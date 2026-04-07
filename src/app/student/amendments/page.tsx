import { StudentPageHeader } from "@/components/student/shared/page-header";
import { resolveStudentExamTarget } from "@/lib/student-level";
import { getCurrentUser } from "@/lib/auth/session";
import {
    Scroll,
    ArrowRight,
    CalendarBlank,
    BookOpen,
    Lightbulb,
    ArrowSquareOut,
    Warning,
    Star,
} from "@phosphor-icons/react/dist/ssr";

export const metadata = {
    title: "Latest Amendments | Financly",
    description:
        "Stay exam-ready with the latest ICAI-notified amendments, Finance Act changes, and statutory updates for CA Foundation, Inter, and Final.",
};

/* ------------------- Types ------------------- */
type AmendmentPriority = "CRITICAL" | "HIGH" | "MODERATE";
type CALevel = "Final" | "Inter" | "Foundation" | "All Levels";

interface Amendment {
    id: string;
    title: string;
    subject: string;
    level: CALevel;
    effectiveDate: string;
    summary: string;
    keyPoints: string[];
    priority: AmendmentPriority;
    source: string;
    isNew?: boolean;
}

/* ------------------- Static Amendment Data ------------------- */
const AMENDMENTS: Amendment[] = [
    {
        id: "fa-2024-income-tax",
        title: "Finance Act 2024 – Income Tax Amendments",
        subject: "Taxation",
        level: "Final",
        effectiveDate: "AY 2025-26",
        priority: "CRITICAL",
        isNew: true,
        source: "Finance Act, 2024",
        summary:
            "The Finance Act 2024 revises key income tax provisions applicable from AY 2025-26, including changes to capital gains taxation, new tax regime slabs, and buyback tax shifts.",
        keyPoints: [
            "New tax regime is now the default; old regime requires explicit opt-in",
            "LTCG on equity shares: exemption limit raised to ₹1.25 lakh (from ₹1 lakh)",
            "STCG on equity shares: rate raised to 20% (from 15%)",
            "Buyback tax burden now shifted to shareholders (not company)",
            "STT revised upward on F&O transactions",
        ],
    },
    {
        id: "ind-as-amendment-june-2024",
        title: "MCA – Ind AS 116 & Ind AS 1 Amendments",
        subject: "Financial Reporting",
        level: "Final",
        effectiveDate: "April 2024",
        priority: "HIGH",
        isNew: true,
        source: "MCA Notification, June 2024",
        summary:
            "MCA notified amendments to Ind AS 116 (Leases) and Ind AS 1 (Presentation) effective from April 2024 onwards, aligning with IASB updates on sale and leaseback transactions.",
        keyPoints: [
            "Ind AS 116: New guidance on measurement of lease liabilities in sale-leaseback",
            "Ind AS 1: Refined criteria for classifying liabilities as current vs. non-current",
            "Enhanced disclosure requirements for covenant clauses",
        ],
    },
    {
        id: "gst-amendment-2024",
        title: "GST Council – 53rd & 54th Council Meeting Changes",
        subject: "GST & Indirect Tax",
        level: "Final",
        effectiveDate: "July 2024 onwards",
        priority: "CRITICAL",
        isNew: true,
        source: "GST Council Notifications",
        summary:
            "The 53rd and 54th GST Council meetings introduced significant compliance simplifications and rate rationalizations effective July 2024.",
        keyPoints: [
            "GSTR-1A introduced for voluntary amendments before GSTR-3B filing",
            "Interest waiver on demand notices under Sec 73 for FY 2017-20",
            "IGST refund of IGST credit allowed for merchant exporters",
            "Rate changes: Insurance premium GST reduced on certain term plans",
            "Criminal prosecution threshold raised from ₹1 Cr to ₹2 Cr",
        ],
    },
    {
        id: "companies-act-amendment-2024",
        title: "Companies Act – MCA Amendments (Proviso to Sec 230)",
        subject: "Corporate & Economic Laws",
        level: "Final",
        effectiveDate: "March 2024",
        priority: "HIGH",
        source: "MCA Gazette Notification",
        summary:
            "MCA updated the Companies (Compromises, Arrangements and Amalgamations) Rules to fast-track merger of wholly owned subsidiaries.",
        keyPoints: [
            "Fast-track merger now available for holding–wholly owned subsidiary companies",
            "Simplified NCLT procedure; no shareholder meetings required",
            "Creditor objection window reduced from 30 to 15 days",
        ],
    },
    {
        id: "icai-sa-315-revision",
        title: "SA 315 (Revised 2024) – Identifying and Assessing RMM",
        subject: "Auditing & Assurance",
        level: "Final",
        effectiveDate: "April 2024",
        priority: "HIGH",
        isNew: true,
        source: "ICAI – AASB",
        summary:
            "SA 315 has been comprehensively revised to incorporate a risk-based approach to identifying risks of material misstatement (RMM), with greater emphasis on IT systems and automated controls.",
        keyPoints: [
            "Mandatory documentation of entity's risk assessment process",
            "IT-related risks now explicitly within scope of inherent risk factors",
            "New concept of 'Spectrum of Inherent Risk' introduced",
            "Stand-alone inherent vs. control risk assessment now required",
        ],
    },
    {
        id: "inter-itr-new-regime-2024",
        title: "Finance Act 2024 – Intermediate Taxation Updates",
        subject: "Income Tax",
        level: "Inter",
        effectiveDate: "AY 2025-26",
        priority: "CRITICAL",
        isNew: true,
        source: "Finance Act, 2024",
        summary:
            "CA Inter students must study the revised slab rates under the new tax regime and revised deduction rules under Section 80C group given the Finance Act 2024 changes.",
        keyPoints: [
            "New regime slabs revised: 0% up to ₹3L, 5% from ₹3L–7L, 10% for ₹7L–10L",
            "Standard deduction under new regime raised to ₹75,000",
            "Section 87A rebate limit revised to ₹25,000 for new regime",
            "TDS on salaries to default to new regime unless employee opts out",
        ],
    },
    {
        id: "icai-code-of-ethics-2025",
        title: "ICAI Code of Ethics – 2024 Edition Revisions",
        subject: "Professional Ethics",
        level: "All Levels",
        effectiveDate: "January 2025",
        priority: "MODERATE",
        source: "ICAI Ethics Committee",
        summary:
            "ICAI adopted the 2024 IESBA Handbook revisions into its Code of Ethics, covering independence requirements and non-assurance services.",
        keyPoints: [
            "Expanded guidance on non-assurance services to audit clients",
            "Revised fee dependency thresholds for PIE audit clients",
            "New provisions on technology and data analytics safeguards",
        ],
    },
    {
        id: "foundation-accounts-revised",
        title: "Foundation Accounts – Schedule III Revised Format",
        subject: "Accounts",
        level: "Foundation",
        effectiveDate: "April 2024",
        priority: "MODERATE",
        source: "MCA Notification",
        summary:
            "MCA revised Schedule III of the Companies Act for financial statement presentation, now applicable in Foundation exam questions on final accounts.",
        keyPoints: [
            "Separate disclosure of shareholding of promoters",
            "New line items for CSR obligation disclosure",
            "Rounding-off requirements revised for smaller companies",
        ],
    },
];

