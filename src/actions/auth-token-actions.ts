"use server";

import { clearAllAuthSessions, refreshCurrentAuthSession } from "@/lib/auth/session";
import { ActionResponse } from "@/types/shared";

export async function refreshTokenAction(): Promise<ActionResponse<{ success: boolean }>> {
    try {
        const payload = await refreshCurrentAuthSession();

        if (!payload) {
            return { success: false, message: "Invalid or expired session" };
        }

        return { success: true, data: { success: true } };
    } catch (error) {
        console.error("Refresh token error:", error);
        return { success: false, message: "Internal server error" };
    }
}

export async function logoutAllAction(): Promise<ActionResponse<undefined>> {
    try {
        await clearAllAuthSessions();

        return { success: true, message: "Logged out from all devices", data: undefined };
    } catch (error) {
        console.error("Logout all error:", error);
        return { success: false, message: "Logout failed" };
    }
}
