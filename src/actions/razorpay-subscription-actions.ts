"use server";

import { getCurrentUser } from "@/lib/auth/session";
import {
    calculatePlanExpiry,
    getBillingAmount,
    getBillingPlanDefinition,
    getBillingValidityMonths,
    getRazorpayInstance,
} from "@/lib/server/razorpay";
import { resolvePlanEntitlement } from "@/lib/server/plan-entitlements";
import { getResolvedPlatformConfig, getRazorpayRecurringPlanId } from "@/lib/server/platform-config";
import { revalidatePlanSurfaces } from "@/lib/server/revalidation";
import prisma from "@/lib/prisma/client";

export async function createRecurringSubscription(input: {
    planId: string;
}) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, message: "Authentication required." };
        }

        const plan = getBillingPlanDefinition(input.planId);
        if (plan.role !== user.role && user.role !== "ADMIN") {
            return { success: false, message: "This subscription is not available for your account role." };
        }
        if (resolvePlanEntitlement(user.plan, user.role).rank > resolvePlanEntitlement(plan.appPlan, user.role).rank) {
            return {
                success: false,
                message: "Your account already includes a higher tier. Renew that plan instead of moving down.",
            };
        }

        const razorpayPlanId = await getRazorpayRecurringPlanId(input.planId);
        if (!razorpayPlanId) {
            return {
                success: false,
                message: "Monthly plan is not configured yet. Save the recurring Razorpay plan ID in admin integrations first.",
            };
        }

        const razorpay = await getRazorpayInstance();
        const subscription = await razorpay.subscriptions.create({
            plan_id: razorpayPlanId,
            customer_notify: 1,
            total_count: 12,
            quantity: 1,
            addons: [],
            notes: {
                userId: user.id,
                userEmail: user.email || "",
                planId: input.planId,
                role: plan.role,
            },
        });

        const expiresAt = calculatePlanExpiry(
            user.planExpiresAt,
            getBillingValidityMonths(input.planId, "monthly"),
        );

        await prisma.subscription.create({
            data: {
                userId: user.id,
                plan: plan.appPlan,
                role: plan.role,
                status: "PENDING",
                amountPaise: getBillingAmount(input.planId, "monthly"),
                razorpaySubscriptionId: subscription.id,
                razorpayPlanId: input.planId,
                expiresAt,
                currentPeriodEnd: expiresAt,
            },
        });

        const runtimeConfig = await getResolvedPlatformConfig();

        return {
            success: true,
            data: {
                subscriptionId: subscription.id,
                keyId: runtimeConfig.values.razorpayKeyId ?? "",
                userName: user.fullName || "Valued Student",
                userEmail: user.email || "",
                userPhone: user.phone || "",
            },
        };
    } catch (error: unknown) {
        console.error("Subscription Error:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to initialize subscription.",
        };
    }
}

export async function cancelRecurringSubscription(subscriptionId: string) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("Unauthorized");

        const existingSubscription = await prisma.subscription.findFirst({
            where: {
                userId: user.id,
                razorpaySubscriptionId: subscriptionId,
            },
        });

        if (!existingSubscription) {
            return { success: false, message: "Subscription not found." };
        }

        const razorpay = await getRazorpayInstance();
        await razorpay.subscriptions.cancel(subscriptionId, false);

        await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
                cancelAtPeriodEnd: true,
                status: "ACTIVE",
            },
        });

        revalidatePlanSurfaces();
        return { success: true };
    } catch (error: unknown) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to cancel subscription.",
        };
    }
}
