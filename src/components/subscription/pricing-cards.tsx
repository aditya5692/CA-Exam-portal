"use client";

import { cn } from "@/lib/utils";
import { Buildings,CaretRight,Check,Rocket,Sparkle } from "@phosphor-icons/react";
import { useCallback,useState } from "react";

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

import React from "react";

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

import { CheckoutModal } from "./checkout-modal";

export function PricingCards({ userPlan, userRole }: { userPlan?: string, userRole?: string }) {
    const defaultView = userRole === "TEACHER" || userRole === "ADMIN" ? "teacher" : "student";
    const [view, setView] = useState<"teacher" | "student">(defaultView);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const activePlans = view === "teacher" ? TEACHER_PLANS : STUDENT_PLANS;

    const handlePlanClick = useCallback((plan: Plan) => {
        if (plan.price === "Custom") {
            // Forward to contact sales or similar
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
                    <div className="inline-flex bg-gray-50 p-1 rounded-2xl border border-gray-100 shadow-sm">
                        <button
                            onClick={() => setView("student")}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all uppercase tracking-widest",
                                view === "student" ? "bg-white text-indigo-600 shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            Student Plans
                        </button>
                        <button
                            onClick={() => setView("teacher")}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all uppercase tracking-widest",
                                view === "teacher" ? "bg-white text-indigo-600 shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
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
                            "relative p-8 rounded-[32px] bg-white border transition-all duration-300 group hover:shadow-2xl hover:-translate-y-1",
                            plan.highlight
                                ? "border-indigo-500 shadow-xl shadow-indigo-500/5 ring-4 ring-indigo-50"
                                : "border-gray-100 shadow-sm hover:border-gray-200"
                        )}
                    >
                        {plan.highlight && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-lg">
                                Most Popular
                            </div>
                        )}

                        <div className="mb-8">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                                plan.highlight ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-gray-50 text-gray-400 border border-gray-100"
                            )}>
                                <plan.icon size={24} weight="bold" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 font-outfit mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-3">
                                <span className="text-4xl font-bold text-gray-900 font-outfit">{plan.price}</span>
                                {plan.price !== "Custom" && <span className="text-gray-400 font-semibold tracking-tight">/year</span>}
                            </div>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                {plan.description}
                            </p>
                        </div>

                        <div className="space-y-4 mb-10">
                            {plan.features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                                        feature.included ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-300"
                                    )}>
                                        <Check size={12} weight="bold" />
                                    </div>
                                    <span className={cn(
                                        "text-sm font-medium transition-colors",
                                        feature.included ? "text-gray-600" : "text-gray-300 line-through"
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
                                userPlan === "PRO" && plan.highlight ? "bg-emerald-50 text-emerald-600 cursor-not-allowed border border-emerald-100" :
                                    plan.highlight
                                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/30"
                                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
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
