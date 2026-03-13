"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "@phosphor-icons/react";

// ─── Types ─────────────────────────────────────────────────────────────────────
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
        { key: "all", label: `All (${counts.all})`, active: "bg-indigo-600 text-white", inactive: "bg-gray-100 text-gray-500 hover:bg-gray-200" },
        { key: "wrong", label: `❌ Wrong (${counts.wrong})`, active: "bg-rose-500 text-white", inactive: "bg-gray-100 text-gray-500 hover:bg-rose-50" },
        { key: "correct", label: `✅ Correct (${counts.correct})`, active: "bg-emerald-500 text-white", inactive: "bg-gray-100 text-gray-500 hover:bg-emerald-50" },
    ];

    const optionLetters = ["A", "B", "C", "D", "E"];

    return (
        <div className="space-y-4">
            {/* Filter tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {tabs.map((t) => (
                    <button key={t.key} onClick={() => setFilter(t.key)}
                        className={cn("px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95",
                            filter === t.key ? t.active : t.inactive)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Empty state */}
            {displayed.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="text-4xl mb-2">{filter === "wrong" ? "🎉" : "📭"}</div>
                    <div className="font-bold text-gray-600">
                        {filter === "wrong" ? "No wrong answers — well done!" : "Nothing here."}
                    </div>
                </div>
            )}

            {/* Question cards */}
            {displayed.map((answer, idx) => (
                <div key={answer.id}
                    className={cn("p-6 rounded-2xl bg-white border-2 shadow-sm",
                        answer.isCorrect ? "border-emerald-100" : "border-rose-100")}>
                    <div className="flex items-start gap-4">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0",
                            answer.isCorrect ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                            {idx + 1}
                        </div>

                        <div className="flex-1 space-y-4 min-w-0">
                            {/* Tags */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {answer.question.topic && (
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                                        {answer.question.topic}
                                    </span>
                                )}
                                {answer.question.difficulty && (
                                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold",
                                        answer.question.difficulty === "EASY" ? "bg-green-50 text-green-600" :
                                            answer.question.difficulty === "HARD" ? "bg-rose-50 text-rose-600" :
                                                "bg-amber-50 text-amber-600")}>
                                        {answer.question.difficulty}
                                    </span>
                                )}
                                {answer.timeSpent > 0 && (
                                    <span className="text-[10px] text-gray-400 font-medium">⏱ {answer.timeSpent}s</span>
                                )}
                            </div>

                            {/* Question text */}
                            <p className="font-semibold text-gray-900 leading-relaxed text-sm">{answer.question.text}</p>

                            {/* Options */}
                            <div className="grid sm:grid-cols-2 gap-2">
                                {answer.question.options.map((opt, oi) => {
                                    const isChosen = opt.id === answer.selectedOptionId;
                                    const isCorrect = opt.isCorrect;
                                    return (
                                        <div key={opt.id}
                                            className={cn("p-3 rounded-xl border text-sm font-medium flex items-center justify-between gap-2",
                                                isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                                                    isChosen && !isCorrect ? "bg-rose-50 border-rose-200 text-rose-800" :
                                                        "bg-gray-50 border-gray-100 text-gray-500")}>
                                            <span className="flex items-center gap-2">
                                                <span className={cn("w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center shrink-0",
                                                    isCorrect ? "bg-emerald-500 text-white" :
                                                        isChosen ? "bg-rose-500 text-white" :
                                                            "bg-gray-200 text-gray-500")}>
                                                    {optionLetters[oi] ?? String.fromCharCode(65 + oi)}
                                                </span>
                                                {opt.text}
                                            </span>
                                            {isCorrect && <CheckCircle size={14} weight="fill" className="text-emerald-500 shrink-0" />}
                                            {isChosen && !isCorrect && <XCircle size={14} weight="fill" className="text-rose-500 shrink-0" />}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Explanation */}
                            {answer.question.explanation && (
                                <div className="flex gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                                    <span className="text-indigo-500 shrink-0">💡</span>
                                    <div>
                                        <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Explanation</div>
                                        <p className="text-sm text-gray-700 leading-relaxed">{answer.question.explanation}</p>
                                    </div>
                                </div>
                            )}

                            {/* Unanswered notice */}
                            {!answer.selectedOptionId && (
                                <div className="flex gap-2 items-center p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-400 font-medium">
                                    ⏭ You skipped this question
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* Back CTA */}
            <div className="pt-4 flex gap-3">
                <Link href="/student/exams"
                    className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all text-center shadow-lg shadow-indigo-200">
                    Practice More →
                </Link>
                <Link href="/student/history"
                    className="flex-1 py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all text-center">
                    📋 Full History
                </Link>
            </div>
        </div>
    );
}
