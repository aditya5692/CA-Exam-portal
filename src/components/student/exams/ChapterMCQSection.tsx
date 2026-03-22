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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--student-accent-strong)] text-white">
                        <span className="material-symbols-outlined text-[20px]">menu_book</span>
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--student-text)]">Chapter-wise MCQs</h3>
                </div>
                <span className="student-chip rounded-full px-3 py-1 text-[10px] font-bold">BASED ON ICAI PATTERN</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {hubData?.chapterWiseMCQs && hubData.chapterWiseMCQs.length > 0 ? (
                    hubData.chapterWiseMCQs.map((subject) => {
                        const isExpanded = selectedSubject === subject.title;
                        const progressColor = subject.color === "emerald" ? "bg-emerald-500" : subject.color === "amber" ? "bg-amber-500" : "bg-rose-500";
                        const bgColor = subject.color === "emerald" ? "bg-emerald-50 text-emerald-600" : subject.color === "amber" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600";
                        const icon = subject.color === "emerald" ? "account_balance" : subject.color === "amber" ? "gavel" : "payments";

                        return (
                            <div key={subject.id} className="student-surface overflow-hidden rounded-xl transition-all hover:shadow-[0_18px_30px_rgba(55,48,38,0.08)]">
                                {/* Main Subject Header */}
                                <div
                                    className={cn("group flex cursor-pointer items-center justify-between p-4 transition-colors", isExpanded ? "border-b border-[var(--student-border)] bg-[rgba(255,253,249,0.88)]" : "hover:bg-white/80")}
                                    onClick={() => setSelectedSubject(isExpanded ? "All Subjects" : subject.title)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", bgColor)}>
                                            <span className="material-symbols-outlined">{icon}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-base font-semibold text-[var(--student-text)]">{subject.title}</h4>
                                            <p className="text-xs text-slate-500">{subject.chapters || 0} Chapters • {subject.questions || 0}+ Practice Questions</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="hidden sm:block text-right">
                                            <p className="text-xs font-bold text-[var(--student-muted-strong)]">{subject.progress}% Progress</p>
                                            <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-[var(--student-panel-muted)]">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-1000", progressColor)}
                                                    style={{ width: `${subject.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className={cn("material-symbols-outlined text-[var(--student-accent-strong)] transition-transform duration-300", isExpanded && "rotate-180")}>expand_more</span>
                                    </div>
                                </div>

                                {/* Expanded Chapters List */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="mt-4 space-y-3 pl-14">
                                            {subject.chapterDetails?.map((chapter, idx) => (
                                                <div key={idx} className="flex items-center justify-between group/chapter py-1">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-[var(--student-muted-strong)] transition-colors group-hover/chapter:text-[var(--student-accent-strong)]">
                                                            Chapter {idx + 1}: {chapter.name}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <div className="h-1 w-24 overflow-hidden rounded-full bg-[var(--student-panel-muted)]">
                                                                <div className={cn("h-full", progressColor)} style={{ width: `${chapter.progress}%` }}></div>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-[var(--student-muted)]">{chapter.progress}%</span>
                                                        </div>
                                                    </div>
                                                    {chapter.examId ? (
                                                        <Link
                                                            href={`/exam/war-room?examId=${chapter.examId}&mode=practice`}
                                                            className="text-[10px] font-bold uppercase tracking-wider text-[var(--student-accent-strong)] hover:underline"
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
                                                <button className="group flex items-center gap-2 text-[11px] font-bold text-[var(--student-accent-strong)] transition-colors hover:text-[var(--student-accent)]">
                                                    <span>VIEW {subject.chapters - (subject.chapterDetails?.length || 0)} MORE CHAPTERS</span>
                                                    <span className="material-symbols-outlined text-sm group-hover:translate-y-0.5 transition-transform">keyboard_arrow_down</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="student-surface flex flex-col items-center justify-center rounded-xl p-12 text-center">
                        <span className="material-symbols-outlined mb-3 text-4xl text-slate-200">auto_stories</span>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No chapter-wise MCQs available</p>
                        <p className="mt-1 text-xs text-slate-500">Check your CA level settings in the profile or header to ensure you are viewing relevant content.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
