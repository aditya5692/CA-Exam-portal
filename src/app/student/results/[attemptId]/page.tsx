import { getExamResults } from "@/actions/exam-actions";
import { ArrowLeft, ChartLineUp, Target, CheckCircle, XCircle, Clock, Trophy, Star, Calendar } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SolutionReview, type SolutionAnswer } from "./solution-review";
import { getCurrentUser } from "@/lib/auth/session";

interface ResultsPageProps {
    params: Promise<{ attemptId: string }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
    const user = await getCurrentUser(["STUDENT", "ADMIN"]);
    const { attemptId } = await params;
    const { success, data: attempt } = await getExamResults(attemptId);

    if (!success || !attempt) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-6xl">😕</div>
                    <div className="font-black text-xl text-gray-700">Results not found</div>
                    <Link href="/student/analytics" className="text-indigo-600 font-bold hover:underline text-sm">← Back to Analytics</Link>
                </div>
            </div>
        );
    }

    let daysToExam = 0;
    const userTarget = user?.examTarget || "";
    if (userTarget) {
        const months = { "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11 };
        const parts = userTarget.split(" ");
        if (parts.length >= 2) {
            const moPartRaw = parts[parts.length - 2].substring(0, 3).toLowerCase();
            const moKey = Object.keys(months).find(k => k.toLowerCase() === moPartRaw);
            const yrPart = parseInt(parts[parts.length - 1]);
            if (moKey && !isNaN(yrPart)) {
                const targetDate = new Date(yrPart, months[moKey as keyof typeof months], 1);
                const now = new Date();
                const diffTime = targetDate.getTime() - now.getTime();
                daysToExam = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }
        }
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

    const titleParts = attempt.exam.title.split(" ");
    const lastWord = titleParts.pop();
    const mainTitle = titleParts.join(" ");

    return (
        <div className="min-h-screen bg-[#f8fafc] font-outfit">
            <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">

                {/* Standardized Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                    <div className="space-y-4">
                        <Link href="/student/analytics"
                            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-all group/back mb-1">
                            <ArrowLeft size={16} weight="bold" className="group-hover/back:-translate-x-1 transition-transform" /> Back to Performance
                        </Link>
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Assessment Report</span>
                        </div>
                        <h1 className="font-outfit tracking-tighter leading-tight text-3xl md:text-4xl font-black text-slate-900">
                            {mainTitle} <span className="text-indigo-600">{lastWord}</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-base font-sans max-w-2xl leading-relaxed">
                            Comprehensive diagnostic report for the assessment completed on <span className="text-slate-900">{completedDate}</span>.
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4 shrink-0 mb-1">
                        {daysToExam > 0 && (
                            <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-slate-100 text-slate-900 font-bold text-[10px] uppercase tracking-widest border border-slate-200 shadow-sm pointer-events-none">
                                <Calendar size={18} weight="bold" className="text-indigo-500" />
                                Next Goal: {daysToExam} Days
                            </div>
                        )}
                        <Link href={`/exam/war-room?examId=${attempt.examId}`}
                            className="px-8 py-4 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-indigo-900/5 active:scale-95">
                            Retake Exam
                        </Link>
                    </div>
                </div>

                {/* ── Score Hero ─────────────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-2xl shadow-xl bg-slate-900 p-8 text-white">
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
                                    <span className="text-3xl font-bold">{accuracy}%</span>
                                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Score</span>
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
                                    <div key={s.label} className="p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-1.5 text-white/40 mb-2">
                                            {s.icon}
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
                                        </div>
                                        <div className="text-xl font-bold">{s.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Badges row */}
                        <div className="flex items-center gap-3 flex-wrap mt-5">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <span className="text-amber-200 font-bold text-xs uppercase tracking-widest">⚡ +{xpGained} XP</span>
                            </div>
                            {accuracy === 100 && <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-100 text-[10px] font-bold uppercase tracking-widest">🏆 Perfect</span>}
                            {accuracy >= 80 && accuracy < 100 && <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 text-[10px] font-bold uppercase tracking-widest">🎯 Accurate</span>}
                            {avgTimePerQ > 0 && avgTimePerQ < 45 && <span className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-100 text-[10px] font-bold uppercase tracking-widest">⚡ Fast</span>}
                            {accuracy < 50 && <span className="px-3 py-1.5 rounded-full bg-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest">💪 Practice</span>}
                        </div>
                    </div>
                </div>

                {/* ── Main: Solution review + Sidebar ────────────────────────── */}
                <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">

                    {/* Solution Review (client component for filter interactivity) */}
                    <div className="space-y-4">
                        <h2 className="font-outfit tracking-tight">Solution Review</h2>
                        <SolutionReview answers={answers} />
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-5 sticky top-6">

                        {/* Topic breakdown */}
                        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm group">
                            <h3 className="font-bold font-outfit text-slate-900 mb-6 flex items-center gap-2.5 text-[10px] uppercase tracking-widest">
                                <ChartLineUp size={20} weight="bold" className="text-indigo-600 opacity-60 group-hover:scale-110 transition-transform" /> Topic Breakdown
                            </h3>
                            {topicBreakdown.length === 0 ? (
                                <p className="text-sm text-slate-400">No topic data.</p>
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
                            <div className="p-5 rounded-[20px] bg-rose-50 border border-rose-100">
                                <h3 className="text-sm font-bold font-outfit text-rose-700 mb-3">🎯 Focus On These</h3>
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
                        <div className="p-10 rounded-2xl bg-slate-900 text-white shadow-xl relative overflow-hidden group/cta">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/cta:scale-110 transition-transform duration-700">
                                <Star size={80} weight="fill" />
                            </div>
                            <div className="relative z-10">
                                <Star size={24} className="text-indigo-400 mb-4" weight="fill" />
                                <div className="font-bold text-2xl font-outfit mb-2 tracking-tight">
                                    {accuracy >= 75 ? "Excellent Work!" : accuracy >= 55 ? "Keep it up!" : "Need more practice."}
                                </div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6 leading-relaxed">
                                    Average time: <strong className="text-white">{avgTimePerQ}s / question</strong>
                                </p>
                                <Link href="/student/exams"
                                    className="block text-center py-4 rounded-xl bg-white text-slate-950 font-bold text-[10px] uppercase tracking-widest hover:bg-white shadow-lg active:scale-95 transition-all">
                                    Try Next Exam
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
