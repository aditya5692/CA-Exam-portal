"use server";

import { getCurrentUser,setAuthSession } from "@/lib/auth/session";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import {
  getCurrentUserPlanSummary,
  promoteUserToProPlan,
} from "@/lib/server/plan-entitlements";
import { revalidatePlanSurfaces } from "@/lib/server/revalidation";
import type { CurrentPlanSummary } from "@/types/plan";
import { ActionResponse } from "@/types/shared";

export async function activateProPlan(): Promise<ActionResponse<void>> {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, message: "You must be logged in to activate a plan." };
        }

        if (user.plan === "PRO") {
            return { success: false, message: "You are already on the PRO plan." };
        }

        const updatedUser = await promoteUserToProPlan(user.id);
        await setAuthSession(updatedUser);
        revalidatePlanSurfaces();

        return { success: true, message: "Your PRO plan has been successfully activated!", data: undefined };
    } catch (error: unknown) {
        return { success: false, message: getActionErrorMessage(error, "An unexpected error occurred during activation.") };
    }
}

export async function getCurrentPlanSummary(): Promise<ActionResponse<CurrentPlanSummary>> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, message: "You must be logged in to view plan details." };
        }

        return {
            success: true,
            data: await getCurrentUserPlanSummary(user.id),
        };
    } catch (error: unknown) {
        return {
            success: false,
            message: getActionErrorMessage(error, "Failed to load the current plan summary."),
        };
    }
}
