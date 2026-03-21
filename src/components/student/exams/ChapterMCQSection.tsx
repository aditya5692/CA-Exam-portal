"use client";

import { cn } from "@/lib/utils";
import type { ExamHubData } from "@/types/student";
import Link from "next/link";

type Props = {
    hubData: ExamHubData | null;
    selectedSubject: string;
    setSelectedSubject: (subject: string) => void;
};

export function ChapterMCQSection({ hubData, selectedSubject, setSelectedSubject }: Props) {
    return (
        <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-[20px]">menu_book</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Chapter-wise MCQs</h3>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full border border-slate-200">BASED ON ICAI PATTERN</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {hubData?.chapterWiseMCQs.map((subject) => {
                    const isExpanded = selectedSubject === subject.title;
                    const progressColor = subject.color === "emerald" ? "bg-emerald-500" : subject.color === "amber" ? "bg-amber-500" : "bg-rose-500";
                    const bgColor = subject.color === "emerald" ? "bg-emerald-50 text-emerald-600" : subject.color === "amber" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600";
                    const icon = subject.color === "emerald" ? "account_balance" : subject.color === "amber" ? "gavel" : "payments";

                    return (
                        <div key={subject.id} className="bg-white/70 backdrop-blur-md border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                            {/* Main Subject Header */}
                            <div
                                className={cn("p-4 flex items-center justify-between cursor-pointer group transition-colors", isExpanded ? "bg-slate-50/50 border-b border-slate-100" : "hover:bg-slate-50/30")}
                                onClick={() => setSelectedSubject(isExpanded ? "All Subjects" : subject.title)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", bgColor)}>
                                        <span className="material-symbols-outlined">{icon}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-base font-semibold text-slate-900">{subject.title}</h4>
                                        <p className="text-xs text-slate-500">{subject.chapters || 0} Chapters • {subject.questions || 0}+ Practice Questions</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="hidden sm:block text-right">
                                        <p className="text-xs font-bold text-slate-700">{subject.progress}% Progress</p>
                                        <div className="w-32 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-1000", progressColor)}
                                                style={{ width: `${subject.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className={cn("material-symbols-outlined text-indigo-600 transition-transform duration-300", isExpanded && "rotate-180")}>expand_more</span>
                                </div>
                            </div>

                            {/* Expanded Chapters List */}
                            {isExpanded && (
                                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="mt-4 space-y-3 pl-14">
                                        {subject.chapterDetails?.map((chapter, idx) => (
                                            <div key={idx} className="flex items-center justify-between group/chapter py-1">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-slate-700 group-hover/chapter:text-indigo-600 transition-colors">
                                                        Chapter {idx + 1}: {chapter.name}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className="w-24 bg-slate-100 h-1 rounded-full overflow-hidden">
                                                            <div className={cn("h-full", progressColor)} style={{ width: `${chapter.progress}%` }}></div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-500">{chapter.progress}%</span>
                                                    </div>
                                                </div>
                                                {chapter.examId ? (
                                                    <Link
                                                        href={`/exam/war-room?examId=${chapter.examId}&mode=practice`}
                                                        className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider hover:underline"
                                                    >
                                                        Practice
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">No Practice</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {/* View More Button */}
                                    {subject.chapters > (subject.chapterDetails?.length || 0) && (
                                        <div className="mt-4 pl-14 pt-3 border-t border-slate-50">
                                            <button className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors group">
                                                <span>VIEW {subject.chapters - (subject.chapterDetails?.length || 0)} MORE CHAPTERS</span>
                                                <span className="material-symbols-outlined text-sm group-hover:translate-y-0.5 transition-transform">keyboard_arrow_down</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
