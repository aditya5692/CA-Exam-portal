"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { deleteVaultQuestion, getVaultQuestions } from "@/actions/mcq-vault-actions";
import { SharedPageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import {
    Books,
    CaretDown,
    CloudArrowUp,
    MagnifyingGlass,
    PencilSimple,
    Plus,
    Sparkle,
    Stack,
    Trash
} from "@phosphor-icons/react";
import { VaultFilterSuite } from "./vault-filter-suite";

interface VaultQuestion {
    id: string;
    text: string;
    subject?: string;
    topic?: string;
    difficulty?: string;
    type?: string;
    options: { text: string; isCorrect: boolean }[];
}

export function QuestionBankViewer() {
    const [questions, setQuestions] = useState<VaultQuestion[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const [activeFilters, setActiveFilters] = useState<{
        subject: string | null;
        chapter: string | null;
        difficulty: string | null;
    }>({ subject: null, chapter: null, difficulty: null });

    const filteredQuestions = useMemo(() => {
        return questions.filter((q: VaultQuestion) => {
            const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (q.subject && q.subject.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesSubject = !activeFilters.subject || q.subject === activeFilters.subject || (activeFilters.subject === "Uncategorized" && !q.subject);
            const matchesChapter = !activeFilters.chapter || q.topic === activeFilters.chapter || (activeFilters.chapter === "General" && !q.topic);
            const matchesDifficulty = !activeFilters.difficulty || q.difficulty === activeFilters.difficulty;

            return matchesSearch && matchesSubject && matchesChapter && matchesDifficulty;
        });
    }, [questions, searchQuery, activeFilters]);

    // Grouping Logic
    const groupedData = useMemo<Record<string, Record<string, VaultQuestion[]>>>(() => {
        const groups: Record<string, Record<string, VaultQuestion[]>> = {};
        filteredQuestions.forEach((q: VaultQuestion) => {
            const sub = q.subject || "Uncategorized";
            const chap = q.topic || "General";
            if (!groups[sub]) groups[sub] = {};
            if (!groups[sub][chap]) groups[sub][chap] = [];
            groups[sub][chap].push(q);
        });
        return groups;
    }, [filteredQuestions]);

    const toggleChapter = (chapterId: string) => {
        const next = new Set(expandedChapters);
        if (next.has(chapterId)) next.delete(chapterId); else next.add(chapterId);
        setExpandedChapters(next);
    };

    const toggleAll = (expand: boolean) => {
        if (expand) {
            const all: string[] = [];
            Object.values(groupedData).forEach((chapters: Record<string, VaultQuestion[]>) => {
                Object.keys(chapters).forEach(c => all.push(c));
            });
            setExpandedChapters(new Set(all));
        } else {
            setExpandedChapters(new Set());
        }
    };

    // Initially expand all chapters when data loads
    useEffect(() => {
        if (!loading && Object.keys(groupedData).length > 0 && expandedChapters.size === 0) {
            toggleAll(true);
        }
    }, [loading, groupedData]);

    const fetchQuestions = async () => {
        setLoading(true);
        const res = await getVaultQuestions();
        if (res.success) {
            setQuestions((res.data || []) as VaultQuestion[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this question?")) return;
        const res = await deleteVaultQuestion(id);
        if (res.success) {
            fetchQuestions();
        } else {
            alert(res.message);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SharedPageHeader
                eyebrow="Library > Question Vault"
                title="Question Bank"
                description="Organize and review all generated and uploaded MCQs. These questions can be automatically compiled into mock test series."
                aside={
                    <div className="flex flex-wrap gap-4">
                        <Link 
                            href="/teacher/mcq-extract"
                            className="h-12 px-6 rounded-xl bg-white border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:border-slate-400 hover:text-slate-900 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                        >
                            <Sparkle size={18} weight="bold" className="text-secondary" />
                            AI Studio
                        </Link>
                        <Link 
                            href="/teacher/question-bank/add"
                            className="h-12 px-6 rounded-xl bg-white border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:border-slate-400 hover:text-slate-900 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                        >
                            <Plus size={18} weight="bold" className="text-primary" />
                            Add MCQ
                        </Link>
                        <Link 
                            href="/teacher/question-bank/bulk-upload"
                            className="h-12 px-6 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
                        >
                            <CloudArrowUp size={18} weight="bold" />
                            Bulk Ingestion
                        </Link>
                    </div>
                }
            />

            <VaultFilterSuite 
                onFilterChange={setActiveFilters} 
                className="mb-8" 
            />

            {/* Content area */}
            <div className="flex flex-col min-h-[500px]">
                {/* Search Bar */}
                <div className="pb-6 flex items-center justify-between gap-4 flex-wrap border-b border-slate-100 mb-8">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-500">
                                <Stack size={18} weight="bold" />
                            </div>
                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{filteredQuestions.length} Library Matches Found</span>
                        </div>
                        
                        <div className="flex items-center gap-3 border-l border-slate-100 pl-6">
                            <button 
                                onClick={() => toggleAll(true)}
                                className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                Expand List
                            </button>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <button 
                                onClick={() => toggleAll(false)}
                                className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                Collapse All
                            </button>
                        </div>
                    </div>

                    <div className="relative w-full max-w-sm">
                        <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" weight="bold" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Identify specific MCQ identifiers..."
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200/60 text-[13px] font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl">
                        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <span className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Synchronizing Vault...</span>
                    </div>
                ) : filteredQuestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-white border border-slate-100 rounded-3xl">
                        <div className="w-20 h-20 bg-slate-50 shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
                            <Books size={40} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">No Questions Found</h3>
                            <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Try adjusting your intelligence filters or search criteria.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {Object.entries(groupedData).map(([subject, chapters]: [string, Record<string, VaultQuestion[]>]) => (
                            <div key={subject} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xs font-black uppercase tracking-[0.25em] text-[#64748B]">{subject}</h2>
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {Object.entries(chapters).map(([chapter, items]: [string, VaultQuestion[]]) => {
                                        const isExpanded = expandedChapters.has(chapter);
                                        return (
                                            <div key={chapter} className={cn(
                                                "bg-white border rounded-2xl overflow-hidden shadow-sm transition-all duration-300",
                                                isExpanded ? "border-slate-200" : "border-slate-100 opacity-80 hover:opacity-100"
                                            )}>
                                                <div 
                                                    onClick={() => toggleChapter(chapter)}
                                                    className="px-6 py-4 bg-white hover:bg-slate-50 border-b border-transparent cursor-pointer flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                                                            isExpanded ? "bg-indigo-600 text-white rotate-180" : "bg-slate-50 border border-slate-100 text-slate-300"
                                                        )}>
                                                            <CaretDown size={14} weight="bold" />
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={cn(
                                                                "text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border",
                                                                isExpanded ? "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm shadow-indigo-100/10" : "bg-slate-50 text-slate-400 border-slate-100 opacity-60"
                                                            )}>
                                                                {chapter}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-300 tracking-tight">{items.length} assessments matched</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {!isExpanded && (
                                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-indigo-400 transition-colors">
                                                            Click to Expand
                                                        </div>
                                                    )}
                                                </div>                                                {isExpanded && (
                                                    <div className="divide-y divide-slate-50 animate-in slide-in-from-top-2 duration-300">
                                                        {items.map((q: VaultQuestion) => {
                                                            const correctOption = q.options.find((o: { text: string; isCorrect: boolean }) => o.isCorrect);
                                                            return (
                                                                <div key={q.id} className="group p-6 hover:bg-slate-50 transition-all duration-200">
                                                                    <div className="flex items-start justify-between gap-6">
                                                                        <div className="space-y-3 flex-1">
                                                                            <div className="flex items-center gap-2">
                                                                                {q.difficulty && (
                                                                                    <span className={cn(
                                                                                        "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                                                                                        q.difficulty.toLowerCase() === "hard" ? "bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-100/10" :
                                                                                        q.difficulty.toLowerCase() === "medium" ? "bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-100/10" :
                                                                                        "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-100/10"
                                                                                    )}>{q.difficulty}</span>
                                                                                )}
                                                                            </div>
                                                                            <h3 className="text-[14px] font-semibold text-[#1E293B] leading-relaxed max-w-4xl">
                                                                                {q.text}
                                                                            </h3>
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50/50 text-slate-500 border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-100 transition-all duration-300">
                                                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Master Record</span>
                                                                                    <span className="text-[11px] font-bold truncate max-w-[400px]">{correctOption?.text || "Reference Undefined"}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                                            <button className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center shadow-sm">
                                                                                <PencilSimple size={16} weight="bold" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDelete(q.id)}
                                                                                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center shadow-sm"
                                                                            >
                                                                                <Trash size={16} weight="bold" />
                                                                            </button>
                                                                        </div>
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
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
