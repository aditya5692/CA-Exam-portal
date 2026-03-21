"use client";

import { cn } from "@/lib/utils";
import { CheckCircle,XCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

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
        { key: "all", label: `All (${counts.all})`, active: "bg-slate-900 text-white", inactive: "bg-slate-100 text-slate-500 hover:bg-slate-200" },
        { key: "wrong", label: `Wrong (${counts.wrong})`, active: "bg-rose-500 text-white", inactive: "bg-slate-100 text-slate-500 hover:bg-rose-50" },
        { key: "correct", label: `Correct (${counts.correct})`, active: "bg-emerald-500 text-white", inactive: "bg-slate-100 text-slate-500 hover:bg-emerald-50" },
    ];

    const optionLetters = ["A", "B", "C", "D", "E"];

    return (
        <div className="space-y-4">
            {/* Filter tabs */}
            <div className="flex items-center gap-3 flex-wrap mb-6">
                {tabs.map((t) => (
                    <button key={t.key} onClick={() => setFilter(t.key)}
                        className={cn("px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-sm border",
                            filter === t.key ? t.active + " border-transparent" : t.inactive + " border-slate-100")}>
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
                    className={cn("p-6 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-300",
                        !answer.isCorrect && "border-rose-100")}>
                    <div className="flex items-start gap-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-inner border border-black/5",
                            answer.isCorrect ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                            {idx + 1}
                        </div>

                        <div className="flex-1 space-y-4 min-w-0">
                            {/* Tags */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {answer.question.topic && (
                                    <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-100">
                                        {answer.question.topic}
                                    </span>
                                )}
                                {answer.question.difficulty && (
                                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                                        answer.question.difficulty === "EASY" ? "bg-emerald-50 text-emerald-600/80 border-emerald-100" :
                                            answer.question.difficulty === "HARD" ? "bg-rose-50 text-rose-600/80 border-rose-100" :
                                                "bg-amber-50 text-amber-600/80 border-amber-100")}>
                                        {answer.question.difficulty}
                                    </span>
                                )}
                                {answer.timeSpent > 0 && (
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">⏱ Time: {answer.timeSpent}s</span>
                                )}
                            </div>

                            {/* Question text */}
                            <p className="font-bold text-slate-900 leading-relaxed text-lg font-outfit tracking-tight">{answer.question.text}</p>

                            {/* Options */}
                            <div className="grid sm:grid-cols-2 gap-3">
                                {answer.question.options.map((opt, oi) => {
                                    const isChosen = opt.id === answer.selectedOptionId;
                                    const isCorrect = opt.isCorrect;
                                    return (
                                        <div key={opt.id}
                                            className={cn("p-4 rounded-xl border text-sm font-bold flex items-center justify-between gap-3 transition-all",
                                                isCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm" :
                                                    isChosen && !isCorrect ? "bg-rose-50 border-rose-100 text-rose-700 shadow-sm" :
                                                        "bg-white border-slate-100 text-slate-500 hover:border-slate-200")}>
                                            <span className="flex items-center gap-3">
                                                <span className={cn("w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm",
                                                    isCorrect ? "bg-emerald-500 text-white" :
                                                        isChosen ? "bg-rose-500 text-white" :
                                                            "bg-slate-100 text-slate-400")}>
                                                    {optionLetters[oi] ?? String.fromCharCode(65 + oi)}
                                                </span>
                                                {opt.text}
                                            </span>
                                            {isCorrect && <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0" />}
                                            {isChosen && !isCorrect && <XCircle size={18} weight="fill" className="text-rose-500 shrink-0" />}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Explanation */}
                            {answer.question.explanation && (
                                <div className="flex gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                    <span className="text-xl shrink-0">💡</span>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 opacity-70">Explanation</div>
                                        <p className="text-base text-slate-700 font-medium leading-relaxed font-sans">{answer.question.explanation}</p>
                                    </div>
                                </div>
                            )}

                            {/* Unanswered notice */}
                            {!answer.selectedOptionId && (
                                <div className="flex gap-3 items-center p-4 rounded-xl bg-slate-50 border border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                                    Not Answered
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* Back CTA */}
            <div className="pt-8 flex gap-4">
                <Link href="/student/exams"
                    className="flex-1 py-4 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all text-center shadow-lg active:scale-95">
                    Start Next Exam
                </Link>
                <Link href="/student/analytics"
                    className="flex-1 py-4 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all text-center active:scale-95 shadow-sm">
                    View Analytics
                </Link>
            </div>
        </div>
    );
}
