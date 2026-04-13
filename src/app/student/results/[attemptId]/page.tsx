import { getExamResults, getExamPeerBenchmarks } from "@/actions/exam-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { computeAttemptSpeedSummary, formatSeconds } from "@/lib/server/peer-benchmarking";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    MinusCircle,
    Target,
    XCircle,
    Timer,
    TrendUp,
    TrendDown,
    Minus,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SolutionReview, type SolutionAnswer } from "./solution-review";
import type { BenchmarkMap } from "@/lib/server/peer-benchmarking";

interface ResultsPageProps {
    params: Promise<{ attemptId: string }>;
}

function formatDuration(startTime: Date, endTime: Date | null) {
    if (!endTime) return "-";
    const totalSeconds = Math.max(
        0,
        Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000),
    );
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
}

/* Peer speed comparison panel */
function SpeedBenchmarkPanel({
    yourAvgTime,
    peerAvgTime,
    passingAvgTime,
    percentDiff,
    respondents,
}: {
    yourAvgTime: number;
    peerAvgTime: number;
    passingAvgTime: number | null;
    percentDiff: number | null;
    respondents: number;
}) {
    const isFaster = percentDiff !== null && percentDiff < 0;
    const isSlower = percentDiff !== null && percentDiff > 0;
    const isEqual = percentDiff !== null && percentDiff === 0;

    const speedLabel = isFaster
        ? `${Math.abs(percentDiff!)}% faster than passing average`
        : isSlower
        ? `${percentDiff}% slower than passing average`
        : isEqual
        ? "Right at the passing pace"
        : "Not enough peer data yet";

    const speedColor = isFaster
        ? "text-emerald-700"
        : isSlower
        ? "text-rose-700"
        : "text-amber-700";

    const speedBg = isFaster
        ? "bg-emerald-50 border-emerald-200"
        : isSlower
        ? "bg-rose-50 border-rose-200"
        : "bg-amber-50 border-amber-200";

    const SpeedIcon = isFaster ? TrendUp : isSlower ? TrendDown : Minus;

    return (
        <div className={cn("rounded-lg border p-6 shadow-sm", speedBg)}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                    <Timer size={16} weight="fill" />
                    Speed vs Peers
                </div>
                {respondents > 0 && (
                    <span className="text-[10px] font-semibold text-[var(--student-muted)]">
                        {respondents} student{respondents !== 1 ? "s" : ""} compared
                    </span>
                )}
            </div>

            {/* Your time vs peer time */}
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--student-muted)]">Your pace</div>
                    <div className="mt-1 text-3xl font-black tracking-tight text-[var(--student-text)]">{formatSeconds(yourAvgTime)}</div>
                    <div className="mt-0.5 text-xs font-semibold text-[var(--student-muted-strong)]">avg per question</div>
                </div>
                {peerAvgTime > 0 && (
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--student-muted)]">All students</div>
                        <div className="mt-1 text-3xl font-black tracking-tight text-[var(--student-text)]">{formatSeconds(peerAvgTime)}</div>
                        <div className="mt-0.5 text-xs font-semibold text-[var(--student-muted-strong)]">avg per question</div>
                    </div>
                )}
                {passingAvgTime != null && (
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--student-muted)]">Passing students</div>
                        <div className="mt-1 text-3xl font-black tracking-tight text-[var(--student-text)]">{formatSeconds(passingAvgTime)}</div>
                        <div className="mt-0.5 text-xs font-semibold text-[var(--student-muted-strong)]">avg per question</div>
                    </div>
                )}
            </div>

            {/* Verdict */}
            <div className={cn("mt-5 flex items-center gap-2 rounded-lg border px-4 py-3", speedBg)}>
                <SpeedIcon size={18} weight="fill" className={speedColor} />
                <span className={cn("text-sm font-black", speedColor)}>{speedLabel}</span>
            </div>

            {respondents === 0 && (
                <p className="mt-3 text-xs font-semibold text-[var(--student-muted)]">
                    Be one of the first to complete this exam! Peer benchmarks will appear as more students attempt it.
                </p>
            )}
        </div>
    );
}

