"use client";

import { cn } from "@/lib/utils";
import type { ExamHubData } from "@/types/student";
import Link from "next/link";

export function MockTestSection({ hubData }: { hubData: ExamHubData | null }) {
    return (
        <section>
            <div className="flex items-center justify-between mb-[9px]">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--student-accent-strong)] text-white">
                        <span className="material-symbols-outlined text-[20px]">fact_check</span>
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--student-text)]">Full Mock Tests</h3>
                </div>
            </div>

            <div className="space-y-2">
                {hubData?.mockTests && hubData.mockTests.length > 0 ? (
                    hubData.mockTests.map((test) => (
                        <div key={test.id} className={cn(
                            "student-surface group flex flex-col gap-4 rounded-xl p-5 transition-all duration-300 hover:shadow-[0_18px_30px_rgba(55,48,38,0.08)] md:flex-row md:items-center",
                            test.isLocked && "opacity-75 grayscale hover:grayscale-0 hover:opacity-100"
                        )}>
                            <div className="flex items-center gap-4 flex-1">
                                <div className={cn(
                                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                                    test.isLocked ? "border border-[var(--student-border)] bg-[var(--student-panel-muted)]" : "student-icon-tile"
                                )}>
                                    <span className={cn("material-symbols-outlined", test.isLocked ? "text-[var(--student-muted)]" : "text-[var(--student-accent-strong)]")}>
                                        {test.isLocked ? "lock" : "assignment"}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className={cn("text-base font-semibold", test.isLocked ? "text-slate-700" : "text-slate-900")}>{test.title}</h4>
                                        {test.isCompleted && (
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">COMPLETED</span>
                                        )}
                                        {test.isNew && (
                                            <span className="student-chip-accent rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">NEW</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {test.isCompleted ? `Score: ${test.score}/${test.totalMarks} • Attempted on ${test.attemptedDate}` : test.isLocked ? "Unlock this test by completing chapters in MCQs." : "Based on latest ICAI amendments for upcoming attempt."}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className={cn("text-xs font-bold", test.isLocked ? "text-slate-400" : "text-slate-900")}>{test.questions}</p>
                                        <p className={cn("text-[10px] font-medium uppercase tracking-tighter", test.isLocked ? "text-slate-300" : "text-slate-400")}>MCQs</p>
                                    </div>
                                    <div className="text-center">
                                        <p className={cn("text-xs font-bold", test.isLocked ? "text-slate-400" : "text-slate-900")}>{test.duration}m</p>
                                        <p className={cn("text-[10px] font-medium uppercase tracking-tighter", test.isLocked ? "text-slate-300" : "text-slate-400")}>Time</p>
                                    </div>
                                </div>

                                {test.isLocked ? (
                                    <button className="px-8 py-2.5 bg-slate-200 text-slate-500 text-xs font-bold rounded-lg cursor-not-allowed">
                                        Locked
                                    </button>
                                ) : test.isCompleted ? (
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/student/results/${test.lastAttemptId}`}
                                            className="px-6 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors shadow-sm active:scale-95 duration-200"
                                        >
                                            Analysis
                                        </Link>
                                        <Link
                                            href={`/exam/war-room?examId=${test.id}&mode=mock`}
                                            className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm active:scale-95 duration-200"
                                        >
                                            Retake
                                        </Link>
                                    </div>
                                ) : (
                                    <Link
                                        href={`/exam/war-room?examId=${test.id}&mode=mock`}
                                        className="student-button-primary rounded-lg px-8 py-2.5 text-center text-xs font-bold transition-colors active:scale-95 duration-200"
                                    >
                                        Start Practice
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="student-surface flex flex-col items-center justify-center rounded-xl p-12 text-center">
                        <span className="material-symbols-outlined mb-3 text-4xl text-slate-200">content_paste_off</span>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No mock tests found for your CA level</p>
                        <p className="mt-1 text-xs text-slate-500">Try changing your CA level in the profile or header to see more available tests.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
