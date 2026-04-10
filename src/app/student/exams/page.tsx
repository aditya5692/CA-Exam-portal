import { getStudentVisibleExams } from "@/actions/publish-exam-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { resolveStudentExamTarget } from "@/lib/student-level";
import { redirect } from "next/navigation";
import StudentExamsClient from "./client";

export const dynamic = "force-dynamic";

export default async function StudentExamsPage() {
    // 1. Get current student
    const user = await getCurrentUser(["STUDENT", "ADMIN"]);
    if (!user) {
        redirect("/auth/login");
    }

    const examTarget = resolveStudentExamTarget(user ?? {});
    const caLevelKey = examTarget.caLevelKey;
    const caLevelLabel = examTarget.caLevelLabel;

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

    return (
        <StudentExamsClient
            caLevelKey={caLevelKey}
            caLevelLabel={caLevelLabel}
            exams={exams}
            teachers={teachers}
            studentName={user?.fullName ?? user?.email ?? "Student"}
            daysToExam={examTarget.daysToExam}
        />
    );
}
