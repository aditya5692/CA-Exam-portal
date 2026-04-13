"use client";

import { cn } from "@/lib/utils";
import { CaretRight,ChartBar,Sparkle,Target,Users } from "@phosphor-icons/react";

const TOPICS = [
    "Corporate Law",
    "Audit & Assurance",
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
        if (score >= 90) return "bg-emerald-500/90 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]";
        if (score >= 75) return "bg-emerald-100/60 text-emerald-900 border border-emerald-200/50";
        if (score >= 60) return "bg-amber-100/50 text-amber-900 border border-amber-200/50";
        if (score >= 45) return "bg-orange-100/40 text-orange-900 border border-orange-200/50";
        return "bg-rose-500/20 text-rose-700 border border-rose-200/50";
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700  ">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <ChartBar size={24} weight="bold" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tighter">Topic Mastery Matrix</h2>
                            <p className="text-slate-500 font-medium text-sm">Cross-sectional analysis of cohort performance and domain coverage.</p>
                        </div>
                    </div>
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-6 bg-white/50 backdrop-blur-md rounded-lg border border-slate-100 p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-lg bg-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">High Mastery</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-lg bg-amber-100 border border-amber-200" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Developing</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-lg bg-rose-500/20 border border-rose-200" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Critical Warning</span>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-lg border border-slate-100 shadow-sm overflow-hidden p-6">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-100 pb-2">
                    <table className="w-full border-separate border-spacing-2">
                        <thead>
                            <tr>
                                <th className="p-4 text-left bg-slate-50/50 rounded-lg border border-slate-100/50 min-w-[200px]">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        <Users size={16} weight="bold" /> Registered Cadet
                                    </div>
                                </th>
                                {TOPICS.map((topic, i) => (
                                    <th key={i} className="p-4 text-center bg-slate-50/50 rounded-lg border border-slate-100/50 min-w-[140px]">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 truncate px-2" title={topic}>
                                            {topic}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {STUDENTS.map((student, sIdx) => (
                                <tr key={sIdx} className="group">
                                    <td className="p-4 rounded-lg bg-white border border-slate-50 group-hover:border-indigo-100 group-hover:shadow-sm transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[11px] font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                                {student.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{student.name}</span>
                                        </div>
                                    </td>
                                    {student.scores.map((score, tIdx) => (
                                        <td key={tIdx} className="p-0">
                                            <div className={cn(
                                                "h-14 w-full rounded-lg flex items-center justify-center text-sm font-black transition-all hover:scale-110 active:scale-95 cursor-help shadow-sm border",
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: "Elite Subject", value: "Taxation Systems", icon: Sparkle, color: "text-emerald-600", bg: "bg-emerald-50", subtitle: "88% Avg Mastery across cohort", trend: "+14%" },
                    { label: "Critical Focus", value: "Audit Standards", icon: Target, color: "text-rose-600", bg: "bg-rose-50", subtitle: "45% struggle with 'Controls'", trend: "-8%" },
                    { label: "Intervention Priority", value: "Ritika Sharma", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", subtitle: "Declining trend in Direct Tax", trend: "High Risk" },
                ].map((item, i) => (
                    <div key={i} className="p-6 rounded-lg bg-white border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-indigo-100/50 transition-all duration-300 flex flex-col justify-between">
                         <div className="flex items-center justify-between mb-8">
                            <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 duration-500", item.bg, item.color)}>
                                <item.icon size={28} weight="bold" />
                            </div>
                            <div className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest", item.color === "text-rose-600" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                                {item.trend}
                            </div>
                         </div>
                         
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{item.label}</p>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tighter mb-2 group-hover:text-indigo-600 transition-colors  ">{item.value}</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{item.subtitle}</p>
                         </div>
                         
                         <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Detail View</span>
                             <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                 <CaretRight size={14} weight="bold" />
                             </div>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
