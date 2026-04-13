"use client";

import { createExamFromVault, getTeacherBatchOptions } from "@/actions/publish-exam-actions";
import { getVaultQuestions } from "@/actions/mcq-vault-actions";
import { cn } from "@/lib/utils";
import {
    ArrowsOut,
    Check,
    CheckCircle,
    CaretLeft,
    CaretDown,
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
import { VaultFilterSuite } from "./vault-filter-suite";
import { getVaultIntel, harvestQuestions, type VaultIntel } from "@/actions/vault-intel-actions";

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
    const [vaultIntel, setVaultIntel] = useState<VaultIntel | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilters, setActiveFilters] = useState<{
        subject: string | null;
        chapter: string | null;
        difficulty: string | null;
    }>({ subject: null, chapter: null, difficulty: null });

    // Expansion state
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

    const toggleChapter = (chapterId: string) => {
        const next = new Set(expandedChapters);
        if (next.has(chapterId)) next.delete(chapterId); else next.add(chapterId);
        setExpandedChapters(next);
    };

    // Form State
    const [title, setTitle] = useState("");
    const [caLevel, setCaLevel] = useState<"foundation" | "ipc" | "final">("final");
    const [subject, setSubject] = useState("");
    const [duration, setDuration] = useState("60");
    const [examType, setExamType] = useState("MOCK");
    const [targetType, setTargetType] = useState<"ALL" | "BATCH">("ALL");
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

    // New Visibility Flags
    const [visibleToNonBatch, setVisibleToNonBatch] = useState(false);
    const [visibleToOtherBatches, setVisibleToOtherBatches] = useState(false);

    const filteredVault = useMemo(() => {
        return vaultQuestions.filter((q: VaultQuestion) => {
            const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (q.subject && q.subject.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesSubject = !activeFilters.subject || q.subject === activeFilters.subject || (activeFilters.subject === "Uncategorized" && !q.subject);
            const matchesChapter = !activeFilters.chapter || q.topic === activeFilters.chapter || (activeFilters.chapter === "General" && !q.topic);
            const matchesDifficulty = !activeFilters.difficulty || q.difficulty === activeFilters.difficulty;

            return matchesSearch && matchesSubject && matchesChapter && matchesDifficulty;
        });
    }, [vaultQuestions, searchQuery, activeFilters]);

    // Grouping for the harvester
    const groupedHarvester = useMemo(() => {
        const groups: Record<string, Record<string, VaultQuestion[]>> = {};
        filteredVault.forEach((q: VaultQuestion) => {
            const sub = q.subject || "Uncategorized";
            const chap = q.topic || "General";
            if (!groups[sub]) groups[sub] = {};
            if (!groups[sub][chap]) groups[sub][chap] = [];
            groups[sub][chap].push(q);
        });
        return groups;
    }, [filteredVault]);

    // Initially expand all when harvester groups change
    useEffect(() => {
        const all: string[] = [];
        Object.values(groupedHarvester).forEach(chapters => {
            Object.keys(chapters).forEach(c => all.push(c));
        });
        if (all.length > 0 && expandedChapters.size === 0) {
            setExpandedChapters(new Set(all));
        }
    }, [vaultQuestions, activeFilters, groupedHarvester]);

    // Mode: Manual or Generator
    const [buildMode, setBuildMode] = useState<"MANUAL" | "GENERATOR">("MANUAL");
    
    // Generator State
    const [genSubject, setGenSubject] = useState<string>("");
    const [genChapters, setGenChapters] = useState<Record<string, number>>({});

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const [qRes, bRes, iRes] = await Promise.all([
                getVaultQuestions(),
                getTeacherBatchOptions(),
                getVaultIntel()
            ]);

            if (qRes.success && qRes.data) setVaultQuestions(qRes.data);
            if (bRes.success && bRes.data) {
                setBatches(bRes.data);
                if (bRes.data.length > 0) setSelectedBatchId(bRes.data[0].id);
            }
            if (iRes.success && iRes.data) setVaultIntel(iRes.data);
            
            setLoading(false);
        }
        loadData();
    }, []);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedQuestionIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedQuestionIds(next);
    };

    const selectAllInChapter = (items: VaultQuestion[]) => {
        const next = new Set(selectedQuestionIds);
        items.forEach(i => next.add(i.id));
        setSelectedQuestionIds(next);
    };

    const handleSmartHarvest = async () => {
        if (!genSubject) {
            alert("Please select a subject for the smart generator.");
            return;
        }

        const recipeChapters = Object.entries(genChapters)
            .filter(([_, count]) => (count as number) > 0)
            .map(([name, count]) => ({ name, count: count as number }));

        if (recipeChapters.length === 0) {
            alert("Please specify question counts for at least one chapter.");
            return;
        }

        setLoading(true);
        const res = await harvestQuestions({
            subject: genSubject,
            chapters: recipeChapters
        });

        if (res.success && res.data) {
            const next = new Set(selectedQuestionIds);
            res.data.forEach(id => next.add(id));
            setSelectedQuestionIds(next);
            setBuildMode("MANUAL");
            alert(`Auto-harvested ${res.data.length} questions into your selection.`);
        } else {
            alert(res.message);
        }
        setLoading(false);
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
                visibleToNonBatch,
                visibleToOtherBatches,
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
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
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
                        className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-95"
                    >
                        <CaretLeft size={20} weight="bold" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Build Test Series</h1>
                        <p className="text-sm text-slate-500 font-medium">Configure metadata and harvest questions from your vault</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black">
                        {selectedQuestionIds.size} Selected
                    </div>
                    <button
                        onClick={handlePublish}
                        disabled={isSubmitting}
                        className="h-14 px-8 rounded-lg bg-indigo-600 text-white text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-3 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <RocketLaunch size={20} weight="fill" />
                        )}
                        {isSubmitting ? "Building..." : "Publish Series"}
                    </button>
                </div>
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
                                    className="w-full h-14 bg-white border border-slate-100 rounded-lg px-5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all placeholder:text-slate-300"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Level</label>
                                    <select
                                        value={caLevel}
                                        onChange={(e) => setCaLevel(e.target.value as any)}
                                        className="w-full h-14 bg-white border border-slate-100 rounded-lg px-4 text-sm font-semibold focus:outline-none focus:border-indigo-500/30 transition-all"
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
                                        className="w-full h-14 bg-white border border-slate-100 rounded-lg px-4 text-sm font-semibold focus:outline-none focus:border-indigo-500/30 transition-all"
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
                                        className="w-full h-14 bg-white border border-slate-100 rounded-lg px-5 text-sm font-semibold focus:outline-none focus:border-indigo-500/30 transition-all placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Duration (Min)</label>
                                    <input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="w-full h-14 bg-white border border-slate-100 rounded-lg px-5 text-sm font-semibold focus:outline-none focus:border-indigo-500/30 transition-all"
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

                        <div className="flex p-1.5 rounded-lg bg-white border border-slate-100 gap-1">
                            <button
                                onClick={() => setTargetType("ALL")}
                                className={cn(
                                    "flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2",
                                    targetType === "ALL" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Globe size={14} weight="bold" /> Global
                            </button>
                            <button
                                onClick={() => setTargetType("BATCH")}
                                className={cn(
                                    "flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2",
                                    targetType === "BATCH" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Users size={14} weight="bold" /> My Batches
                            </button>
                        </div>

                        {targetType === "BATCH" && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                {batches.map((b: BatchOption) => (
                                    <button
                                        key={b.id}
                                        onClick={() => setSelectedBatchId(b.id)}
                                        className={cn(
                                            "w-full p-4 rounded-lg border text-left transition-all flex items-center justify-between",
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
                                    <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-lg">
                                        <p className="text-xs font-semibold text-slate-400 italic">No batches found</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Extra Visibility Controls */}
                        <div className="pt-6 space-y-4 border-t border-slate-100">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Cross-Platform Sharing</label>
                            
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-all cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={visibleToNonBatch}
                                        onChange={(e) => setVisibleToNonBatch(e.target.checked)}
                                        className="w-5 h-5 rounded border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Show to Non-Batch Students</p>
                                        <p className="text-[10px] font-semibold text-slate-400">Visible to students who haven't joined any batch</p>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-all cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={visibleToOtherBatches}
                                        onChange={(e) => setVisibleToOtherBatches(e.target.checked)}
                                        className="w-5 h-5 rounded border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Show to Other Batches</p>
                                        <p className="text-[10px] font-semibold text-slate-400">Allow students in other batches to access this</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right side: Question Selection Suite */}
                <div className="flex flex-col h-full min-h-[600px] bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
                    {/* Mode Toggle */}
                    <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                         <div className="flex p-1 rounded-xl bg-slate-50 border border-slate-100 gap-1 w-fit">
                            <button
                                onClick={() => setBuildMode("MANUAL")}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                    buildMode === "MANUAL" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Stack size={14} weight="bold" /> Manual Selection
                            </button>
                            <button
                                onClick={() => setBuildMode("GENERATOR")}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                    buildMode === "GENERATOR" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <RocketLaunch size={14} weight="bold" /> Smart Generator
                            </button>
                        </div>

                        <button
                            onClick={() => setSelectedQuestionIds(new Set())}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            Clear Selection
                        </button>
                    </div>

                    {buildMode === "MANUAL" ? (
                        <div className="space-y-6 flex flex-col flex-1 min-h-0 animate-in fade-in slide-in-from-right-4 duration-500">
                            <VaultFilterSuite onFilterChange={setActiveFilters} className="mb-2" />
                            
                            <div className="relative group">
                                <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" weight="bold" />
                                <input
                                    type="text"
                                    placeholder="Search content within search criteria…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-14 pl-12 pr-6 rounded-xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-medium"
                                />
                            </div>

                            <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                                {Object.entries(groupedHarvester).length === 0 ? (
                                    <div className="py-20 text-center space-y-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <div className="w-16 h-16 bg-white rounded-xl mx-auto flex items-center justify-center text-slate-200 shadow-sm">
                                            <Stack size={32} weight="duotone" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 italic">No matching questions in your harvester</p>
                                    </div>
                                ) : (
                                    Object.entries(groupedHarvester).map(([subject, chapters]: [string, any]) => (
                                        <div key={subject} className="space-y-4">
                                            <div className="flex items-center gap-3 px-2">
                                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">{subject}</h3>
                                                <div className="h-px flex-1 bg-slate-100" />
                                            </div>

                                            {Object.entries(chapters).map(([chapter, items]: [string, any]) => {
                                                const isExpanded = expandedChapters.has(chapter);
                                                return (
                                                    <div key={chapter} className="space-y-3">
                                                        <div 
                                                            onClick={() => toggleChapter(chapter)}
                                                            className="flex items-center justify-between px-2 cursor-pointer group"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn(
                                                                    "w-4 h-4 rounded flex items-center justify-center transition-all",
                                                                    isExpanded ? "bg-indigo-50 text-indigo-600 rotate-180" : "bg-slate-50 text-slate-400"
                                                                )}>
                                                                    <CaretDown size={14} weight="bold" />
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-500">{chapter}</span>
                                                                <span className="text-[9px] font-medium text-slate-300">({items.length})</span>
                                                            </div>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    selectAllInChapter(items);
                                                                }}
                                                                className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                Select All
                                                            </button>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="grid grid-cols-1 gap-2 animate-in slide-in-from-top-1 duration-200">
                                                                {(items as VaultQuestion[]).map((q: VaultQuestion) => {
                                                                    const isSelected = selectedQuestionIds.has(q.id);
                                                                    return (
                                                                        <div
                                                                            key={q.id}
                                                                            onClick={() => toggleSelection(q.id)}
                                                                            className={cn(
                                                                                "p-4 rounded-xl border transition-all cursor-pointer group flex items-start gap-4",
                                                                                isSelected
                                                                                    ? "bg-indigo-50/50 border-indigo-200"
                                                                                    : "bg-white border-transparent hover:bg-slate-50/50 hover:border-slate-100"
                                                                            )}
                                                                        >
                                                                            <div className={cn(
                                                                                "w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center shrink-0 mt-0.5",
                                                                                isSelected ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" : "border-slate-200 group-hover:border-slate-300"
                                                                            )}>
                                                                                {isSelected && <Check size={12} weight="bold" />}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 mb-1.5">
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
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 animate-in fade-in slide-in-from-left-4 duration-500 space-y-10 py-4 max-w-2xl">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Generate Question Base</h3>
                                <p className="text-sm text-slate-500 font-medium">Select a subject and specify counts per chapter for rapid series population.</p>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Primary Subject</label>
                                    <select
                                        value={genSubject}
                                        onChange={(e) => {
                                            setGenSubject(e.target.value);
                                            setGenChapters({});
                                        }}
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl px-5 text-sm font-bold focus:outline-none focus:border-emerald-500/30 transition-all"
                                    >
                                        <option value="">Select Target Subject</option>
                                        {vaultIntel?.subjects.map((s: string) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                {genSubject && vaultIntel?.chaptersBySubject[genSubject] && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Chapter Wise Breakdown</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {vaultIntel.chaptersBySubject[genSubject].map((c: { name: string; count: number }) => (
                                                <div key={c.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:bg-white hover:border-emerald-100 transition-all">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{c.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{c.count} total in vault</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black uppercase text-slate-400">Add</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={c.count}
                                                            value={genChapters[c.name] || ""}
                                                            onChange={(e) => setGenChapters({ ...genChapters, [c.name]: parseInt(e.target.value) || 0 })}
                                                            placeholder="0"
                                                            className="w-20 h-10 bg-white border border-slate-100 rounded-lg text-center font-bold text-sm focus:outline-none focus:border-emerald-500 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleSmartHarvest}
                                    disabled={!genSubject || Object.values(genChapters).every(v => (v as number) <= 0)}
                                    className="w-full h-16 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-700 disabled:opacity-40 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/10"
                                >
                                    <RocketLaunch size={24} weight="fill" />
                                    Initiate Intelligence Harvest
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
