import "server-only";

import prisma from "@/lib/prisma/client";
import type { CurrentPlanSummary,PlanSupportTier } from "@/types/plan";
import type { User } from "@prisma/client";

const MB = 1024 * 1024;
const GB = 1024 * MB;

type EntitlementDefinition = {
    displayName: string;
    rank: number;
    storageLimitFloor: number;
    supportTier: PlanSupportTier;
    isPremium: boolean;
    featureHighlights: string[];
    restrictions: string[];
};

type RolePlanMatrix = Record<string, EntitlementDefinition>;

const DEFAULT_ENTITLEMENT: EntitlementDefinition = {
    displayName: "Free",
    rank: 0,
    storageLimitFloor: 50 * MB,
    supportTier: "STANDARD",
    isPremium: false,
    featureHighlights: [
        "Core portal access",
        "Standard material and exam workflows",
    ],
    restrictions: [
        "Advanced analytics and premium distribution tools remain locked",
    ],
};

const STUDENT_ENTITLEMENTS: RolePlanMatrix = {
    FREE: {
        displayName: "CA Pass",
        rank: 1,
        storageLimitFloor: 50 * MB,
        supportTier: "STANDARD",
        isPremium: false,
        featureHighlights: [
            "Core mock tests and progress tracking",
            "Standard study-material access",
        ],
        restrictions: [
            "Advanced analytics and premium exam workflows are limited",
        ],
    },
    PRO: {
        displayName: "CA Pass PRO",
        rank: 2,
        storageLimitFloor: 256 * MB,
        supportTier: "PRIORITY",
        isPremium: true,
        featureHighlights: [
            "Extended mock-test access",
            "Priority learning analytics",
            "Protected storage allowance",
        ],
        restrictions: [],
    },
    ELITE: {
        displayName: "CA Pass Elite",
        rank: 3,
        storageLimitFloor: 512 * MB,
        supportTier: "PRIORITY",
        isPremium: true,
        featureHighlights: [
            "Elite exam access",
            "Deeper mastery insights",
            "Expanded revision storage",
        ],
        restrictions: [],
    },
    ENTERPRISE: {
        displayName: "Institutional Student Access",
        rank: 4,
        storageLimitFloor: GB,
        supportTier: "ENTERPRISE",
        isPremium: true,
        featureHighlights: [
            "Institution-grade access controls",
            "Maximum storage allocation",
            "Priority support workflows",
        ],
        restrictions: [],
    },
};

const TEACHER_ENTITLEMENTS: RolePlanMatrix = {
    FREE: {
        displayName: "Teacher Free",
        rank: 1,
        storageLimitFloor: 50 * MB,
        supportTier: "STANDARD",
        isPremium: false,
        featureHighlights: [
            "Core batch and publishing tools",
            "Standard material distribution",
        ],
        restrictions: [
            "Advanced analytics and large-scale distribution remain limited",
        ],
    },
    PRO: {
        displayName: "Studio Pro",
        rank: 2,
        storageLimitFloor: GB,
        supportTier: "PRIORITY",
        isPremium: true,
        featureHighlights: [
            "Premium batch management",
            "Higher storage for content libraries",
            "Priority support",
        ],
        restrictions: [],
    },
    ELITE: {
        displayName: "Studio Elite",
        rank: 3,
        storageLimitFloor: 2 * GB,
        supportTier: "PRIORITY",
        isPremium: true,
        featureHighlights: [
            "Expanded content operations",
            "Premium analytics readiness",
            "Higher educator throughput",
        ],
        restrictions: [],
    },
    ENTERPRISE: {
        displayName: "Academy Enterprise",
        rank: 4,
        storageLimitFloor: 4 * GB,
        supportTier: "ENTERPRISE",
        isPremium: true,
        featureHighlights: [
            "Institution-scale storage",
            "Enterprise support lane",
            "Multi-team operational headroom",
        ],
        restrictions: [],
    },
};

