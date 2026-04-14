import prisma from "@/lib/prisma/client";
import { 
    TeacherMaterialWithRelations, 
    TeacherMaterialsData, 
    TeacherOverviewData 
} from "@/types/educator";
import { Prisma, StudyMaterial, User } from "@prisma/client";
import { isAdminUser, listManagedEducatorOptions } from "@/lib/server/educator-management";

export class EducatorService {
    /**
     * Fetches all materials uploaded by or relevant to the educator.
     */
    static async getTeacherMaterials(teacher: User): Promise<TeacherMaterialsData> {
        const isAdminView = isAdminUser(teacher);
        const materials = await prisma.studyMaterial.findMany({
            where: isAdminView
                ? { fileUrl: { startsWith: "/uploads/teacher_materials/" } }
                : {
                    uploadedById: teacher.id,
                    fileUrl: { startsWith: "/uploads/teacher_materials/" },
                },
            include: {
                uploadedBy: {
                    select: { id: true, fullName: true, email: true, role: true },
                },
                accessedBy: {
                    include: {
                        student: { select: { id: true, fullName: true, email: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }) as TeacherMaterialWithRelations[];

        return {
            materials,
            isAdminView,
            availableEducators: isAdminView ? await listManagedEducatorOptions() : [],
        };
    }

    /**
     * Fetches overview metrics for the teacher dashboard.
     */
    static async getTeacherOverview(teacher: User): Promise<TeacherOverviewData> {
        const teacherId = teacher.id;

        // stats
        const batches = await prisma.batch.findMany({
            where: { teacherId },
            include: { _count: { select: { enrollments: true } } }
        });
        const activeStudents = batches.reduce((acc, b) => acc + b._count.enrollments, 0);

        const teacherExams = await prisma.exam.findMany({
            where: { teacherId },
            select: { id: true }
        });
        const examIds = teacherExams.map(e => e.id);

        const attempts = await prisma.examAttempt.findMany({
            where: { examId: { in: examIds }, status: "SUBMITTED" },
            select: { 
                score: true, 
                startTime: true, 
                endTime: true, 
                exam: { select: { totalMarks: true } } 
            }
        });

        const totalAttempts = attempts.length;
        let totalScorePct = 0;
        let totalTime = 0;

        attempts.forEach(a => {
            if (a.exam.totalMarks > 0) {
                totalScorePct += (a.score / a.exam.totalMarks) * 100;
            }
            if (a.endTime) {
                totalTime += (a.endTime.getTime() - a.startTime.getTime()) / 1000;
            }
        });

        const avgScore = totalAttempts > 0 ? Math.round(totalScorePct / totalAttempts * 10) / 10 : 0;
        const avgTimeSec = totalAttempts > 0 ? totalTime / totalAttempts : 0;
        const avgTimeStr = `${Math.floor(avgTimeSec / 60)}m ${Math.round(avgTimeSec % 60)}s`;

        // trends
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d;
        });

        const trends = last7Days.map(date => {
            const start = new Date(date.setHours(0, 0, 0, 0));
            const end = new Date(date.setHours(23, 59, 59, 999));
            const dayAttempts = attempts.filter(a => a.startTime >= start && a.startTime <= end);
            const dayScore = dayAttempts.length > 0 
                ? dayAttempts.reduce((acc, a) => acc + (a.score / (a.exam.totalMarks || 1)) * 100, 0) / dayAttempts.length 
                : 0;
            return {
                name: days[date.getDay()],
                attempts: dayAttempts.length,
                score: Math.round(dayScore)
            };
        });

        // Recent Activity
        const recentAttempts = await prisma.examAttempt.findMany({
            where: { examId: { in: examIds } },
            orderBy: { startTime: "desc" },
            take: 4,
            include: { student: { select: { fullName: true } }, exam: { select: { title: true } } }
        });
        
        const recentActivity = recentAttempts.map(a => {
            const diff = Math.floor((new Date().getTime() - a.startTime.getTime()) / 60000);
            const timeStr = diff < 60 ? `${diff}m ago` : diff < 1440 ? `${Math.floor(diff / 60)}h ago` : `${Math.floor(diff / 1440)}d ago`;
            const colors = ["bg-indigo-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500"];
            return {
                user: a.student.fullName || "Unknown Student",
                action: `Attempted ${a.exam.title}`,
                time: timeStr,
                color: colors[Math.floor(Math.random() * colors.length)]
            };
        });

        // Top Students
        const batchIds = batches.map(b => b.id);
        const topStudentsRaw = await prisma.studentLearningProfile.findMany({
            where: {
                student: {
                    enrollments: {
                        some: { batchId: { in: batchIds } }
                    }
                }
            },
            take: 4,
            orderBy: { totalXP: "desc" },
            include: { student: { select: { fullName: true, id: true } } }
        });

        const topStudents = topStudentsRaw.map((p, i) => ({
            id: p.studentId,
            name: p.student.fullName || "Student",
            xp: p.totalXP,
            rank: i + 1,
            level: p.level
        }));

        // Recent Announcements
        const recentAnnouncementsRaw = await prisma.announcement.findMany({
            where: { teacherId },
            take: 3,
            orderBy: { createdAt: "desc" },
            include: { batch: { select: { name: true } } }
        });

        const recentAnnouncements = recentAnnouncementsRaw.map(a => ({
            id: a.id,
            content: a.content,
            date: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            batchName: a.batch.name
        }));

        // Recent Materials
        const recentMaterialsRaw = await prisma.studyMaterial.findMany({
            where: { uploadedById: teacherId },
            take: 4,
            orderBy: { createdAt: "desc" }
        });

        const recentMaterials = recentMaterialsRaw.map(m => ({
            id: m.id,
            title: m.title,
            type: m.subType || "PDF",
            category: m.category,
            date: new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));

        return {
            stats: {
                activeStudents,
                avgTestScore: avgScore,
                avgTimePerTest: avgTimeStr,
                testsCompleted: totalAttempts,
                activeStudentsTrend: 12.5,
                avgScoreTrend: 5.2
            },
            trends,
            recentActivity,
            topStudents,
            recentAnnouncements,
            recentMaterials,
            teacherName: teacher.fullName || "Educator"
        };
    }

    /**
     * Fetches detailed analytics data for the teacher analytics page.
     */
    static async getTeacherAnalyticsData(teacher: User) {
        const teacherId = teacher.id;
        const isAdmin = teacher.role === "ADMIN";

        // Teacher exams
        const teacherExams = await prisma.exam.findMany({
            where: isAdmin ? {} : { teacherId },
            select: { id: true, title: true, totalMarks: true, passingMarks: true, subject: true, status: true },
        });
        const examIds = teacherExams.map(e => e.id);

        // Submitted attempts
        const allAttempts = await prisma.examAttempt.findMany({
            where: { examId: { in: examIds }, status: "SUBMITTED" },
            select: {
                id: true,
                score: true,
                startTime: true,
                endTime: true,
                studentId: true,
                examId: true,
                student: { select: { id: true, fullName: true, email: true } },
                exam: { select: { totalMarks: true, passingMarks: true } },
            },
            orderBy: { startTime: "desc" },
        });

        const totalAttempts = allAttempts.length;

        // Global stats
        let totalScorePct = 0;
        let passCount = 0;
        const uniqueStudentIds = new Set<string>();

        allAttempts.forEach(a => {
            const pct = a.exam.totalMarks > 0 ? (a.score / a.exam.totalMarks) * 100 : 0;
            totalScorePct += pct;
            if (a.exam.passingMarks > 0 && a.score >= a.exam.passingMarks) passCount++;
            else if (a.exam.passingMarks === 0 && pct >= 40) passCount++;
            uniqueStudentIds.add(a.studentId);
        });

        const avgScore = totalAttempts > 0 ? Math.round((totalScorePct / totalAttempts) * 10) / 10 : 0;
        const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;

        // 7-day attempt trends
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const trends = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split("T")[0];
            const dayAttempts = allAttempts.filter(a => a.startTime.toISOString().split("T")[0] === dateStr);
            const dayAvg = dayAttempts.length > 0
                ? dayAttempts.reduce((acc, a) => acc + (a.exam.totalMarks > 0 ? (a.score / a.exam.totalMarks) * 100 : 0), 0) / dayAttempts.length
                : 0;
            return { name: dayNames[d.getDay()], attempts: dayAttempts.length, score: Math.round(dayAvg) };
        });

        // Per-exam performance breakdown
        const examPerformance = teacherExams.map(exam => {
            const eAttempts = allAttempts.filter(a => a.examId === exam.id);
            const eTotal = eAttempts.length;
            const eAvg = eTotal > 0
                ? eAttempts.reduce((acc, a) => acc + (exam.totalMarks > 0 ? (a.score / exam.totalMarks) * 100 : 0), 0) / eTotal
                : 0;
            const ePassed = eAttempts.filter(a => exam.passingMarks > 0 ? a.score >= exam.passingMarks : (exam.totalMarks > 0 ? (a.score / exam.totalMarks) * 100 : 0) >= 40).length;
            return {
                title: exam.title,
                subject: exam.subject || "General",
                attempts: eTotal,
                avgScore: Math.round(eAvg * 10) / 10,
                passRate: eTotal > 0 ? Math.round((ePassed / eTotal) * 100) : 0,
            };
        }).filter(e => e.attempts > 0).sort((a, b) => b.attempts - a.attempts).slice(0, 8);

        // At-risk students
        const studentScoreMap = new Map<string, { name: string; scores: number[]; attempts: number }>();
        allAttempts.forEach(a => {
            const pct = a.exam.totalMarks > 0 ? (a.score / a.exam.totalMarks) * 100 : 0;
            const key = a.studentId;
            if (!studentScoreMap.has(key)) {
                studentScoreMap.set(key, { name: a.student.fullName || a.student.email || "Unknown", scores: [], attempts: 0 });
            }
            const entry = studentScoreMap.get(key)!;
            entry.scores.push(pct);
            entry.attempts++;
        });

        const atRiskStudents = Array.from(studentScoreMap.entries()).map(([, s]) => {
            const sAvg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
            const deviation = Math.round(sAvg - avgScore);
            return {
                name: s.name,
                score: Math.round(sAvg),
                deviation,
                attempts: s.attempts,
                status: deviation < -15 ? "Critical" : deviation < -5 ? "Watch" : "Safe",
            };
        }).filter(s => s.status !== "Safe").sort((a, b) => a.deviation - b.deviation).slice(0, 6);

        // Subject accuracy
        const batches = await prisma.batch.findMany({
            where: { teacherId },
            select: { id: true, enrollments: { select: { studentId: true } } },
        });
        const batchStudentIds = Array.from(new Set(batches.flatMap(b => b.enrollments.map(e => e.studentId))));

        const topicProgressRows = await prisma.topicProgress.findMany({
            where: { studentId: { in: batchStudentIds }, totalAttempted: { gt: 0 } },
            select: { subject: true, totalAttempted: true, totalCorrect: true },
        });

        const subjectMap = new Map<string, { correct: number; attempted: number }>();
        topicProgressRows.forEach(row => {
            const existing = subjectMap.get(row.subject) ?? { correct: 0, attempted: 0 };
            existing.correct += row.totalCorrect;
            existing.attempted += row.totalAttempted;
            subjectMap.set(row.subject, existing);
        });

        const subjectAccuracy = Array.from(subjectMap.entries())
            .map(([subject, { correct, attempted }]) => ({
                subject,
                accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
                attempts: attempted,
            }))
            .sort((a, b) => b.attempts - a.attempts)
            .slice(0, 8);

        // Top students by XP
        const topProfilesRaw = await prisma.studentLearningProfile.findMany({
            where: { studentId: { in: batchStudentIds } },
            orderBy: { totalXP: "desc" },
            take: 5,
            include: { student: { select: { fullName: true, email: true } } },
        });

        const topStudents = topProfilesRaw.map((p, i) => {
            const sAttempts = allAttempts.filter(a => a.studentId === p.studentId);
            const sAvg = sAttempts.length > 0
                ? sAttempts.reduce((acc, a) => acc + (a.exam.totalMarks > 0 ? (a.score / a.exam.totalMarks) * 100 : 0), 0) / sAttempts.length
                : 0;
            return {
                name: p.student.fullName || p.student.email || "Student",
                xp: p.totalXP,
                rank: i + 1,
                level: p.level,
                avgScore: Math.round(sAvg),
            };
        });

        return {
            stats: {
                totalAttempts,
                avgScore,
                passRate,
                activeStudents: uniqueStudentIds.size,
                totalExams: teacherExams.length,
                publishedExams: teacherExams.filter(e => e.status === "PUBLISHED").length,
            },
            trends,
            examPerformance,
            atRiskStudents,
            subjectAccuracy,
            topStudents,
            teacherName: teacher.fullName || "Educator",
        };
    }
}