/* ------------------- Priority Config ------------------- */
const PRIORITY_CONFIG: Record<AmendmentPriority, {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    barClass: string;
}> = {
    CRITICAL: {
        label: "Critical",
        bgClass: "bg-rose-50",
        textClass: "text-rose-700",
        borderClass: "border-rose-200",
        barClass: "bg-rose-500",
    },
    HIGH: {
        label: "High",
        bgClass: "bg-amber-50",
        textClass: "text-amber-700",
        borderClass: "border-amber-200",
        barClass: "bg-amber-500",
    },
    MODERATE: {
        label: "Moderate",
        bgClass: "bg-blue-50",
        textClass: "text-blue-700",
        borderClass: "border-blue-200",
        barClass: "bg-blue-400",
    },
};

const LEVEL_COLORS: Record<CALevel, string> = {
    "Final": "border-indigo-200 bg-indigo-50 text-indigo-700",
    "Inter": "border-violet-200 bg-violet-50 text-violet-700",
    "Foundation": "border-teal-200 bg-teal-50 text-teal-700",
    "All Levels": "border-slate-200 bg-slate-100 text-slate-600",
};

/* ------------------- Page Component ------------------- */
export default async function AmendmentsPage() {
    const user = await getCurrentUser(["STUDENT", "ADMIN"]);
    const examTarget = resolveStudentExamTarget(user ?? {});

    const criticalAmendments = AMENDMENTS.filter(a => a.priority === "CRITICAL");
    const otherAmendments = AMENDMENTS.filter(a => a.priority !== "CRITICAL");

    return (
        <div className="space-y-12 pb-20 font-outfit">
            <StudentPageHeader
                eyebrow="Exam-Ready Amendments"
                title="Latest"
                accent="Amendments"
                description="All significant Finance Act changes, ICAI notifications, and statutory amendments — curated and summarized for your CA exam. Sorted by examination priority."
                daysToExam={examTarget.daysToExam}
            />

            {/* Stats Row */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-rose-600">
                        <Warning size={16} weight="fill" />
                        Critical Priority
                    </div>
                    <div className="mt-3 text-4xl font-black tracking-tight text-rose-700">{criticalAmendments.length}</div>
                    <div className="mt-1 text-xs font-semibold text-rose-500">Must revise before exam</div>
                </div>
                <div className="rounded-2xl border border-[var(--student-border)] bg-white p-5">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--student-muted)]">
                        <BookOpen size={16} weight="fill" />
                        Total Amendments
                    </div>
                    <div className="mt-3 text-4xl font-black tracking-tight text-[var(--student-text)]">{AMENDMENTS.length}</div>
                    <div className="mt-1 text-xs font-semibold text-[var(--student-muted)]">Across all CA levels</div>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
                        <Star size={16} weight="fill" />
                        Newly Added
                    </div>
                    <div className="mt-3 text-4xl font-black tracking-tight text-emerald-700">{AMENDMENTS.filter(a => a.isNew).length}</div>
                    <div className="mt-1 text-xs font-semibold text-emerald-500">Recently notified</div>
                </div>
            </div>

            {/* Critical Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-rose-600">
                        <Warning size={14} weight="fill" />
                        Critical — Exam Hotspots
                    </div>
                    <div className="h-px flex-1 bg-rose-100" />
                </div>
                <div className="space-y-4">
                    {criticalAmendments.map(amendment => (
                        <AmendmentCard key={amendment.id} amendment={amendment} />
                    ))}
                </div>
            </div>

            {/* Other Amendments */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--student-muted)]">
                        <Scroll size={14} weight="fill" />
                        High &amp; Moderate Priority
                    </div>
                    <div className="h-px flex-1 bg-[var(--student-border)]" />
                </div>
                <div className="space-y-4">
                    {otherAmendments.map(amendment => (
                        <AmendmentCard key={amendment.id} amendment={amendment} />
                    ))}
                </div>
            </div>

            {/* Disclaimer / CTA */}
            <div className="student-surface-dark relative flex flex-col items-center gap-8 overflow-hidden rounded-3xl p-10 text-white lg:flex-row">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <Lightbulb size={32} weight="fill" />
                </div>
                <div className="flex-1 space-y-2 text-center lg:text-left">
                    <h2 className="text-2xl font-black tracking-tight">Always cross-check with ICAI Study Material</h2>
                    <p className="max-w-2xl text-base font-medium leading-relaxed text-white/70">
                        These amendments are curated for exam relevance. Always refer to the official ICAI Study Material and Practice Manual for the assessment year applicable to your exam.
                    </p>
                </div>
                <a
                    href="https://icai.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="student-button-secondary relative z-10 inline-flex shrink-0 items-center gap-2 rounded-xl px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                >
                    ICAI Official Site
                    <ArrowSquareOut size={14} weight="bold" />
                </a>
            </div>
        </div>
    );
}

