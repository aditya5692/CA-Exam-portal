import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SharedPageHeaderProps {
    eyebrow: string;
    title: string;
    accent?: string;
    description: ReactNode;
    daysToExam?: number;
    aside?: ReactNode;
    className?: string;
}

export function SharedPageHeader({
    eyebrow,
    title,
    accent,
    description,
    daysToExam = 0,
    aside,
    className
}: SharedPageHeaderProps) {
    const milestone = daysToExam > 0 ? (
        <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 bg-indigo-50 border border-indigo-100/50 shadow-sm animate-in fade-in slide-in-from-right-4 duration-700">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest leading-none">
                Exam in {daysToExam} days
            </span>
        </div>
    ) : null;

    const sideContent = aside ?? milestone;
    const breadcrumbs = eyebrow.split(">").map(s => s.trim());

    return (
        <header
            className={cn(
                "relative flex flex-col gap-4 pb-12 mb-8 border-b border-slate-100 group/header",
                "animate-in fade-in slide-in-from-top-2 duration-500 ease-out",
                className
            )}
        >
            {/* Background Accent Gradient */}
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -z-10 group-hover/header:bg-indigo-500/10 transition-colors duration-1000" />
            
            <div className="flex flex-col gap-2">
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center gap-1 select-none overflow-x-auto no-scrollbar py-1">
                    {breadcrumbs.map((crumb, idx) => (
                        <div key={idx} className="flex items-center gap-1 shrink-0">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-[0.15em] transition-colors duration-300",
                                idx === breadcrumbs.length - 1 ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                            )}>
                                {crumb}
                            </span>
                            {idx < breadcrumbs.length - 1 && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-300">
                                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mt-1">
                    <div className="flex-1 max-w-4xl space-y-3">
                        <h1 className="text-3xl md:text-4xl lg:text-[40px] font-bold text-slate-900 leading-[1.15] tracking-tight">
                            {title}
                            {accent && (
                                <span className="ml-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                                    {accent}
                                </span>
                            )}
                        </h1>
                        
                        {description && (
                            <div className="text-[15px] md:text-base font-medium leading-relaxed text-slate-500 max-w-2xl">
                                {description}
                            </div>
                        )}
                    </div>

                    {sideContent && (
                        <div className="shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                            {sideContent}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
