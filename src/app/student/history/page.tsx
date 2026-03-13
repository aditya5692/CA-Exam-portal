import Link from "next/link";
import { getStudentHistory } from "@/actions/student-actions";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

// ─── Sub-components ────────────────────────────────────────────────────────────

function AccuracyBar({ accuracy }: { accuracy: number }) {
    const color = accuracy >= 75 ? "#22c55e" : accuracy >= 55 ? "#f59e0b" : "#ef4444";
    return (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex-1">
            <div className="h-full rounded-full" style={{ width: `${accuracy}%`, backgroundColor: color }} />
        </div>
    );
}

const STATUS_CONFIG = {
    completed: { label: "Completed", color: "bg-green-50 text-green-600 border border-green-100", dot: "bg-green-500" },
    "in-progress": { label: "In Progress", color: "bg-amber-50 text-amber-600 border border-amber-100", dot: "bg-amber-500 animate-pulse" },
    abandoned: { label: "Abandoned", color: "bg-gray-100 text-gray-500 border border-gray-200", dot: "bg-gray-400" },
} as const;

const BADGE_CATALOG: Record<string, { emoji: string; label: string; desc: string }> = {
    PERFECT_SCORE: { emoji: "🏆", label: "Perfect Score", desc: "100% in a series" },
    HIGH_ACCURACY: { emoji: "🎯", label: "High Accuracy", desc: "80%+ in a series" },
    WEEK_STREAK: { emoji: "🔥", label: "Week Streak", desc: "7 consecutive days" },
    SPEED_DEMON: { emoji: "⚡", label: "Speed Demon", desc: "Avg < 45s/question" },
};

// ─── Main page (server component) ─────────────────────────────────────────────

