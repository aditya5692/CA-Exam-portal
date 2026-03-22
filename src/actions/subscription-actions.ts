"use server";

import { getCurrentUser, setAuthSession } from "@/lib/auth/session";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import {
    getCurrentUserPlanSummary,
    promoteUserToProPlan,
} from "@/lib/server/plan-entitlements";
import { getRazorpayInstance, PLAN_AMOUNTS, PLAN_NAMES, PLAN_VALIDITY_YEARS, verifyPaymentSignature } from "@/lib/server/razorpay";
import { revalidatePlanSurfaces } from "@/lib/server/revalidation";
import prisma from "@/lib/prisma/client";
import type { CurrentPlanSummary } from "@/types/plan";
import { ActionResponse } from "@/types/shared";

// ─── Student & Teacher Plan Actions ─────────────────────────────────────────

export async function createRazorpayOrder(planId: string): Promise<ActionResponse<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
}>> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, message: "You must be logged in to subscribe." };
        }

        const amount = PLAN_AMOUNTS[planId];
        if (!amount) {
            return { success: false, message: "Invalid plan selected." };
        }

        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.create({
            amount,
            currency: "INR",
            notes: {
                userId: user.id,
                planId,
                planName: PLAN_NAMES[planId] ?? planId,
            },
        });

        return {
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount as number,
                currency: order.currency,
                keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
            },
        };
    } catch (error: unknown) {
        return {
            success: false,
            message: getActionErrorMessage(error, "Failed to create order. Please try again."),
        };
    }
}

export async function verifyAndActivatePlan(payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    planId: string;
}): Promise<ActionResponse<void>> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, message: "You must be logged in." };
        }

        // Verify signature
        const isValid = verifyPaymentSignature(
            payload.razorpayOrderId,
            payload.razorpayPaymentId,
            payload.razorpaySignature
        );
        if (!isValid) {
            return { success: false, message: "Payment verification failed. Please contact support." };
        }

        const amount = PLAN_AMOUNTS[payload.planId];
        if (!amount) {
            return { success: false, message: "Invalid plan." };
        }

        const validityYears = PLAN_VALIDITY_YEARS[payload.planId] ?? 1;
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + validityYears);

        const role = payload.planId.startsWith("t-") ? "TEACHER" : "STUDENT";

        // Create subscription record
        await prisma.subscription.create({
            data: {
                userId: user.id,
                plan: "PRO",
                role,
                status: "ACTIVE",
                amountPaise: amount,
                razorpayOrderId: payload.razorpayOrderId,
                razorpayPaymentId: payload.razorpayPaymentId,
                razorpaySignature: payload.razorpaySignature,
                expiresAt,
            },
        });

        // Update user plan + expiry
        const updatedUser = await promoteUserToProPlan(user.id);
        await prisma.user.update({
            where: { id: user.id },
            data: { planExpiresAt: expiresAt },
        });

        await setAuthSession(updatedUser);
        revalidatePlanSurfaces();

        return { success: true, data: undefined };
    } catch (error: unknown) {
        return {
            success: false,
            message: getActionErrorMessage(error, "Failed to activate plan. Please contact support."),
        };
    }
}

export async function getMySubscription(): Promise<ActionResponse<{
    plan: string;
    status: string;
    expiresAt: string;
    startedAt: string;
    razorpayPaymentId?: string | null;
} | null>> {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, message: "Not authenticated." };

        const sub = await prisma.subscription.findFirst({
            where: { userId: user.id, status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
        });

        if (!sub) return { success: true, data: null };

        return {
            success: true,
            data: {
                plan: sub.plan,
                status: sub.status,
                expiresAt: sub.expiresAt.toISOString(),
                startedAt: sub.startedAt.toISOString(),
                razorpayPaymentId: sub.razorpayPaymentId,
            },
        };
    } catch (error: unknown) {
        return {
            success: false,
            message: getActionErrorMessage(error, "Failed to load subscription."),
        };
    }
}

// ─── Legacy action (kept for compatibility) ──────────────────────────────────

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

// ─── Admin Actions ───────────────────────────────────────────────────────────

export async function adminGetAllSubscriptions(filters?: {
    status?: string;
}): Promise<ActionResponse<Array<{
    id: string;
    userId: string;
    userFullName: string | null;
    userEmail: string | null;
    plan: string;
    role: string;
    status: string;
    amountPaise: number;
    razorpayPaymentId: string | null;
    startedAt: string;
    expiresAt: string;
    createdAt: string;
    grantedByAdminId: string | null;
}>>> {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && !user.isSuperAdmin)) {
            return { success: false, message: "Unauthorized." };
        }

        const subscriptions = await prisma.subscription.findMany({
            where: filters?.status ? { status: filters.status } : undefined,
            include: {
                user: { select: { fullName: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            data: subscriptions.map((s) => ({
                id: s.id,
                userId: s.userId,
                userFullName: s.user.fullName,
                userEmail: s.user.email,
                plan: s.plan,
                role: s.role,
                status: s.status,
                amountPaise: s.amountPaise,
                razorpayPaymentId: s.razorpayPaymentId,
                startedAt: s.startedAt.toISOString(),
                expiresAt: s.expiresAt.toISOString(),
                createdAt: s.createdAt.toISOString(),
                grantedByAdminId: s.grantedByAdminId,
            })),
        };
    } catch (error: unknown) {
        return {
            success: false,
            message: getActionErrorMessage(error, "Failed to load subscriptions."),
        };
    }
}

export async function adminUpdateSubscription(
    subscriptionId: string,
    status: "ACTIVE" | "CANCELLED" | "EXPIRED"
): Promise<ActionResponse<void>> {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && !user.isSuperAdmin)) {
            return { success: false, message: "Unauthorized." };
        }

        await prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status },
        });

        return { success: true, data: undefined };
    } catch (error: unknown) {
        return {
            success: false,
            message: getActionErrorMessage(error, "Failed to update subscription."),
        };
    }
}

export async function adminGrantPlan(data: {
    userId: string;
    plan: string;
    durationDays: number;
}): Promise<ActionResponse<void>> {
    try {
        const admin = await getCurrentUser();
        if (!admin || (admin.role !== "ADMIN" && !admin.isSuperAdmin)) {
            return { success: false, message: "Unauthorized." };
        }

        const target = await prisma.user.findUnique({ where: { id: data.userId } });
        if (!target) return { success: false, message: "User not found." };

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + data.durationDays);

        await prisma.subscription.create({
            data: {
                userId: data.userId,
                plan: data.plan,
                role: target.role,
                status: "ACTIVE",
                amountPaise: 0,
                grantedByAdminId: admin.id,
                expiresAt,
            },
        });

        await prisma.user.update({
            where: { id: data.userId },
            data: { plan: data.plan, planExpiresAt: expiresAt },
        });

        return { success: true, data: undefined };
    } catch (error: unknown) {
        return {
            success: false,
            message: getActionErrorMessage(error, "Failed to grant plan."),
        };
    }
}
