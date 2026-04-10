"use client";

import { updateStudentAnswerGapTag } from "@/actions/exam-actions";
import { cn } from "@/lib/utils";
import { CheckCircle, Info, Timer, Warning, XCircle, ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { BenchmarkMap } from "@/lib/server/peer-benchmarking";

function fmtSeconds(seconds: number): string {
    if (seconds <= 0) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}

export interface SolutionAnswer {
    id: string;
    questionId: string;
    selectedOptionId: string | null;
    isCorrect: boolean;
    timeSpent: number;
    gapTag?: string | null;
    question: {
        text: string;
        explanation: string | null;
        difficulty: string | null;
        subject: string | null;
        topic: string | null;
        caseStudy?: {
            id: string;
            title: string;
            content: string;
        } | null;
        options: { id: string; text: string; isCorrect: boolean }[];
    };
}

type FilterTab = "all" | "wrong" | "correct" | "skipped";

function getStatusMeta(answer: SolutionAnswer) {
    if (!answer.selectedOptionId) {
        return {
            label: "Not answered",
            badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
            cardClass: "border-amber-100",
        };
    }

    if (answer.isCorrect) {
        return {
            label: "Correct",
            badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
            cardClass: "border-emerald-100",
        };
    }

    return {
        label: "Wrong",
        badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
        cardClass: "border-rose-100",
    };
}

export function SolutionReview({ answers, benchmarks = {} }: { answers: SolutionAnswer[]; benchmarks?: BenchmarkMap }) {
    const [filter, setFilter] = useState<FilterTab>("all");
    const router = useRouter();

    const numberedAnswers = useMemo(
        () => answers.map((answer, index) => ({ answer, questionNumber: index + 1 })),
        [answers],
    );

    const counts = {
        all: answers.length,
        wrong: answers.filter((answer) => answer.selectedOptionId && !answer.isCorrect).length,
        correct: answers.filter((answer) => answer.isCorrect).length,
        skipped: answers.filter((answer) => !answer.selectedOptionId).length,
    };

    const displayed = numberedAnswers.filter(({ answer }) => {
        if (filter === "wrong") {
            return Boolean(answer.selectedOptionId) && !answer.isCorrect;
        }

        if (filter === "correct") {
            return answer.isCorrect;
        }

        if (filter === "skipped") {
            return !answer.selectedOptionId;
        }

        return true;
    });

    const tabs: { key: FilterTab; label: string; active: string; inactive: string }[] = [
        {
            key: "all",
            label: `All (${counts.all})`,
            active: "student-tab-active border-[var(--student-border)] text-[var(--student-accent-strong)]",
            inactive: "bg-[var(--student-panel-muted)] text-[var(--student-muted)] hover:bg-[var(--student-panel-solid)]",
        },
        {
            key: "wrong",
            label: `Wrong (${counts.wrong})`,
            active: "bg-[var(--student-destructive)] text-white border-[var(--student-destructive)]",
            inactive: "bg-[var(--student-panel-muted)] text-[var(--student-muted)] hover:bg-[var(--student-destructive-soft)]",
        },
        {
            key: "correct",
            label: `Correct (${counts.correct})`,
            active: "bg-[var(--student-success)] text-white border-[var(--student-success)]",
            inactive: "bg-[var(--student-panel-muted)] text-[var(--student-muted)] hover:bg-[var(--student-success-soft)]",
        },
        {
            key: "skipped",
            label: `Skipped (${counts.skipped})`,
            active: "bg-[var(--student-support)] text-white border-[var(--student-support)]",
            inactive: "bg-[var(--student-panel-muted)] text-[var(--student-muted)] hover:bg-[var(--student-support-soft)]",
        },
    ];

    const optionLetters = ["A", "B", "C", "D", "E"];

    async function handleTagUpdate(answerId: string, tag: string | null) {
        const result = await updateStudentAnswerGapTag(answerId, tag);
        if (result.success) {
            toast.success("Review tag saved.");
            router.refresh();
            return;
        }

        toast.error(result.message);
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                    Question by question review
                </div>
                <h2 className="text-2xl font-black tracking-tight text-[var(--student-text)]">
                    Compare your marked option with the correct answer
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-[var(--student-muted-strong)]">
                    The review keeps the original question order intact so you can replay the attempt exactly as you saw it.
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={cn(
                            "rounded-xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95",
                            filter === tab.key ? tab.active : `${tab.inactive} border-[var(--student-border)]`,
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {displayed.length === 0 && (
                <div className="rounded-[28px] border border-[var(--student-border)] bg-[var(--student-panel-muted)] py-14 text-center">
                    <div className="text-lg font-black text-[var(--student-text)]">Nothing in this filter.</div>
                    <div className="mt-2 text-sm text-[var(--student-muted-strong)]">
                        Switch filters to review another set of questions.
                    </div>
                </div>
            )}

            <div className="space-y-5">
                {displayed.map(({ answer, questionNumber }) => {
                    const status = getStatusMeta(answer);

                    return (
                        <article
                            id={`review-question-${questionNumber}`}
                            key={answer.id}
                            className={cn(
                                "scroll-mt-24 rounded-[28px] border bg-white p-6 shadow-sm",
                                status.cardClass,
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--student-border)] bg-[var(--student-panel-muted)] text-sm font-black text-[var(--student-text)]">
                                    {questionNumber}
                                </div>

                                <div className="min-w-0 flex-1 space-y-5">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={cn(
                                                "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
                                                status.badgeClass,
                                            )}>
                                                {status.label}
                                            </span>
                                            {answer.question.topic && (
                                                <span className="rounded-full border border-[var(--student-border)] bg-[var(--student-panel-muted)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--student-muted-strong)]">
                                                    {answer.question.topic}
                                                </span>
                                            )}
                                            {answer.question.difficulty && (
                                                <span className="rounded-full border border-[var(--student-border)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--student-muted)]">
                                                    {answer.question.difficulty}
                                                </span>
                                            )}
                                            {answer.timeSpent > 0 && (() => {
                                                const bm = benchmarks[answer.questionId];
                                                const yourTime = answer.timeSpent;
                                                // Per-question peer chip
                                                if (!bm || bm.respondents < 2) {
                                                    // Only show your time
                                                    return (
                                                        <span className="rounded-full border border-[var(--student-border)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--student-muted)]">
                                                            <Timer size={11} className="inline mb-0.5 mr-1" />{fmtSeconds(yourTime)}
                                                        </span>
                                                    );
                                                }
                                                const peerAvg = bm.avgTimePassing ?? bm.avgTimeAll;
                                                const diff = Math.round(((yourTime - peerAvg) / peerAvg) * 100);
                                                const isFaster = diff < -5;
                                                const isSlower = diff > 10;
                                                return (
                                                    <>
                                                        <span className="rounded-full border border-[var(--student-border)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--student-muted)]">
                                                            <Timer size={11} className="inline mb-0.5 mr-1" />You: {fmtSeconds(yourTime)}
                                                        </span>
                                                        <span className={cn(
                                                            "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
                                                            isFaster ? "border-emerald-200 bg-emerald-50 text-emerald-700" : isSlower ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700"
                                                        )}>
                                                            {isFaster ? <ArrowLeft size={11} className="inline mb-0.5 mr-0.5" /> : isSlower ? <ArrowRight size={11} className="inline mb-0.5 mr-0.5" /> : null}
                                                            Avg: {fmtSeconds(peerAvg)}{isFaster ? ` · ${Math.abs(diff)}% faster` : isSlower ? ` · ${diff}% slower` : " · On pace"}
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        {answer.question.subject && (
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                                {answer.question.subject}
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-lg font-black leading-relaxed tracking-tight text-[var(--student-text)]">
                                        {answer.question.text}
                                    </p>

                                    {answer.question.caseStudy && (
                                        <div className="rounded-[24px] border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-5">
                                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                                <span className="rounded-full bg-[var(--student-accent-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--student-accent-strong)]">
                                                    Case study
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--student-muted)]">
                                                    {answer.question.caseStudy.title}
                                                </span>
                                            </div>
                                            <div className="space-y-3 text-sm leading-7 text-[var(--student-text)]">
                                                {answer.question.caseStudy.content.split("\n").map((paragraph, index) =>
                                                    paragraph.trim() ? <p key={index}>{paragraph}</p> : null,
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid gap-3 lg:grid-cols-2">
                                        {answer.question.options.map((option, optionIndex) => {
                                            const isChosen = option.id === answer.selectedOptionId;
                                            const isCorrectOption = option.isCorrect;

                                            return (
                                                <div
                                                    key={option.id}
                                                    className={cn(
                                                        "rounded-2xl border p-4 transition-all",
                                                        isCorrectOption
                                                            ? "border-emerald-200 bg-emerald-50"
                                                            : isChosen
                                                                ? "border-rose-200 bg-rose-50"
                                                                : "border-[var(--student-border)] bg-[var(--student-panel-solid)]",
                                                    )}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={cn(
                                                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                                                            isCorrectOption
                                                                ? "bg-emerald-600 text-white"
                                                                : isChosen
                                                                    ? "bg-rose-600 text-white"
                                                                    : "bg-[var(--student-panel-muted)] text-[var(--student-muted)]",
                                                        )}>
                                                            {optionLetters[optionIndex] ?? String.fromCharCode(65 + optionIndex)}
                                                        </div>

                                                        <div className="min-w-0 flex-1 space-y-3">
                                                            <div className="text-sm font-semibold leading-6 text-[var(--student-text)]">
                                                                {option.text}
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {isChosen && (
                                                                    <span className={cn(
                                                                        "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em]",
                                                                        isCorrectOption
                                                                            ? "border-emerald-200 bg-white text-emerald-700"
                                                                            : "border-rose-200 bg-white text-rose-700",
                                                                    )}>
                                                                        Your answer
                                                                    </span>
                                                                )}
                                                                {isCorrectOption && (
                                                                    <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">
                                                                        Correct answer
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {isCorrectOption && (
                                                            <CheckCircle size={18} weight="fill" className="shrink-0 text-emerald-600" />
                                                        )}
                                                        {isChosen && !isCorrectOption && (
                                                            <XCircle size={18} weight="fill" className="shrink-0 text-rose-600" />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {!answer.selectedOptionId && (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                                            You did not mark an option for this question.
                                        </div>
                                    )}

                                    {answer.question.explanation && (
                                        <div className="rounded-2xl border border-[var(--student-accent-soft-strong)] bg-[var(--student-accent-soft)] p-5">
                                            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--student-accent-strong)]">
                                                Explanation
                                            </div>
                                            <p className="text-sm leading-7 text-[var(--student-text)]">
                                                {answer.question.explanation}
                                            </p>
                                        </div>
                                    )}

                                    {!answer.isCorrect && answer.selectedOptionId && (
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                                    Why did this go wrong?
                                                </div>
                                                {answer.gapTag && (
                                                    <button
                                                        onClick={() => handleTagUpdate(answer.id, null)}
                                                        className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 hover:text-rose-600"
                                                    >
                                                        Clear tag
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    {
                                                        id: "CONCEPTUAL",
                                                        label: "Conceptual error",
                                                        icon: <Info size={14} weight="bold" />,
                                                        inactive: "border-blue-200 bg-blue-50 text-blue-700",
                                                        active: "border-blue-600 bg-blue-600 text-white",
                                                    },
                                                    {
                                                        id: "SILLY",
                                                        label: "Silly mistake",
                                                        icon: <Warning size={14} weight="bold" />,
                                                        inactive: "border-amber-200 bg-amber-50 text-amber-700",
                                                        active: "border-amber-600 bg-amber-600 text-white",
                                                    },
                                                    {
                                                        id: "TIME",
                                                        label: "Time pressure",
                                                        icon: <Timer size={14} weight="bold" />,
                                                        inactive: "border-rose-200 bg-rose-50 text-rose-700",
                                                        active: "border-rose-600 bg-rose-600 text-white",
                                                    },
                                                ].map((tag) => (
                                                    <button
                                                        key={tag.id}
                                                        onClick={() => handleTagUpdate(answer.id, tag.id)}
                                                        className={cn(
                                                            "flex items-center gap-2 rounded-xl border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all active:scale-95",
                                                            answer.gapTag === tag.id
                                                                ? tag.active
                                                                : `${tag.inactive} hover:shadow-sm`,
                                                        )}
                                                    >
                                                        {tag.icon}
                                                        {tag.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
