"use client";

import { cn } from "@/lib/utils";
import { Buildings, CaretRight, Check, Rocket, Sparkle } from "@phosphor-icons/react";
import type { ElementType } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckoutModal } from "./checkout-modal";

type PlanTier = "FREE" | "BASIC" | "PRO";

interface PlanFeature {
    text: string;
    included: boolean;
}

interface Plan {
    id: string;
    appPlan: PlanTier;
    name: string;
    annualPrice: string;
    monthlyPrice?: string;
    description: string;
    features: PlanFeature[];
    buttonText: string;
    highlight?: boolean;
    icon: ElementType;
    type: "teacher" | "student";
    razorpayMonthlyPlanId?: string;
}

type CheckoutPlan = {
    id: string;
    name: string;
    price: string;
    type: "teacher" | "student";
    isRecurring?: boolean;
};

const PLAN_RANKS: Record<PlanTier, number> = {
    FREE: 0,
    BASIC: 1,
    PRO: 2,
};

const TEACHER_PLANS: Plan[] = [
    {
        id: "t-free",
        appPlan: "FREE",
        name: "Free",
        annualPrice: "Rs 0",
        description: "For educators launching their first cohort and core publishing flow.",
        icon: Rocket,
        type: "teacher",
        buttonText: "Start Free",
        features: [
            { text: "Teacher dashboard, profile, and announcements", included: true },
            { text: "Starter batch workspace", included: true },
            { text: "Core materials and question-bank access", included: true },
            { text: "Student analytics workspace", included: false },
            { text: "Large-library content storage", included: false },
        ],
    },
    {
        id: "t-basic",
        appPlan: "BASIC",
        name: "Basic",
        annualPrice: "Rs 1,499",
        description: "For growing classes that need structure, tracking, and better delivery.",
        icon: Buildings,
        type: "teacher",
        buttonText: "Choose Basic",
        features: [
            { text: "Everything in Free, plus larger batch operations", included: true },
            { text: "Structured student management workflows", included: true },
            { text: "Extended materials and question-bank capacity", included: true },
            { text: "Operational insights across updates and assessments", included: true },
            { text: "Priority support lane", included: false },
        ],
    },
    {
        id: "t-pro",
        appPlan: "PRO",
        name: "Pro",
        annualPrice: "Rs 2,499",
        description: "For serious teaching teams running premium cohorts at scale.",
        icon: Sparkle,
        highlight: true,
        type: "teacher",
        buttonText: "Go Pro",
        features: [
            { text: "Unlimited batches and student operations", included: true },
            { text: "Full cohort analytics and premium reporting", included: true },
            { text: "Advanced content, publishing, and question-bank workflows", included: true },
            { text: "Premium content-library storage", included: true },
            { text: "Priority support", included: true },
        ],
    },
];

const STUDENT_PLANS: Plan[] = [
    {
        id: "s-free",
        appPlan: "FREE",
        name: "Free",
        annualPrice: "Rs 0",
        description: "For CA aspirants starting with daily practice and shared resources.",
        icon: Rocket,
        type: "student",
        buttonText: "Start Free",
        features: [
            { text: "Student dashboard, profile, and batch updates", included: true },
            { text: "Starter mock exams and shared materials", included: true },
            { text: "Core progress tracking", included: true },
            { text: "Premium PYQ and War Room workflows", included: false },
            { text: "Advanced mastery analytics", included: false },
        ],
    },
    {
        id: "s-basic",
        appPlan: "BASIC",
        name: "Basic",
        annualPrice: "Rs 199",
        monthlyPrice: "Rs 29",
        description: "For consistent prep with better revision depth and stronger tracking.",
        icon: Buildings,
        type: "student",
        buttonText: "Choose Basic",
        features: [
            { text: "Everything in Free, plus broader exam access", included: true },
            { text: "PYQ and revision-kit unlocks", included: true },
            { text: "Extended study-vault storage", included: true },
            { text: "Performance snapshots across attempts", included: true },
            { text: "Full War Room tooling", included: false },
        ],
    },
    {
        id: "s-pro",
        appPlan: "PRO",
        name: "Pro",
        annualPrice: "Rs 399",
        monthlyPrice: "Rs 49",
        description: "For high-intensity exam prep with full analytics and premium practice depth.",
        icon: Sparkle,
        highlight: true,
        type: "student",
        buttonText: "Go Pro",
        features: [
            { text: "Unlimited mock reattempts", included: true },
            { text: "Full War Room access", included: true },
            { text: "Advanced mastery analytics", included: true },
            { text: "Premium PYQ workflows", included: true },
            { text: "Priority support", included: true },
        ],
    },
];

