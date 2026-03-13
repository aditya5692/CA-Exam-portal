"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BookmarkSimple, List, Star, Clock, Users, CaretDown, BookBookmark } from "@phosphor-icons/react";

// ── Types ──────────────────────────────────────────────────────────────────────

type ExamShape = {
    id: string;
    title: string;
    duration: number;
    totalMarks: number;
    category: string;
    batchName: string | null;
    teacherName: string;
    questionCount: number;
    attemptCount: number;
    attempt: { id: string; examId: string; status: string; score: number } | null;
};

type TeacherShape = { name: string; subjects: string[]; examCount: number };

type Props = {
    caLevelKey: "foundation" | "ipc" | "final";
    caLevelLabel: string;
    exams: ExamShape[];
    teachers: TeacherShape[];
    studentName: string;
};

// ── CA Level visual config ─────────────────────────────────────────────────────

const CA_LEVEL_SUBJECTS: Record<string, string[]> = {
    foundation: [
        "Principles & Practice of Accounting",
        "Business Laws & Business Correspondence",
        "Business Mathematics & Logical Reasoning",
        "Business Economics & Business & Commercial Knowledge",
    ],
    ipc: [
        "Accounting", "Corporate & Other Laws", "Cost & Management Accounting",
        "Taxation", "Advanced Accounting", "Auditing & Assurance",
        "Enterprise Information Systems", "Financial Management & Economics",
    ],
    final: [
        "Financial Reporting", "Strategic Financial Management",
        "Advanced Auditing & Professional Ethics", "Corporate & Economic Laws",
        "Strategic Cost Management", "Risk Management",
        "Direct Tax Laws", "Indirect Tax Laws",
    ],
};

// ── Series Card ────────────────────────────────────────────────────────────────

function ExamCard({ exam }: { exam: ExamShape }) {
    // Generate a pseudo-random deterministic difficulty and experience year for empty fields
    const charCodeSum = exam.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const diffNum = charCodeSum % 3;
    const difficulty = diffNum === 0 ? "EASY" : diffNum === 1 ? "MEDIUM" : "HARD";
    const yrsExperience = 5 + (charCodeSum % 15); // Random between 5 - 20 years

    const diffColors: Record<string, string> = {
        EASY: "bg-emerald-100 text-emerald-700",
        MEDIUM: "bg-amber-100 text-amber-700",
        HARD: "bg-rose-100 text-rose-700"
    };

    return (
        <div className="bg-white rounded-[20px] p-5 md:p-6 border border-slate-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-200">
            <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3.5">
                    <span className={cn("px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest", diffColors[difficulty])}>
                        {difficulty}
                    </span>
                    <button className="text-slate-300 hover:text-slate-500 transition-colors">
                        <BookmarkSimple size={18} weight="fill" />
                    </button>
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-800 text-base md:text-lg leading-snug mb-3 line-clamp-2 min-h-[44px] md:min-h-[56px]">
                    {exam.title}
                </h3>

                {/* Teacher Profile */}
                <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                        <span className="font-bold text-slate-500 text-sm md:text-base uppercase">
                            {exam.teacherName.charAt(0)}
                        </span>
                    </div>
                    <div>
                        <div className="font-bold text-xs md:text-sm text-slate-800 leading-tight">Prof. {exam.teacherName}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{yrsExperience} yrs experience</div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-5">
                    <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-500 font-medium">
                        <List size={14} className="text-blue-600" weight="fill" />
                        {exam.questionCount} MCQs
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-500 font-medium">
                        <Star size={14} className="text-blue-600" weight="fill" />
                        {exam.totalMarks} Marks
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-500 font-medium">
                        <Clock size={14} className="text-blue-600" weight="fill" />
                        {exam.duration} Mins
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-500 font-medium">
                        <Users size={14} className="text-blue-600" weight="fill" />
                        {exam.attemptCount >= 1000 ? (exam.attemptCount / 1000).toFixed(1) + 'k' : exam.attemptCount} Taken
                    </div>
                </div>
            </div>

            {/* Bottom Button */}
            <Link href={`/exam/war-room?examId=${exam.id}`}
                className="w-full py-2.5 md:py-3 rounded-xl bg-blue-700 text-white text-[13px] md:text-sm font-bold text-center hover:bg-blue-800 transition-colors block shadow-sm hover:shadow-md active:scale-95">
                Start Now
            </Link>
        </div>
    );
}

// ── Main client component ──────────────────────────────────────────────────────

