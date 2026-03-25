"use server";

import prisma from "@/lib/prisma/client";
import { signAccessToken } from "@/lib/server/jwt";
import { cookies } from "next/headers";
import { ActionResponse } from "@/types/shared";

const ACCESS_COOKIE_NAME = "modern_ca_access_token";
const REFRESH_COOKIE_NAME = "modern_ca_refresh_token";

export async function refreshTokenAction(): Promise<ActionResponse<{ success: boolean }>> {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

        if (!refreshToken) {
            return { success: false, message: "No refresh token found" };
        }

        // @ts-ignore - Prisma types may need to be reloaded in IDE
        const session = await (prisma as any).session.findUnique({
            where: { refreshToken },
            include: { user: true }
        });

        if (!session || session.expiresAt < new Date()) {
            // Cleanup expired or invalid session
            if (session) {
                // @ts-ignore
                await (prisma as any).session.delete({ where: { id: session.id } });
            }
            return { success: false, message: "Invalid or expired session" };
        }

        const user = session.user;
        const accessToken = await signAccessToken({
            userId: user.id,
            role: user.role,
            fullName: user.fullName || null,
            registrationNumber: user.registrationNumber || null,
            plan: user.plan || "Free",
            isSuperAdmin: !!user.isSuperAdmin,
        });

        // Update last active
        // @ts-ignore
        await (prisma as any).session.update({
            where: { id: session.id },
            data: { lastActiveAt: new Date() }
        });

        cookieStore.set(ACCESS_COOKIE_NAME, accessToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 15, // 15 minutes
        });

        return { success: true, data: { success: true } };
    } catch (error) {
        console.error("Refresh token error:", error);
        return { success: false, message: "Internal server error" };
    }
}

export async function logoutAllAction(): Promise<ActionResponse<undefined>> {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

        if (refreshToken) {
            // @ts-ignore
            const session = await (prisma as any).session.findUnique({
                where: { refreshToken }
            });

            if (session) {
                // @ts-ignore
                await (prisma as any).session.deleteMany({
                    where: { userId: session.userId }
                });
            }
        }

        cookieStore.delete(ACCESS_COOKIE_NAME);
        cookieStore.delete(REFRESH_COOKIE_NAME);

        return { success: true, message: "Logged out from all devices", data: undefined };
    } catch (error) {
        console.error("Logout all error:", error);
        return { success: false, message: "Logout failed" };
    }
}