function normalizeVisiblePlanTier(plan?: string): PlanTier {
    const normalizedPlan = plan?.trim().toUpperCase();

    if (normalizedPlan === "FREE") {
        return "FREE";
    }

    if (normalizedPlan === "BASIC") {
        return "BASIC";
    }

    return "PRO";
}

function getPlanPrice(plan: Plan, billingCycle: "annual" | "monthly") {
    if (billingCycle === "monthly" && plan.monthlyPrice && plan.razorpayMonthlyPlanId) {
        return plan.monthlyPrice;
    }

    return plan.annualPrice;
}

export function PricingCards({ userPlan, userRole }: { userPlan?: string; userRole?: string }) {
    const defaultView = userRole === "TEACHER" || userRole === "ADMIN" ? "teacher" : "student";
    const [view, setView] = useState<"teacher" | "student">(defaultView);
    const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
    const [selectedPlan, setSelectedPlan] = useState<CheckoutPlan | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [publicConfig, setPublicConfig] = useState({
        razorpayPlanBasic: "",
        razorpayPlanPro: "",
    });

    useEffect(() => {
        let isMounted = true;

        async function loadRuntimeConfig() {
            try {
                const response = await fetch("/api/platform-config/public", {
                    cache: "no-store",
                });
                const payload = await response.json();

                if (!isMounted) {
                    return;
                }

                setPublicConfig({
                    razorpayPlanBasic: payload.razorpayPlanBasic ?? "",
                    razorpayPlanPro: payload.razorpayPlanPro ?? "",
                });
            } catch (error) {
                console.error("Failed to load public platform config for pricing", error);
            }
        }

        void loadRuntimeConfig();

        return () => {
            isMounted = false;
        };
    }, []);

    const studentPlans = useMemo(() => STUDENT_PLANS.map((plan) => {
        if (plan.id === "s-basic") {
            return {
                ...plan,
                razorpayMonthlyPlanId: publicConfig.razorpayPlanBasic || undefined,
            };
        }

        if (plan.id === "s-pro") {
            return {
                ...plan,
                razorpayMonthlyPlanId: publicConfig.razorpayPlanPro || undefined,
            };
        }

        return plan;
    }), [publicConfig.razorpayPlanBasic, publicConfig.razorpayPlanPro]);

    const activePlans = view === "teacher" ? TEACHER_PLANS : studentPlans;
    const supportsMonthlyBilling = useMemo(
        () => activePlans.every((plan) => plan.appPlan === "FREE" || (plan.monthlyPrice && plan.razorpayMonthlyPlanId)),
        [activePlans],
    );
    const effectiveBillingCycle = supportsMonthlyBilling ? billingCycle : "annual";
    const currentPlanTier = userPlan ? normalizeVisiblePlanTier(userPlan) : null;
    const currentPlanRank = currentPlanTier ? PLAN_RANKS[currentPlanTier] : -1;

    const handlePlanClick = useCallback((plan: Plan) => {
        if (plan.appPlan === "FREE" && !userRole) {
            const role = plan.type === "teacher" ? "TEACHER" : "STUDENT";
            window.location.href = `/auth/signup?role=${role}`;
            return;
        }

        const selectedBillingCycle = effectiveBillingCycle === "monthly" && plan.monthlyPrice && plan.razorpayMonthlyPlanId
            ? "monthly"
            : "annual";

        const planToCheckout: CheckoutPlan = {
            id: plan.id,
            name: plan.name,
            price: getPlanPrice(plan, selectedBillingCycle),
            type: plan.type,
            isRecurring: selectedBillingCycle === "monthly",
        };

        setSelectedPlan(planToCheckout);
        setIsModalOpen(true);
    }, [effectiveBillingCycle, userRole]);

    return (
        <div className="space-y-10">
            {!userRole && (
                <div className="flex flex-col items-center gap-6">
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                        <button
                            onClick={() => setView("student")}
                            className={cn(
                                "truncate rounded-lg px-6 py-2 text-sm font-bold transition-all",
                                view === "student" ? "border border-slate-200 bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900",
                            )}
                        >
                            Student Plans
                        </button>
                        <button
                            onClick={() => setView("teacher")}
                            className={cn(
                                "truncate rounded-lg px-6 py-2 text-sm font-bold transition-all",
                                view === "teacher" ? "border border-slate-200 bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900",
                            )}
                        >
                            Teacher Plans
                        </button>
                    </div>

                    {supportsMonthlyBilling && (
                        <div className="flex items-center gap-4">
                            <span className={cn("text-xs font-bold transition-colors", billingCycle === "monthly" ? "text-slate-900" : "text-slate-400")}>
                                Monthly
                            </span>
                            <button
                                onClick={() => setBillingCycle(billingCycle === "annual" ? "monthly" : "annual")}
                                className="relative h-6 w-12 rounded-full bg-slate-200 p-1 transition-all"
                            >
                                <div
                                    className={cn(
                                        "h-4 w-4 rounded-full bg-emerald-500 transition-all duration-300",
                                        billingCycle === "annual" ? "translate-x-6" : "translate-x-0",
                                    )}
                                />
                            </button>
                            <span className={cn("text-xs font-bold transition-colors", billingCycle === "annual" ? "text-slate-900" : "text-slate-400")}>
                                Annual
                            </span>
                            <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                Save 25%
                            </span>
                        </div>
                    )}

                    {view === "student" && !supportsMonthlyBilling && (
                        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                            Monthly student plans will appear here once Razorpay recurring plan IDs are saved in admin integrations.
                        </div>
                    )}
                </div>
            )}

            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
                {activePlans.map((plan) => {
                    const planRank = PLAN_RANKS[plan.appPlan];
                    const isCurrentPlan = currentPlanTier === plan.appPlan;
                    const isIncludedInCurrentPlan = currentPlanRank > planRank;
                    const isDisabled = plan.appPlan === "FREE"
                        ? isCurrentPlan || isIncludedInCurrentPlan
                        : isIncludedInCurrentPlan;
                    const buttonLabel = isCurrentPlan
                        ? plan.appPlan === "FREE"
                            ? "Current Plan"
                            : "Renew This Plan"
                        : isIncludedInCurrentPlan
                            ? `Included in ${currentPlanTier === "PRO" ? "Pro" : "Basic"}`
                            : plan.buttonText;
                    const displayedPrice = getPlanPrice(plan, effectiveBillingCycle);
                    const priceSuffix = displayedPrice === "Rs 0"
                        ? null
                        : effectiveBillingCycle === "monthly" && plan.monthlyPrice && plan.razorpayMonthlyPlanId
                            ? "/ month"
                            : "/ year";

                    return (
                        <div
                            key={plan.id}
                            className={cn(
                                "relative flex flex-col rounded-lg border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300",
                                "hover:-translate-y-1 hover:shadow-md",
                                plan.highlight && "border-emerald-500/20 ring-2 ring-emerald-500/10",
                            )}
                        >
                            {plan.highlight && (
                                <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-lg-b-lg bg-emerald-500 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                                    Recommended
                                </div>
                            )}

                            <div className="mb-8">
                                <div
                                    className={cn(
                                        "mb-6 flex h-12 w-12 items-center justify-center rounded-lg",
                                        plan.highlight
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                                            : "bg-slate-100 text-slate-500",
                                    )}
                                >
                                    <plan.icon size={24} weight="bold" />
                                </div>

                                <h3 className="  text-xl font-bold text-slate-950">{plan.name}</h3>
                                <p className="mt-1 text-xs font-bold uppercase tracking-tight text-slate-500">
                                    Tier: {plan.appPlan}
                                </p>

                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className="  text-4xl font-bold tracking-tight text-slate-950">
                                        {displayedPrice}
                                    </span>
                                    {priceSuffix && (
                                        <span className="text-sm font-medium text-slate-400">
                                            {priceSuffix}
                                        </span>
                                    )}
                                </div>

                                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                                    {plan.description}
                                </p>
                            </div>

                            <div className="mb-8 flex-grow space-y-3 text-sm">
                                {plan.features.map((feature) => (
                                    <div key={feature.text} className="flex items-start gap-3">
                                        <div
                                            className={cn(
                                                "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full",
                                                feature.included
                                                    ? "bg-emerald-50 text-emerald-600"
                                                    : "bg-slate-50 text-slate-300",
                                            )}
                                        >
                                            <Check size={12} weight="bold" />
                                        </div>
                                        <span
                                            className={cn(
                                                "font-medium",
                                                feature.included ? "text-slate-700" : "text-slate-400",
                                            )}
                                        >
                                            {feature.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button
                                disabled={isDisabled}
                                onClick={() => handlePlanClick(plan)}
                                className={cn(
                                    "flex w-full items-center justify-center gap-2 rounded-lg py-4 text-sm font-bold transition-all",
                                    isDisabled
                                        ? "cursor-not-allowed border border-slate-100 bg-slate-50 text-slate-400"
                                        : plan.highlight
                                            ? "bg-[#0f2cbd] text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"
                                            : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                                )}
                            >
                                <span>{buttonLabel}</span>
                                {!isDisabled && <CaretRight size={16} weight="bold" />}
                            </button>
                        </div>
                    );
                })}
            </div>

            <CheckoutModal
                plan={selectedPlan}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
