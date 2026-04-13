"use client";

import { toggleSavedItem } from "@/actions/student-actions";
import { cn } from "@/lib/utils";
import type { UnifiedExam,UnifiedMaterial } from "@/types/shared";
import { ArrowRight,BookmarkSimple,BookOpen,ClipboardText,Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

type ActiveTab = "ALL" | "MATERIAL" | "EXAM";

type SavedMaterial = UnifiedMaterial & {
    subType?: string;
    fileUrl?: string;
    uploadedBy?: { fullName?: string | null } | null;
};

type SavedExam = UnifiedExam & {
    duration?: number;
    teacher?: { fullName?: string | null } | null;
};

const TABS: Array<{ id: ActiveTab; label: string }> = [
    { id: "ALL", label: "All Items" },
    { id: "MATERIAL", label: "Materials" },
    { id: "EXAM", label: "Exams" },
];

interface Props {
    materials: SavedMaterial[];
    exams: SavedExam[];
}

export function SavedItemsList({ materials: initialMaterials, exams: initialExams }: Props) {
    const [materials, setMaterials] = useState(initialMaterials);
    const [exams, setExams] = useState(initialExams);
    const [activeTab, setActiveTab] = useState<ActiveTab>("ALL");

    const handleUnsave = async (id: string, type: "MATERIAL" | "EXAM") => {
        const res = await toggleSavedItem(id, type);
        if (res.success && res.data && !res.data.saved) {
            if (type === "MATERIAL") {
                setMaterials(prev => prev.filter(m => m.id !== id));
            } else {
                setExams(prev => prev.filter(e => e.id !== id));
            }
        }
    };

    const hasItems = materials.length > 0 || exams.length > 0;

    if (!hasItems) {
        return (
            <div className="text-center py-24 bg-white rounded-lg border border-slate-100 shadow-sm mx-auto max-w-2xl shadow-slate-200/50">
                <div className="w-16 h-16 rounded-lg bg-slate-50 flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <BookmarkSimple size={32} weight="duotone" className="text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-950   mb-3 tracking-tight">No saved items</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8 text-base font-medium leading-relaxed   opacity-70">
                    You haven&apos;t saved any materials or exams yet. Start exploring to build your collection.
                </p>
                <Link 
                    href="/student/dashboard"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                    Go to Dashboard <ArrowRight weight="bold" size={16} />
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Professional Category Switcher */}
            <div className="inline-flex rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-1.5">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200",
                            activeTab === tab.id 
                                ? "student-tab-active"
                                : "text-[var(--student-muted)] hover:text-[var(--student-text)]"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {/* Materials */}
                {(activeTab === "ALL" || activeTab === "MATERIAL") && materials.map((item) => (
                    <div key={item.id} className="student-surface group relative flex flex-col overflow-hidden rounded-lg p-8 transition-all duration-300 hover:border-[var(--student-accent-soft-strong)] hover:shadow-[0_18px_30px_rgba(55,48,38,0.08)]">
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="student-icon-tile flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300">
                                <BookOpen size={24} weight="bold" />
                            </div>
                            <button 
                                onClick={() => handleUnsave(item.id, "MATERIAL")}
                                className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-90 flex items-center justify-center border border-transparent shadow-sm"
                                title="Remove item"
                            >
                                <Trash size={18} weight="bold" />
                            </button>
                        </div>
                        
                        <div className="space-y-3 mb-8 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-accent-strong)] opacity-80">{item.category}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)] opacity-80">{item.subType ?? item.type}</span>
                            </div>
                            <h4 className="min-h-[44px] line-clamp-2   text-lg font-bold leading-tight tracking-tight text-[var(--student-text)] transition-colors group-hover:text-[var(--student-accent-strong)]">
                                {item.title}
                            </h4>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 opacity-60">Uploaded By</span>
                                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tight   opacity-80">{item.uploadedBy?.fullName || "Verified Faculty"}</span>
                            </div>
                            <Link href={item.fileUrl ?? "#"} target="_blank" className="student-button-secondary flex h-10 items-center justify-center rounded-lg px-6 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95">
                                View File
                            </Link>
                        </div>
                    </div>
                ))}

                {/* Exams */}
                {(activeTab === "ALL" || activeTab === "EXAM") && exams.map((item) => (
                    <div key={item.id} className="student-surface group relative flex flex-col overflow-hidden rounded-lg p-8 transition-all duration-300 hover:border-[var(--student-accent-soft-strong)] hover:shadow-[0_18px_30px_rgba(55,48,38,0.08)]">
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="student-icon-tile flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300">
                                <ClipboardText size={24} weight="bold" />
                            </div>
                            <button 
                                onClick={() => handleUnsave(item.id, "EXAM")}
                                className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-90 flex items-center justify-center border border-transparent shadow-sm"
                                title="Remove item"
                            >
                                <Trash size={18} weight="bold" />
                            </button>
                        </div>
                        
                        <div className="space-y-3 mb-8 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-accent-strong)] opacity-80">{item.category}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)] opacity-80">{item.duration ?? item.durationMinutes} Mins</span>
                            </div>
                            <h4 className="min-h-[44px] line-clamp-2   text-lg font-bold leading-tight tracking-tight text-[var(--student-text)] transition-colors group-hover:text-[var(--student-accent-strong)]">
                                {item.title}
                            </h4>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 opacity-60">Educator</span>
                                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tight   opacity-80">{item.teacher?.fullName || "Verified Expert"}</span>
                            </div>
                            <Link href={`/exam/war-room?examId=${item.id}`} className="student-button-primary flex h-10 items-center justify-center rounded-lg px-6 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95">
                                Start Exam
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
