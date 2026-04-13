"use client";

import { cn } from "@/lib/utils";
import {
    Funnel,
    X,
    CaretDown,
    ChartBar,
    BookOpen,
    Lightning
} from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { getVaultIntel, type VaultIntel } from "@/actions/vault-intel-actions";

interface VaultFilterSuiteProps {
    onFilterChange: (filters: {
        subject: string | null;
        chapter: string | null;
        difficulty: string | null;
    }) => void;
    className?: string;
}

export function VaultFilterSuite({ onFilterChange, className }: VaultFilterSuiteProps) {
    const [intel, setIntel] = useState<VaultIntel | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        async function loadIntel() {
            const res = await getVaultIntel();
            if (res.success && res.data) {
                setIntel(res.data);
            }
        }
        loadIntel();
    }, []);

    useEffect(() => {
        onFilterChange({
            subject: selectedSubject,
            chapter: selectedChapter,
            difficulty: selectedDifficulty
        });
    }, [selectedSubject, selectedChapter, selectedDifficulty, onFilterChange]);

    const activeChapters = selectedSubject && intel?.chaptersBySubject[selectedSubject] 
        ? intel.chaptersBySubject[selectedSubject] 
        : [];

    const clearFilters = () => {
        setSelectedSubject(null);
        setSelectedChapter(null);
        setSelectedDifficulty(null);
    };

    const hasFilters = selectedSubject || selectedChapter || selectedDifficulty;

    return (
        <div className={cn("bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300", className, isExpanded ? "ring-4 ring-slate-50 border-slate-300" : "hover:border-slate-300")}>
            <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50 border-b border-transparent transition-all" style={{ borderBottomColor: isExpanded ? "rgba(226, 232, 240, 0.8)" : "transparent" }}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                        <Funnel size={20} weight="fill" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Intelligence Filter</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Precision Content Harvesting</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {hasFilters && (
                        <button 
                            onClick={clearFilters}
                            className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50"
                        >
                            <X size={14} weight="bold" />
                            Reset Selection
                        </button>
                    )}
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            isExpanded ? "bg-slate-200 text-slate-900 rotate-180" : "bg-white border border-slate-200 text-slate-400 hover:text-slate-900"
                        )}
                    >
                        <CaretDown size={16} weight="bold" />
                    </button>
                </div>
            </div>

            <div className={cn(
                "grid transition-all duration-500 ease-in-out",
                isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
            )}>
                <div className="overflow-hidden">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Subject Filter */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                <BookOpen size={14} weight="fill" className="text-indigo-500" />
                                Subject Module
                            </label>
                            <select
                                value={selectedSubject || ""}
                                onChange={(e) => {
                                    setSelectedSubject(e.target.value || null);
                                    setSelectedChapter(null);
                                }}
                                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all cursor-pointer"
                            >
                                <option value="">All Subjects</option>
                                {intel?.subjects.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Chapter Filter */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                <ChartBar size={14} weight="fill" className="text-emerald-500" />
                                Chapter Selection
                            </label>
                            <select
                                value={selectedChapter || ""}
                                disabled={!selectedSubject}
                                onChange={(e) => setSelectedChapter(e.target.value || null)}
                                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all cursor-pointer disabled:opacity-40"
                            >
                                <option value="">All Chapters</option>
                                {activeChapters.map(c => (
                                    <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
                                ))}
                            </select>
                        </div>

                        {/* Difficulty Filter */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                <Lightning size={14} weight="fill" className="text-amber-500" />
                                Difficulty Tier
                            </label>
                            <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100 gap-1">
                                {["EASY", "MEDIUM", "HARD"].map((diff) => (
                                    <button
                                        key={diff}
                                        onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
                                        className={cn(
                                            "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                            selectedDifficulty === diff 
                                                ? (diff === "HARD" ? "bg-rose-600 text-white shadow-md shadow-rose-200" : diff === "MEDIUM" ? "bg-amber-500 text-white shadow-md shadow-amber-200" : "bg-emerald-600 text-white shadow-md shadow-emerald-200")
                                                : "text-slate-400 hover:text-slate-600 hover:bg-white"
                                        )}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
