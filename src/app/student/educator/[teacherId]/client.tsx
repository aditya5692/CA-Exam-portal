"use client";

import { SharedPageHeader } from "@/components/shared/page-header";
import { Megaphone, Download, Star, Flame, Lock, Unlock, BookOpen } from "lucide-react";
import { MockTestSection } from "@/components/student/exams/MockTestSection";
import type { ExamHubData } from "@/types/student";

export default function EducatorPortalClient({ data }: { data: any }) {
    const { teacher, feedItems, materials, mockTests } = data;

    // Fake hubData for MockTestSection to reuse component
    const hubData: ExamHubData = {
        stats: { totalStudyTimeHours: 0, avgProficiency: 0, examsMastered: 0 },
        practiceGoal: { current: 0, target: 0 },
        chapterWiseMCQs: [],
        mockTests: mockTests
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-24">
            <SharedPageHeader
                eyebrow="Educator space"
                title={teacher.name}
                accent="Portal"
                description={`Access exclusive resources, announcements, and practice materials assigned by ${teacher.name}.`}
                daysToExam={0}
            />

            {/* Announcements */}
            {feedItems.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold tracking-tight text-[var(--student-text)] flex items-center gap-2">
                            <Megaphone className="text-[var(--student-accent)] w-5 h-5" />
                            Announcements
                        </h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {feedItems.map((item: any) => (
                            <div key={item.id} className="student-surface rounded-lg p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--student-accent-strong)] opacity-20 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-start justify-between mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                    <span>{item.batchName}</span>
                                </div>
                                <p className="text-sm font-medium leading-relaxed text-[var(--student-text)]">
                                    {item.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Materials */}
            {materials.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center justify-between mb-4 mt-6">
                        <h2 className="text-xl font-bold tracking-tight text-[var(--student-text)] flex items-center gap-2">
                            <BookOpen className="text-indigo-500 w-5 h-5" />
                            Study Materials
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {materials.map((material: any) => (
                            <div key={material.id} className="group student-surface p-6 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full bg-white relative overflow-hidden">
                                {material.isTrending && (
                                    <div className="absolute top-4 left-4 z-10">
                                        <span className="bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                            <Flame className="w-3.5 h-3.5 fill-current" /> Trending
                                        </span>
                                    </div>
                                )}
                                
                                <div className="flex items-start justify-between relative z-10 mb-6 gap-3 pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 flex items-center justify-center bg-indigo-50 text-indigo-500/80 rounded-lg">
                                            {material.isProtected ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-widest">{material.subType}</span>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">Study Material</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <button className="text-left w-full block group-hover:text-indigo-500/80 transition-colors">
                                    <h3 className="font-bold text-slate-900 text-base leading-tight line-clamp-2 min-h-[44px] tracking-tight">
                                        {material.title}
                                    </h3>
                                    {material.description && (
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 line-clamp-2 min-h-[32px] opacity-60">{material.description}</p>
                                    )}
                                </button>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <Download className="w-3.5 h-3.5 text-indigo-400" /> {material.downloads}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <Star className="w-3.5 h-3.5 text-amber-500 fill-current" /> {material.rating?.toFixed(1) || "5.0"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Exams */}
            {mockTests.length > 0 && (
                <section className="space-y-6 pt-6">
                    <MockTestSection hubData={hubData} />
                </section>
            )}
            
            {feedItems.length === 0 && materials.length === 0 && mockTests.length === 0 && (
                <div className="student-surface py-20 rounded-lg flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">No Resources Available</h3>
                    <p className="text-slate-500 text-sm max-w-sm mt-2">
                        {teacher.name} has not published any announcements, materials, or exams to your batches yet.
                    </p>
                </div>
            )}
        </div>
    );
}