export default async function StudentHistoryPage() {
    const res = await getStudentHistory();

    // If no data yet, show an empty state rather than crashing
    const data = res.data;
    const profile = data?.profile;
    const attempts = data?.attempts ?? [];
    const subjectAccuracy = data?.subjectAccuracy ?? [];

    const hasData = !!profile;
    const xpPercent = hasData
        ? Math.min(Math.round((profile.totalXP / profile.xpToNextLevel) * 100), 100)
        : 0;

    // AI summary: best and worst subject
    const best = [...subjectAccuracy].sort((a, b) => b.accuracy - a.accuracy)[0];
    const worst = [...subjectAccuracy].sort((a, b) => a.accuracy - b.accuracy)[0];

    // Subject list for filter (used client-side — just pre-populate for display)
    const subjects = Array.from(new Set(attempts.map((a) => a.subject)));

    return (
        <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* ── Hero metrics banner ──────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white">
                <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-16 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
                            {hasData ? profile.caLevel : "CA Student"}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white/10 text-white/50 text-[10px] font-bold uppercase tracking-widest">
                            {hasData ? `${profile.joinedDaysAgo} days on platform` : "New Member"}
                        </span>
                    </div>

                    <h1 className="text-3xl font-black font-outfit tracking-tight mb-1">
                        {hasData ? `${profile.name}'s` : "Your"} Learning Journey
                    </h1>
                    <p className="text-white/40 text-sm font-medium mb-8">
                        All your MCQ attempts, results, and adaptive progress in one place.
                    </p>

                    {/* Key metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
                        {[
                            { label: "Total Attempts", value: hasData ? profile.totalAttempts : "—", sub: "series done" },
                            { label: "Avg Accuracy", value: hasData ? `${profile.avgAccuracy}%` : "—", sub: "all time" },
                            { label: "Correct Answers", value: hasData ? profile.totalCorrect : "—", sub: hasData ? `of ~${profile.totalQuestions}` : "" },
                            { label: "Day Streak", value: hasData ? `🔥 ${profile.streak}` : "—", sub: hasData ? `best ${profile.longestStreak}` : "" },
                            { label: "Total XP", value: hasData ? `⚡ ${profile.totalXP}` : "—", sub: hasData ? `Level ${profile.level}` : "" },
                            { label: "Subjects Covered", value: subjectAccuracy.length || "—", sub: "subjects attempted" },
                        ].map((m) => (
                            <div key={m.label} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                <div className="text-xl font-black font-outfit text-white">{m.value}</div>
                                <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">{m.label}</div>
                                <div className="text-[10px] text-white/50 font-medium mt-0.5">{m.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* XP Level bar */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 shrink-0">
                            {hasData ? profile.level : "1"}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-bold text-white">Level {hasData ? profile.level : 1}</span>
                                <span className="text-xs text-white/40">
                                    {hasData ? `${profile.totalXP} / ${profile.xpToNextLevel} XP to Level ${profile.level + 1}` : "Attempt your first series to earn XP"}
                                </span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                                    style={{ width: `${xpPercent}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Badges ────────────────────────────────────────────────────── */}
            {hasData && profile.badges.length > 0 && (
                <div>
                    <h2 className="text-base font-black text-gray-900 font-outfit mb-4">🏅 Earned Badges</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {profile.badges.map((badgeId) => {
                            const b = BADGE_CATALOG[badgeId] ?? { emoji: "🎖", label: badgeId, desc: "" };
                            return (
                                <div key={badgeId} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                    <span className="text-2xl">{b.emoji}</span>
                                    <div>
                                        <div className="font-bold text-sm text-gray-900">{b.label}</div>
                                        <div className="text-[10px] text-gray-400 font-medium">{b.desc}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Subject accuracy heatmap ───────────────────────────────── */}
            {subjectAccuracy.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-black text-gray-900 font-outfit mb-5">📊 Subject-wise Accuracy</h2>
                    <div className="space-y-4">
                        {subjectAccuracy.map((s) => {
                            const col = s.accuracy >= 75 ? "text-green-600" : s.accuracy >= 55 ? "text-amber-600" : "text-rose-600";
                            const fill = s.accuracy >= 75 ? "#22c55e" : s.accuracy >= 55 ? "#f59e0b" : "#ef4444";
                            return (
                                <div key={s.subject} className="flex items-center gap-4">
                                    <div className="w-52 shrink-0">
                                        <div className="text-xs font-bold text-gray-700 truncate">{s.subject}</div>
                                        <div className="text-[10px] text-gray-400">{s.attempts} topic{s.attempts !== 1 ? "s" : ""} covered</div>
                                    </div>
                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${s.accuracy}%`, backgroundColor: fill }} />
                                    </div>
                                    <span className={cn("w-10 text-right text-sm font-black", col)}>{s.accuracy}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Attempt history ───────────────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
                    <h2 className="text-base font-black text-gray-900 font-outfit">📋 Attempt History
                        <span className="ml-2 text-gray-400 font-normal text-sm">({attempts.length})</span>
                    </h2>
                </div>

                {attempts.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="text-5xl mb-4">📭</div>
                        <div className="font-bold text-gray-600 text-lg">No attempts yet</div>
                        <div className="text-sm mt-2 mb-6">Start a series from the MCQ Practice Hub to see your history here.</div>
                        <Link href="/student/exams"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                            Go to MCQ Practice Hub →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {attempts.map((a) => {
                            const st = STATUS_CONFIG[a.status];
                            const accColor = a.accuracy >= 75 ? "text-green-600" : a.accuracy >= 55 ? "text-amber-600" : "text-rose-600";
                            const accBg = a.accuracy >= 75 ? "bg-green-50" : a.accuracy >= 55 ? "bg-amber-50" : "bg-rose-50";
                            return (
                                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                    <div className="flex items-start gap-4 p-5">
                                        {/* Accuracy badge */}
                                        <div className={cn("shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center", accBg)}>
                                            {a.status === "abandoned"
                                                ? <span className="text-2xl">💤</span>
                                                : <>
                                                    <span className={cn("text-lg font-black font-outfit", accColor)}>{a.accuracy}%</span>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase">Accuracy</span>
                                                </>}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold", st.color)}>
                                                    <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                                                    {st.label}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{a.subject}</span>
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-sm leading-snug truncate">{a.seriesTitle}</h3>

                                            {a.status === "completed" && (
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                                                    <span>✅ {a.correct}/{a.total} correct</span>
                                                    <span>⏱ {a.durationUsedMinutes}m used</span>
                                                    <span>⚡ +{a.xpEarned} XP</span>
                                                    <span className="ml-auto text-gray-300">{a.attemptedAt}</span>
                                                </div>
                                            )}
                                            {a.status === "abandoned" && (
                                                <p className="text-xs text-gray-400 mt-1">Not submitted · {a.attemptedAt}</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {a.status === "completed" && (
                                                <>
                                                    <Link href={`/student/results/${a.id}`}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[11px] font-bold hover:bg-indigo-100 transition-all border border-indigo-100">
                                                        📝 Review Solutions
                                                    </Link>
                                                </>
                                            )}
                                            {(a.status === "abandoned" || a.status === "in-progress") && (
                                                <Link href={`/exam/war-room?examId=${a.examId}`}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-[11px] font-bold hover:bg-amber-100 transition-all border border-amber-100">
                                                    🔁 {a.status === "in-progress" ? "Resume" : "Retry"}
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Topic breakdown — expanded inline */}
                                    {a.topicBreakdown.length > 0 && a.status === "completed" && (
                                        <details className="border-t border-gray-100">
                                            <summary className="px-5 py-3 text-xs font-bold text-indigo-600 cursor-pointer hover:bg-indigo-50/30 transition-all select-none list-none flex items-center gap-1">
                                                📊 View topic breakdown
                                            </summary>
                                            <div className="bg-gray-50/50 px-5 pb-5 pt-4">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Topic Performance</h4>
                                                        <div className="space-y-2.5">
                                                            {a.topicBreakdown.map((t) => {
                                                                const col = t.accuracy >= 75 ? "text-green-600" : t.accuracy >= 55 ? "text-amber-600" : "text-rose-500";
                                                                return (
                                                                    <div key={t.topic} className="flex items-center gap-3">
                                                                        <span className="text-xs font-medium text-gray-700 w-36 shrink-0 truncate">{t.topic}</span>
                                                                        <AccuracyBar accuracy={t.accuracy} />
                                                                        <span className={cn("text-xs font-black w-9 text-right", col)}>{t.accuracy}%</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                    {a.weakTopics.length > 0 && (
                                                        <div>
                                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Improvement Plan</h4>
                                                            <div className="space-y-2">
                                                                {a.weakTopics.map((topic, i) => (
                                                                    <div key={topic} className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100">
                                                                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                                                                        <div>
                                                                            <div className="text-xs font-bold text-gray-900">{topic}</div>
                                                                            <div className="text-[10px] text-rose-500 font-medium">Queued for next adaptive series</div>
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

            {/* ── AI Summary callout ─────────────────────────────────────── */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between gap-6 flex-wrap">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">AI Summary</div>
                    {best && worst && best.subject !== worst.subject ? (
                        <>
                            <div className="font-black font-outfit text-lg">
                                You&apos;re strongest in {best.subject} ({best.accuracy}%) 🎉
                            </div>
                            <div className="text-sm text-white/50 mt-0.5">
                                Focus on {worst.subject} ({worst.accuracy}%) to improve your overall rank.
                            </div>
                        </>
                    ) : attempts.length === 0 ? (
                        <div className="font-black font-outfit text-lg">Ready to start? 🚀</div>
                    ) : (
                        <div className="font-black font-outfit text-lg">Keep practising to unlock AI insights! 📚</div>
                    )}
                </div>
                <Link href="/student/analytics"
                    className="shrink-0 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-sm transition-all">
                    Full Analytics →
                </Link>
            </div>
        </div>
    );
}
