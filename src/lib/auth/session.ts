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
import { buildAuthCookieOptions } from "./cookie-options";

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

async function expireAuthCookies() {
    const cookieStore = await cookies();
    const secure = process.env.NODE_ENV === "production";
    const expiredCookieOptions = buildAuthCookieOptions({
        secure,
        maxAge: 0,
    });

    cookieStore.set(ACCESS_COOKIE_NAME, "", expiredCookieOptions);
    cookieStore.set(REFRESH_COOKIE_NAME, "", expiredCookieOptions);
}

type RefreshSessionOptions = {
    syncAccessCookie?: boolean;
    clearInvalidCookies?: boolean;
};

async function resolveSessionPayloadFromRefreshToken(
    refreshToken: string,
    options: RefreshSessionOptions = {},
): Promise<SessionPayload | null> {
    const {
        syncAccessCookie = false,
        clearInvalidCookies = false,
    } = options;
    const session = await prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
    });

    if (!session) {
        if (clearInvalidCookies) {
            await expireAuthCookies();
        }
        return null;
    }

    if (session.expiresAt <= new Date()) {
        await prisma.session.deleteMany({
            where: { id: session.id },
        });
        if (clearInvalidCookies) {
            await expireAuthCookies();
        }
        return null;
    }

    if (session.user.isBlocked) {
        await prisma.session.deleteMany({
            where: { userId: session.userId },
        });
        if (clearInvalidCookies) {
            await expireAuthCookies();
        }
        return null;
    }

    const payload = buildSessionPayload(session.user);

    await prisma.session.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() },
    });

    if (syncAccessCookie) {
        await writeAccessTokenCookie(
            await cookies(),
            payload,
            signAccessToken,
            process.env.NODE_ENV === "production",
        );
    }

    return payload;
}

export async function setAuthSession(user: User) {
    const payload = buildSessionPayload(user);
    const refreshToken = randomUUID();
    const secure = process.env.NODE_ENV === "production";
    const cookieStore = await cookies();
    const existingRefreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

    if (existingRefreshToken) {
        await prisma.session.deleteMany({
            where: { refreshToken: existingRefreshToken },
        });
    }

    // Store refresh token in DB
    await prisma.session.create({
        data: {
            userId: user.id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_MAX_AGE_SECONDS * 1000),
        },
    });

    await writeAccessTokenCookie(
        cookieStore,
        payload,
        signAccessToken,
        secure,
    );

    // Set Refresh Token (Long-lived)
    cookieStore.set(
        REFRESH_COOKIE_NAME,
        refreshToken,
        buildAuthCookieOptions({
            secure,
            maxAge: REFRESH_MAX_AGE_SECONDS,
        }),
    );
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

    await expireAuthCookies();
}

export async function clearAllAuthSessions() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

    if (refreshToken) {
        const session = await prisma.session.findUnique({
            where: { refreshToken },
            select: { userId: true },
        });

        if (session) {
            await prisma.session.deleteMany({
                where: { userId: session.userId },
            });
        }
    }

    await expireAuthCookies();
}

export async function refreshCurrentAuthSession() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

    if (!refreshToken) {
        await expireAuthCookies();
        return null;
    }

    return resolveSessionPayloadFromRefreshToken(refreshToken, {
        syncAccessCookie: true,
        clearInvalidCookies: true,
    });
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

    if (accessToken) {
        const payload = await verifyAccessToken(accessToken);
        if (payload) {
            return payload as SessionPayload;
        }
    }

    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
    if (!refreshToken) {
        return null;
    }

    // Server components can read cookies during render, but may not mutate them.
    // Fall back to the refresh-token-backed DB session without attempting to rewrite cookies here.
    return resolveSessionPayloadFromRefreshToken(refreshToken);
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
