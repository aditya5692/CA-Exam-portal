"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@phosphor-icons/react";

interface MetricCardProps {
    label: string;
    value: string;
    trend: string;
    icon: Icon;
    color: "accent" | "success" | "support" | "neutral";
}

export function MetricCard({ label, value, trend, icon: Icon, color }: MetricCardProps) {
    const colorClasses = {
        accent: "bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)]",
        success: "bg-emerald-50 text-emerald-600",
        support: "bg-[var(--student-support-soft)] text-[var(--student-support-strong)]",
        neutral: "bg-slate-50 text-slate-600"
    };

    return (
        <div className="group relative overflow-hidden rounded-[32px] border border-[var(--student-border)] bg-white p-6 transition-all hover:-translate-y-1 hover:border-[var(--student-accent-soft-strong)] hover:shadow-xl">
            <div className="flex items-start justify-between">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110", colorClasses[color])}>
                    <Icon size={24} weight="bold" />
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">{label}</p>
                    <h3 className="mt-1 font-outfit text-3xl font-black text-[var(--student-text)]">{value}</h3>
                </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-[var(--student-border)] pt-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--student-muted-strong)]">{trend}</span>
                <div className="h-1 w-12 rounded-full bg-[var(--student-border)]" />
            </div>
        </div>
    );
}
