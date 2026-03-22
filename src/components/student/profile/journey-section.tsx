"use client";

import { CheckCircle2 } from "lucide-react";

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
    let subtitle = "Start your CA journey.";
    if (foundationCleared && intermediateCleared && finalCleared) {
        subtitle = "Congratulations. You have completed the full CA path.";
    } else if (foundationCleared && intermediateCleared) {
        subtitle = "Foundation and Intermediate cleared. Final pending.";
    } else if (foundationCleared) {
        subtitle = "Foundation cleared. Intermediate pending.";
    }

    const calculatedPercentage = percentage !== undefined ? percentage : (
        (foundationCleared ? 33 : 0) +
        (intermediateCleared ? 33 : 0) +
        (finalCleared ? 34 : 0)
    );

    return (
        <div className="student-surface relative mb-8 overflow-hidden rounded-[32px] p-8 font-outfit md:p-10">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(220,235,230,0.68),transparent_62%)]" />
            <div className="absolute -bottom-24 left-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(242,227,192,0.52),transparent_60%)]" />

            <div className="relative z-10 mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <div className="student-chip inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--student-muted)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--student-support)]" />
                        Progress Path
                    </div>
                    <h2 className="mt-3 text-xl font-black tracking-tight text-[var(--student-text)]">CA Journey Progress</h2>
                    <p className="mt-1 text-sm font-medium text-[var(--student-muted)]">{subtitle}</p>
                </div>
                <div className="text-5xl font-black tracking-tighter text-[var(--student-accent-strong)]">
                    {calculatedPercentage}%
                </div>
            </div>

            <div className="relative z-10 space-y-8">
                <div className="relative h-4 overflow-hidden rounded-full border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-0.5 shadow-inner">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--student-accent)] via-[var(--student-accent-strong)] to-[var(--student-support)] shadow-[0_0_18px_rgba(31,92,80,0.22)] transition-all duration-1000 ease-out"
                        style={{ width: `${calculatedPercentage}%` }}
                    />
                </div>

                <div className="flex flex-col justify-between gap-6 md:flex-row md:gap-0">
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
            <div className={`flex h-6 w-6 items-center justify-center rounded-full ${isCompleted ? "bg-[var(--student-accent-strong)] text-white shadow-[0_10px_22px_rgba(31,92,80,0.16)]" : "border-2 border-[var(--student-border)] bg-[var(--student-panel-solid)] text-[var(--student-muted)]"}`}>
                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-2.5 w-2.5 rounded-full border border-[var(--student-border-strong)]" />}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isCompleted ? "text-[var(--student-accent-strong)]" : "text-[var(--student-muted)]"}`}>
                {label}
            </span>
        </div>
    );
}
