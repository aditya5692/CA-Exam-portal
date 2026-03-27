"use server";


import Razorpay from "razorpay";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createRecurringSubscription(planId: string) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, message: "Authentication required." };
        }

        // 1. Create Subscription in Razorpay
        // Note: planId here is the Razorpay Plan ID (e.g., plan_P123...)
        const subscription = await razorpay.subscriptions.create({
            plan_id: planId,
            customer_notify: 1,
            total_count: 12, // e.g., for a 1-year monthly sub
            quantity: 1,
            addons: [],
            notes: {
                userId: user.id,
                userEmail: user.email || "",
            },
        });

        // 2. Pre-save a pending subscription record in our DB
        await prisma.subscription.create({
            data: {
                userId: user.id,
                plan: "PRO_RECURRING", // Marker for recurring
                role: user.role,
                status: "PENDING",
                amountPaise: 0, // Will be updated by webhook on first charge
                razorpaySubscriptionId: subscription.id,
                razorpayPlanId: planId,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days, will be synced
            },
        });

        return {
            success: true,
            data: {
                subscriptionId: subscription.id,
                keyId: process.env.RAZORPAY_KEY_ID!,
                userName: user.fullName || "Valued Student",
                userEmail: user.email || "",
                userPhone: (user as any).phone || "",
            },
        };
    } catch (error: any) {
        console.error("Subscription Error:", error);
        return { success: false, message: error.message || "Failed to initialize subscription." };
    }
}

export async function cancelRecurringSubscription(subscriptionId: string) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("Unauthorized");

        // Cancel in Razorpay at the end of cycle
        await razorpay.subscriptions.cancel(subscriptionId, false);

        await prisma.subscription.update({
            where: { razorpaySubscriptionId: subscriptionId },
            data: { cancelAtPeriodEnd: true },
        });

        revalidatePath("/student/dashboard");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
