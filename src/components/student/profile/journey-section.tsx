"use client";

import { CheckCircle2, Circle } from "lucide-react";

interface JourneyProgressProps {
    foundationCleared: boolean;
    intermediateCleared: boolean;
    finalCleared: boolean;
    percentage?: number;
}

export function JourneySection({ 
    foundationCleared, 
    intermediateCleared, 
    finalCleared,
    percentage = 75 
}: JourneyProgressProps) {
    // Determine subtitle
    let subtitle = "Start your CA Journey";
    if (foundationCleared && intermediateCleared && finalCleared) {
        subtitle = "Congratulations! You are a CA.";
    } else if (foundationCleared && intermediateCleared) {
        subtitle = "Foundation & Inter Cleared • Final Pending";
    } else if (foundationCleared) {
        subtitle = "Foundation Cleared • Intermediate Pending";
    }

    // Default percentage logic if not provided
    const calculatedPercentage = percentage !== undefined ? percentage : (
        (foundationCleared ? 33 : 0) + 
        (intermediateCleared ? 33 : 0) + 
        (finalCleared ? 34 : 0)
    );

    return (
        <div className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/20 mb-8 font-outfit relative overflow-hidden">
             {/* Background glow */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
             
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">CA Journey Progress</h2>
                    <p className="text-slate-400 text-sm font-medium mt-1">{subtitle}</p>
                </div>
                <div className="text-5xl font-black text-indigo-600 tracking-tighter">
                    {calculatedPercentage}%
                </div>
             </div>

             <div className="space-y-8">
                {/* Progress Bar Container */}
                <div className="relative h-4 bg-slate-50 rounded-full border border-slate-100 overflow-hidden shadow-inner p-0.5">
                    <div 
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all duration-1000 ease-out"
                        style={{ width: `${calculatedPercentage}%` }}
                    />
                </div>

                {/* Checkpoints */}
                <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-0">
                    <Checkpoint label="FOUNDATION" isCompleted={foundationCleared} />
                    <Checkpoint label="INTERMEDIATE" isCompleted={intermediateCleared} />
                    <Checkpoint label="FINAL" isCompleted={finalCleared} />
                </div>
             </div>
        </div>
    );
}

function Checkpoint({ label, isCompleted }: { label: string; isCompleted: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isCompleted ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-300" />}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isCompleted ? 'text-indigo-600' : 'text-slate-400'}`}>
                {label}
            </span>
        </div>
    );
}
