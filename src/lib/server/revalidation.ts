import "server-only";

import { revalidatePath } from "next/cache";

export function revalidateBatchSurfaces() {
    revalidatePath("/admin/dashboard");
    revalidatePath("/teacher/batches");
    revalidatePath("/teacher/students");
    revalidatePath("/teacher/updates");
    revalidatePath("/student/updates");
}

export function revalidateMaterialSurfaces() {
    revalidatePath("/admin/dashboard");
    revalidatePath("/study-material");
    revalidatePath("/teacher/free-resources");
    revalidatePath("/teacher/materials");
    revalidatePath("/student/dashboard");
    revalidatePath("/student/free-resources");
    revalidatePath("/student/materials");
}

export function revalidatePastYearQuestionSurfaces() {
    revalidatePath("/teacher/past-year-questions");
    revalidatePath("/student/past-year-questions");
    revalidatePath("/past-year-questions");
}

export function revalidateExamSurfaces(attemptId?: string) {
    revalidatePath("/teacher/test-series");
    revalidatePath("/student/exams");

    if (attemptId) {
        revalidatePath(`/student/results/${attemptId}`);
    }
}

export function revalidateProfileSurfaces(role: "TEACHER" | "STUDENT") {
    if (role === "STUDENT") {
        revalidatePath("/");
        revalidatePath("/student", "layout");
        revalidatePath("/student/dashboard");
        revalidatePath("/student/exams");
        revalidatePath("/student/profile");
        revalidatePath("/student/history");
        revalidatePath("/student/analytics");
        return;
    }

    revalidatePath("/teacher", "layout");
    revalidatePath("/teacher/profile");
}

export function revalidateAdminSurfaces() {
    revalidatePath("/admin/dashboard");
    revalidatePath("/teacher/dashboard");
    revalidatePath("/teacher/profile");
    revalidatePath("/teacher/batches");
    revalidatePath("/teacher/materials");
    revalidatePath("/teacher/updates");
    revalidatePath("/teacher/students");
    revalidatePath("/teacher/questions");
    revalidatePath("/teacher/mcq-extract");
    revalidatePath("/teacher/analytics");
    revalidatePath("/student/dashboard");
    revalidatePath("/student/profile");
    revalidatePath("/student/exams");
    revalidatePath("/student/materials");
    revalidatePath("/student/updates");
    revalidatePath("/student/analytics");
    revalidatePath("/exam");
    revalidatePath("/exam/war-room");
}

export function revalidatePlanSurfaces() {
    revalidatePath("/student/dashboard");
    revalidatePath("/teacher/dashboard");
    revalidatePath("/student/profile");
    revalidatePath("/teacher/profile");
    revalidatePath("/student/plan");
    revalidatePath("/teacher/plan");
}
