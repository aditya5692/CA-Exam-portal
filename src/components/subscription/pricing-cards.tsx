"use client";

import { cn } from "@/lib/utils";
import { Buildings, CaretRight, Check, Rocket, Sparkle } from "@phosphor-icons/react";
import React, { useCallback, useState } from "react";
import { CheckoutModal } from "./checkout-modal";

interface PlanFeature {
    text: string;
    included: boolean;
}

interface Plan {
    id: string;
    name: string;
    price: string;
    description: string;
    features: PlanFeature[];
    buttonText: string;
    highlight?: boolean;
    icon: React.ElementType;
    type: "teacher" | "student";
}

const TEACHER_PLANS: Plan[] = [
    {
        id: "t-free",
        name: "Free",
        price: "₹0",
        description: "Perfect for getting started with small cohorts.",
        icon: Rocket,
        type: "teacher",
        buttonText: "Get Started",
        features: [
            { text: "Up to 50 students", included: true },
            { text: "1 active cohort", included: true },
            { text: "Basic MCQ Editor", included: true },
            { text: "Email Support", included: true },
            { text: "Advanced Analytics", included: false },
        ]
    },
    {
        id: "t-pro",
        name: "Studio Pro",
        price: "₹2,499",
        description: "Advanced tools for professional educators.",
        icon: Sparkle,
        highlight: true,
        type: "teacher",
        buttonText: "Upgrade to Pro",
        features: [
            { text: "Unlimited students", included: true },
            { text: "Unlimited cohorts", included: true },
            { text: "Advanced MCQ Editor", included: true },
            { text: "Topic Mastery Heatmaps", included: true },
            { text: "Priority Support", included: true },
        ]
    },
    {
        id: "t-academy",
        name: "Academy",
        price: "Custom",
        description: "Enterprise features for large institutions.",
        icon: Buildings,
        type: "teacher",
        buttonText: "Contact Sales",
        features: [
            { text: "White-labeled platform", included: true },
            { text: "Dedicated account manager", included: true },
            { text: "Custom API integrations", included: true },
            { text: "SLA Guarantees", included: true },
            { text: "School-wide analytics", included: true },
        ]
    }
];

const STUDENT_PLANS: Plan[] = [
    {
        id: "s-free",
        name: "CA Pass",
        price: "₹0",
        description: "Essential tools for every CA aspirant.",
        icon: Rocket,
        type: "student",
        buttonText: "Start Learning",
        features: [
            { text: "500+ Mock Tests access", included: true },
            { text: "Basic Performance Dashboard", included: true },
            { text: "Study Community access", included: true },
            { text: "Ads supported", included: true },
            { text: "Unlimited Reattempts", included: false },
            { text: "Previous Year Papers", included: false },
        ]
    },
    {
        id: "s-elite",
        name: "CA Pass PRO",
        price: "₹399",
        description: "The ultimate edge for exam success.",
        icon: Sparkle,
        highlight: true,
        type: "student",
        buttonText: "Activate Pass PRO",
        features: [
            { text: "18,000+ Mock Tests", included: true },
            { text: "Unlimited Reattempts", included: true },
            { text: "10 Years Previous Papers", included: true },
            { text: "Subject Mastery Heatmaps", included: true },
            { text: "Exclusive War Room access", included: true },
        ]
    }
];

