"use client";

import { useEffect } from "react";
import { useExamStore } from "@/store/exam-store";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Flag, Timer, CheckCircle, Warning } from "@phosphor-icons/react";

export function ExamEngine() {
    const {
        questions,
        currentQuestionIndex,
        answers,
        setCurrentQuestion,
        setAnswer,
        timeRemaining,
        tick,
        status
    } = useExamStore();

    useEffect(() => {
        if (status !== "running") return;
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [status, tick]);

    const currentQuestion = questions[currentQuestionIndex];

    if (!currentQuestion) return (
        <div className="flex items-center justify-center min-h-[400px] text-white/40">
            Loading test data...
        </div>
    );

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <header className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                        <Timer size={20} weight="bold" className="text-blue-400" />
                        <span className="font-mono text-xl font-bold text-white tracking-tighter">{formatTime(timeRemaining)}</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="text-white/40 text-xs font-bold uppercase tracking-widest">
                        Progress: <span className="text-white ml-2">{Object.keys(answers).length} / {questions.length}</span>
                    </div>
                </div>

                <button className="px-6 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-sm hover:bg-rose-500/20 transition-all">
                    End Test
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
                <div className="space-y-6">
                    <div className="p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <button className="text-white/20 hover:text-amber-400 transition-all">
                                <Flag size={24} />
                            </button>
                        </div>

                        <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] uppercase font-bold tracking-widest mb-6">
                            Question {currentQuestionIndex + 1}
                        </span>

                        <h2 className="text-2xl font-bold text-white leading-relaxed mb-10 font-outfit">
                            {currentQuestion.prompt}
                        </h2>

                        <div className="grid grid-cols-1 gap-4">
                            {currentQuestion.options.map((option) => {
                                const isSelected = answers[currentQuestion.id] === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => setAnswer(currentQuestion.id, option.id)}
                                        className={cn(
                                            "group flex items-center gap-4 p-5 rounded-2xl border transition-all text-left",
                                            isSelected
                                                ? "bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20 text-white"
                                                : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20 hover:text-white/70"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all",
                                            isSelected ? "bg-white text-blue-600" : "bg-white/10 text-white/40 group-hover:bg-white/20"
                                        )}>
                                            {option.id}
                                        </div>
                                        <span className="flex-1 font-semibold">{option.label}</span>
                                        {isSelected && <CheckCircle size={24} weight="fill" className="text-white" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2">
                        <button
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestion(currentQuestionIndex - 1)}
                            className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-white/10 bg-white/5 text-white/40 font-bold hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all"
                        >
                            <ArrowLeft weight="bold" /> Previous
                        </button>
                        <div className="flex gap-2">
                            <button className="p-3 rounded-2xl border border-white/10 bg-white/5 text-white/40 hover:text-white transition-all uppercase text-[10px] font-bold tracking-widest px-6">
                                Skip for now
                            </button>
                            <button
                                disabled={currentQuestionIndex === questions.length - 1}
                                onClick={() => setCurrentQuestion(currentQuestionIndex + 1)}
                                className="flex items-center gap-3 px-8 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/20 disabled:opacity-20 transition-all"
                            >
                                Save & Next <ArrowRight weight="bold" />
                            </button>
                        </div>
                    </div>
                </div>

                <aside className="space-y-6">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold font-outfit">Question Navigator</h3>
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Done: {Object.keys(answers).length}</span>
                        </div>

                        <div className="grid grid-cols-5 gap-3">
                            {questions.map((q, i) => {
                                const isAnswered = !!answers[q.id];
                                const isCurrent = currentQuestionIndex === i;
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentQuestion(i)}
                                        className={cn(
                                            "w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs transition-all border",
                                            isCurrent ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20" :
                                                isAnswered ? "bg-emerald-500/20 border-emerald-500/20 text-emerald-400" :
                                                    "bg-white/5 border-white/10 text-white/20 hover:bg-white/10 hover:text-white/40"
                                        )}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-4">
                        <h3 className="text-white font-bold font-outfit flex items-center gap-2">
                            <Warning size={20} className="text-amber-400" /> Proctoring Log
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                <CheckCircle size={16} className="text-emerald-400" />
                                <p className="text-[10px] text-emerald-400/80 font-semibold">Environment set to secure</p>
                            </div>
                        </div>
                        <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white/20 text-xs font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">
                            System Health Check
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
