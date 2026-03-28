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
        "Core portal access across dashboard and profile surfaces",
        "Starter materials and exam workflows",
    ],
    restrictions: [
        "Advanced analytics, premium distribution tools, and higher storage stay locked",
    ],
};

const STUDENT_ENTITLEMENTS: RolePlanMatrix = {
    FREE: {
        displayName: "Free",
        rank: 0,
        storageLimitFloor: 50 * MB,
        supportTier: "STANDARD",
        isPremium: false,
        featureHighlights: [
            "Student dashboard, profile, and batch update access",
            "Starter mock exams with shared study materials",
            "Free resources and core progress tracking",
        ],
        restrictions: [
            "Advanced analytics, premium PYQ packs, and War Room drills stay locked",
            "Revision-vault storage remains on the starter limit",
        ],
    },
    BASIC: {
        displayName: "Basic",
        rank: 1,
        storageLimitFloor: 256 * MB,
        supportTier: "STANDARD",
        isPremium: true,
        featureHighlights: [
            "Everything in Free, plus a broader exam hub and more revision attempts",
            "Extended personal study vault storage for saved materials and notes",
            "Performance snapshots across exams, materials, and educator updates",
        ],
        restrictions: [
            "Deep mastery analytics, premium War Room tooling, and the fastest support lane stay on Pro",
        ],
    },
    PRO: {
        displayName: "Pro",
        rank: 2,
        storageLimitFloor: 512 * MB,
        supportTier: "PRIORITY",
        isPremium: true,
        featureHighlights: [
            "Unlimited mock reattempts, premium PYQ workflows, and full War Room access",
            "Advanced student analytics with mastery-focused performance views",
            "Priority support and the highest protected study storage allocation",
        ],
        restrictions: [],
    },
    ELITE: {
        displayName: "Pro",
        rank: 3,
        storageLimitFloor: 768 * MB,
        supportTier: "PRIORITY",
        isPremium: true,
        featureHighlights: [
            "Legacy elite access retained with all current Pro capabilities",
            "Expanded revision storage for older premium accounts",
            "Priority support continuity",
        ],
        restrictions: [],
    },
    ENTERPRISE: {
        displayName: "Enterprise",
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
        displayName: "Free",
        rank: 0,
        storageLimitFloor: 50 * MB,
        supportTier: "STANDARD",
        isPremium: false,
        featureHighlights: [
            "Teacher dashboard, profile, and starter publishing workspace",
            "Core batches, announcements, and material sharing",
            "Starter question bank access for early cohorts",
        ],
        restrictions: [
            "Large cohort operations, advanced analytics, and expanded content storage stay locked",
        ],
    },
    BASIC: {
        displayName: "Basic",
        rank: 1,
        storageLimitFloor: 512 * MB,
        supportTier: "STANDARD",
        isPremium: true,
        featureHighlights: [
            "Everything in Free, plus structured batch and student management at growing scale",
            "Extended materials library and question-bank workflows for active classes",
            "Operational insights across students, updates, and assessments",
        ],
        restrictions: [
            "Unlimited distribution, advanced cohort analytics, and the highest storage band stay on Pro",
        ],
    },
    PRO: {
        displayName: "Pro",
        rank: 2,
        storageLimitFloor: 2 * GB,
        supportTier: "PRIORITY",
        isPremium: true,
        featureHighlights: [
            "Unlimited teaching operations across batches, students, materials, and question banks",
            "Premium analytics for cohort performance and teaching velocity",
            "Priority support with maximum content-library storage",
        ],
        restrictions: [],
    },
    ELITE: {
        displayName: "Pro",
        rank: 3,
        storageLimitFloor: 3 * GB,
        supportTier: "PRIORITY",
        isPremium: true,
        featureHighlights: [
            "Legacy elite access retained with all current Pro capabilities",
            "Expanded storage preserved for older premium educator accounts",
            "Priority support continuity",
        ],
        restrictions: [],
    },
    ENTERPRISE: {
        displayName: "Enterprise",
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

export function normalizePlanCode(plan: string | null | undefined) {
    const normalizedPlan = (plan ?? "").trim().toUpperCase();
    return normalizedPlan || "FREE";
}

export function resolvePublicPlanTier(plan: string | null | undefined): "FREE" | "BASIC" | "PRO" {
    const normalizedPlan = normalizePlanCode(plan);

    if (normalizedPlan === "FREE") {
        return "FREE";
    }

    if (normalizedPlan === "BASIC") {
        return "BASIC";
    }

    return "PRO";
}

export function resolvePlanEntitlement(plan: string, role: string): EntitlementDefinition {
    const normalizedPlan = normalizePlanCode(plan);
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
    const publicPlanTier = resolvePublicPlanTier(input.plan);
    const storageLimit = Math.max(input.storageLimit, 0);
    const storageUsagePercent = storageLimit > 0
        ? Math.min(100, Math.round((input.storageUsed / storageLimit) * 100))
        : 0;
    const canUpgrade = input.role === "ADMIN"
        ? !planIncludesAtLeast(input.plan, input.role, "ENTERPRISE")
        : publicPlanTier !== "PRO";
    const recommendedPlan = input.role === "ADMIN"
        ? (canUpgrade ? "ENTERPRISE" : null)
        : publicPlanTier === "FREE"
            ? "BASIC"
            : publicPlanTier === "BASIC"
                ? "PRO"
                : null;

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
        recommendedPlan,
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

export async function syncUserPlanAccess(
    userId: string,
    targetPlan: string,
    planExpiresAt?: Date | null,
) {
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

    const entitlement = resolvePlanEntitlement(targetPlan, user.role);
    return prisma.user.update({
        where: { id: user.id },
        data: {
            plan: targetPlan,
            planExpiresAt: planExpiresAt ?? user.planExpiresAt,
            storageLimit: Math.max(user.storageLimit, entitlement.storageLimitFloor),
        },
    });
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

    return syncUserPlanAccess(user.id, "PRO");
}