export function PricingCards({ userPlan, userRole }: { userPlan?: string, userRole?: string }) {
    const defaultView = userRole === "TEACHER" || userRole === "ADMIN" ? "teacher" : "student";
    const [view, setView] = useState<"teacher" | "student">(defaultView);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const activePlans = view === "teacher" ? TEACHER_PLANS : STUDENT_PLANS;

    const handlePlanClick = useCallback((plan: Plan) => {
        if (plan.price === "Custom") {
            window.location.href = "mailto:sales@financly.portal";
            return;
        }
        setSelectedPlan(plan);
        setIsModalOpen(true);
    }, []);

    return (
        <div className="space-y-12">
            {!userRole && (
                <div className="flex justify-center">
                    <div className="inline-flex bg-[var(--landing-bg)] p-1 rounded-2xl border border-[var(--landing-border)] shadow-[var(--landing-shadow-sm)]">
                        <button
                            onClick={() => setView("student")}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all uppercase tracking-widest",
                                view === "student" ? "bg-[var(--landing-panel)] text-[var(--landing-accent)] shadow-sm border border-[var(--landing-border)]" : "text-[var(--landing-muted-light)] hover:text-[var(--landing-muted)]"
                            )}
                        >
                            Student Plans
                        </button>
                        <button
                            onClick={() => setView("teacher")}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all uppercase tracking-widest",
                                view === "teacher" ? "bg-[var(--landing-panel)] text-[var(--landing-accent)] shadow-sm border border-[var(--landing-border)]" : "text-[var(--landing-muted-light)] hover:text-[var(--landing-muted)]"
                            )}
                        >
                            Teacher Plans
                        </button>
                    </div>
                </div>
            )}

            <div className={cn(
                "grid gap-8 mx-auto",
                view === "teacher" ? "max-w-6xl lg:grid-cols-3" : "max-w-4xl lg:grid-cols-2"
            )}>
                {activePlans.map((plan) => (
                    <div
                        key={plan.id}
                        className={cn(
                            "relative p-8 rounded-[32px] bg-[var(--landing-panel)] border transition-all duration-300 group hover:shadow-[var(--landing-shadow-lg)] hover:-translate-y-1",
                            plan.highlight
                                ? "border-[var(--landing-accent)] shadow-[var(--landing-shadow)] ring-4 ring-[var(--landing-selection-bg)]"
                                : "border-[var(--landing-border)] shadow-[var(--landing-shadow-sm)] hover:border-[var(--landing-muted-light)]"
                        )}
                    >
                        {plan.highlight && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--landing-accent)] text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-lg">
                                Most Popular
                            </div>
                        )}

                        <div className="mb-8">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                                plan.highlight ? "bg-[var(--landing-accent)] text-white shadow-[var(--landing-shadow-accent)]" : "bg-[var(--landing-bg)] text-[var(--landing-muted-light)] border border-[var(--landing-border)]"
                            )}>
                                <plan.icon size={24} weight="bold" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--landing-text)] font-outfit mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-3">
                                <span className="text-4xl font-bold text-[var(--landing-text)] font-outfit">{plan.price}</span>
                                {plan.price !== "Custom" && <span className="text-[var(--landing-muted-light)] font-semibold tracking-tight">/year</span>}
                            </div>
                            <p className="text-[var(--landing-muted)] text-sm font-medium leading-relaxed">
                                {plan.description}
                            </p>
                        </div>

                        <div className="space-y-4 mb-10">
                            {plan.features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                                        feature.included ? "bg-[var(--landing-selection-bg)] text-[var(--landing-accent)]" : "bg-[var(--landing-bg)] text-[var(--landing-muted-light)]"
                                    )}>
                                        <Check size={12} weight="bold" />
                                    </div>
                                    <span className={cn(
                                        "text-sm font-medium transition-colors",
                                        feature.included ? "text-[var(--landing-muted)]" : "text-[var(--landing-muted-light)] line-through"
                                    )}>
                                        {feature.text}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            disabled={userPlan === "PRO" && plan.highlight}
                            onClick={() => handlePlanClick(plan)}
                            className={cn(
                                "w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95",
                                userPlan === "PRO" && plan.highlight ? "bg-[var(--landing-selection-bg)] text-[var(--landing-accent)] cursor-not-allowed border border-[var(--landing-border)]" :
                                    plan.highlight
                                        ? "bg-[var(--landing-accent)] text-white shadow-[var(--landing-shadow-accent)] hover:bg-[var(--landing-accent-hover)] hover:shadow-[var(--landing-shadow-accent-strong)]"
                                        : "bg-[var(--landing-bg)] text-[var(--landing-muted)] hover:bg-[var(--landing-selection-bg)] border border-[var(--landing-border)]"
                            )}>
                            {userPlan === "PRO" && plan.highlight ? "Current Plan" : plan.buttonText}
                            {userPlan === "PRO" && plan.highlight ? <Check size={18} weight="bold" /> : <CaretRight size={18} weight="bold" />}
                        </button>
                    </div>
                ))}
            </div>

            <CheckoutModal
                plan={selectedPlan}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
