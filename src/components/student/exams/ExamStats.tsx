"use client";

import type { ExamHubData } from "@/types/student";

export function ExamStats({ hubData }: { hubData: ExamHubData | null }) {
    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="student-surface flex items-center gap-4 rounded-2xl p-6 transition-shadow hover:shadow-[0_18px_30px_rgba(55,48,38,0.08)]">
                <div className="student-icon-tile flex h-12 w-12 items-center justify-center rounded-xl">
                    <span className="material-symbols-outlined">history</span>
                </div>
                <div>
                    <p className="font-outfit text-2xl font-bold text-[var(--student-text)]">{hubData?.stats.totalStudyTimeHours || 0}h</p>
                    <p className="text-xs font-medium uppercase tracking-widest text-[var(--student-muted)] opacity-80">Total Study Time</p>
                </div>
            </div>
            <div className="student-surface flex items-center gap-4 rounded-2xl p-6 transition-shadow hover:shadow-[0_18px_30px_rgba(55,48,38,0.08)]">
                <div className="student-icon-tile-warm flex h-12 w-12 items-center justify-center rounded-xl">
                    <span className="material-symbols-outlined">trending_up</span>
                </div>
                <div>
                    <p className="font-outfit text-2xl font-bold text-[var(--student-text)]">{hubData?.stats.avgProficiency || 0}%</p>
                    <p className="text-xs font-medium uppercase tracking-widest text-[var(--student-muted)] opacity-80">Avg. Proficiency</p>
                </div>
            </div>
            <div className="student-surface flex items-center gap-4 rounded-2xl p-6 transition-shadow hover:shadow-[0_18px_30px_rgba(55,48,38,0.08)]">
                <div className="student-icon-tile-success flex h-12 w-12 items-center justify-center rounded-xl">
                    <span className="material-symbols-outlined">verified</span>
                </div>
                <div>
                    <p className="font-outfit text-2xl font-bold text-[var(--student-text)]">{hubData?.stats.examsMastered || 0}</p>
                    <p className="text-xs font-medium uppercase tracking-widest text-[var(--student-muted)] opacity-80">Exams Mastered</p>
                </div>
            </div>
        </section>
    );
}
