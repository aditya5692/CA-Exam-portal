"use server";

import prisma from "@/lib/prisma/client";
import { getCurrentUser, setAuthSession } from "@/lib/auth/session";

export async function activateProPlan() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, message: "You must be logged in to activate a plan." };
        }

        if (user.plan === "PRO") {
            return { success: false, message: "You are already on the PRO plan." };
        }

        // Update the user's plan to PRO
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { plan: "PRO" },
        });

        // Update the auth session cookie to reflect the new plan
        await setAuthSession(updatedUser);

        return { success: true, message: "Your PRO plan has been successfully activated!" };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "An unexpected error occurred during activation." };
    }
}
