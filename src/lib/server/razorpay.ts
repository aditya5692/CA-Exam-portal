import crypto from "crypto";
import Razorpay from "razorpay";

export type BillingCycle = "annual" | "monthly";
export type BillingPlanRole = "STUDENT" | "TEACHER";
export type BillingAppPlan = "BASIC" | "PRO";

type BillingPlanDefinition = {
    id: string;
    appPlan: BillingAppPlan;
    role: BillingPlanRole;
    displayName: string;
    annualAmountPaise: number;
    annualValidityMonths: number;
    recurringAmountPaise?: number;
    recurringValidityMonths?: number;
};

const BILLING_PLANS: Record<string, BillingPlanDefinition> = {
    "s-basic": {
        id: "s-basic",
        appPlan: "BASIC",
        role: "STUDENT",
        displayName: "Student Basic",
        annualAmountPaise: 19900,
        annualValidityMonths: 12,
        recurringAmountPaise: 2900,
        recurringValidityMonths: 1,
    },
    "s-pro": {
        id: "s-pro",
        appPlan: "PRO",
        role: "STUDENT",
        displayName: "Student Pro",
        annualAmountPaise: 39900,
        annualValidityMonths: 12,
        recurringAmountPaise: 4900,
        recurringValidityMonths: 1,
    },
    "s-elite": {
        id: "s-elite",
        appPlan: "PRO",
        role: "STUDENT",
        displayName: "Student Pro",
        annualAmountPaise: 39900,
        annualValidityMonths: 12,
        recurringAmountPaise: 4900,
        recurringValidityMonths: 1,
    },
    "t-basic": {
        id: "t-basic",
        appPlan: "BASIC",
        role: "TEACHER",
        displayName: "Teacher Basic",
        annualAmountPaise: 149900,
        annualValidityMonths: 12,
    },
    "t-pro": {
        id: "t-pro",
        appPlan: "PRO",
        role: "TEACHER",
        displayName: "Teacher Pro",
        annualAmountPaise: 249900,
        annualValidityMonths: 12,
    },
};

let razorpayInstance: Razorpay | null = null;

export function getRazorpayInstance(): Razorpay {
    if (!razorpayInstance) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            throw new Error(
                "Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env",
            );
        }

        razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }

    return razorpayInstance;
}

export function verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string,
): boolean {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("RAZORPAY_KEY_SECRET is not set.");

    const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    return generatedSignature === signature;
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        throw new Error("RAZORPAY_WEBHOOK_SECRET is not set.");
    }

    const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

    return expectedSignature === signature;
}

export function getBillingPlanDefinition(planId: string) {
    const plan = BILLING_PLANS[planId];

    if (!plan) {
        throw new Error("Invalid plan selected.");
    }

    return plan;
}

export function getBillingAmount(planId: string, billingCycle: BillingCycle = "annual") {
    const plan = getBillingPlanDefinition(planId);

    if (billingCycle === "monthly") {
        if (!plan.recurringAmountPaise) {
            throw new Error("Monthly billing is not configured for this plan.");
        }

        return plan.recurringAmountPaise;
    }

    return plan.annualAmountPaise;
}

export function getBillingValidityMonths(planId: string, billingCycle: BillingCycle = "annual") {
    const plan = getBillingPlanDefinition(planId);

    if (billingCycle === "monthly") {
        if (!plan.recurringValidityMonths) {
            throw new Error("Monthly validity is not configured for this plan.");
        }

        return plan.recurringValidityMonths;
    }

    return plan.annualValidityMonths;
}

export function calculatePlanExpiry(
    currentExpiry: Date | null | undefined,
    validityMonths: number,
) {
    const now = new Date();
    const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const expiresAt = new Date(baseDate);

    expiresAt.setMonth(expiresAt.getMonth() + validityMonths);
    return expiresAt;
}

export const PLAN_NAMES: Record<string, string> = Object.fromEntries(
    Object.entries(BILLING_PLANS).map(([id, plan]) => [id, plan.displayName]),
);

export const PLAN_AMOUNTS: Record<string, number> = Object.fromEntries(
    Object.entries(BILLING_PLANS).map(([id, plan]) => [id, plan.annualAmountPaise]),
);

export const PLAN_ROLES: Record<string, BillingPlanRole> = Object.fromEntries(
    Object.entries(BILLING_PLANS).map(([id, plan]) => [id, plan.role]),
);

export const PLAN_VALIDITY_YEARS: Record<string, number> = Object.fromEntries(
    Object.entries(BILLING_PLANS).map(([id, plan]) => [id, Math.max(1, Math.round(plan.annualValidityMonths / 12))]),
);
