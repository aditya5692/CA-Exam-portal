"use client";

import { createExamFromVault, getTeacherBatchOptions } from "@/actions/publish-exam-actions";
import { getVaultQuestions } from "@/actions/mcq-vault-actions";
import { cn } from "@/lib/utils";
import {
    ArrowsOut,
    Check,
    CheckCircle,
    CaretLeft,
    Clock,
    FileText,
    Globe,
    MagnifyingGlass,
    Plus,
    RocketLaunch,
    Stack,
    Users,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type VaultQuestion = {
    id: string;
    text: string;
    subject: string | null;
    topic: string | null;
    difficulty: string | null;
};

type BatchOption = {
    id: string;
    name: string;
    studentCount: number;
};

export function SeriesCreator() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [vaultQuestions, setVaultQuestions] = useState<VaultQuestion[]>([]);
    const [batches, setBatches] = useState<BatchOption[]>([]);

    // Form State
    const [title, setTitle] = useState("");
    const [caLevel, setCaLevel] = useState<"foundation" | "ipc" | "final">("final");
    const [subject, setSubject] = useState("");
    const [duration, setDuration] = useState("60");
    const [examType, setExamType] = useState("MOCK");
    const [targetType, setTargetType] = useState<"ALL" | "BATCH">("ALL");
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

    // Filter questions
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const [qRes, bRes] = await Promise.all([
                getVaultQuestions(),
                getTeacherBatchOptions(),
            ]);

            if (qRes.success && qRes.data) setVaultQuestions(qRes.data);
            if (bRes.success && bRes.data) {
                setBatches(bRes.data);
                if (bRes.data.length > 0) setSelectedBatchId(bRes.data[0].id);
            }
            setLoading(false);
        }
        loadData();
    }, []);

    const filteredVault = useMemo(() => {
        return vaultQuestions.filter(q =>
            q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (q.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
        );
    }, [vaultQuestions, searchQuery]);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedQuestionIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedQuestionIds(next);
    };

    const handlePublish = async () => {
        if (!title || !subject || !duration) {
            alert("Please fill in all basic details.");
            return;
        }
        if (selectedQuestionIds.size === 0) {
            alert("Please select at least one question from the bank.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await createExamFromVault({
                title,
                caLevel,
                subject,
                durationMinutes: parseInt(duration),
                examType,
                target: targetType === "BATCH" ? { kind: "batch", batchId: selectedBatchId } : { kind: "all" },
                questionIds: Array.from(selectedQuestionIds),
            });

            if (res.success) {
                router.push("/teacher/test-series");
                router.refresh();
            } else {
                alert(res.message);
            }
        } catch (err) {
            alert("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-10 px-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/teacher/test-series"
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-95"
                    >
                        <CaretLeft size={20} weight="bold" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Build Test Series</h1>
                        <p className="text-sm text-slate-500 font-medium">Configure metadata and harvest questions from your vault</p>
                    </div>
                </div>

                <button
                    onClick={handlePublish}
                    disabled={isSubmitting}
                    className="h-14 px-8 rounded-2xl bg-indigo-600 text-white text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-3 disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <RocketLaunch size={20} weight="fill" />
                    )}
                    {isSubmitting ? "Building..." : "Publish Series"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-10">
                {/* Left side: Configuration */}
                <div className="space-y-8">
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                <FileText size={18} weight="bold" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Test series Info</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Series Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. CA Final Audit Mock #04"
                                    className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all placeholder:text-slate-300"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Level</label>
                                    <select
                                        value={caLevel}
                                        onChange={(e) => setCaLevel(e.target.value as any)}
                                        className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-4 text-sm font-semibold focus:outline-none focus:border-indigo-500/30 transition-all"
                                    >
                                        <option value="foundation">CA Foundation</option>
                                        <option value="ipc">CA Inter</option>
                                        <option value="final">CA Final</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Type</label>
                                    <select
                                        value={examType}
                                        onChange={(e) => setExamType(e.target.value)}
                                        className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-4 text-sm font-semibold focus:outline-none focus:border-indigo-500/30 transition-all"
                                    >
                                        <option value="MOCK">Mock Test</option>
                                        <option value="PRACTICE">Practice</option>
                                        <option value="SECTIONAL">Sectional</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Subject</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="e.g. Audit"
                                        className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-5 text-sm font-semibold focus:outline-none focus:border-indigo-500/30 transition-all placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Duration (Min)</label>
                                    <input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-5 text-sm font-semibold focus:outline-none focus:border-indigo-500/30 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                <Users size={18} weight="bold" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Distribution</h2>
                        </div>

                        <div className="flex p-1.5 rounded-2xl bg-white border border-slate-100 gap-1">
                            <button
                                onClick={() => setTargetType("ALL")}
                                className={cn(
                                    "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2",
                                    targetType === "ALL" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Globe size={14} weight="bold" /> Global
                            </button>
                            <button
                                onClick={() => setTargetType("BATCH")}
                                className={cn(
                                    "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2",
                                    targetType === "BATCH" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Users size={14} weight="bold" /> My Batches
                            </button>
                        </div>

                        {targetType === "BATCH" && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                {batches.map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => setSelectedBatchId(b.id)}
                                        className={cn(
                                            "w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between",
                                            selectedBatchId === b.id ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{b.name}</p>
                                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{b.studentCount} active enrollments</p>
                                        </div>
                                        {selectedBatchId === b.id && <CheckCircle size={20} weight="fill" className="text-indigo-600" />}
                                    </button>
                                ))}
                                {batches.length === 0 && (
                                    <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl">
                                        <p className="text-xs font-semibold text-slate-400 italic">No batches found</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>

                {/* Right side: Question Bank Selection */}
                <div className="flex flex-col h-full min-h-[600px] bg-white border border-slate-100 rounded-[32px] p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                                <Stack size={22} weight="bold" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Question Harvester</h2>
                                <p className="text-xs text-slate-400 font-medium">Select items to include in this series</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black">
                                {selectedQuestionIds.size} Selected
                            </div>
                            <button
                                onClick={() => setSelectedQuestionIds(new Set())}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    <div className="relative group mb-6">
                        <MagnifyingGlass
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
                            weight="bold"
                        />
                        <input
                            type="text"
                            placeholder="Search your question bank by content or subject…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 pl-12 pr-6 rounded-2xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-medium"
                        />
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-100">
                        {filteredVault.map((q) => {
                            const isSelected = selectedQuestionIds.has(q.id);
                            return (
                                <div
                                    key={q.id}
                                    onClick={() => toggleSelection(q.id)}
                                    className={cn(
                                        "p-5 rounded-2xl border transition-all cursor-pointer group flex items-start gap-5",
                                        isSelected
                                            ? "bg-indigo-50/50 border-indigo-200"
                                            : "bg-white border-transparent hover:bg-slate-50/50 hover:border-slate-100"
                                    )}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded border-2 transition-all flex items-center justify-center shrink-0 mt-0.5",
                                        isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-200 group-hover:border-slate-300"
                                    )}>
                                        {isSelected && <Check size={12} weight="bold" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            {q.subject && (
                                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                                                    {q.subject}
                                                </span>
                                            )}
                                            {q.difficulty && (
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                    q.difficulty === "HARD" ? "bg-rose-50 text-rose-500" : q.difficulty === "MEDIUM" ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-500"
                                                )}>
                                                    {q.difficulty}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700 leading-relaxed line-clamp-2">
                                            {q.text}
                                        </p>
                                    </div>

                                    <button className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100">
                                        <ArrowsOut size={16} weight="bold" />
                                    </button>
                                </div>
                            );
                        })}

                        {filteredVault.length === 0 && (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto flex items-center justify-center text-slate-200">
                                    <Stack size={32} weight="duotone" />
                                </div>
                                <p className="text-sm font-bold text-slate-400 italic">No matching questions in your vault</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
