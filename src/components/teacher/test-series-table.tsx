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
    Funnel,
    Globe,
    MagnifyingGlass,
    PencilSimple,
    Selection as SelectionIcon,
    Stack,
    Trash,
    Users,
    WarningCircle,
    X,
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
            {/* ── INPUT zone: search + filter ─────────────────────────────── */}
            <div className="pb-5 border-b border-slate-100 space-y-4 px-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">All Test Series</h2>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {filteredExams.length} of {initialExams.length} assessments
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative group flex-shrink-0">
                        <MagnifyingGlass
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                            weight="bold"
                        />
                        <input
                            type="text"
                            placeholder="Search by title, subject…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-72 pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                <X size={14} weight="bold" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Status filter pills */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Funnel size={14} className="text-slate-400 shrink-0" weight="bold" />
                    {(["ALL", "PUBLISHED", "DRAFT"] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                                filterStatus === s
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                            )}
                        >
                            {s === "ALL" ? "All" : s === "PUBLISHED" ? "Live" : "Drafts"}
                            <span className={cn(
                                "text-[10px] font-black px-1.5 py-0.5 rounded-full",
                                filterStatus === s ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                            )}>
                                {statusCounts[s]}
                            </span>
                        </button>
                    ))}

                    {/* Bulk-select bar */}
                    {selectedIds.size > 0 && (
                        <div className="ml-auto flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                <SelectionIcon size={13} weight="bold" /> {selectedIds.size} selected
                            </span>
                            <button
                                onClick={() => setShowConfirm({ type: "bulk" })}
                                className="h-8 px-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition-all flex items-center gap-1.5"
                            >
                                <Trash size={13} weight="bold" /> Delete
                            </button>
                            <button onClick={() => setSelectedIds(new Set())} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center">
                                <X size={13} weight="bold" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── PROCESS + OUTPUT zone: cards ────────────────────────────── */}
            {filteredExams.length === 0 ? (
                <div className="py-24 text-center space-y-4 px-8">
                    <div className="w-20 h-20 bg-slate-50 rounded-lg mx-auto flex items-center justify-center text-slate-300">
                        <Stack size={36} weight="duotone" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            {searchQuery || filterStatus !== "ALL" ? "No Matches Found" : "No Test Series Yet"}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            {searchQuery || filterStatus !== "ALL"
                                ? "Try clearing your filters"
                                : "Create your first series using the button above"}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-2 mt-4 bg-white border border-slate-100 rounded-lg p-2 pb-4">
                    {/* Select all row */}
                    {filteredExams.length > 1 && (
                        <div className="flex items-center gap-3 px-3 py-2">
                            <button
                                onClick={toggleSelectAll}
                                className={cn(
                                    "w-4 h-4 rounded-lg border-2 transition-all flex items-center justify-center shrink-0",
                                    selectedIds.size === filteredExams.length && filteredExams.length > 0
                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                        : "border-slate-300 hover:border-indigo-400"
                                )}
                            >
                                {selectedIds.size === filteredExams.length && filteredExams.length > 0 && (
                                    <Check size={10} weight="bold" />
                                )}
                            </button>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                                Select all
                            </span>
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
                                    "group flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 cursor-pointer",
                                    isSelected
                                        ? "bg-indigo-50/60 border-indigo-200"
                                        : "bg-white border-transparent hover:bg-slate-50"
                                )}
                            >
                                {/* Checkbox */}
                                <button
                                    onClick={() => toggleSelect(exam.id)}
                                    className={cn(
                                        "w-4 h-4 rounded-lg border-2 transition-all flex items-center justify-center shrink-0",
                                        isSelected
                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                            : "border-slate-200 group-hover:border-slate-300"
                                    )}
                                >
                                    {isSelected && <Check size={10} weight="bold" />}
                                </button>

                                {/* Icon */}
                                <div className={cn(
                                    "w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300",
                                    isSelected ? "bg-indigo-100 border-indigo-200 text-indigo-600" : "bg-slate-50 border-slate-200 text-slate-400 group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-500"
                                )}>
                                    <FileText size={20} weight="duotone" />
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

                                {/* ── OUTPUT zone: audience + metrics ─────── */}
                                <div className="hidden md:flex items-center gap-6 shrink-0">
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
