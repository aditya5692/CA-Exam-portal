import { StudentPageHeader } from "@/components/student/shared/page-header";
import { resolveStudentExamTarget } from "@/lib/student-level";
import { getCurrentUser } from "@/lib/auth/session";
import {
    ChartPieSlice,
    Star,
    CheckCircle,
    Circle,
    Info,
    ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

export const metadata = {
    title: "ICAI ABC Analysis | Financly",
    description:
        "Prioritize your CA exam preparation with the official ICAI chapter-wise ABC categorization. Identify high-weightage (A), moderate (B), and low-priority (C) topics.",
};

/* ------------------- Types ------------------- */
type Category = "A" | "B" | "C";

interface ChapterEntry {
    chapter: string;
    category: Category;
    marks?: string;
    note?: string;
}

interface SubjectData {
    subject: string;
    level: string;
    chapters: ChapterEntry[];
}

/* ------------------- Static ICAI ABC Data ------------------- */
const ABC_DATA: SubjectData[] = [
    {
        subject: "Financial Reporting",
        level: "CA Final",
        chapters: [
            { chapter: "Ind AS 115 – Revenue from Contracts", category: "A", marks: "15–20", note: "Frequently tested with complex scenarios" },
            { chapter: "Ind AS 36 – Impairment of Assets", category: "A", marks: "10–15" },
            { chapter: "Ind AS 16 – Property, Plant and Equipment", category: "A", marks: "8–12" },
            { chapter: "Ind AS 109 – Financial Instruments", category: "A", marks: "10–14", note: "Hedge accounting often asked" },
            { chapter: "Ind AS 12 – Income Taxes", category: "B", marks: "6–10" },
            { chapter: "Ind AS 38 – Intangible Assets", category: "B", marks: "5–8" },
            { chapter: "Ind AS 21 – Effects of Changes in FX Rates", category: "B", marks: "4–8" },
            { chapter: "Ind AS 40 – Investment Property", category: "C", marks: "3–6" },
            { chapter: "Ind AS 41 – Agriculture", category: "C", marks: "2–4", note: "Theoretical, rarely numerical" },
        ],
    },
    {
        subject: "Strategic Financial Management",
        level: "CA Final",
        chapters: [
            { chapter: "Capital Budgeting & Financial Decisions", category: "A", marks: "12–18" },
            { chapter: "Security Analysis & Portfolio Management", category: "A", marks: "10–16", note: "Beta, CAPM, SML always appear" },
            { chapter: "Derivatives – Options, Futures, Swaps", category: "A", marks: "10–15" },
            { chapter: "Foreign Exchange Risk Management", category: "A", marks: "8–12" },
            { chapter: "Mergers, Acquisitions & Corporate Restructuring", category: "B", marks: "6–10" },
            { chapter: "International Financial Management", category: "B", marks: "5–8" },
            { chapter: "Financial Services & Markets", category: "C", marks: "3–6" },
            { chapter: "Startup Finance & Innovation", category: "C", marks: "2–4" },
        ],
    },
    {
        subject: "Advanced Auditing & Professional Ethics",
        level: "CA Final",
        chapters: [
            { chapter: "Risk-Based Auditing & Audit Planning", category: "A", marks: "12–16" },
            { chapter: "Audit Committee & Corporate Governance", category: "A", marks: "8–12", note: "Frequently paired with Companies Act" },
            { chapter: "Standards on Auditing (SA 700-series)", category: "A", marks: "10–14" },
            { chapter: "Forensic Audit & Investigation", category: "B", marks: "6–10" },
            { chapter: "Peer Review & Quality Review", category: "B", marks: "5–8" },
            { chapter: "Audit of Special Entities", category: "C", marks: "3–6" },
        ],
    },
    {
        subject: "Corporate & Economic Laws",
        level: "CA Final",
        chapters: [
            { chapter: "Companies Act – Meetings & Resolutions", category: "A", marks: "12–16" },
            { chapter: "SEBI Regulations & Insider Trading", category: "A", marks: "10–14" },
            { chapter: "Insolvency & Bankruptcy Code", category: "A", marks: "8–12", note: "IBC hotspot since 2021" },
            { chapter: "Companies Act – Directors & Managerial Personnel", category: "B", marks: "6–10" },
            { chapter: "Competition Act", category: "B", marks: "4–8" },
            { chapter: "Prevention of Money Laundering Act", category: "C", marks: "3–5" },
        ],
    },
    {
        subject: "Advanced Tax Laws",
        level: "CA Final",
        chapters: [
            { chapter: "International Taxation – DTAA", category: "A", marks: "15–20", note: "BEPS, MLI, Pillar Two concepts" },
            { chapter: "Transfer Pricing", category: "A", marks: "12–16" },
            { chapter: "GST – ITC, Place of Supply, RCM", category: "A", marks: "10–15" },
            { chapter: "GST – Annual Return & Audit", category: "B", marks: "6–10" },
            { chapter: "Customs & FTP", category: "B", marks: "5–8" },
            { chapter: "Tax Planning & Tax Avoidance", category: "C", marks: "3–6" },
        ],
    },
];

/* ------------------- Category Config ------------------- */
const CATEGORY_CONFIG: Record<Category, {
    label: string;
    description: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    icon: React.ReactNode;
    priority: string;
}> = {
    A: {
        label: "Category A",
        description: "High Weightage — Must Do",
        priority: "Priority 1",
        bgClass: "bg-emerald-50",
        borderClass: "border-emerald-200",
        textClass: "text-emerald-800",
        badgeBg: "bg-emerald-600",
        badgeBorder: "border-emerald-700",
        badgeText: "text-white",
        icon: <Star size={16} weight="fill" className="text-emerald-600" />,
    },
    B: {
        label: "Category B",
        description: "Moderate Weightage — Should Do",
        priority: "Priority 2",
        bgClass: "bg-amber-50",
        borderClass: "border-amber-200",
        textClass: "text-amber-800",
        badgeBg: "bg-amber-500",
        badgeBorder: "border-amber-600",
        badgeText: "text-white",
        icon: <CheckCircle size={16} weight="fill" className="text-amber-500" />,
    },
    C: {
        label: "Category C",
        description: "Lower Weightage — Good to Have",
        priority: "Priority 3",
        bgClass: "bg-slate-50",
        borderClass: "border-slate-200",
        textClass: "text-slate-600",
        badgeBg: "bg-slate-400",
        badgeBorder: "border-slate-500",
        badgeText: "text-white",
        icon: <Circle size={16} weight="fill" className="text-slate-400" />,
    },
};

/* ------------------- Page Component ------------------- */
export default async function ABCAnalysisPage() {
    const user = await getCurrentUser(["STUDENT", "ADMIN"]);
    const examTarget = resolveStudentExamTarget(user ?? {});

    return (
        <div className="space-y-12 pb-20 font-outfit">
            <StudentPageHeader
                eyebrow="ICAI Official Categorization"
                title="ABC Chapter"
                accent="Analysis"
                description="The ICAI chapter-wise ABC categorization tells you exactly where the marks come from. Focus on Category A first — they appear in almost every paper."
                daysToExam={examTarget.daysToExam}
            />

            {/* Legend */}
            <div className="grid gap-4 sm:grid-cols-3">
                {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([cat, cfg]) => (
                    <div
                        key={cat}
                        className={`flex items-center gap-4 rounded-2xl border ${cfg.borderClass} ${cfg.bgClass} p-5`}
                    >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${cfg.badgeBorder} ${cfg.badgeBg} text-lg font-black ${cfg.badgeText}`}>
                            {cat}
                        </div>
                        <div>
                            <div className={`text-[10px] font-black uppercase tracking-[0.16em] ${cfg.textClass}`}>{cfg.priority}</div>
                            <div className="mt-0.5 text-sm font-bold text-[var(--student-text)]">{cfg.description}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Subject-wise breakdown */}
            <div className="space-y-8">
                {ABC_DATA.map((subjectData) => {
                    const aChapters = subjectData.chapters.filter(c => c.category === "A");
                    const bChapters = subjectData.chapters.filter(c => c.category === "B");
                    const cChapters = subjectData.chapters.filter(c => c.category === "C");

                    return (
                        <div
                            key={subjectData.subject}
                            className="overflow-hidden rounded-3xl border border-[var(--student-border)] bg-white shadow-sm"
                        >
                            {/* Subject Header */}
                            <div className="flex items-center justify-between gap-4 border-b border-[var(--student-border)] bg-[var(--student-panel-muted)] px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--student-border)] bg-white text-[var(--student-accent-strong)]">
                                        <ChartPieSlice size={18} weight="fill" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--student-muted)]">{subjectData.level}</div>
                                        <div className="mt-0.5 text-base font-black tracking-tight text-[var(--student-text)]">{subjectData.subject}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">{aChapters.length}A</span>
                                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">{bChapters.length}B</span>
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{cChapters.length}C</span>
                                </div>
                            </div>

                            {/* Chapters Table */}
                            <div className="divide-y divide-[var(--student-border)]">
                                {subjectData.chapters.map((chapter) => {
                                    const cfg = CATEGORY_CONFIG[chapter.category];
                                    return (
                                        <div key={chapter.chapter} className="flex items-center gap-4 px-6 py-4">
                                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${cfg.badgeBorder} ${cfg.badgeBg} text-[11px] font-black ${cfg.badgeText}`}>
                                                {chapter.category}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold leading-snug text-[var(--student-text)]">{chapter.chapter}</div>
                                                {chapter.note && (
                                                    <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-[var(--student-muted)]">
                                                        <Info size={11} />
                                                        {chapter.note}
                                                    </div>
                                                )}
                                            </div>
                                            {chapter.marks && (
                                                <div className="shrink-0 text-right">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--student-muted)]">Marks</div>
                                                    <div className="mt-0.5 text-sm font-black text-[var(--student-text)]">{chapter.marks}</div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CTA Banner */}
            <div className="student-surface-dark relative flex flex-col items-center gap-8 overflow-hidden rounded-3xl p-10 text-white lg:flex-row">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <ChartPieSlice size={32} weight="fill" />
                </div>
                <div className="flex-1 space-y-2 text-center lg:text-left">
                    <h2 className="text-2xl font-black tracking-tight">Practice Category A chapters first</h2>
                    <p className="max-w-2xl text-base font-medium leading-relaxed text-white/70">
                        On average, Category A chapters contribute over 60% of your total exam marks. Master them first — then pick up Category B for the remaining score buffer.
                    </p>
                </div>
                <a
                    href="/student/exams"
                    className="student-button-secondary relative z-10 inline-flex shrink-0 items-center gap-2 rounded-xl px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                >
                    Attempt Practice Set
                    <ArrowRight size={14} weight="bold" />
                </a>
            </div>
        </div>
    );
}
