"use client";

import { cn } from "@/lib/utils";
import { BookmarkSimple,CheckCircle,Clock,List,Star,Users } from "@phosphor-icons/react";
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

    return (
        <div className="group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
                <div className="flex flex-wrap gap-2">
                    <span className={cn("px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm", diffColors[difficulty])}>
                        {difficulty}
                    </span>
                    {exam.chapter && (
                        <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-100 shadow-sm">
                            {exam.chapter}
                        </span>
                    )}
                    {exam.examType && exam.examType !== "GENERAL" && (
                        <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                            {exam.examType}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => onToggleSave(exam.id)}
                    className={cn(
                        "p-2 rounded-lg transition-all duration-200 active:scale-95 border shadow-sm shrink-0",
                        isSaved
                            ? "bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                            : "bg-white border-slate-100 text-slate-300 hover:text-indigo-500 hover:border-indigo-100 hover:bg-indigo-50/50"
                    )}
                >
                    <BookmarkSimple size={18} weight={isSaved ? "fill" : "bold"} />
                </button>
            </div>

            <h3 className="text-lg font-bold font-outfit text-slate-950 leading-tight mb-5 group-hover:text-indigo-500/80 transition-colors line-clamp-2 min-h-[52px]">
                {exam.title}
            </h3>

            <div className="flex items-center gap-3 mb-8 group/author">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 text-[11px] font-bold border border-slate-200 transition-transform group-hover/author:scale-110 uppercase">
                    {exam.teacherName.charAt(0)}
                </div>
                <div>
                    <div className="font-bold text-[11px] text-slate-900 group-hover/author:text-indigo-600 transition-colors tracking-widest uppercase">Prof. {exam.teacherName}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/80">Syllabus Expert</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <List size={16} weight="bold" className="text-indigo-500 opacity-60" />
                    {exam.questionCount} Questions
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <Star size={16} className="text-amber-500" weight="bold" />
                    {exam.totalMarks} Marks
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <Clock size={16} weight="bold" className="text-indigo-500 opacity-60" />
                    {exam.duration} Mins
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <Users size={16} weight="bold" className="text-indigo-500 opacity-60" />
                    {exam.attemptCount} Students
                </div>
            </div>

            <div className="mt-auto space-y-4 pt-6 border-t border-slate-50">
                {exam.attempt?.status === "SUBMITTED" && (
                    <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100/50 shadow-sm">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle size={18} weight="fill" className="text-emerald-500/80" />
                            <span className="text-[10px] font-bold text-emerald-700/80 uppercase tracking-widest">Score</span>
                        </div>
                        <div className="text-[11px] font-bold text-emerald-700/80 font-outfit">
                            {Math.round(exam.attempt.score)} / {exam.totalMarks}
                        </div>
                    </div>
                )}

                {exam.attempt?.status === "STARTED" && (
                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50/50 rounded-xl border border-amber-100/50 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-amber-500/80 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                        <span className="text-[10px] font-bold text-amber-700/80 uppercase tracking-widest">Ongoing</span>
                    </div>
                )}

                <Link href={`/exam/war-room?examId=${exam.id}${exam.attempt?.status === "STARTED" ? "&mode=resume" : ""}`}
                    className={cn(
                        "w-full h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center flex items-center justify-center transition-all duration-300 active:scale-95 shadow-sm border",
                        exam.attempt?.status === "SUBMITTED"
                            ? "bg-white text-slate-900 hover:bg-slate-50 border-slate-200"
                            : "bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
                    )}>
                    {exam.attempt?.status === "SUBMITTED" ? "Retake Exam" : exam.attempt?.status === "STARTED" ? "Resume Exam" : "Start Practice"}
                </Link>
            </div>
        </div>
    );
}
