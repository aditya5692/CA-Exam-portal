"use client";

import { cn } from "@/lib/utils";
import { Info, Users, BookOpen, TrendUp } from "@phosphor-icons/react";

const TOPICS = [
    "Corporate Law",
    "Audit &amp; Assurance",
    "Financial Reporting",
    "Direct Tax",
    "Indirect Tax",
    "Costing",
    "Strategic Management"
];

const STUDENTS = [
    { name: "Aditya Rao", scores: [84, 76, 92, 45, 88, 72, 65] },
    { name: "Sana Khan", scores: [52, 88, 71, 95, 62, 48, 90] },
    { name: "Nikhil Jain", scores: [95, 92, 88, 84, 91, 89, 96] },
    { name: "Ritika Sharma", scores: [38, 42, 55, 61, 44, 39, 52] },
    { name: "Karan Gupta", scores: [65, 71, 68, 74, 69, 72, 70] },
    { name: "Priya Malik", scores: [88, 85, 91, 89, 87, 92, 90] },
];

export function TopicMasteryHeatmap() {
    const getHeatColor = (score: number) => {
        if (score >= 90) return "bg-emerald-500 text-white";
        if (score >= 75) return "bg-emerald-400/60 text-emerald-900";
        if (score >= 60) return "bg-amber-400/50 text-amber-900";
        if (score >= 45) return "bg-orange-400/40 text-orange-900";
        return "bg-rose-500/20 text-rose-700";
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900 font-outfit">Topic Mastery Heatmap</h2>
                    <p className="text-gray-500 text-sm font-medium">Cross-sectional analysis of cohort performance by subject area.</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-emerald-500" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mastery</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-amber-400/50" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Growth</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-rose-500/20" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">At Risk</span>
                    </div>
                </div>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="p-4 text-left bg-gray-50/50 border border-gray-100 rounded-tl-2xl">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                        <Users size={16} /> Student Name
                                    </div>
                                </th>
                                {TOPICS.map((topic, i) => (
                                    <th key={i} className={cn(
                                        "p-4 text-center bg-gray-50/50 border border-gray-100 min-w-[120px]",
                                        i === TOPICS.length - 1 && "rounded-tr-2xl"
                                    )}>
                                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 truncate px-2" title={topic}>
                                            {topic}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {STUDENTS.map((student, sIdx) => (
                                <tr key={sIdx}>
                                    <td className="p-4 border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                                {student.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">{student.name}</span>
                                        </div>
                                    </td>
                                    {student.scores.map((score, tIdx) => (
                                        <td key={tIdx} className="p-1 border border-gray-100">
                                            <div className={cn(
                                                "h-12 w-full rounded-lg flex items-center justify-center text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-help",
                                                getHeatColor(score)
                                            )} title={`${score}% Mastery`}>
                                                {score}%
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <BookOpen size={20} weight="bold" />
                        </div>
                        <TrendUp size={20} className="text-emerald-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Strongest Topic</h3>
                    <p className="text-2xl font-bold text-emerald-600 font-outfit truncate">Mastery in Tax</p>
                    <p className="text-xs text-gray-500 mt-2 font-medium">88% average mastery across cohort.</p>
                </div>

                <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                            <Info size={20} weight="bold" />
                        </div>
                        <TrendUp size={20} className="text-rose-500 rotate-180" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Critical Focus</h3>
                    <p className="text-2xl font-bold text-rose-600 font-outfit truncate">Audit Gaps</p>
                    <p className="text-xs text-gray-500 mt-2 font-medium">45% of students scoring below 50%.</p>
                </div>

                <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Users size={20} weight="bold" />
                        </div>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Attention Required</h3>
                    <p className="text-2xl font-bold text-indigo-600 font-outfit truncate">Ritika Sharma</p>
                    <p className="text-xs text-gray-500 mt-2 font-medium">Personalized intervention recommended.</p>
                </div>
            </div>
        </div>
    );
}
