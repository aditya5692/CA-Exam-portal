"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toggleSavedItem, getSavedItems, getExamHubData, updateStudentLevel, ExamHubData } from "@/actions/student-actions";

// ── Components ─────────────────────────────────────────────────────────────────
import { ExamHero } from "@/components/student/exams/ExamHero";
import { ExamStats } from "@/components/student/exams/ExamStats";
import { ChapterMCQSection } from "@/components/student/exams/ChapterMCQSection";
import { MockTestSection } from "@/components/student/exams/MockTestSection";
import { ExamHubFooter } from "@/components/student/exams/ExamHubFooter";
import { ExamShape, TeacherShape, Props } from "@/components/student/exams/types";
import { Calendar } from "@phosphor-icons/react";

// ── Main client component ──────────────────────────────────────────────────────

export default function StudentExamsClient({ caLevelKey, caLevelLabel, exams, teachers, studentName, daysToExam }: Props) {
    const router = useRouter();
    const [selectedSubject, setSelectedSubject] = useState("All Subjects");
    const [selectedLevel, setSelectedLevel] = useState("All Levels");
    const [searchQuery, setSearchQuery] = useState("");
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [hubData, setHubData] = useState<ExamHubData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const init = async () => {
            setLoading(true);
            const [saveRes, hubRes] = await Promise.all([
                getSavedItems(),
                getExamHubData()
            ]);

            if (mounted) {
                if (saveRes.success && saveRes.data) {
                    const ids = new Set([
                        ...(saveRes.data.materials || []).map((m: any) => m.id),
                        ...(saveRes.data.exams || []).map((e: any) => e.id)
                    ]);
                    setSavedIds(ids);
                }

                if (hubRes.success && hubRes.data) {
                    setHubData(hubRes.data);
                }
                setLoading(false);
            }
        };
        init();
        return () => { mounted = false; };
    }, []);

    const handleLevelChange = async (level: string) => {
        if (level === "foundation" || level === "ipc" || level === "final") {
            const res = await updateStudentLevel(level);
            if (res.success) {
                // Manually re-fetch hubData to show the new level's subjects immediately
                const hubRes = await getExamHubData();
                if (hubRes.success && hubRes.data) {
                    setHubData(hubRes.data);
                }
                router.refresh();
            }
        }
        setSelectedLevel(level);
    };

    const handleToggleSave = async (id: string) => {
        const res = await toggleSavedItem(id, "EXAM");
        if (res.success && res.data) {
            setSavedIds(prev => {
                const next = new Set(prev);
                if ((res.data as { saved: boolean }).saved) next.add(id);
                else next.delete(id);
                return next;
            });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Loading Exam Hub...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full pb-12 font-outfit">
            {/* Standardized Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Exam Hub</span>
                    </div>
                    <h1 className="font-outfit tracking-tighter leading-tight text-3xl md:text-4xl font-black text-slate-900">
                        Professional <span className="text-indigo-600">Practice Hub</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-base font-sans max-w-2xl leading-relaxed">
                        Master your CA journey with curated practice modules for <span className="text-indigo-600 font-bold">{caLevelLabel}</span>.
                    </p>
                </div>
                {daysToExam > 0 && (
                    <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/5 hover:bg-slate-800 transition-all active:scale-95 shrink-0 mb-1 pointer-events-none">
                        <Calendar size={18} weight="bold" className="text-indigo-400" />
                        Next Milestone: {daysToExam} Days
                    </div>
                )}
            </div>

            <ExamHero 
                caLevelKey={caLevelKey} 
                caLevelLabel={caLevelLabel} 
                onLevelChange={handleLevelChange} 
            />

            <ExamStats hubData={hubData} />

            <ChapterMCQSection 
                hubData={hubData} 
                selectedSubject={selectedSubject} 
                setSelectedSubject={setSelectedSubject} 
            />

            <MockTestSection hubData={hubData} />

            <ExamHubFooter />
        </div>
    );
}

