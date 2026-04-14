"use client";

import { deleteExams } from "@/actions/exam-management-actions";
import { cn } from "@/lib/utils";
import {
    ArrowUpRight,
    CaretRight,
    Check,
    ChartBar,
    Clock,
    FileText,
    Faders,
    Globe,
    MagnifyingGlass,
    PencilSimple,
    Selection as SelectionIcon,
    Stack,
    Trash,
    Users,
    WarningCircle,
    X,
    DownloadSimple,
    Plus
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ExamRow = {
    id: string;
    title: string;
    duration: number;
    totalMarks: number;
    category: string;
    subject: string | null;
    status: string;
    examType: string | null;
    createdAt: string;
    batch: { name: string } | null;
    _count: { attempts: number; questions: number };
};

type Props = {
    initialExams: ExamRow[];
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
    PUBLISHED: { label: "Live",      dot: "bg-emerald-500 animate-pulse", bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-100" },
    DRAFT:     { label: "Draft",     dot: "bg-amber-400",                 bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-100"   },
    ARCHIVED:  { label: "Archived",  dot: "bg-slate-300",                 bg: "bg-slate-100",   text: "text-slate-500",   border: "border-slate-100"   },
};

const TYPE_LABELS: Record<string, string> = {
    MOCK:     "Mock Test",
    PRACTICE: "Practice",
    SECTIONAL:"Sectional",
    FULL:     "Full Length",
};

export function TestSeriesTable({ initialExams }: Props) {
    const router = useRouter();
    const [searchQuery,  setSearchQuery]  = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
    const [isDeleting,   setIsDeleting]   = useState(false);
    const [showConfirm,  setShowConfirm]  = useState<{ type: "single" | "bulk"; id?: string } | null>(null);
    const [showFilters,  setShowFilters]  = useState(false);

    const filteredExams = useMemo(() => {
        return initialExams.filter((e) => {
            const matchesSearch =
                e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (e.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                e.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === "ALL" || e.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [initialExams, searchQuery, filterStatus]);

    const toggleSelect    = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedIds(next);
    };
    const toggleSelectAll = () => {
        setSelectedIds(selectedIds.size === filteredExams.length
            ? new Set()
            : new Set(filteredExams.map((e) => e.id)));
    };

    const handleDelete = async () => {
        if (!showConfirm) return;
        setIsDeleting(true);
        const ids = showConfirm.type === "bulk" ? Array.from(selectedIds) : [showConfirm.id!];
        try {
            const res = await deleteExams(ids);
            if (res.success) {
                setSelectedIds(new Set());
                setShowConfirm(null);
                router.refresh();
            } else alert(res.message);
        } catch (err) {
            console.error(err);
            alert("An error occurred while deleting.");
        } finally {
            setIsDeleting(false);
        }
    };

    const statusCounts = useMemo(() => ({
        ALL:       initialExams.length,
        PUBLISHED: initialExams.filter(e => e.status === "PUBLISHED").length,
        DRAFT:     initialExams.filter(e => e.status === "DRAFT").length,
    }), [initialExams]);

    return (
        <>
            {/* Hero Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-6">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Assessment Vault</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
                            All Test Series
                        </h1>
                    </div>
                    <div className="h-7 px-3 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 self-end mb-1">
                        <Stack size={12} weight="bold" className="text-indigo-500/60" />
                        <span>{filteredExams.length} / {initialExams.length} Live Assets</span>
                    </div>
                </div>
                
                <p className="hidden xl:block text-slate-400 font-medium text-xs max-w-sm text-right leading-relaxed opacity-80">
                    Orchestrate mock assessments and practice modules with high-fidelity control over student grouping.
                </p>
            </div>

            {/* Search / Filter Row */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
                <div className="relative flex-1">
                    <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} weight="bold" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Locate specific assessments by title, subject or category..."
                        className="w-full h-12 bg-white border border-slate-200/60 rounded-xl pl-11 pr-4 text-[13px] font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all shadow-sm" />
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "h-12 px-6 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-sm",
                            showFilters ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        )}
                    >
                        <Faders size={18} weight="bold" /> 
                        {showFilters ? "Hide Filters" : "Access Filters"}
                    </button>
                    <button onClick={() => router.push("/teacher/test-series/create")} className="h-12 px-6 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 active:scale-95">
                        <Plus size={18} weight="bold" /> New Assessment
                    </button>
                </div>
            </div>

            {/* Filter Suite Bar (Conditional) */}
            {showFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-6 animate-in slide-in-from-top-4 duration-300 p-1 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 px-4 py-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Status Coverage:</span>
                    {(["ALL", "PUBLISHED", "DRAFT"] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                                filterStatus === s ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                            )}
                        >
                            {s === "ALL" ? "Total Library" : s === "PUBLISHED" ? "Live Access" : "Draft Stages"}
                            <span className={cn(
                                "ml-2 text-[9px] font-black px-1.5 py-0.5 rounded-full",
                                filterStatus === s ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                            )}>
                                {statusCounts[s]}
                            </span>
                        </button>
                    ))}
                    <div className="ml-auto">
                        <button className="h-9 px-4 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:border-slate-400 hover:text-slate-900 transition-all flex items-center gap-2">
                            <DownloadSimple size={14} weight="bold" /> Export Report
                        </button>
                    </div>
                </div>
            )}

            {/* ── PROCESS + OUTPUT zone: cards ────────────────────────────── */}
            {filteredExams.length === 0 ? (
                <div className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-5 max-w-xs mx-auto">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100 shadow-sm">
                            <Stack size={40} weight="light" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">No matching assessments</p>
                            <p className="text-[10px] font-semibold text-slate-400 leading-relaxed italic">Try clearing your filters or search identifiers to discover specific test series.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 mt-4">
                    {/* Select all row */}
                    {filteredExams.length > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={toggleSelectAll}
                                    className={cn(
                                        "w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center shrink-0",
                                        selectedIds.size === filteredExams.length && filteredExams.length > 0
                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                            : "bg-white border-slate-200 hover:border-indigo-400"
                                    )}
                                >
                                    {selectedIds.size === filteredExams.length && filteredExams.length > 0 && (
                                        <Check size={12} weight="bold" />
                                    )}
                                </button>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Select all records ({filteredExams.length})
                                </span>
                            </div>

                            {/* Bulk Actions Indicator */}
                            {selectedIds.size > 0 && (
                                <div className="flex items-center gap-3 animate-in slide-in-from-right-2">
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">
                                        {selectedIds.size} Selected
                                    </span>
                                    <button
                                        onClick={() => setShowConfirm({ type: "bulk" })}
                                        className="h-8 px-4 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                    >
                                        Delete Bulk
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {filteredExams.map((exam) => {
                        const statusCfg = STATUS_CONFIG[exam.status] ?? STATUS_CONFIG.DRAFT;
                        const typeLabel = TYPE_LABELS[exam.examType ?? ""] ?? (exam.examType ?? "Practice");
                        const isSelected = selectedIds.has(exam.id);

                        return (
                            <div
                                key={exam.id}
                                className={cn(
                                    "group flex flex-col lg:flex-row lg:items-center gap-6 p-6 rounded-2xl border transition-all duration-300 cursor-default",
                                    isSelected
                                        ? "bg-indigo-50/40 border-indigo-200 ring-2 ring-indigo-500/5 shadow-lg shadow-indigo-600/5"
                                        : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md hover:bg-white"
                                )}
                            >
                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleSelect(exam.id)}
                                        className={cn(
                                            "w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center shrink-0 shadow-sm",
                                            isSelected
                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                : "bg-white border-slate-200 group-hover:border-indigo-400"
                                        )}
                                    >
                                        {isSelected && <Check size={14} weight="bold" />}
                                    </button>

                                    {/* Icon */}
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 shadow-sm",
                                        isSelected ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-200" : "bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-500"
                                    )}>
                                        <FileText size={22} weight="bold" />
                                    </div>

                                {/* Title & meta */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-sm text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                                            {exam.title}
                                        </span>
                                        {/* Status badge */}
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0",
                                            statusCfg.bg, statusCfg.text, statusCfg.border
                                        )}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                                            {statusCfg.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                        {/* Duration */}
                                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                            <Clock size={11} weight="bold" /> {exam.duration} min
                                        </span>
                                        <span className="text-slate-200">·</span>
                                        {/* Marks */}
                                        <span className="text-[11px] text-slate-400 font-medium">{exam.totalMarks} marks</span>
                                        <span className="text-slate-200">·</span>
                                        {/* Type */}
                                        <span className="text-[11px] text-slate-400 font-medium">{typeLabel}</span>
                                        <span className="text-slate-200">·</span>
                                        {/* Date */}
                                        <span className="text-[11px] text-slate-400 font-medium">
                                            {new Date(exam.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                    </div>
                                    </div>
                                </div>

                                {/* ── OUTPUT zone: audience + metrics ─────── */}
                                <div className="hidden md:flex items-center gap-6 shrink-0 lg:ml-auto">
                                    {/* Audience */}
                                    {exam.batch ? (
                                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100">
                                            <Users size={13} weight="bold" /> {exam.batch.name}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                                            <Globe size={13} weight="bold" /> Global
                                        </div>
                                    )}

                                    {/* Attempts metric */}
                                    <div className="text-center min-w-[56px]">
                                        <div className="flex items-center gap-1 justify-center">
                                            <span className="text-lg font-black text-slate-900 leading-none">{exam._count.attempts}</span>
                                            <ArrowUpRight size={13} className="text-emerald-500" weight="bold" />
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium">Attempts</div>
                                    </div>

                                    {/* Questions metric */}
                                    <div className="text-center min-w-[56px]">
                                        <div className="flex items-center gap-1 justify-center">
                                            <span className="text-lg font-black text-slate-900 leading-none">{exam._count.questions}</span>
                                            <ChartBar size={13} className="text-indigo-400" weight="bold" />
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium">Questions</div>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => setShowConfirm({ type: "single", id: exam.id })}
                                        className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-300 hover:text-rose-500 hover:border-rose-200 transition-all flex items-center justify-center"
                                        title="Delete"
                                    >
                                        <Trash size={16} weight="bold" />
                                    </button>
                                    <Link
                                        href={`/teacher/test-series/${exam.id}`}
                                        className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center"
                                        title="Edit"
                                    >
                                        <PencilSimple size={16} weight="bold" />
                                    </Link>
                                    <Link
                                        href={`/teacher/test-series/${exam.id}`}
                                        className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 shadow-sm shadow-indigo-600/20 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 duration-200"
                                        title="Open"
                                    >
                                        <CaretRight size={16} weight="bold" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Confirm Delete Modal ──────────────────────────────────────── */}
            {showConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-5 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto">
                            <WarningCircle size={32} weight="fill" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Confirm Deletion</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                {showConfirm.type === "bulk"
                                    ? `Permanently delete ${selectedIds.size} test series and all student attempts?`
                                    : "Permanently delete this test series and all student attempts?"}
                                {" "}<span className="font-semibold text-slate-700">This cannot be undone.</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                disabled={isDeleting}
                                onClick={() => setShowConfirm(null)}
                                className="flex-1 h-12 rounded-lg border border-slate-200 text-sm font-semibold text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isDeleting}
                                onClick={handleDelete}
                                className="flex-1 h-12 rounded-lg bg-rose-600 text-sm font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isDeleting
                                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <><Trash size={15} weight="bold" /> Delete</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
