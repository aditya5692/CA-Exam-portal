"use client";

import { cn } from "@/lib/utils";
import { BookmarkSimple, CheckCircle, Clock, List, Star, Users } from "@phosphor-icons/react";
import Link from "next/link";
import { ExamShape } from "./types";

export function ExamCard({
    exam,
    onToggleSave,
    isSaved
}: {
    exam: ExamShape;
    onToggleSave: (id: string) => void;
    isSaved: boolean
}) {
    const charCodeSum = exam.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const diffNum = charCodeSum % 3;
    const difficulty = diffNum === 0 ? "EASY" : diffNum === 1 ? "MEDIUM" : "HARD";

    const diffColors: Record<string, string> = {
        EASY: "bg-emerald-50 text-emerald-600 border-emerald-100",
        MEDIUM: "bg-amber-50 text-amber-600 border-amber-100",
        HARD: "bg-rose-50 text-rose-600 border-rose-100"
    };

    const softColors: Record<string, string> = {
        EASY: "soft-bg-emerald hover:bg-emerald-50/50",
        MEDIUM: "soft-bg-amber hover:bg-amber-50/50",
        HARD: "soft-bg-rose hover:bg-rose-50/50"
    };

    return (
        <div className={cn(
            "student-surface group relative flex h-full flex-col rounded-lg p-6 transition-all duration-300 hover:border-[var(--student-accent-soft-strong)] hover:shadow-[0_18px_30px_rgba(55,48,38,0.08)]",
            softColors[difficulty]
        )}>
            <div className="flex items-start justify-between mb-6">
                <div className="flex flex-wrap gap-2">
                    <span className={cn("px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm", diffColors[difficulty])}>
                        {difficulty}
                    </span>
                    {exam.chapter && (
                        <span className="student-chip rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                            {exam.chapter}
                        </span>
                    )}
                    {exam.examType && exam.examType !== "GENERAL" && (
                        <span className="student-chip-accent rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                            {exam.examType}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => onToggleSave(exam.id)}
                    className={cn(
                        "p-2 rounded-lg transition-all duration-200 active:scale-95 border shadow-sm shrink-0",
                        isSaved
                            ? "border-[var(--student-accent-strong)] bg-[var(--student-accent-strong)] text-white shadow-md shadow-[rgba(31,92,80,0.16)]"
                            : "bg-white border-[var(--student-border)] text-slate-300 hover:bg-[var(--student-accent-soft)] hover:border-[var(--student-accent-soft-strong)] hover:text-[var(--student-accent-strong)]"
                    )}
                >
                    <BookmarkSimple size={18} weight={isSaved ? "fill" : "bold"} />
                </button>
            </div>

            <h3 className="mb-5 min-h-[52px] line-clamp-2   text-lg font-bold leading-tight text-slate-950 transition-colors group-hover:text-[var(--student-accent-strong)]">
                {exam.title}
            </h3>

            <div className="flex items-center gap-3 mb-8 group/author">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 text-[11px] font-bold border border-slate-200 transition-transform group-hover/author:scale-110 uppercase">
                    {exam.teacherName.charAt(0)}
                </div>
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-slate-900 transition-colors group-hover/author:text-[var(--student-accent-strong)]">Prof. {exam.teacherName}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-accent-strong)]/80">Syllabus Expert</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <List size={16} weight="bold" className="text-[var(--student-accent-strong)] opacity-70" />
                    {exam.questionCount} Questions
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <Star size={16} className="text-amber-500" weight="bold" />
                    {exam.totalMarks} Marks
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <Clock size={16} weight="bold" className="text-[var(--student-accent-strong)] opacity-70" />
                    {exam.duration} Mins
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <Users size={16} weight="bold" className="text-[var(--student-accent-strong)] opacity-70" />
                    {exam.attemptCount} Students
                </div>
            </div>

            <div className="mt-auto space-y-4 pt-6 border-t border-slate-50">
                {exam.attempt?.status === "SUBMITTED" && (
                    <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100/50 shadow-sm">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle size={18} weight="fill" className="text-emerald-500/80" />
                            <span className="text-[10px] font-bold text-emerald-700/80 uppercase tracking-widest">Score</span>
                        </div>
                        <div className="text-[11px] font-bold text-emerald-700/80  ">
                            {Math.round(exam.attempt.score)} / {exam.totalMarks}
                        </div>
                    </div>
                )}

                {exam.attempt?.status === "STARTED" && (
                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50/50 rounded-lg border border-amber-100/50 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-amber-500/80 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                        <span className="text-[10px] font-bold text-amber-700/80 uppercase tracking-widest">Ongoing</span>
                    </div>
                )}

                <Link href={`/exam/war-room?examId=${exam.id}${exam.attempt?.status === "STARTED" ? "&mode=resume" : ""}`}
                    className={cn(
                        "flex h-12 w-full items-center justify-center rounded-lg border text-center text-[10px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 shadow-sm",
                        exam.attempt?.status === "SUBMITTED"
                            ? "student-button-secondary"
                            : "student-button-primary"
                    )}>
                    {exam.attempt?.status === "SUBMITTED" ? "Retake Exam" : exam.attempt?.status === "STARTED" ? "Resume Exam" : "Start Practice"}
                </Link>
            </div>
        </div>
    );
}
