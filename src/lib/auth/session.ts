import "server-only";

import prisma from "@/lib/prisma/client";
import type { User } from "@prisma/client";
import { cookies } from "next/headers";
import { ensureDemoAccounts,getDefaultDemoUser,type AppRole } from "./demo-accounts";

type SessionPayload = {
    userId: string;
    role: AppRole;
    fullName: string | null;
    registrationNumber: string | null;
    plan: string;
};

const SESSION_COOKIE_NAME = "modern_ca_portal_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
let demoAccountsPromise: Promise<unknown> | null = null;

function encodeSession(payload: SessionPayload) {
    return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeSession(value: string): SessionPayload | null {
    try {
        const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionPayload;
        if (!parsed?.userId || !parsed?.role) return null;
        return parsed;
    } catch {
        return null;
    }
}

function roleMatches(user: User, role?: AppRole | AppRole[]) {
    if (!role) return true;
    if (Array.isArray(role)) return role.includes(user.role as AppRole);
    return user.role === role;
}

async function ensureDemoAccountsReady() {
    if (!demoAccountsPromise) {
        demoAccountsPromise = ensureDemoAccounts().catch((error) => {
            demoAccountsPromise = null;
            throw error;
        });
    }

    await demoAccountsPromise;
}

export async function setAuthSession(user: User) {
    const cookieStore = await cookies();
    cookieStore.set(
        SESSION_COOKIE_NAME,
        encodeSession({
            userId: user.id,
            role: user.role as AppRole,
            fullName: user.fullName ?? null,
            registrationNumber: user.registrationNumber ?? null,
            plan: user.plan,
        }),
        {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: SESSION_MAX_AGE_SECONDS,
        }
    );
}

export async function clearAuthSession() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionPayload() {
    const cookieStore = await cookies();
    const rawValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!rawValue) return null;
    return decodeSession(rawValue);
}

export async function getCurrentUser(role?: AppRole | AppRole[]) {
    const session = await getSessionPayload();
    if (!session) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
    });

    if (!user) {
        // In Next.js 15, we cannot clear sessions (modifying cookies) during server component rendering
        // Return null and let the page handle the redirect/unauthorized state
        return null;
    }

    if (!roleMatches(user, role)) return null;
    return user;
}

export async function getCurrentUserOrDemoUser(
    role: AppRole,
    allowedRoles?: AppRole | AppRole[]
) {
    const sessionUser = await getCurrentUser(allowedRoles ?? role);
    if (sessionUser) return sessionUser;

    await ensureDemoAccountsReady();
    const demoUser = await getDefaultDemoUser(role);
    if (!demoUser) {
        throw new Error(`No ${role.toLowerCase()} account is available.`);
    }

    return demoUser;
}
