import { getExamResults } from "@/actions/exam-actions";
import { StudentPageHeader } from "@/components/student/shared/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import { buildNegativeMarkingSnapshot, ICAI_NEGATIVE_MARKING_PENALTY } from "@/lib/exam/insights";
import { resolveStudentExamTarget } from "@/lib/student-level";
import { cn } from "@/lib/utils";
import { ArrowLeft,ChartLineUp,CheckCircle,Clock,Star,Target,Trophy,XCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { SolutionReview,type SolutionAnswer } from "./solution-review";

interface ResultsPageProps {
    params: Promise<{ attemptId: string }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
    const user = await getCurrentUser(["STUDENT", "ADMIN"]);
    const { attemptId } = await params;
    const { success, data: attempt } = await getExamResults(attemptId);

    if (!success || !attempt) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--student-bg)]">
                <div className="text-center space-y-4">
                    <div className="text-6xl">😕</div>
                    <div className="font-black text-xl text-[var(--student-text)]">Results not found</div>
                    <Link href="/student/analytics" className="text-[var(--student-accent)] font-bold hover:underline text-sm">← Back to Analytics</Link>
                </div>
            </div>
        );
    }

    const examTarget = resolveStudentExamTarget(user ?? {});

    // ── Computed stats ─────────────────────────────────────────────────────────
    const answers = attempt.answers as unknown as SolutionAnswer[];
    const totalQuestions = answers.length;
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const wrongCount = answers.filter((a) => Boolean(a.selectedOptionId) && !a.isCorrect).length;
    const skippedCount = answers.filter((a) => !a.selectedOptionId).length;
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
    const taggedReasonItems = [
        {
            key: "CONCEPTUAL",
            label: "Conceptual Error",
            helper: "Law or concept needs revision",
            count: answers.filter((answer) => !answer.isCorrect && answer.gapTag === "CONCEPTUAL").length,
            badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
            barClass: "bg-blue-500",
        },
        {
            key: "SILLY",
            label: "Silly Mistake",
            helper: "Keywords and cues were rushed",
            count: answers.filter((answer) => !answer.isCorrect && answer.gapTag === "SILLY").length,
            badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
            barClass: "bg-amber-500",
        },
        {
            key: "TIME",
            label: "Time Pressure",
            helper: "Speed forced a low-conviction attempt",
            count: answers.filter((answer) => !answer.isCorrect && answer.gapTag === "TIME").length,
            badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
            barClass: "bg-rose-500",
        },
    ]
        .filter((item) => item.count > 0)
        .sort((left, right) => right.count - left.count);
    const taggedWrongCount = taggedReasonItems.reduce((sum, item) => sum + item.count, 0);
    const untaggedWrongCount = Math.max(0, wrongCount - taggedWrongCount);
    const topReason = taggedReasonItems[0] ?? null;
    const negativeMarking = buildNegativeMarkingSnapshot({
        actualScore: attempt.score,
        wrongAttemptedCount: wrongCount,
        riskyWrongCount: wrongCount,
        passingMarks: attempt.exam.passingMarks,
    });

    const completedDate = attempt.endTime
        ? new Date(attempt.endTime).toLocaleDateString("en-IN", { dateStyle: "long" })
        : "—";

    const scoreColor = accuracy >= 75 ? "var(--student-success)" : accuracy >= 55 ? "var(--student-support)" : "var(--student-destructive)";

    const titleParts = attempt.exam.title.split(" ");
    const lastWord = titleParts.pop();
    const mainTitle = titleParts.join(" ");

    return (
        <div className="min-h-screen bg-[var(--student-bg)] font-outfit">
            <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">

                {/* Standardized Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                    <div className="space-y-4">
                        <Link href="/student/analytics"
                            className="group/back mb-1 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)] transition-all hover:text-[var(--student-accent-strong)]">
                            <ArrowLeft size={16} weight="bold" className="transition-transform group-hover/back:-translate-x-1" /> Back to Performance
                        </Link>
                        <StudentPageHeader
                            eyebrow="Assessment report"
                            title={mainTitle}
                            accent={lastWord}
                            description={
                                <>
                                    Comprehensive diagnostic report for the assessment completed on{" "}
                                    <span className="font-semibold text-[var(--student-text)]">{completedDate}</span>.
                                </>
                            }
                            aside={
                                <div className="mb-1 flex flex-col items-center gap-4 md:flex-row">
                                    {examTarget.daysToExam > 0 && (
                                        <div className="student-chip inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-semibold">
                                            <span className="h-2 w-2 rounded-full bg-[var(--student-support)]" />
                                            Next milestone in {examTarget.daysToExam} days
                                        </div>
                                    )}
                                    <Link href={`/exam/war-room?examId=${attempt.examId}`} className="student-button-primary rounded-xl px-8 py-4 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95">
                                        Retake Exam
                                    </Link>
                                </div>
                            }
                        />
                    </div>
                </div>

                {/* ── Score Hero ─────────────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-2xl shadow-xl bg-[var(--student-accent-strong)] p-8 text-white">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
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
                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="student-surface rounded-[28px] p-6 md:p-8">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                                    Negative Marking Simulator
                                </div>
                                <h2 className="font-outfit text-2xl font-bold tracking-tight text-[var(--student-text)]">
                                    ICAI penalty preview
                                </h2>
                                <p className="max-w-2xl text-sm leading-7 text-[var(--student-muted-strong)]">
                                    This simulation applies {ICAI_NEGATIVE_MARKING_PENALTY} mark deduction for every wrong attempt while keeping skipped questions neutral.
                                </p>
                            </div>
                            <div className="inline-flex items-center rounded-full border border-[var(--student-support-soft-strong)] bg-[var(--student-support-soft)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--student-support)]">
                                Penalty active: -{ICAI_NEGATIVE_MARKING_PENALTY}
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {[
                                {
                                    label: "Raw Score",
                                    value: `${attempt.score}/${attempt.exam.totalMarks}`,
                                    helper: `${correctCount} correct · ${skippedCount} skipped`,
                                },
                                {
                                    label: "With Penalty",
                                    value: `${negativeMarking.negativeMarkedScore}/${attempt.exam.totalMarks}`,
                                    helper: `${wrongCount} wrong attempts cost ${negativeMarking.penaltyLoss} marks`,
                                },
                                {
                                    label: "If You Had Skipped",
                                    value: `${negativeMarking.skipRecoveryScore}/${attempt.exam.totalMarks}`,
                                    helper: wrongCount > 0
                                        ? `Skipping those ${wrongCount} wrong attempts saves ${negativeMarking.recoveredMarks} marks`
                                        : "No risky attempts to recover",
                                },
                            ].map((item) => (
                                <div key={item.label} className="rounded-[24px] border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-5">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                                        {item.label}
                                    </div>
                                    <div className="mt-3 text-2xl font-bold text-[var(--student-text)]">
                                        {item.value}
                                    </div>
                                    <div className="mt-2 text-xs leading-6 text-[var(--student-muted-strong)]">
                                        {item.helper}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 rounded-[24px] border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-5">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                                What-if coaching note
                            </div>
                            <p className="mt-3 text-sm leading-7 text-[var(--student-text)]">
                                {wrongCount > 0 ? (
                                    <>
                                        With ICAI-style negative marking enabled, your score would move from{" "}
                                        <span className="font-bold">{attempt.score}</span> to{" "}
                                        <span className="font-bold">{negativeMarking.negativeMarkedScore}</span>. If you had skipped those{" "}
                                        {wrongCount} wrong attempts, the same paper lands at{" "}
                                        <span className="font-bold">{negativeMarking.skipRecoveryScore}</span>.
                                    </>
                                ) : (
                                    <>
                                        You avoided all penalty traps in this attempt. Every attempted answer was either correct or strategically skipped.
                                    </>
                                )}
                            </p>
                            {attempt.exam.passingMarks > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="rounded-full border border-[var(--student-border)] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted-strong)]">
                                        Pass line: {attempt.exam.passingMarks}
                                    </span>
                                    <span className={cn(
                                        "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                                        negativeMarking.wouldPassUnderPenalty
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            : "border-rose-200 bg-rose-50 text-rose-700",
                                    )}>
                                        {negativeMarking.wouldPassUnderPenalty ? "Still above pass line" : "Falls below pass line"}
                                    </span>
                                    {wrongCount > 0 && (
                                        <span className={cn(
                                            "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                                            negativeMarking.wouldPassAfterRecovery
                                                ? "border-[var(--student-support-soft-strong)] bg-[var(--student-support-soft)] text-[var(--student-support)]"
                                                : "border-[var(--student-border)] bg-white text-[var(--student-muted-strong)]",
                                        )}>
                                            {negativeMarking.wouldPassAfterRecovery
                                                ? "Skipping restores the pass line"
                                                : "Skipping helps, but more concept work is still needed"}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="student-surface rounded-[28px] p-6 md:p-8">
                        <div className="space-y-2">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                                Why Marks Were Lost
                            </div>
                            <h2 className="font-outfit text-2xl font-bold tracking-tight text-[var(--student-text)]">
                                Self-diagnosis for this paper
                            </h2>
                            <p className="text-sm leading-7 text-[var(--student-muted-strong)]">
                                Tag each miss below so the dashboard learns whether the leak came from concepts, careless reading, or time pressure.
                            </p>
                        </div>

                        <div className="mt-6 space-y-4">
                            {wrongCount === 0 && (
                                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium leading-7 text-emerald-800">
                                    No incorrect attempts here. Your review can focus on speed and maintaining the same discipline in case-study bundles.
                                </div>
                            )}

                            {wrongCount > 0 && taggedReasonItems.length === 0 && (
                                <div className="rounded-[24px] border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-5 text-sm leading-7 text-[var(--student-muted-strong)]">
                                    Start tagging the wrong answers in the solution review below. This panel will turn into a pattern report as soon as you label them.
                                </div>
                            )}

                            {taggedReasonItems.map((item) => {
                                const width = wrongCount > 0 ? Math.max(10, Math.round((item.count / wrongCount) * 100)) : 0;

                                return (
                                    <div key={item.key} className="rounded-[24px] border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className={cn("inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest", item.badgeClass)}>
                                                    {item.label}
                                                </div>
                                                <div className="text-xs text-[var(--student-muted-strong)]">
                                                    {item.helper}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-[var(--student-text)]">{item.count}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                                                    {wrongCount > 0 ? Math.round((item.count / wrongCount) * 100) : 0}% of misses
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                                            <div className={cn("h-full rounded-full", item.barClass)} style={{ width: `${width}%` }} />
                                        </div>
                                    </div>
                                );
                            })}

                            {untaggedWrongCount > 0 && (
                                <div className="rounded-[24px] border border-dashed border-[var(--student-border)] bg-white p-4 text-sm leading-7 text-[var(--student-muted-strong)]">
                                    {untaggedWrongCount} wrong answer{untaggedWrongCount === 1 ? "" : "s"} still need{untaggedWrongCount === 1 ? "s" : ""} a reason tag.
                                </div>
                            )}

                            {topReason && (
                                <div className="rounded-[24px] border border-[var(--student-accent-soft-strong)] bg-[var(--student-accent-soft)] p-5 text-sm leading-7 text-[var(--student-text)]">
                                    <span className="font-bold">{topReason.label}</span> is the biggest leak in this attempt.
                                    {topReason.key === "SILLY" && " The concept may already be there, but the final read of words like correct, incorrect, except, and not needs more patience."}
                                    {topReason.key === "CONCEPTUAL" && " Revisit the underlying section before the retake, because speed alone will not fix these misses."}
                                    {topReason.key === "TIME" && " Practice skipping low-conviction questions earlier and coming back after locking easier marks."}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">

                    {/* Solution Review (client component for filter interactivity) */}
                    <div className="space-y-4">
                        <h2 className="font-outfit tracking-tight text-[var(--student-text)]">Solution Review</h2>
                        <SolutionReview answers={answers} />
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-5 sticky top-6">

                        {/* Topic breakdown */}
                        <div className="p-6 rounded-2xl bg-[var(--student-panel)] border border-[var(--student-border)] shadow-sm group">
                            <h3 className="font-bold font-outfit text-[var(--student-text)] mb-6 flex items-center gap-2.5 text-[10px] uppercase tracking-widest">
                                <ChartLineUp size={20} weight="bold" className="text-[var(--student-accent)] opacity-60 group-hover:scale-110 transition-transform" /> Topic Breakdown
                            </h3>
                            {topicBreakdown.length === 0 ? (
                                <p className="text-sm text-[var(--student-muted)]">No topic data.</p>
                            ) : (
                                <div className="space-y-4">
                                    {topicBreakdown.map((t) => {
                                        const color = t.accuracy >= 75 ? "var(--student-success)" : t.accuracy >= 55 ? "var(--student-support)" : "var(--student-destructive)";
                                        const tagColor = t.accuracy >= 75 ? "text-[var(--student-success)]" : t.accuracy >= 55 ? "text-[var(--student-support)]" : "text-[var(--student-destructive)]";
                                        const tag = t.accuracy >= 75 ? "Strong" : t.accuracy >= 55 ? "Average" : "Weak";
                                        return (
                                            <div key={t.topic}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-xs font-bold text-[var(--student-text)] truncate max-w-[140px]">{t.topic}</span>
                                                    <span className={cn("text-[10px] font-bold", tagColor)}>{tag} · {t.accuracy}%</span>
                                                </div>
                                                <div className="h-2 bg-[var(--student-panel-muted)] rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${t.accuracy}%`, backgroundColor: color }} />
                                                </div>
                                                <div className="text-[10px] text-[var(--student-muted)] mt-0.5">{t.correct}/{t.total} correct</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Weak topics: improvement plan */}
                        {weakTopics.length > 0 && (
                            <div className="p-5 rounded-[20px] bg-[var(--student-destructive-soft)] border border-[var(--student-destructive-soft-strong)]">
                                <h3 className="text-sm font-bold font-outfit text-[var(--student-destructive)] mb-3">🎯 Focus On These</h3>
                                <div className="space-y-2">
                                    {weakTopics.map((t, i) => (
                                        <div key={t.topic} className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-[var(--student-destructive)] text-white text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                                            <div>
                                                <div className="text-xs font-bold text-[var(--student-text)]">{t.topic}</div>
                                                <div className="text-[10px] text-[var(--student-destructive)]">{t.accuracy}% accuracy</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strong topics */}
                        {strongTopics.length > 0 && (
                            <div className="p-5 rounded-2xl bg-[var(--student-accent-soft)] border border-[var(--student-accent-soft-strong)]">
                                <h3 className="text-sm font-bold text-[var(--student-accent)] mb-3 flex items-center gap-1.5"><Trophy size={13} /> Your Strengths</h3>
                                <div className="flex flex-wrap gap-2">
                                    {strongTopics.map(t => (
                                        <span key={t.topic} className="px-2 py-1 rounded-full bg-[var(--student-accent-soft-strong)] text-[var(--student-accent-strong)] text-xs font-bold">{t.topic}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Next steps */}
                        <div className="p-10 rounded-2xl bg-[var(--student-accent-strong)] text-white shadow-xl relative overflow-hidden group/cta">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/cta:scale-110 transition-transform duration-700">
                                <Star size={80} weight="fill" />
                            </div>
                            <div className="relative z-10">
                                <Star size={24} className="text-[var(--student-support)] mb-4" weight="fill" />
                                <div className="font-bold text-2xl font-outfit mb-2 tracking-tight">
                                    {accuracy >= 75 ? "Excellent Work!" : accuracy >= 55 ? "Keep it up!" : "Need more practice."}
                                </div>
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-6 leading-relaxed">
                                    Average time: <strong className="text-white">{avgTimePerQ}s / question</strong>
                                </p>
                                <Link href="/student/exams"
                                    className="block text-center py-4 rounded-xl bg-white text-[var(--student-accent-strong)] font-bold text-[10px] uppercase tracking-widest hover:bg-white shadow-lg active:scale-95 transition-all">
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
