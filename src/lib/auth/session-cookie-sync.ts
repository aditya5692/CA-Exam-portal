import type { User } from "@prisma/client";
import { buildAuthCookieOptions } from "./cookie-options";

export type SessionPayload = {
    userId: string;
    role: User["role"];
    roleSlug: "student" | "teacher" | "admin";
    fullName: string | null;
    registrationNumber: string | null;
    plan: string;
    isSuperAdmin?: boolean;
};

export type SessionUser = Pick<User, "id" | "role" | "fullName" | "registrationNumber" | "plan" | "isSuperAdmin">;

type CookieStoreLike = {
    get(name: string): { value: string } | undefined;
    set(name: string, value: string, options: {
        httpOnly: boolean;
        sameSite: "lax";
        secure: boolean;
        path: string;
        maxAge: number;
        domain?: string;
    }): void;
};

type SignAccessToken = (payload: SessionPayload) => Promise<string>;

export const ACCESS_COOKIE_NAME = "modern_ca_access_token";
export const REFRESH_COOKIE_NAME = "modern_ca_refresh_token";
export const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 15;

export function toRoleSlug(role: User["role"]): SessionPayload["roleSlug"] {
    if (role === "ADMIN") return "admin";
    if (role === "TEACHER") return "teacher";
    return "student";
}

export function buildSessionPayload(user: SessionUser): SessionPayload {
    return {
        userId: user.id,
        role: user.role,
        roleSlug: toRoleSlug(user.role),
        fullName: user.fullName ?? null,
        registrationNumber: user.registrationNumber ?? null,
        plan: user.plan,
        isSuperAdmin: !!user.isSuperAdmin,
    };
}

export async function writeAccessTokenCookie(
    cookieStore: CookieStoreLike,
    payload: SessionPayload,
    signAccessToken: SignAccessToken,
    secure: boolean,
) {
    const accessToken = await signAccessToken(payload);

    cookieStore.set(
        ACCESS_COOKIE_NAME,
        accessToken,
        buildAuthCookieOptions({
            secure,
            maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
        }),
    );
}

export async function syncSessionCookiePayload(
    cookieStore: CookieStoreLike,
    user: SessionUser,
    signAccessToken: SignAccessToken,
    secure: boolean,
) {
    const hasCurrentSession =
        Boolean(cookieStore.get(ACCESS_COOKIE_NAME)?.value) ||
        Boolean(cookieStore.get(REFRESH_COOKIE_NAME)?.value);

    if (!hasCurrentSession) {
        return false;
    }

    await writeAccessTokenCookie(cookieStore, buildSessionPayload(user), signAccessToken, secure);
    return true;
}
