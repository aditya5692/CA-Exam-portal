"use client";

import type { ExamHubData } from "@/types/student";

export function ExamStats({ hubData }: { hubData: ExamHubData | null }) {
    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-4 group hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <span className="material-symbols-outlined">history</span>
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-900 font-outfit">{hubData?.stats.totalStudyTimeHours || 0}h</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest opacity-80">Total Study Time</p>
                </div>
            </div>
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-4 group hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <span className="material-symbols-outlined">trending_up</span>
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-900 font-outfit">{hubData?.stats.avgProficiency || 0}%</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest opacity-80">Avg. Proficiency</p>
                </div>
            </div>
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-4 group hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <span className="material-symbols-outlined">verified</span>
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-900 font-outfit">{hubData?.stats.examsMastered || 0}</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest opacity-80">Exams Mastered</p>
                </div>
            </div>
        </section>
    );
}
