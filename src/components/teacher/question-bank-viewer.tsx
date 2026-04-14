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
                            className="h-12 px-6 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Sparkle size={18} weight="fill" className="text-secondary" />
                            AI Studio
                        </Link>
                        <Link 
                            href="/teacher/question-bank/add"
                            className="h-12 px-6 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Plus size={18} weight="bold" className="text-primary" />
                            Add MCQ
                        </Link>
                        <Link 
                            href="/teacher/question-bank/bulk-upload"
                            className="h-12 px-6 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
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
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                <Stack size={18} weight="bold" />
                            </div>
                            <span className="text-sm font-bold text-slate-900">{filteredQuestions.length} Matches Found</span>
                        </div>
                        
                        <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
                            <button 
                                onClick={() => toggleAll(true)}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                Expand All
                            </button>
                            <span className="text-slate-200">•</span>
                            <button 
                                onClick={() => toggleAll(false)}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
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
                            placeholder="Search within filtered results…"
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all"
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
                                    <h2 className="text-lg font-black uppercase tracking-[0.2em] text-slate-900">{subject}</h2>
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
                                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                            isExpanded ? "bg-indigo-600 text-white rotate-180" : "bg-slate-100 text-slate-400"
                                                        )}>
                                                            <CaretDown size={18} weight="bold" />
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={cn(
                                                                "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap transition-all",
                                                                isExpanded ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"
                                                            )}>
                                                                {chapter}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400">{items.length} questions matched</span>
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
                                                                                        "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                                                        q.difficulty.toLowerCase() === "hard" ? "bg-rose-50 text-rose-600" :
                                                                                        q.difficulty.toLowerCase() === "medium" ? "bg-amber-50 text-amber-600" :
                                                                                        "bg-emerald-50 text-emerald-600"
                                                                                    )}>{q.difficulty}</span>
                                                                                )}
                                                                            </div>
                                                                            <h3 className="text-sm font-semibold text-slate-800 leading-relaxed">
                                                                                {q.text}
                                                                            </h3>
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                                    <span className="text-[9px] font-black uppercase tracking-widest">Answer</span>
                                                                                    <span className="text-xs font-bold truncate max-w-[300px]">{correctOption?.text || "None"}</span>
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
