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

    const breadcrumbs = eyebrow.split(">").map(s => s.trim());

    return (
        <div
            className={cn("flex flex-col gap-1 md:gap-2 transition-all duration-300 tuner-heading-container pb-10", className)}
        >
            {/* Breadcrumb Layer */}
            <nav className="flex items-center select-none mb-3">
                {breadcrumbs.map((crumb, idx) => (
                    <div key={idx} className="flex items-center">
                        <span className="breadcrumb-item">
                            {crumb}
                        </span>
                        {idx < breadcrumbs.length - 1 && (
                            <span className="breadcrumb-separator">/</span>
                        )}
                    </div>
                ))}
            </nav>

            {/* Title Layer */}
            <h1 className="text-2xl font-semibold tracking-tight text-[#111827] md:text-[32px] font-sans">
                {title}
                {accent && <span className="text-[var(--student-accent)]"> {accent}</span>}
            </h1>

            {/* Content & Action Layer */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                {description && (
                    <div className="max-w-3xl text-base font-normal leading-relaxed text-[#4B5563]">
                        {description}
                    </div>
                )}

                {sideContent && (
                    <div className="shrink-0">
                        {sideContent}
                    </div>
                )}
            </div>
        </div>
    );
}
