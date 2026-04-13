"use client";

import { getVaultQuestions, deleteVaultQuestion } from "@/actions/mcq-vault-actions";
import { cn } from "@/lib/utils";
import {
    Books,
    MagnifyingGlass,
    PencilSimple,
    Trash,
    Stack,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";

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

    const filteredQuestions = questions.filter(q =>
        q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.subject && q.subject.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="w-full max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-10 relative">
                <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            Asset Library
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Question Bank</h1>
                        <p className="text-slate-500 font-medium text-sm max-w-xl leading-relaxed">
                            Organize and review all generated and uploaded MCQs. These questions can be automatically compiled into mock test series.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content area */}
            <div className="flex flex-col min-h-[500px]">
                {/* Search Bar */}
                <div className="pb-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Stack size={20} weight="fill" className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{questions.length} Items</span>
                    </div>

                    <div className="relative w-full max-w-sm">
                        <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" weight="bold" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search questions or tags..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-[1fr_200px_80px] items-center px-6 py-3 bg-slate-50 border border-slate-100 rounded-lg-t-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 border-b-0">
                    <span>Question Details</span>
                    <span>Meta Tags</span>
                    <span className="text-right">Actions</span>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-100 flex-1 overflow-x-auto border border-slate-100 rounded-lg-b-2xl bg-white mb-8">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <span className="mt-4 text-xs font-bold text-slate-400">Loading Bank...</span>
                        </div>
                    ) : filteredQuestions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 shadow-sm border border-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                <Books size={32} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Bank is Empty</h3>
                                <p className="text-sm text-slate-500 mt-1">Upload questions to see them here.</p>
                            </div>
                        </div>
                    ) : (
                        filteredQuestions.map((q, i) => {
                            const correctOption = q.options.find(o => o.isCorrect);
                            return (
                                <div key={q.id} className="grid grid-cols-[1fr_200px_80px] items-start px-6 py-4 hover:bg-slate-50 transition-colors duration-200 group">
                                    {/* Question & Answer */}
                                    <div className="pr-6 min-w-0">
                                        <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1.5 break-words">
                                            {q.text}
                                        </h3>
                                        <div className="flex items-start gap-2 max-w-full">
                                            <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest shrink-0 mt-0.5">Answer:</span>
                                            <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg truncate max-w-md">
                                                {correctOption?.text || "None selected"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-col gap-2 justify-center">
                                        {q.subject && (
                                            <span className="inline-flex px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide self-start truncate max-w-full">
                                                {q.subject}
                                            </span>
                                        )}
                                        {q.difficulty && (
                                            <span className={cn(
                                                "inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest self-start",
                                                q.difficulty.toLowerCase() === "hard" ? "bg-rose-50 text-rose-600" :
                                                    q.difficulty.toLowerCase() === "medium" ? "bg-amber-50 text-amber-600" :
                                                        "bg-emerald-50 text-emerald-600"
                                            )}>{q.difficulty}</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center shadow-sm">
                                            <PencilSimple size={14} weight="bold" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(q.id)}
                                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center shadow-sm"
                                        >
                                            <Trash size={14} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
