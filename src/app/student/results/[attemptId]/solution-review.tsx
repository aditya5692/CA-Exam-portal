"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

export interface SolutionAnswer {
    id: string;
    questionId: string;
    selectedOptionId: string | null;
    isCorrect: boolean;
    timeSpent: number;
    question: {
        text: string;
        explanation: string | null;
        difficulty: string | null;
        subject: string | null;
        topic: string | null;
        options: { id: string; text: string; isCorrect: boolean }[];
    };
}

type FilterTab = "all" | "wrong" | "correct";

export function SolutionReview({ answers }: { answers: SolutionAnswer[] }) {
    const [filter, setFilter] = useState<FilterTab>("all");

    const counts = {
        all: answers.length,
        wrong: answers.filter((a) => !a.isCorrect).length,
        correct: answers.filter((a) => a.isCorrect).length,
    };

    const displayed =
        filter === "all" ? answers :
            filter === "wrong" ? answers.filter((a) => !a.isCorrect) :
                answers.filter((a) => a.isCorrect);

    const tabs: { key: FilterTab; label: string; active: string; inactive: string }[] = [
        { key: "all", label: `All (${counts.all})`, active: "student-tab-active border-[var(--student-border)] text-[var(--student-accent-strong)]", inactive: "bg-[var(--student-panel-muted)] text-[var(--student-muted)] hover:bg-[var(--student-panel-solid)]" },
        { key: "wrong", label: `Wrong (${counts.wrong})`, active: "bg-[var(--student-destructive)] text-white border-[var(--student-destructive)] shadow-[0_12px_24px_rgba(220,38,38,0.18)]", inactive: "bg-[var(--student-panel-muted)] text-[var(--student-muted)] hover:bg-[var(--student-destructive-soft)]" },
        { key: "correct", label: `Correct (${counts.correct})`, active: "bg-[var(--student-accent-strong)] text-white border-[var(--student-accent-strong)] shadow-[0_12px_24px_rgba(31,92,80,0.18)]", inactive: "bg-[var(--student-panel-muted)] text-[var(--student-muted)] hover:bg-[var(--student-accent-soft)]" },
    ];

    const optionLetters = ["A", "B", "C", "D", "E"];

    return (
        <div className="space-y-4">
            <div className="mb-6 flex flex-wrap items-center gap-3">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setFilter(t.key)}
                        className={cn(
                            "rounded-xl border px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95",
                            filter === t.key ? t.active : `${t.inactive} border-[var(--student-border)]`
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {displayed.length === 0 && (
                <div className="student-surface rounded-2xl py-16 text-center">
                    <div className="mb-2 text-4xl">{filter === "wrong" ? "Clear" : "Empty"}</div>
                    <div className="font-bold text-[var(--student-muted-strong)]">
                        {filter === "wrong" ? "No wrong answers in this set." : "Nothing to review in this filter."}
                    </div>
                </div>
            )}

            {displayed.map((answer, idx) => (
                <div
                    key={answer.id}
                    className={cn(
                        "student-surface rounded-[28px] p-6 transition-all duration-300",
                        !answer.isCorrect && "border-[var(--student-destructive-soft-strong)]"
                    )}
                >
                    <div className="flex items-start gap-4">
                        <div
                            className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold shadow-inner",
                                answer.isCorrect
                                    ? "border-[var(--student-success-soft-strong,var(--student-border-strong))] bg-[var(--student-success-soft,var(--student-panel-muted))] text-[var(--student-success)]"
                                    : "border-[var(--student-destructive-soft-strong)] bg-[var(--student-destructive-soft)] text-[var(--student-destructive)]"
                            )}
                        >
                            {idx + 1}
                        </div>

                        <div className="min-w-0 flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                {answer.question.topic && (
                                    <span className="student-chip rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                                        {answer.question.topic}
                                    </span>
                                )}
                                {answer.question.difficulty && (
                                    <span
                                        className={cn(
                                            "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                                            answer.question.difficulty === "EASY"
                                                ? "border-[var(--student-success-soft-strong,var(--student-border-strong))] bg-[var(--student-success-soft,var(--student-panel-muted))] text-[var(--student-success)]"
                                                : answer.question.difficulty === "HARD"
                                                    ? "border-[var(--student-destructive-soft-strong)] bg-[var(--student-destructive-soft)] text-[var(--student-destructive)]"
                                                    : "border-[var(--student-support-soft-strong)] bg-[var(--student-support-soft)] text-[var(--student-support)]"
                                        )}
                                    >
                                        {answer.question.difficulty}
                                    </span>
                                )}
                                {answer.timeSpent > 0 && (
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                                        Time: {answer.timeSpent}s
                                    </span>
                                )}
                            </div>

                            <p className="font-outfit text-lg font-bold leading-relaxed tracking-tight text-[var(--student-text)]">
                                {answer.question.text}
                            </p>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {answer.question.options.map((opt, oi) => {
                                    const isChosen = opt.id === answer.selectedOptionId;
                                    const isCorrect = opt.isCorrect;

                                    return (
                                        <div
                                            key={opt.id}
                                            className={cn(
                                                "flex items-center justify-between gap-3 rounded-xl border p-4 text-sm font-bold transition-all",
                                                isCorrect
                                                    ? "border-[var(--student-success-soft-strong,var(--student-border-strong))] bg-[var(--student-success-soft,var(--student-panel-muted))] text-[var(--student-success)] shadow-sm"
                                                    : isChosen && !isCorrect
                                                        ? "border-[var(--student-destructive-soft-strong)] bg-[var(--student-destructive-soft)] text-[var(--student-destructive)] shadow-sm"
                                                        : "border-[var(--student-border)] bg-[var(--student-panel-solid)] text-[var(--student-muted-strong)]"
                                            )}
                                        >
                                            <span className="flex items-center gap-3">
                                                <span
                                                    className={cn(
                                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold shadow-sm",
                                                        isCorrect
                                                            ? "bg-[var(--student-success)] text-white"
                                                            : isChosen
                                                                ? "bg-[var(--student-destructive)] text-white"
                                                                : "bg-[var(--student-panel-muted)] text-[var(--student-muted)]"
                                                    )}
                                                >
                                                    {optionLetters[oi] ?? String.fromCharCode(65 + oi)}
                                                </span>
                                                {opt.text}
                                            </span>
                                            {isCorrect && <CheckCircle size={18} weight="fill" className="shrink-0 text-[var(--student-success)]" />}
                                            {isChosen && !isCorrect && <XCircle size={18} weight="fill" className="shrink-0 text-[var(--student-destructive)]" />}
                                        </div>
                                    );
                                })}
                            </div>

                            {answer.question.explanation && (
                                <div className="rounded-2xl border border-[var(--student-accent-soft-strong)] bg-[var(--student-accent-soft)] p-5">
                                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--student-accent-strong)]">
                                        Explanation
                                    </div>
                                    <p className="text-base font-medium leading-relaxed text-[var(--student-text)]">
                                        {answer.question.explanation}
                                    </p>
                                </div>
                            )}

                            {!answer.selectedOptionId && (
                                <div className="rounded-xl border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-4 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                                    Not answered
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            <div className="flex gap-4 pt-8">
                <Link
                    href="/student/exams"
                    className="student-button-primary flex-1 rounded-xl px-4 py-4 text-center text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                    Start Next Exam
                </Link>
                <Link
                    href="/student/analytics"
                    className="student-button-secondary flex-1 rounded-xl px-4 py-4 text-center text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                    View Analytics
                </Link>
            </div>
        </div>
    );
}
