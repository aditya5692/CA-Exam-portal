"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Check,
    CaretLeft,
    CaretRight,
    Tag,
    Eraser,
    CheckCircle
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface Question {
    id: string;
    text: string;
    options: { id: string; text: string }[];
    difficulty: string;
}

interface ExamMainProps {
    questions: { question: Question; order: number; marks: number }[];
    onSave: (questionId: string, selectedOptionId: string, timeSpent: number) => void;
    onSubmit: (answers: { questionId: string, selectedOptionId: string, timeSpent: number }[]) => void;
}

export function ExamMain({
    questions,
    onSave,
    onSubmit
}: ExamMainProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
    const [visited, setVisited] = useState<Set<string>>(new Set([questions[0]?.question.id]));
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        startTimeRef.current = Date.now();
    }, []);

    const currentQuestion = questions[currentIndex]?.question;
    const currentOrder = questions[currentIndex]?.order;

    const handleOptionSelect = useCallback((optionId: string) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: optionId
        }));
        // Auto-save on selection
        const now = Date.now();
        const start = startTimeRef.current || now;
        const timeSpent = Math.floor((now - start) / 1000);
        onSave(currentQuestion.id, optionId, timeSpent);
    }, [currentQuestion.id, onSave]);

    const handleFinalSubmit = () => {
        const payload = Object.entries(answers).map(([qId, optId]) => ({
            questionId: qId,
            selectedOptionId: optId,
            timeSpent: 0 // In a real app, track per-question time
        }));
        onSubmit(payload);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            setVisited(prev => new Set(prev).add(questions[nextIndex].question.id));
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleMarkForReview = () => {
        setMarkedForReview(prev => {
            const next = new Set(prev);
            if (next.has(currentQuestion.id)) {
                next.delete(currentQuestion.id);
            } else {
                next.add(currentQuestion.id);
            }
            return next;
        });
        handleNext();
    };

    const handleClear = () => {
        setAnswers(prev => {
            const next = { ...prev };
            delete next[currentQuestion.id];
            return next;
        });
    };

    const getStatusColor = (qId: string) => {
        if (markedForReview.has(qId)) return "bg-purple-500 text-white border-purple-500";
        if (answers[qId]) return "bg-emerald-500 text-white border-emerald-500";
        if (visited.has(qId)) return "bg-rose-500 text-white border-rose-500";
        return "bg-slate-100 text-slate-400 border-slate-200";
    };

    return (
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
            {/* Sidebar Question Palette */}
            <aside className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col p-6 overflow-y-auto">
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Question Palette</h3>
                    <div className="grid grid-cols-4 lg:grid-cols-5 gap-3">
                        {questions.map((q, idx) => (
                            <button
                                key={q.question.id}
                                onClick={() => {
                                    setCurrentIndex(idx);
                                    setVisited(prev => new Set(prev).add(q.question.id));
                                }}
                                className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all border-2",
                                    currentIndex === idx ? "ring-2 ring-indigo-500 ring-offset-2 scale-110 z-10" : "",
                                    getStatusColor(q.question.id)
                                )}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100 space-y-3">
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <div className="w-4 h-4 rounded bg-emerald-500" /> Answered
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <div className="w-4 h-4 rounded bg-rose-500" /> Not Answered
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <div className="w-4 h-4 rounded bg-purple-500" /> Marked for Review
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200" /> Not Visited
                    </div>
                </div>
            </aside>

            {/* Main Question Display */}
            <section className="flex-1 flex flex-col bg-white overflow-y-auto">
                <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
                    {/* Tags */}
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100">
                            Q {currentOrder} / {questions.length}
                        </span>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100">
                            {questions[currentIndex]?.marks} Marks
                        </span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">
                            {currentQuestion?.difficulty}
                        </span>
                    </div>

                    {/* Question Statement */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Question Statement</h2>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-lg md:text-xl font-medium leading-relaxed">
                            {currentQuestion?.text}
                        </div>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 gap-4">
                        {currentQuestion?.options.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleOptionSelect(option.id)}
                                className={cn(
                                    "p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 group",
                                    answers[currentQuestion.id] === option.id
                                        ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-lg shadow-indigo-100"
                                        : "border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                    answers[currentQuestion.id] === option.id
                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                        : "border-slate-300 group-hover:border-indigo-400"
                                )}>
                                    {answers[currentQuestion.id] === option.id && <Check weight="bold" size={16} />}
                                </div>
                                <span className="font-medium">{option.text}</span>
                            </button>
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleMarkForReview}
                                className="px-6 py-3 rounded-xl border border-purple-200 text-purple-600 bg-purple-50 font-bold text-sm hover:bg-purple-100 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Tag size={18} weight="bold" /> Mark & Next
                            </button>
                            <button
                                onClick={handleClear}
                                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 bg-white font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Eraser size={18} weight="bold" /> Clear
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 bg-white font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                            >
                                <CaretLeft size={18} weight="bold" /> Previous
                            </button>
                            {currentIndex === questions.length - 1 ? (
                                <button
                                    onClick={handleFinalSubmit}
                                    className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <CheckCircle size={18} weight="bold" /> Submit Exam
                                </button>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    Next <CaretRight size={18} weight="bold" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