export default async function ResultsPage({ params }: ResultsPageProps) {
    const user = await getCurrentUser(["STUDENT", "ADMIN"]);
    if (!user) {
        redirect("/auth/login");
    }

    const { attemptId } = await params;
    const { success, data: attempt } = await getExamResults(attemptId);

    if (!success || !attempt) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--student-bg)]">
                <div className="space-y-4 text-center">
                    <div className="text-5xl font-black text-[var(--student-text)]">404</div>
                    <div className="text-lg font-bold text-[var(--student-text)]">Result review not found.</div>
                    <Link
                        href="/student/analytics"
                        className="text-sm font-semibold text-[var(--student-accent-strong)] hover:underline"
                    >
                        Back to analytics
                    </Link>
                </div>
            </div>
        );
    }

    // Fetch peer benchmarks (non-blocking — gracefully empty if no data)
    const { data: benchmarks = {} } = await getExamPeerBenchmarks(attempt.examId);

    const answers = attempt.answers as unknown as SolutionAnswer[];
    const totalQuestions = answers.length;
    const correctCount = answers.filter((answer) => answer.isCorrect).length;
    const wrongCount = answers.filter((answer) => Boolean(answer.selectedOptionId) && !answer.isCorrect).length;
    const skippedCount = answers.filter((answer) => !answer.selectedOptionId).length;
    const attemptedCount = totalQuestions - skippedCount;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const timeTaken = formatDuration(attempt.startTime, attempt.endTime);
    const submittedOn = attempt.endTime
        ? new Date(attempt.endTime).toLocaleString("en-IN", {
            dateStyle: "long",
            timeStyle: "short",
        })
        : "Not submitted";
    const scorePercent = attempt.exam.totalMarks > 0
        ? Math.round((attempt.score / attempt.exam.totalMarks) * 100)
        : accuracy;
    const passed = attempt.exam.passingMarks > 0
        ? attempt.score >= attempt.exam.passingMarks
        : accuracy >= 50;

    // Speed benchmark summary
    const speedSummary = computeAttemptSpeedSummary(
        answers.map((a) => ({ questionId: a.questionId, timeSpent: a.timeSpent })),
        benchmarks as BenchmarkMap,
    );

    // Count how many benchmark data points exist
    const benchmarkRespondents = Object.values(benchmarks as BenchmarkMap).reduce(
        (max, bm) => Math.max(max, bm.respondents),
        0,
    );

    const questionStatuses = answers.map((answer, index) => ({
        number: index + 1,
        status: !answer.selectedOptionId
            ? "skipped"
            : answer.isCorrect
                ? "correct"
                : "wrong",
    }));

    return (
        <div className="min-h-screen bg-[var(--student-bg)]">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-4">
                            <Link
                                href="/student/analytics"
                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)] transition-colors hover:text-[var(--student-accent-strong)]"
                            >
                                <ArrowLeft size={16} weight="bold" />
                                Back to analytics
                            </Link>

                            <div className="space-y-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                    Exam result review
                                </div>
                                <h1 className="text-3xl font-black tracking-tight text-[var(--student-text)] md:text-4xl">
                                    {attempt.exam.title}
                                </h1>
                                <p className="max-w-3xl text-sm leading-7 text-[var(--student-muted-strong)]">
                                    Review every marked answer exactly as it appeared in the attempt, compare your choice
                                    against the correct option, and use the navigator to jump question by question.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={`/exam/war-room?examId=${attempt.examId}`}
                                className="student-button-primary rounded-lg px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em]"
                            >
                                Retake exam
                            </Link>
                            <Link
                                href="/student/exams"
                                className="student-button-secondary rounded-lg px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em]"
                            >
                                More exams
                            </Link>
                        </div>
                    </div>

                    {/* Score Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        {[
                            {
                                label: "Score",
                                value: `${attempt.score}/${attempt.exam.totalMarks}`,
                                helper: `${scorePercent}% overall`,
                                icon: <Target size={18} weight="fill" className="text-[var(--student-accent-strong)]" />,
                            },
                            {
                                label: "Correct",
                                value: String(correctCount),
                                helper: `${accuracy}% accuracy`,
                                icon: <CheckCircle size={18} weight="fill" className="text-emerald-600" />,
                            },
                            {
                                label: "Wrong",
                                value: String(wrongCount),
                                helper: `${attemptedCount} attempted`,
                                icon: <XCircle size={18} weight="fill" className="text-rose-600" />,
                            },
                            {
                                label: "Skipped",
                                value: String(skippedCount),
                                helper: `${totalQuestions} total questions`,
                                icon: <MinusCircle size={18} weight="fill" className="text-amber-600" />,
                            },
                            {
                                label: "Time Taken",
                                value: timeTaken,
                                helper: submittedOn,
                                icon: <Clock size={18} weight="fill" className="text-blue-600" />,
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="rounded-lg border border-[var(--student-border)] bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                    {item.icon}
                                    {item.label}
                                </div>
                                <div className="mt-4 text-3xl font-black tracking-tight text-[var(--student-text)]">
                                    {item.value}
                                </div>
                                <div className="mt-2 text-xs font-semibold leading-6 text-[var(--student-muted-strong)]">
                                    {item.helper}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Peer Speed Benchmark Panel — always show, gracefully handles no data */}
                    {speedSummary.yourAvgTime > 0 && (
                        <SpeedBenchmarkPanel
                            yourAvgTime={speedSummary.yourAvgTime}
                            peerAvgTime={speedSummary.peerAvgTime}
                            passingAvgTime={speedSummary.passingAvgTime}
                            percentDiff={speedSummary.percentDiff}
                            respondents={benchmarkRespondents}
                        />
                    )}
                </div>

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-w-0 rounded-lg border border-[var(--student-border)] bg-white p-5 md:p-8">
                        <SolutionReview answers={answers} benchmarks={benchmarks as BenchmarkMap} />
                    </div>

                    <aside className="space-y-5 lg:sticky lg:top-6">
                        <div className="rounded-lg border border-[var(--student-border)] bg-white p-6 shadow-sm">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                Attempt snapshot
                            </div>
                            <div className="mt-4 space-y-4">
                                <div className={cn(
                                    "inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]",
                                    passed
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-rose-200 bg-rose-50 text-rose-700",
                                )}>
                                    {passed ? "Above target" : "Needs another revision pass"}
                                </div>

                                <div className="space-y-3 text-sm text-[var(--student-muted-strong)]">
                                    <div className="flex items-start justify-between gap-4">
                                        <span>Submitted</span>
                                        <span className="text-right font-semibold text-[var(--student-text)]">{submittedOn}</span>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <span>Subject</span>
                                        <span className="text-right font-semibold text-[var(--student-text)]">
                                            {attempt.exam.subject || "General"}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <span>Chapter</span>
                                        <span className="text-right font-semibold text-[var(--student-text)]">
                                            {(attempt.exam as any).chapter || "Mixed"}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <span>Exam type</span>
                                        <span className="text-right font-semibold text-[var(--student-text)]">
                                            {attempt.exam.examType || "General"}
                                        </span>
                                    </div>
                                    {attempt.exam.passingMarks > 0 && (
                                        <div className="flex items-start justify-between gap-4">
                                            <span>Passing marks</span>
                                            <span className="text-right font-semibold text-[var(--student-text)]">
                                                {attempt.exam.passingMarks}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-[var(--student-border)] bg-white p-6 shadow-sm">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                Question legend
                            </div>
                            <div className="mt-4 space-y-3 text-sm font-semibold text-[var(--student-text)]">
                                <div className="flex items-center gap-3">
                                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                                    Correct answer
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="h-3 w-3 rounded-full bg-rose-500" />
                                    Wrong answer
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                                    Not answered
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-[var(--student-border)] bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                    Question navigator
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--student-muted)]">
                                    {totalQuestions} questions
                                </span>
                            </div>

                            <div className="mt-5 grid grid-cols-5 gap-2">
                                {questionStatuses.map((item) => (
                                    <a
                                        key={item.number}
                                        href={`#review-question-${item.number}`}
                                        className={cn(
                                            "flex h-11 items-center justify-center rounded-lg border text-sm font-black transition-all hover:-translate-y-0.5",
                                            item.status === "correct" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                                            item.status === "wrong" && "border-rose-200 bg-rose-50 text-rose-700",
                                            item.status === "skipped" && "border-amber-200 bg-amber-50 text-amber-700",
                                        )}
                                    >
                                        {item.number}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
