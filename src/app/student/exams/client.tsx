"use client";

import { getExamHubData, updateStudentLevel } from "@/actions/student-actions";
import type { ExamHubData } from "@/types/student";
import { useRouter } from "next/navigation";
import { useEffect,useState } from "react";

// ── Components ─────────────────────────────────────────────────────────────────
import { ChapterMCQSection } from "@/components/student/exams/ChapterMCQSection";
import { ExamHero } from "@/components/student/exams/ExamHero";
import { ExamHubFooter } from "@/components/student/exams/ExamHubFooter";
import { ExamStats } from "@/components/student/exams/ExamStats";
import { MockTestSection } from "@/components/student/exams/MockTestSection";
import { StudentPageHeader } from "@/components/student/shared/page-header";
import { Props } from "@/components/student/exams/types";

// ── Main client component ──────────────────────────────────────────────────────

export default function StudentExamsClient({ caLevelKey, caLevelLabel, daysToExam }: Props) {
    const router = useRouter();
    const [selectedSubject, setSelectedSubject] = useState("All Subjects");
    const [hubData, setHubData] = useState<ExamHubData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const init = async () => {
            setLoading(true);
            const hubRes = await getExamHubData();

            if (mounted) {
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
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--student-accent)] border-t-transparent" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">Loading Exam Hub...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full pb-12 font-outfit">
            <StudentPageHeader
                eyebrow="Exam hub"
                title="Professional"
                accent="Practice Hub"
                description={
                    <>
                        Master your CA journey with curated practice modules for{" "}
                        <span className="font-bold text-[var(--student-accent-strong)]">{caLevelLabel}</span>.
                    </>
                }
                daysToExam={daysToExam}
            />

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

