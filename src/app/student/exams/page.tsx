import { getCurrentUser } from "@/lib/auth/session";
import { getStudentVisibleExams } from "@/actions/publish-exam-actions";
import StudentExamsClient from "./client";

// Normalize the student's examTarget to a CA level key
function resolveCALevel(examTarget: string | null | undefined): "foundation" | "ipc" | "final" {
    const t = (examTarget ?? "").toLowerCase();
    if (t.includes("foundation")) return "foundation";
    if (t.includes("inter") || t.includes("ipc")) return "ipc";
    return "final"; // default to final
}

export default async function StudentExamsPage() {
    // 1. Get current student
    const user = await getCurrentUser(["STUDENT", "ADMIN"]).catch(() => null);

    const caLevelKey = resolveCALevel(user?.examTarget);
    const CA_LEVEL_CATEGORY: Record<string, string> = {
        foundation: "CA Foundation",
        ipc: "CA Intermediate",
        final: "CA Final",
    };
    const caLevelLabel = CA_LEVEL_CATEGORY[caLevelKey];

    // 2. Fetch visible exams
    const examsRes = await getStudentVisibleExams(caLevelKey);
    const exams = examsRes.exams ?? [];

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
        />
    );
}
