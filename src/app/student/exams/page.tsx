import { getStudentVisibleExams } from "@/actions/publish-exam-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { getStudentCACategory,resolveStudentCALevel } from "@/lib/student-level";
import StudentExamsClient from "./client";

export const dynamic = "force-dynamic";

export default async function StudentExamsPage() {
    // 1. Get current student
    const user = await getCurrentUser(["STUDENT", "ADMIN"]).catch(() => null);

    const caLevelKey = resolveStudentCALevel(user?.examTarget, user?.department);
    const caLevelLabel = getStudentCACategory(caLevelKey);

    // 2. Fetch visible exams
    const examsRes = await getStudentVisibleExams(caLevelKey);
    const exams = examsRes.data ?? [];

    // 3. Build unique teacher list from real exam data
    const teacherMap = new Map<string, { name: string; subjects: Set<string>; examCount: number }>();
    for (const e of exams) {
        const existing = teacherMap.get(e.teacherName) ?? { name: e.teacherName, subjects: new Set(), examCount: 0 };
        existing.subjects.add(e.category);
        existing.examCount += 1;
        teacherMap.set(e.teacherName, existing);
    }
    const teachers = Array.from(teacherMap.values()).map((t) => ({
        name: t.name,
        subjects: Array.from(t.subjects),
        examCount: t.examCount,
    }));

    let daysToExam = 0;
    const userTarget = user?.examTarget || "";
    if (userTarget) {
        const months = { "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11 };
        const parts = userTarget.split(" ");
        if (parts.length >= 2) {
            const moPartRaw = parts[parts.length - 2].substring(0, 3).toLowerCase();
            const moKey = Object.keys(months).find(k => k.toLowerCase() === moPartRaw);
            const yrPart = parseInt(parts[parts.length - 1]);
            if (moKey && !isNaN(yrPart)) {
                const targetDate = new Date(yrPart, months[moKey as keyof typeof months], 1);
                const now = new Date();
                const diffTime = targetDate.getTime() - now.getTime();
                daysToExam = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }
        }
    }

    return (
        <StudentExamsClient
            caLevelKey={caLevelKey}
            caLevelLabel={caLevelLabel}
            exams={exams}
            teachers={teachers}
            studentName={user?.fullName ?? user?.email ?? "Student"}
            daysToExam={daysToExam}
        />
    );
}
