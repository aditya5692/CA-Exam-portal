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
    monthlyPrice?: string;
    annualPrice: string;
    description: string;
    features: PlanFeature[];
    buttonText: string;
    highlight?: boolean;
    icon: React.ElementType;
    type: "teacher" | "student";
    razorpayMonthlyPlanId?: string;
}

const TEACHER_PLANS: Plan[] = [
    {
        id: "t-free",
        name: "Free",
        price: "₹0",
        annualPrice: "₹0",
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
        annualPrice: "₹2,499",
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
        annualPrice: "Custom",
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
        annualPrice: "₹0",
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
        annualPrice: "₹399",
        monthlyPrice: "₹49",
        razorpayMonthlyPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_PRO || "plan_dummy_123",
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
    const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const activePlans = view === "teacher" ? TEACHER_PLANS : STUDENT_PLANS;

    const handlePlanClick = useCallback((plan: Plan) => {
        if (plan.price === "Custom") {
            window.location.href = "mailto:sales@financly.portal";
            return;
        }

        const planToCheckout = {
            ...plan,
            price: billingCycle === "annual" ? plan.annualPrice : (plan.monthlyPrice || plan.annualPrice),
            isRecurring: billingCycle === "monthly" && !!plan.razorpayMonthlyPlanId,
            razorpayPlanId: plan.razorpayMonthlyPlanId,
        };

        setSelectedPlan(planToCheckout);
        setIsModalOpen(true);
    }, [billingCycle]);

    return (
        <div className="space-y-10">
            {!userRole && (
                <div className="flex flex-col items-center gap-6">
                    <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setView("student")}
                            className={cn(
                                "px-6 py-2 rounded-lg text-sm font-bold transition-all truncate",
                                view === "student" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            Student Plans
                        </button>
                        <button
                            onClick={() => setView("teacher")}
                            className={cn(
                                "px-6 py-2 rounded-lg text-sm font-bold transition-all truncate",
                                view === "teacher" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            Teacher Plans
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className={cn("text-xs font-bold transition-colors", billingCycle === "monthly" ? "text-slate-900" : "text-slate-400")}>Monthly</span>
                        <button 
                            onClick={() => setBillingCycle(billingCycle === "annual" ? "monthly" : "annual")}
                            className="relative w-12 h-6 bg-slate-200 rounded-full p-1 transition-all"
                        >
                            <div className={cn(
                                "w-4 h-4 bg-emerald-500 rounded-full transition-all duration-300",
                                billingCycle === "annual" ? "translate-x-6" : "translate-x-0"
                            )} />
                        </button>
                        <span className={cn("text-xs font-bold transition-colors", billingCycle === "annual" ? "text-slate-900" : "text-slate-400")}>Annual</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">Save 25%</span>
                    </div>
                </div>
            )}

            <div className={cn(
                "grid gap-6 mx-auto",
                view === "teacher" ? "max-w-6xl lg:grid-cols-3" : "max-w-4xl lg:grid-cols-2"
            )}>
                {activePlans.map((plan) => (
                    <div
                        key={plan.id}
                        className={cn(
                            "relative flex flex-col p-8 rounded-2xl transition-all duration-300",
                            "bg-white border border-slate-200 shadow-sm",
                            "hover:shadow-md hover:-translate-y-1",
                            plan.highlight && "ring-2 ring-emerald-500/10 border-emerald-500/20"
                        )}
                    >
                        {plan.highlight && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-b-lg">
                                Recommended
                            </div>
                        )}
                        
                        <div className="mb-8">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center mb-6",
                                plan.highlight 
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" 
                                    : "bg-slate-100 text-slate-500"
                            )}>
                                <plan.icon size={24} weight="bold" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-900 font-outfit">{plan.name}</h3>
                            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-tight">Plan ID: {plan.id.split('-')[1].toUpperCase()}</p>
                            
                            <div className="mt-6 flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-slate-900 font-outfit tracking-tight">
                                    {billingCycle === "annual" ? plan.annualPrice : (plan.monthlyPrice || plan.annualPrice)}
                                </span>
                                {plan.price !== "Custom" && (
                                    <span className="text-sm font-medium text-slate-400">
                                        / {billingCycle === "monthly" ? "month" : "year"}
                                    </span>
                                )}
                            </div>
                            
                            <p className="mt-4 text-slate-600 text-sm leading-relaxed">
                                {plan.description}
                            </p>
                        </div>

                        <div className="flex-grow space-y-3 mb-8 text-sm">
                            {plan.features.map((feature, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className={cn(
                                        "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                                        feature.included 
                                            ? "bg-emerald-50 text-emerald-600" 
                                            : "bg-slate-50 text-slate-300"
                                    )}>
                                        <Check size={12} weight="bold" />
                                    </div>
                                    <span className={cn(
                                        "font-medium",
                                        feature.included ? "text-slate-700" : "text-slate-400"
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
                                "w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                                userPlan === "PRO" && plan.highlight 
                                    ? "bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100" 
                                    : plan.highlight
                                        ? "bg-slate-900 text-white hover:bg-emerald-600 shadow-sm"
                                        : "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50"
                            )}>
                            <span>{userPlan === "PRO" && plan.highlight ? "Active Plan" : plan.buttonText}</span>
                            {!(userPlan === "PRO" && plan.highlight) && <CaretRight size={16} weight="bold" />}
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
