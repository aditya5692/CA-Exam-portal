"use server";

import { getCurrentUser, syncCurrentAuthSession } from "@/lib/auth/session";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import {
    getCurrentUserPlanSummary,
    promoteUserToProPlan,
    resolvePlanEntitlement,
    syncUserPlanAccess,
} from "@/lib/server/plan-entitlements";
import {
    calculatePlanExpiry,
    getBillingAmount,
    getBillingPlanDefinition,
    getBillingValidityMonths,
    getRazorpayInstance,
    PLAN_NAMES,
    verifyPaymentSignature,
} from "@/lib/server/razorpay";
import { revalidatePlanSurfaces } from "@/lib/server/revalidation";
import prisma from "@/lib/prisma/client";
import type { CurrentPlanSummary } from "@/types/plan";
import { ActionResponse } from "@/types/shared";
import { getResolvedPlatformConfig } from "@/lib/server/platform-config";

function isPlanAllowedForUser(planId: string, userRole: string) {
    const plan = getBillingPlanDefinition(planId);
    return userRole === "ADMIN" || plan.role === userRole;
}

function isDowngradeSelection(currentPlan: string, userRole: string, targetPlan: string) {
    return resolvePlanEntitlement(currentPlan, userRole).rank > resolvePlanEntitlement(targetPlan, userRole).rank;
}

export async function createRazorpayOrder(planId: string): Promise<ActionResponse<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
}>> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, message: "You must be logged in to subscribe." };
        }

        if (!isPlanAllowedForUser(planId, user.role)) {
            return { success: false, message: "This plan is not available for your account role." };
        }

        const plan = getBillingPlanDefinition(planId);
        if (isDowngradeSelection(user.plan, user.role, plan.appPlan)) {
            return {
                success: false,
                message: "Your account already includes a higher tier. Choose your current plan to renew or keep the higher tier active.",
            };
        }

        const amount = getBillingAmount(planId, "annual");
        const expiresAt = calculatePlanExpiry(
            user.planExpiresAt,
            getBillingValidityMonths(planId, "annual"),
        );

        const razorpay = await getRazorpayInstance();
        const order = await razorpay.orders.create({
            amount,
            currency: "INR",
            notes: {
                userId: user.id,
                planId,
                planName: PLAN_NAMES[planId] ?? planId,
                role: plan.role,
            },
        });

        await prisma.subscription.create({
            data: {
                userId: user.id,
                plan: plan.appPlan,
                role: plan.role,
                status: "PENDING",
                amountPaise: amount,
                razorpayOrderId: order.id,
                razorpayPlanId: planId,
                expiresAt,
                currentPeriodEnd: expiresAt,
            },
        });

        const runtimeConfig = await getResolvedPlatformConfig();

        return {
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount as number,
                currency: order.currency,
                keyId: runtimeConfig.values.razorpayKeyId ?? "",
                userName: user.fullName || "Valued Learner",
                userEmail: user.email || "",
                userPhone: user.phone || "",
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

        const isValid = await verifyPaymentSignature(
            payload.razorpayOrderId,
            payload.razorpayPaymentId,
            payload.razorpaySignature,
        );
        if (!isValid) {
            return { success: false, message: "Payment verification failed. Please contact support." };
        }

        if (!isPlanAllowedForUser(payload.planId, user.role)) {
            return { success: false, message: "This plan is not available for your account role." };
        }

        const plan = getBillingPlanDefinition(payload.planId);
        const amount = getBillingAmount(payload.planId, "annual");
        const expiresAt = calculatePlanExpiry(
            user.planExpiresAt,
            getBillingValidityMonths(payload.planId, "annual"),
        );

        const updatedUser = await prisma.$transaction(async (tx) => {
            const existingSubscription = await tx.subscription.findFirst({
                where: { razorpayOrderId: payload.razorpayOrderId },
                select: { id: true },
            });

            if (existingSubscription) {
                await tx.subscription.update({
                    where: { id: existingSubscription.id },
                    data: {
                        plan: plan.appPlan,
                        role: plan.role,
                        status: "ACTIVE",
                        amountPaise: amount,
                        razorpayPaymentId: payload.razorpayPaymentId,
                        razorpaySignature: payload.razorpaySignature,
                        expiresAt,
                        currentPeriodEnd: expiresAt,
                        cancelAtPeriodEnd: false,
                    },
                });
            } else {
                await tx.subscription.create({
                    data: {
                        userId: user.id,
                        plan: plan.appPlan,
                        role: plan.role,
                        status: "ACTIVE",
                        amountPaise: amount,
                        razorpayOrderId: payload.razorpayOrderId,
                        razorpayPaymentId: payload.razorpayPaymentId,
                        razorpaySignature: payload.razorpaySignature,
                        razorpayPlanId: payload.planId,
                        expiresAt,
                        currentPeriodEnd: expiresAt,
                    },
                });
            }

            const entitlement = resolvePlanEntitlement(plan.appPlan, user.role);
            return tx.user.update({
                where: { id: user.id },
                data: {
                    plan: plan.appPlan,
                    planExpiresAt: expiresAt,
                    storageLimit: Math.max(user.storageLimit, entitlement.storageLimitFloor),
                },
            });
        });

        await syncCurrentAuthSession(updatedUser);
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
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    razorpayPaymentId: string | null;
    razorpayOrderId: string | null;
    razorpaySubscriptionId: string | null;
} | null>> {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, message: "Not authenticated." };

        const sub = await prisma.subscription.findFirst({
            where: { userId: user.id },
            orderBy: [
                { createdAt: "desc" },
                { startedAt: "desc" },
            ],
        });

        if (!sub) return { success: true, data: null };

        return {
            success: true,
            data: {
                plan: sub.plan,
                status: sub.status,
                expiresAt: sub.expiresAt.toISOString(),
                startedAt: sub.startedAt.toISOString(),
                currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
                cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
                razorpayPaymentId: sub.razorpayPaymentId,
                razorpayOrderId: sub.razorpayOrderId,
                razorpaySubscriptionId: sub.razorpaySubscriptionId,
            },
        };
    } catch (error: unknown) {
        return {
            success: false,
            message: getActionErrorMessage(error, "Failed to load subscription."),
        };
    }
}

export async function recordCheckoutResolution(input: {
    orderId?: string;
    subscriptionId?: string;
    status: "FAILED" | "CANCELLED";
}): Promise<ActionResponse<void>> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, message: "You must be logged in." };
        }

        const where = input.orderId
            ? { userId: user.id, razorpayOrderId: input.orderId }
            : { userId: user.id, razorpaySubscriptionId: input.subscriptionId };

        await prisma.subscription.updateMany({
            where,
            data: { status: input.status },
        });

        revalidatePlanSurfaces();
        return { success: true, data: undefined };
    } catch (error: unknown) {
        return {
            success: false,
            message: getActionErrorMessage(error, "Failed to update checkout state."),
        };
    }
}

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
        await syncCurrentAuthSession(updatedUser);
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
    status: "ACTIVE" | "CANCELLED" | "EXPIRED",
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
                currentPeriodEnd: expiresAt,
            },
        });

        await syncUserPlanAccess(data.userId, data.plan, expiresAt);

        return { success: true, data: undefined };
    } catch (error: unknown) {
        return {
            success: false,
            message: getActionErrorMessage(error, "Failed to grant plan."),
        };
    }
}
