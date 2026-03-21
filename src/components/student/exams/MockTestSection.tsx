"use client";

import { cn } from "@/lib/utils";
import type { ExamHubData } from "@/types/student";
import Link from "next/link";

export function MockTestSection({ hubData }: { hubData: ExamHubData | null }) {
    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-[20px]">fact_check</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Full Mock Tests</h3>
                </div>
                <p className="text-xs font-medium text-slate-500">Official ICAI Simulation Platform</p>
            </div>

            <div className="space-y-4">
                {hubData?.mockTests.map((test) => (
                    <div key={test.id} className={cn(
                        "group flex flex-col md:flex-row md:items-center bg-white/70 backdrop-blur-md border border-slate-100 p-5 rounded-xl hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 gap-4",
                        test.isLocked && "opacity-75 grayscale hover:grayscale-0 hover:opacity-100"
                    )}>
                        <div className="flex items-center gap-4 flex-1">
                            <div className={cn(
                                "h-12 w-12 rounded-lg flex items-center justify-center shrink-0",
                                test.isLocked ? "bg-slate-50" : "bg-indigo-50"
                            )}>
                                <span className={cn("material-symbols-outlined", test.isLocked ? "text-slate-400" : "text-indigo-600")}>
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
                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">NEW</span>
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
                                    className="px-8 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm active:scale-95 duration-200 text-center"
                                >
                                    Start Practice
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
