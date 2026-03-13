import { getExamResults } from "@/actions/exam-actions";
import { ArrowLeft, ChartLineUp, Target, CheckCircle, XCircle, Clock, Trophy, Star } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SolutionReview, type SolutionAnswer } from "./solution-review";

interface ResultsPageProps {
    params: Promise<{ attemptId: string }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
    const { attemptId } = await params;
    const { success, attempt } = await getExamResults(attemptId);

    if (!success || !attempt) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-6xl">😕</div>
                    <div className="font-black text-xl text-gray-700">Results not found</div>
                    <Link href="/student/history" className="text-indigo-600 font-bold hover:underline text-sm">← Back to History</Link>
                </div>
            </div>
        );
    }

    // ── Computed stats ─────────────────────────────────────────────────────────
    const answers = attempt.answers as unknown as SolutionAnswer[];
    const totalQuestions = answers.length;
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const wrongCount = totalQuestions - correctCount;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Real time taken
    const timeTakenMs = attempt.endTime
        ? new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()
        : 0;
    const timeTakenStr = timeTakenMs > 0
        ? `${Math.floor(timeTakenMs / 60000)}m ${Math.floor((timeTakenMs % 60000) / 1000)}s`
        : "—";

    // Avg time per question
    const avgTimePerQ = totalQuestions > 0
        ? Math.round(answers.reduce((s, a) => s + (a.timeSpent ?? 0), 0) / totalQuestions)
        : 0;

    // XP estimate
    const xpGained = correctCount * 5 + (accuracy >= 80 ? 20 : 0);

    // Topic breakdown
    const topicMap = new Map<string, { correct: number; total: number }>();
    for (const a of answers) {
        const key = a.question.topic ?? a.question.subject ?? "General";
        const e = topicMap.get(key) ?? { correct: 0, total: 0 };
        topicMap.set(key, { correct: e.correct + (a.isCorrect ? 1 : 0), total: e.total + 1 });
    }
    const topicBreakdown = Array.from(topicMap.entries())
        .map(([topic, d]) => ({ topic, accuracy: Math.round((d.correct / d.total) * 100), correct: d.correct, total: d.total }))
        .sort((a, b) => b.accuracy - a.accuracy);

    const weakTopics = topicBreakdown.filter(t => t.accuracy < 60);
    const strongTopics = topicBreakdown.filter(t => t.accuracy >= 80);

    const completedDate = attempt.endTime
        ? new Date(attempt.endTime).toLocaleDateString("en-IN", { dateStyle: "long" })
        : "—";

    const scoreColor = accuracy >= 75 ? "#22c55e" : accuracy >= 55 ? "#f59e0b" : "#ef4444";

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <Link href="/student/history"
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors mb-3">
                            <ArrowLeft size={14} weight="bold" /> Back to History
                        </Link>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{attempt.exam.title}</h1>
                        <p className="text-gray-400 text-sm font-medium mt-1">Completed on {completedDate}</p>
                    </div>
                    <Link href={`/exam/war-room?examId=${attempt.examId}`}
                        className="self-end px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95">
                        🔁 Retry Exam
                    </Link>
                </div>

                {/* ── Score Hero ─────────────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row gap-8 items-center">
                            {/* Score ring */}
                            <div className="relative w-36 h-36 shrink-0">
                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                                    <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor} strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - accuracy / 100)}`}
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black">{accuracy}%</span>
                                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Overall</span>
                                </div>
                            </div>

                            {/* Stat grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                                {[
                                    { icon: <Target size={16} />, label: "Score", value: `${attempt.score}/${attempt.exam.totalMarks}` },
                                    { icon: <CheckCircle size={16} className="text-emerald-400" />, label: "Correct", value: `${correctCount}/${totalQuestions}` },
                                    { icon: <XCircle size={16} className="text-rose-400" />, label: "Wrong", value: wrongCount },
                                    { icon: <Clock size={16} className="text-blue-400" />, label: "Time", value: timeTakenStr },
                                ].map((s) => (
                                    <div key={s.label} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-1.5 text-white/40 mb-2">
                                            {s.icon}
                                            <span className="text-[9px] font-bold uppercase tracking-widest">{s.label}</span>
                                        </div>
                                        <div className="text-xl font-black">{s.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Badges row */}
                        <div className="flex items-center gap-3 flex-wrap mt-5">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30">
                                <span className="text-amber-300 font-black text-sm">⚡ +{xpGained} XP</span>
                            </div>
                            {accuracy === 100 && <span className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-bold">🏆 Perfect Score</span>}
                            {accuracy >= 80 && accuracy < 100 && <span className="px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-200 text-xs font-bold">🎯 High Accuracy</span>}
                            {avgTimePerQ > 0 && avgTimePerQ < 45 && <span className="px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-200 text-xs font-bold">⚡ Speed Demon</span>}
                            {accuracy < 50 && <span className="px-3 py-1.5 rounded-full bg-white/10 text-white/60 text-xs font-bold">💪 Keep Practising</span>}
                        </div>
                    </div>
                </div>

                {/* ── Main: Solution review + Sidebar ────────────────────────── */}
                <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">

                    {/* Solution Review (client component for filter interactivity) */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-black text-gray-900">📋 Solution Review</h2>
                        <SolutionReview answers={answers} />
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-5 sticky top-6">

                        {/* Topic breakdown */}
                        <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <h3 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-sm">
                                <ChartLineUp size={16} className="text-indigo-600" /> Topic Breakdown
                            </h3>
                            {topicBreakdown.length === 0 ? (
                                <p className="text-sm text-gray-400">No topic data.</p>
                            ) : (
                                <div className="space-y-4">
                                    {topicBreakdown.map((t) => {
                                        const color = t.accuracy >= 75 ? "#22c55e" : t.accuracy >= 55 ? "#f59e0b" : "#ef4444";
                                        const tagColor = t.accuracy >= 75 ? "text-green-600" : t.accuracy >= 55 ? "text-amber-600" : "text-rose-500";
                                        const tag = t.accuracy >= 75 ? "Strong" : t.accuracy >= 55 ? "Average" : "Weak";
                                        return (
                                            <div key={t.topic}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-xs font-bold text-gray-700 truncate max-w-[140px]">{t.topic}</span>
                                                    <span className={cn("text-[10px] font-bold", tagColor)}>{tag} · {t.accuracy}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${t.accuracy}%`, backgroundColor: color }} />
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-0.5">{t.correct}/{t.total} correct</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Weak topics: improvement plan */}
                        {weakTopics.length > 0 && (
                            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100">
                                <h3 className="text-sm font-black text-rose-700 mb-3">🎯 Focus On These</h3>
                                <div className="space-y-2">
                                    {weakTopics.map((t, i) => (
                                        <div key={t.topic} className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                                            <div>
                                                <div className="text-xs font-bold text-gray-900">{t.topic}</div>
                                                <div className="text-[10px] text-rose-500">{t.accuracy}% accuracy</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strong topics */}
                        {strongTopics.length > 0 && (
                            <div className="p-5 rounded-2xl bg-green-50 border border-green-100">
                                <h3 className="text-sm font-black text-green-700 mb-3 flex items-center gap-1.5"><Trophy size={13} /> Your Strengths</h3>
                                <div className="flex flex-wrap gap-2">
                                    {strongTopics.map(t => (
                                        <span key={t.topic} className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">{t.topic}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Next steps */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
                            <Star size={18} className="text-amber-400 mb-2" weight="fill" />
                            <div className="font-black mb-1">
                                {accuracy >= 75 ? "Great work! 🎉" : accuracy >= 55 ? "Keep going! 💪" : "More practice needed 📚"}
                            </div>
                            <p className="text-indigo-200 text-xs mb-4">
                                Avg time per question: <strong className="text-white">{avgTimePerQ}s</strong>&nbsp;&nbsp;
                                {avgTimePerQ < 45 ? "⚡ Speed Demon pace!" : avgTimePerQ < 90 ? "Good pace" : "Try to be faster"}
                            </p>
                            <Link href="/student/exams"
                                className="block text-center py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition-all">
                                Practice More →
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