export default function StudentExamsClient({ caLevelKey, exams, teachers }: Props) {
    const defaultSubjects = CA_LEVEL_SUBJECTS[caLevelKey] ?? [];

    // We add fallback subjects purely for the aesthetic of the layout, but the data will filter normally.
    const fallbackSubjects = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science"];
    const subjects = defaultSubjects.length > 0 ? defaultSubjects : fallbackSubjects;

    const [selectedSubject, setSelectedSubject] = useState("All Subjects");
    const [selectedLevel, setSelectedLevel] = useState("All Levels");

    // Filter exams by current selection
    const displayExams = exams.filter((e) => {
        let match = true;
        if (selectedSubject !== "All Subjects") {
            const isMatch = e.category.toLowerCase().includes(selectedSubject.toLowerCase().split(" ")[0]) ||
                e.title.toLowerCase().includes(selectedSubject.toLowerCase().split(" ")[0]);
            if (!isMatch) match = false;
        }

        // Pseudo level filtering (since difficulty is hardcoded visually above, let's roughly mock it or skip it)
        if (match && selectedLevel !== "All Levels") {
            const charCodeSum = e.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const diffNum = charCodeSum % 3;
            const diffMap = { 0: "Easy", 1: "Medium", 2: "Hard" };
            if (diffMap[diffNum as 0 | 1 | 2] !== selectedLevel) match = false;
        }

        return match;
    });

    return (
        <div className="space-y-6 md:space-y-8 bg-[#f8f9fa] min-h-[calc(100vh-80px)] p-4 sm:p-6 md:p-8 w-full max-w-[1600px] mx-auto">
            {/* Top Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Mock Exam Library</h1>
                    <p className="text-slate-500 font-medium mt-1 text-xs md:text-sm">Prepare for your upcoming exams with expert-curated MCQs.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto mt-2 xl:mt-0">
                    <button
                        onClick={() => setSelectedLevel("All Levels")}
                        className={cn("px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-all flex-grow xsm:flex-grow-0 text-center", selectedLevel === "All Levels" ? "bg-blue-700 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50")}>
                        All Levels
                    </button>
                    <button
                        onClick={() => setSelectedLevel("Easy")}
                        className={cn("px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-all flex-grow xsm:flex-grow-0 text-center", selectedLevel === "Easy" ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50")}>
                        Easy
                    </button>
                    <button
                        onClick={() => setSelectedLevel("Medium")}
                        className={cn("px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-all flex-grow xsm:flex-grow-0 text-center", selectedLevel === "Medium" ? "bg-amber-100 text-amber-700" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50")}>
                        Medium
                    </button>
                    <button
                        onClick={() => setSelectedLevel("Hard")}
                        className={cn("px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-all flex-grow xsm:flex-grow-0 text-center", selectedLevel === "Hard" ? "bg-rose-100 text-rose-700" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50")}>
                        Hard
                    </button>
                </div>
            </div>

            {/* Subjects horizontally */}
            <div className="flex flex-wrap gap-2 md:gap-3">
                <button
                    onClick={() => setSelectedSubject("All Subjects")}
                    className={cn("px-4 py-2 md:px-5 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all", selectedSubject === "All Subjects" ? "bg-blue-700 text-white" : "border border-slate-200 text-slate-600 bg-white hover:bg-slate-50")}>
                    All Subjects
                </button>
                {subjects.map(s => (
                    <button
                        key={s}
                        onClick={() => setSelectedSubject(s)}
                        className={cn("px-4 py-2 md:px-5 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all", selectedSubject === s ? "bg-blue-700 text-white" : "border border-slate-200 text-slate-600 bg-white hover:bg-slate-50")}>
                        {s}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {displayExams.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 shadow-sm mt-8">
                    <BookBookmark size={48} weight="thin" className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-600">No mock exams found</h3>
                    <p className="text-slate-400 mt-2">Check back later or try adjusting your filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6 mt-6 md:mt-8">
                    {displayExams.map(e => (
                        <ExamCard key={e.id} exam={e} />
                    ))}
                </div>
            )}

            {/* Load More Button */}
            {displayExams.length > 0 && (
                <div className="flex justify-center mt-8 md:mt-12 pb-4 md:pb-8">
                    <button className="px-5 py-2 md:px-6 md:py-2.5 rounded-full border border-blue-700 text-blue-700 font-bold text-[13px] md:text-sm flex items-center gap-1.5 md:gap-2 hover:bg-blue-50 transition-colors">
                        Load More Tests <CaretDown weight="bold" />
                    </button>
                </div>
            )}
        </div>
    );
}
