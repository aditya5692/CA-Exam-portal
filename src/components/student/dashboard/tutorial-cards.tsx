"use client";

import { useState } from "react";
import { 
    CheckCircle, 
    ArrowRight, 
    ArrowLeft, 
    X, 
    ClipboardText, 
    Files, 
    ChartBar, 
    Lightning 
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type TutorialStep = {
    title: string;
    description: string;
    icon: any;
    color: string;
};

const STEPS: TutorialStep[] = [
    {
        title: "Explore Mock Tests",
        description: "Begin your journey by attempting full-length mock tests designed to mimic the real CA exam environment.",
        icon: ClipboardText,
        color: "var(--student-accent-strong)",
    },
    {
        title: "Review Past Year Questions",
        description: "Analyze and practice questions from previous years to understand recurring patterns and important topics.",
        icon: Files,
        color: "#b7791f",
    },
    {
        title: "Track Your Analytics",
        description: "Monitor your progress with deep analytics. Identify weak spots and focus your revision where it matters most.",
        icon: ChartBar,
        color: "#1f5c50",
    },
    {
        title: "Master the War Room",
        description: "Enter the focus mode for timed practice and boost your internal rhythm before the actual exam day.",
        icon: Lightning,
        color: "#991b1b",
    },
];

export function TutorialCards() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    const step = STEPS[currentStep];
    const Icon = step.icon;

    return (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="relative overflow-hidden rounded-[32px] border border-[#e6dccd] bg-white p-6 shadow-[0_20px_50px_rgba(55,48,38,0.06)] sm:p-10">
                {/* Background Decoration */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[rgba(242,227,192,0.15)] blur-3xl" />
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[rgba(220,235,230,0.2)] blur-3xl" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#667370]">Quick Start Tutorial</div>
                            <h2 className="mt-2 font-outfit text-3xl font-black tracking-tight text-[#1f2b2f]">
                                Welcome to your Workspace
                            </h2>
                        </div>
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4ede2] text-[#667370] transition-all hover:bg-[#e6dccd] hover:text-[#1f2b2f]"
                        >
                            <X size={20} weight="bold" />
                        </button>
                    </div>

                    <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 items-center">
                        <div className="space-y-6">
                            <div className="flex gap-2">
                                {STEPS.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={cn(
                                            "h-1.5 rounded-full transition-all duration-500",
                                            idx === currentStep ? "w-8 bg-[#1f5c50]" : "w-1.5 bg-[#e6dccd]"
                                        )} 
                                    />
                                ))}
                            </div>

                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f4ede2] transition-transform duration-500 hover:scale-110" style={{ color: step.color }}>
                                <Icon size={32} weight="fill" />
                            </div>

                            <div className="space-y-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1f5c50]">
                                    Step {currentStep + 1} of 4
                                </div>
                                <h3 className="font-outfit text-2xl font-black text-[#1f2b2f]">
                                    {step.title}
                                </h3>
                                <p className="text-sm font-medium leading-relaxed text-[#667370] max-w-sm">
                                    {step.description}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                {currentStep > 0 && (
                                    <button 
                                        onClick={() => setCurrentStep(prev => prev - 1)}
                                        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e6dccd] bg-white text-[#1f5c50] transition-all hover:bg-[#f4ede2]"
                                    >
                                        <ArrowLeft size={20} weight="bold" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => {
                                        if (currentStep < STEPS.length - 1) {
                                            setCurrentStep(prev => prev + 1);
                                        } else {
                                            setIsVisible(false);
                                        }
                                    }}
                                    className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-[#1f5c50] py-3.5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_12px_24px_rgba(31,92,80,0.15)] transition-all hover:bg-[#18493f] active:scale-95"
                                >
                                    {currentStep < STEPS.length - 1 ? "Next Step" : "Get Started"}
                                    <ArrowRight size={18} weight="bold" />
                                </button>
                            </div>
                        </div>

                        <div className="hidden lg:block relative group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#1f5c50]/5 to-transparent rounded-[32px] -m-4 group-hover:m-0 transition-all duration-700" />
                            <div className="aspect-[16/9] bg-[#f4ede2] rounded-[24px] border border-[#e6dccd] flex items-center justify-center shadow-inner overflow-hidden">
                                {/* Visual representation of the step */}
                                <div className="text-center p-8 animate-in zoom-in-95 duration-700">
                                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg mb-6 text-[#1f5c50]">
                                        <Icon size={40} weight="duotone" />
                                    </div>
                                    <div className="h-2 w-32 bg-[#e6dccd] rounded-full mx-auto mb-3" />
                                    <div className="h-2 w-24 bg-[#e6dccd] rounded-full mx-auto opacity-50" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
