"use client";

import { cn } from "@/lib/utils";
import type { StudentAttempt } from "@/types/student";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

interface Props {
    attempts: StudentAttempt[];
}

const STATUS_CONFIG: Record<"completed" | "in-progress" | "abandoned", { label: string; color: string; dot: string }> = {
    completed: { label: "Completed", color: "bg-[var(--student-accent-soft)] text-[var(--student-accent)] border border-[var(--student-accent-soft-strong)]", dot: "bg-[var(--student-accent)]" },
    "in-progress": { label: "In Progress", color: "bg-[var(--student-support-soft)] text-[var(--student-support)] border border-[var(--student-support-soft-strong)]", dot: "bg-[var(--student-support)] animate-pulse" },
    abandoned: { label: "Abandoned", color: "bg-[var(--student-panel-muted)] text-[var(--student-muted)] border border-[var(--student-border)]", dot: "bg-[var(--student-muted)]" },
};

function AccuracyBar({ accuracy }: { accuracy: number }) {
    const color = accuracy >= 75 ? "var(--student-success)" : accuracy >= 55 ? "var(--student-support)" : "var(--student-destructive)";
    return (
        <div className="h-2 bg-[var(--student-panel-muted)] rounded-full overflow-hidden flex-1 shadow-inner border border-[var(--student-border)]">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${accuracy}%`, backgroundColor: color }} />
        </div>
    );
}

export function StudentAttemptHistory({ attempts }: Props) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-8 flex-wrap px-2">
                <div className="space-y-2">
                    <h2 className=" ">Attempt History</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest opacity-70">A complete record of your practice attempts — {attempts.length} Attempt{attempts.length !== 1 ? 's' : ''} found</p>
                </div>
            </div>

            {attempts.length === 0 ? (
                <div className="text-center py-20 text-slate-400 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 rounded-lg bg-slate-50 flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <span className="text-3xl">📭</span>
                    </div>
                    <div className="font-bold text-slate-800 text-xl   tracking-tight">No attempts yet</div>
                    <p className="text-sm mt-2 mb-8 max-w-xs mx-auto font-medium opacity-70">Start a practice attempt from the Exams section to see your history here.</p>
                    <Link href="/student/exams"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">
                        Go to Exams
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {attempts.map((a) => {
                        const st = STATUS_CONFIG[a.status];
                        const accColor = a.accuracy >= 75 ? "text-emerald-600" : a.accuracy >= 55 ? "text-amber-600" : "text-rose-600";
                        const accBg = a.accuracy >= 75 ? "bg-emerald-50" : a.accuracy >= 55 ? "bg-amber-50" : "bg-rose-50";
                        return (
                            <div key={a.id} className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden hover:border-indigo-100 transition-all duration-300 group">
                                <div className="flex flex-col lg:flex-row lg:items-center gap-8 p-8 md:p-10">
                                    {/* Accuracy badge */}
                                    <div className={cn("shrink-0 w-20 h-20 rounded-lg flex flex-col items-center justify-center transition-all duration-300 shadow-sm border border-black/5", accBg)}>
                                        {a.status === "abandoned"
                                            ? <span className="text-3xl opacity-80">💤</span>
                                            : <>
                                                <span className={cn("text-2xl font-bold   tracking-tight", accColor)}>{a.accuracy}%</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">Score</span>
                                            </>}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-4 flex-wrap mb-4">
                                            <span className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border", st.color)}>
                                                <span className={cn("w-2 h-2 rounded-full", st.dot)} />
                                                {st.label}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-70 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">{a.subject}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-xl leading-none truncate   tracking-tight group-hover:text-indigo-600 transition-colors">{a.seriesTitle}</h3>

                                        {a.status === "completed" && (
                                            <div className="flex items-center gap-5 mt-4 text-[10px] font-bold text-slate-400 flex-wrap uppercase tracking-[0.1em]">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-emerald-500 font-bold text-xs">✓</span> {a.correct}/{a.total} Correct
                                                </div>
                                                <div className="h-1 w-1 rounded-full bg-slate-200" />
                                                <div className="flex items-center gap-2">
                                                    <span className="text-indigo-500 font-bold text-xs">⏱</span> {a.durationUsedMinutes}m Duration
                                                </div>
                                                <div className="h-1 w-1 rounded-full bg-slate-200" />
                                                <div className="flex items-center gap-2">
                                                    <span className="text-amber-500 font-bold text-xs">⚡</span> +{a.xpEarned} XP
                                                </div>
                                                <span className="ml-auto text-slate-300 opacity-70   tracking-normal font-medium">{a.attemptedAt}</span>
                                            </div>
                                        )}
                                        {a.status === "abandoned" && (
                                            <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-[0.15em] flex items-center gap-2"><span className="w-1.5 h-px bg-slate-300" /> Attempt Abandoned · <span className="  tracking-normal opacity-70 font-medium">{a.attemptedAt}</span></p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-4 shrink-0">
                                        {a.status === "completed" && (
                                            <Link href={`/student/results/${a.id}`}
                                                className="flex items-center gap-2 px-6 py-3.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 group/btn">
                                                View Results <ArrowRight size={16} weight="bold" className="group-hover/btn:translate-x-1 transition-transform" />
                                            </Link>
                                        )}
                                        {(a.status === "abandoned" || a.status === "in-progress") && (
                                            <Link href={`/exam/war-room?examId=${a.examId}`}
                                                className="flex items-center gap-2 px-6 py-3.5 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-100 transition-all border border-amber-100 shadow-sm active:scale-95">
                                                {a.status === "in-progress" ? "Resume" : "Retry"}
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* Topic breakdown — expanded inline */}
                                {a.topicBreakdown.length > 0 && a.status === "completed" && (
                                    <details className="border-t border-slate-50 group/details">
                                        <summary className="px-8 py-4 text-[10px] font-bold text-indigo-600 cursor-pointer hover:bg-indigo-50/50 transition-all select-none list-none flex items-center justify-between uppercase tracking-widest">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">📊</span> Detailed Breakdown
                                            </div>
                                            <span className="text-slate-300 group-open/details:rotate-180 transition-transform duration-300">▼</span>
                                        </summary>
                                        <div className="bg-slate-50/30 px-10 pb-10 pt-8">
                                            <div className="grid lg:grid-cols-2 gap-12">
                                                <div className="space-y-6">
                                                    <div className="space-y-1">
                                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance by Topic</h4>
                                                        <p className="text-lg font-bold   text-slate-900 tracking-tight">Topic-wise accuracy</p>
                                                    </div>
                                                    <div className="space-y-5">
                                                        {a.topicBreakdown.map((t) => {
                                                            const col = t.accuracy >= 75 ? "text-emerald-500" : t.accuracy >= 55 ? "text-amber-500" : "text-rose-500";
                                                            return (
                                                                <div key={t.topic} className="flex items-center gap-5">
                                                                    <span className="text-[11px] font-bold text-slate-700 w-40 shrink-0 truncate uppercase tracking-tight">{t.topic}</span>
                                                                    <AccuracyBar accuracy={t.accuracy} />
                                                                    <span className={cn("text-[11px] font-bold w-10 text-right  ", col)}>{t.accuracy}%</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                {a.weakTopics.length > 0 && (
                                                    <div className="space-y-6">
                                                        <div className="space-y-1">
                                                            <h4 className="text-[10px] font-bold text-rose-400/80 uppercase tracking-widest">Focus Areas</h4>
                                                            <p className="text-lg font-bold   text-slate-900 tracking-tight">Identified Weak Topics</p>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {a.weakTopics.map((topic, i) => (
                                                                <div key={topic} className="flex items-center gap-4 p-4 rounded-lg bg-white border border-rose-50 shadow-sm hover:border-rose-100 transition-all group/vector">
                                                                    <span className="w-7 h-7 rounded-lg bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm">{i + 1}</span>
                                                                    <div>
                                                                        <div className="text-sm font-bold text-slate-950 uppercase tracking-tight">{topic}</div>
                                                                        <div className="text-[10px] text-rose-500 font-bold uppercase tracking-[0.15em] mt-0.5 opacity-80">Needs reinforcement</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </details>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
