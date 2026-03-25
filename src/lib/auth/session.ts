import "server-only";

import prisma from "@/lib/prisma/client";
import type { User } from "@prisma/client";
import { signAccessToken, verifyAccessToken } from "@/lib/server/jwt";
import { cookies } from "next/headers";
import { ensureDemoAccounts, getDefaultDemoUser, type AppRole } from "./demo-accounts";
import { randomUUID } from "crypto";
import {
    ACCESS_COOKIE_NAME,
    buildSessionPayload,
    REFRESH_COOKIE_NAME,
    type SessionPayload,
    type SessionUser,
    syncSessionCookiePayload,
    writeAccessTokenCookie,
} from "./session-cookie-sync";

const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
let demoAccountsPromise: Promise<unknown> | null = null;

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
    const payload = buildSessionPayload(user);
    const refreshToken = randomUUID();

    // Store refresh token in DB
    await prisma.session.create({
        data: {
            userId: user.id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_MAX_AGE_SECONDS * 1000),
        },
    });

    await writeAccessTokenCookie(
        await cookies(),
        payload,
        signAccessToken,
        process.env.NODE_ENV === "production",
    );

    // Set Refresh Token (Long-lived)
    const cookieStore = await cookies();
    cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: REFRESH_MAX_AGE_SECONDS,
    });
}

export async function syncCurrentAuthSession(user: SessionUser) {
    return syncSessionCookiePayload(
        await cookies(),
        user,
        signAccessToken,
        process.env.NODE_ENV === "production",
    );
}

export async function clearAuthSession() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
    
    if (refreshToken) {
        await prisma.session.deleteMany({
            where: { refreshToken },
        });
    }

    cookieStore.delete(ACCESS_COOKIE_NAME);
    cookieStore.delete(REFRESH_COOKIE_NAME);
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
    
    if (!accessToken) return null;
    
    const payload = await verifyAccessToken(accessToken);
    return payload as SessionPayload | null;
}

export async function getCurrentUser(role?: AppRole | AppRole[]) {
    const session = await getSessionPayload();
    if (!session) {
        // Here we could trigger a refresh if the refresh token exists, 
        // but for server components, it's better to return null and let middleware handle refresh
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
    });

    if (!user || user.isBlocked) return null;
    
    if (role && !roleMatches(user, role)) return null;
    return user;
}

function roleMatches(user: User, role?: AppRole | AppRole[]) {
    if (!role) return true;
    if (Array.isArray(role)) return role.includes(user.role as AppRole);
    return user.role === role;
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
