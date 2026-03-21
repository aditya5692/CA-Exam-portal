import type { Prisma } from "@prisma/client";

export type TeacherMaterialWithRelations = Prisma.StudyMaterialGetPayload<{
    include: {
        uploadedBy: { select: { id: true, fullName: true, email: true, role: true } };
        accessedBy: { include: { student: { select: { id: true, fullName: true, email: true } } } };
    };
}>;

export type TeacherOverviewData = {
    stats: {
        activeStudents: number;
        avgTestScore: number;
        avgTimePerTest: string;
        testsCompleted: number;
        activeStudentsTrend: number;
        avgScoreTrend: number;
    };
    trends: { name: string; attempts: number; score: number }[];
    recentActivity: { user: string; action: string; time: string; color: string }[];
    topStudents: { id: string; name: string; xp: number; rank: number; level: number }[];
    recentAnnouncements: { id: string; content: string; date: string; batchName: string }[];
    recentMaterials: { id: string; title: string; type: string; category: string; date: string }[];
    teacherName: string;
};
