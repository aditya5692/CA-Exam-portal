import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StudentPageHeaderProps {
    eyebrow: string;
    title: string;
    accent?: string;
    description: ReactNode;
    daysToExam?: number;
    aside?: ReactNode;
    className?: string;
}

export function StudentPageHeader({
    eyebrow,
    title,
    accent,
    description,
    daysToExam = 0,
    aside,
    className
}: StudentPageHeaderProps) {
    const milestone = daysToExam > 0 ? (
        <div className="student-chip inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-semibold whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-[var(--student-support)]" />
            Next milestone in {daysToExam} days
        </div>
    ) : null;

    const sideContent = aside ?? milestone;

    return (
        <div 
            className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between transition-all duration-300 tuner-heading-container", className)}
        >
            <div className="space-y-4">
                <div className="student-chip inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--student-accent)]" />
                    {eyebrow}
                </div>
                <h1 className="font-outfit text-3xl font-black leading-tight tracking-[-0.04em] text-[var(--student-text)] md:text-4xl">
                    {title}
                    {accent && <span className="text-[var(--student-accent-strong)]"> {accent}</span>}
                </h1>
                <div className="max-w-2xl font-sans text-base font-medium leading-relaxed text-[var(--student-muted)]">
                    {description}
                </div>
            </div>

            {sideContent && (
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {sideContent}
                </div>
            )}
        </div>
    );
}