const ADMIN_ENTITLEMENTS: RolePlanMatrix = {
    ENTERPRISE: {
        displayName: "Admin Enterprise",
        rank: 4,
        storageLimitFloor: 4 * GB,
        supportTier: "ENTERPRISE",
        isPremium: true,
        featureHighlights: [
            "Full platform oversight",
            "Enterprise support lane",
            "Operational storage headroom",
        ],
        restrictions: [],
    },
};

function getRolePlanMatrix(role: string): RolePlanMatrix {
    switch (role.toUpperCase()) {
        case "STUDENT":
            return STUDENT_ENTITLEMENTS;
        case "TEACHER":
            return TEACHER_ENTITLEMENTS;
        case "ADMIN":
            return ADMIN_ENTITLEMENTS;
        default:
            return { FREE: DEFAULT_ENTITLEMENT };
    }
}

export function resolvePlanEntitlement(plan: string, role: string): EntitlementDefinition {
    const normalizedPlan = plan.trim().toUpperCase() || "FREE";
    const matrix = getRolePlanMatrix(role);
    return matrix[normalizedPlan] ?? matrix.FREE ?? matrix.ENTERPRISE ?? DEFAULT_ENTITLEMENT;
}

export function planIncludesAtLeast(plan: string, role: string, targetPlan: string) {
    const current = resolvePlanEntitlement(plan, role);
    const target = resolvePlanEntitlement(targetPlan, role);
    return current.rank >= target.rank;
}

export function buildPlanSummary(input: Pick<User, "plan" | "role" | "storageUsed" | "storageLimit">): CurrentPlanSummary {
    const entitlement = resolvePlanEntitlement(input.plan, input.role);
    const storageLimit = Math.max(input.storageLimit, 0);
    const storageUsagePercent = storageLimit > 0
        ? Math.min(100, Math.round((input.storageUsed / storageLimit) * 100))
        : 0;
    const canUpgrade = !planIncludesAtLeast(input.plan, input.role, input.role === "ADMIN" ? "ENTERPRISE" : "PRO");

    return {
        plan: input.plan,
        role: input.role,
        displayName: entitlement.displayName,
        isPremium: entitlement.isPremium,
        supportTier: entitlement.supportTier,
        storageUsed: input.storageUsed,
        storageLimit,
        storageUsagePercent,
        entitledStorageLimit: entitlement.storageLimitFloor,
        featureHighlights: entitlement.featureHighlights,
        restrictions: entitlement.restrictions,
        canUpgrade,
        recommendedPlan: canUpgrade ? (input.role === "ADMIN" ? "ENTERPRISE" : "PRO") : null,
    };
}

export async function getCurrentUserPlanSummary(userId: string): Promise<CurrentPlanSummary> {
    const normalizedUserId = userId.trim();
    if (!normalizedUserId) {
        throw new Error("User id is required.");
    }

    const user = await prisma.user.findUnique({
        where: { id: normalizedUserId },
        select: {
            plan: true,
            role: true,
            storageUsed: true,
            storageLimit: true,
        },
    });

    if (!user) {
        throw new Error("User not found.");
    }

    return buildPlanSummary(user);
}

export async function promoteUserToProPlan(userId: string) {
    const normalizedUserId = userId.trim();
    if (!normalizedUserId) {
        throw new Error("User id is required.");
    }

    const user = await prisma.user.findUnique({
        where: { id: normalizedUserId },
    });

    if (!user) {
        throw new Error("User not found.");
    }

    if (planIncludesAtLeast(user.plan, user.role, "PRO")) {
        throw new Error("Your current plan already includes premium access.");
    }

    const targetEntitlement = resolvePlanEntitlement("PRO", user.role);
    return prisma.user.update({
        where: { id: user.id },
        data: {
            plan: "PRO",
            storageLimit: Math.max(user.storageLimit, targetEntitlement.storageLimitFloor),
        },
    });
}
