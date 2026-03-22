"use client";

import { deleteExams } from "@/actions/exam-management-actions";
import { cn } from "@/lib/utils";
import {
    ArrowUpRight,
    CaretRight,
    Clock,
    DotsThreeVertical,
    FileText,
    Globe,
    MagnifyingGlass,
    Selection as SelectionIcon,
    Stack,
    Trash,
    Users,
    X,
    WarningCircle,
    Check
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";

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

export function TestSeriesTable({ initialExams }: Props) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState<{ type: "single" | "bulk", id?: string } | null>(null);

    const filteredExams = useMemo(() => {
        return initialExams.filter(e => 
            e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (e.subject && e.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
            e.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [initialExams, searchQuery]);

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredExams.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredExams.map(e => e.id)));
        }
    };

    const handleDelete = async () => {
        if (!showConfirm) return;
        
        setIsDeleting(true);
        const idsToDelete = showConfirm.type === "bulk" 
            ? Array.from(selectedIds) 
            : [showConfirm.id!];

        try {
            const res = await deleteExams(idsToDelete);
            if (res.success) {
                setSelectedIds(new Set());
                setShowConfirm(null);
                router.refresh();
            } else {
                alert(res.message);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while deleting the test series.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {/* Table Search & Bulk Actions Bar */}
            <div className="px-8 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Repositories</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Found {filteredExams.length} series in your vault
                        </p>
                    </div>
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300 ml-4">
                            <div className="h-8 w-px bg-slate-100 mx-2" />
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-2">
                                <SelectionIcon size={14} weight="bold" /> {selectedIds.size} Selected
                            </span>
                            <button 
                                onClick={() => setShowConfirm({ type: "bulk" })}
                                className="h-10 px-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2"
                            >
                                <Trash size={16} weight="bold" /> Delete Selected
                            </button>
                            <button 
                                onClick={() => setSelectedIds(new Set())}
                                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                            >
                                <X size={16} weight="bold" />
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="relative group">
                    <MagnifyingGlass
                        size={18}
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                        weight="bold"
                    />
                    <input
                        type="text"
                        placeholder="Filter assessment series..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-80 pl-14 pr-8 py-4 rounded-[20px] bg-slate-50/50 border border-slate-100 text-[10px] uppercase font-black tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-sans placeholder:text-slate-400"
                    />
                </div>
            </div>

            {filteredExams.length === 0 ? (
                <div className="py-32 text-center space-y-4">
                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] mx-auto flex items-center justify-center text-slate-200">
                        <Stack size={48} weight="light" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                            {searchQuery ? "No Matches Found" : "No Series Found"}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                            {searchQuery ? "Try a different search term" : "Initialize your first series in the Question Bank"}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-100">
                    <table className="w-full text-left border-separate border-spacing-0 px-4">
                        <thead>
                            <tr className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">
                                <th className="px-6 py-6 w-12 text-center">
                                    <button 
                                        onClick={toggleSelectAll}
                                        className={cn(
                                            "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
                                            selectedIds.size === filteredExams.length && filteredExams.length > 0
                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                : "border-slate-200 hover:border-indigo-300"
                                        )}
                                    >
                                        {selectedIds.size === filteredExams.length && filteredExams.length > 0 && <Check size={12} weight="bold" />}
                                    </button>
                                </th>
                                <th className="px-6 py-6">Identity & Metrics</th>
                                <th className="px-6 py-6">Target Audience</th>
                                <th className="px-6 py-6">Classification</th>
                                <th className="px-6 py-6">Visibility</th>
                                <th className="px-6 py-6">Engagement</th>
                                <th className="px-6 py-6">Timestamp</th>
                                <th className="px-6 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredExams.map((exam) => (
                                <tr key={exam.id} className={cn(
                                    "group transition-all duration-300",
                                    selectedIds.has(exam.id) ? "bg-indigo-50/30" : "hover:bg-slate-50/50"
                                )}>
                                    <td className="px-6 py-7 text-center">
                                        <button 
                                            onClick={() => toggleSelect(exam.id)}
                                            className={cn(
                                                "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center mx-auto",
                                                selectedIds.has(exam.id)
                                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                                    : "border-slate-200 hover:border-indigo-300 group-hover:border-slate-300"
                                            )}
                                        >
                                            {selectedIds.has(exam.id) && <Check size={12} weight="bold" />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-7">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-white group-hover:border-indigo-100 group-hover:scale-110 transition-all duration-500">
                                                <FileText size={22} weight="bold" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-1">
                                                    {exam.title}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    <Clock size={12} weight="bold" /> {exam.duration} mins <span className="opacity-30">•</span> {exam.totalMarks} Marks
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="px-6 py-7">
                                        {exam.batch ? (
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                                <Users size={14} weight="bold" /> {exam.batch.name}
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                <Globe size={14} weight="bold" /> Global Access
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-6 py-7">
                                        <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                            {exam.examType || "PRACTICE"}
                                        </div>
                                    </td>

                                    <td className="px-6 py-7">
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
                                            exam.status === "PUBLISHED" 
                                                ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                                : "bg-amber-50 border-amber-100 text-amber-600"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", exam.status === "PUBLISHED" ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                                            {exam.status === "PUBLISHED" ? "Live Studio" : "Draft Workspace"}
                                        </div>
                                    </td>

                                    <td className="px-6 py-7">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base font-bold text-slate-900 tracking-tight">{exam._count.attempts}</span>
                                                <ArrowUpRight size={14} className="text-emerald-500" weight="bold" />
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{exam._count.questions} Items</div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-7">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {new Date(exam.createdAt).toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </div>
                                    </td>

                                    <td className="px-6 py-7 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => setShowConfirm({ type: "single", id: exam.id })}
                                                className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-rose-500 hover:border-rose-100 hover:shadow-sm transition-all flex items-center justify-center group/del"
                                            >
                                                <Trash size={18} weight="bold" />
                                            </button>
                                            <Link 
                                                href={`/teacher/test-series/${exam.id}`}
                                                className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 transition-all active:scale-95 shadow-md shadow-slate-900/10 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                                            >
                                                <CaretRight size={18} weight="bold" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/40 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 rounded-[28px] bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto shadow-sm">
                            <WarningCircle size={40} weight="fill" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Delete Series?</h3>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed">
                                {showConfirm.type === "bulk" 
                                    ? `This will permanently remove ${selectedIds.size} test series and all associated student attempts. This action cannot be undone.`
                                    : "This will permanently remove this assessment series and all associated student attempts. This action cannot be undone."}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                disabled={isDeleting}
                                onClick={() => setShowConfirm(null)}
                                className="flex-1 h-14 rounded-2xl border border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isDeleting}
                                onClick={handleDelete}
                                className="flex-1 h-14 rounded-2xl bg-rose-600 font-black text-[10px] uppercase tracking-widest text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500 transition-all flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <> <Trash size={16} weight="bold" /> Confirm Delete </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
