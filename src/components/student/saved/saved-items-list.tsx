"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, ClipboardText, Trash, ArrowRight, BookmarkSimple } from "@phosphor-icons/react";
import { toggleSavedItem } from "@/actions/student-actions";
import { useRouter } from "next/navigation";

interface Props {
    materials: any[];
    exams: any[];
}

export function SavedItemsList({ materials: initialMaterials, exams: initialExams }: Props) {
    const [materials, setMaterials] = useState(initialMaterials);
    const [exams, setExams] = useState(initialExams);
    const [activeTab, setActiveTab] = useState<"ALL" | "MATERIAL" | "EXAM">("ALL");
    const router = useRouter();

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
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm mx-auto max-w-2xl shadow-slate-200/50">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <BookmarkSimple size={32} weight="duotone" className="text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-950 font-outfit mb-3 tracking-tight">No saved items</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8 text-base font-medium leading-relaxed font-sans opacity-70">
                    You haven't saved any materials or exams yet. Start exploring to build your collection.
                </p>
                <Link 
                    href="/student/dashboard"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                    Go to Dashboard <ArrowRight weight="bold" size={16} />
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Professional Category Switcher */}
            <div className="inline-flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                {[
                    { id: "ALL", label: "All Items" },
                    { id: "MATERIAL", label: "Materials" },
                    { id: "EXAM", label: "Exams" }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200",
                            activeTab === tab.id 
                                ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
                                : "text-slate-400 hover:text-slate-900"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {/* Materials */}
                {(activeTab === "ALL" || activeTab === "MATERIAL") && materials.map((item) => (
                    <div key={item.id} className="group bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative overflow-hidden shadow-slate-200/50">
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-500/80 transition-all duration-300 shadow-inner">
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
                                <span className="text-[10px] font-bold tracking-widest text-indigo-500/80 uppercase opacity-70">{item.category}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase opacity-70">{item.subType}</span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 font-outfit leading-tight group-hover:text-indigo-500/80 transition-colors line-clamp-2 min-h-[44px] tracking-tight">
                                {item.title}
                            </h4>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 opacity-60">Uploaded By</span>
                                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tight font-outfit opacity-80">{item.uploadedBy?.fullName || "Verified Faculty"}</span>
                            </div>
                            <Link 
                                href={item.fileUrl} 
                                target="_blank"
                                className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-slate-900/10 border border-slate-900"
                            >
                                View File
                            </Link>
                        </div>
                    </div>
                ))}

                {/* Exams */}
                {(activeTab === "ALL" || activeTab === "EXAM") && exams.map((item) => (
                    <div key={item.id} className="group bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative overflow-hidden shadow-slate-200/50">
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-500/80 transition-all duration-300 shadow-inner">
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
                                <span className="text-[10px] font-bold tracking-widest text-indigo-500/80 uppercase opacity-70">{item.category}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase opacity-70">{item.duration} Mins</span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 font-outfit leading-tight group-hover:text-indigo-500/80 transition-colors line-clamp-2 min-h-[44px] tracking-tight">
                                {item.title}
                            </h4>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 opacity-60">Educator</span>
                                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tight font-outfit opacity-80">{item.teacher?.fullName || "Verified Expert"}</span>
                            </div>
                            <Link 
                                href={`/exam/war-room?examId=${item.id}`}
                                className="h-10 px-6 bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-500"
                            >
                                Start Exam
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