/* ------------------- Amendment Card Sub-Component ------------------- */
function AmendmentCard({ amendment }: { amendment: Amendment }) {
    const pCfg = PRIORITY_CONFIG[amendment.priority];
    const levelColor = LEVEL_COLORS[amendment.level];

    return (
        <div className="overflow-hidden rounded-3xl border border-[var(--student-border)] bg-white shadow-sm">
            {/* Priority Color Bar */}
            <div className={`h-1 w-full ${pCfg.barClass}`} />

            <div className="p-6">
                {/* Top Row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${levelColor}`}>
                            CA {amendment.level}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${pCfg.borderClass} ${pCfg.bgClass} ${pCfg.textClass}`}>
                            {pCfg.label}
                        </span>
                        {amendment.isNew && (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                New
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--student-muted)]">
                        <CalendarBlank size={12} weight="fill" />
                        {amendment.effectiveDate}
                    </div>
                </div>

                {/* Title & Subject */}
                <div className="mt-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--student-muted)]">{amendment.subject}</div>
                    <h2 className="mt-1 text-lg font-black leading-snug tracking-tight text-[var(--student-text)]">{amendment.title}</h2>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--student-muted-strong)]">{amendment.summary}</p>
                </div>

                {/* Key Points */}
                <div className="mt-5 space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--student-muted)]">Key Exam Points</div>
                    <ul className="space-y-2">
                        {amendment.keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-[var(--student-text)]">
                                <ArrowRight size={14} weight="bold" className="mt-0.5 shrink-0 text-[var(--student-accent-strong)]" />
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer */}
                <div className="mt-5 flex items-center gap-2 text-[10px] font-semibold text-[var(--student-muted)]">
                    <BookOpen size={12} weight="fill" />
                    Source: {amendment.source}
                </div>
            </div>
        </div>
    );
}
