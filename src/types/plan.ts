export type PlanSupportTier = "STANDARD" | "PRIORITY" | "ENTERPRISE";

export type CurrentPlanSummary = {
    plan: string;
    role: string;
    displayName: string;
    isPremium: boolean;
    supportTier: PlanSupportTier;
    storageUsed: number;
    storageLimit: number;
    storageUsagePercent: number;
    entitledStorageLimit: number;
    featureHighlights: string[];
    restrictions: string[];
    canUpgrade: boolean;
    recommendedPlan: string | null;
};
