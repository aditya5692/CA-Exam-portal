"use server";

import { requireAuth } from "@/lib/auth/session";
import { withErrorHandler } from "@/lib/server/action-utils";
import { EducatorService } from "@/lib/services/educator-service";

async function requireTeacher() {
    return requireAuth(["TEACHER", "ADMIN"]);
}

export async function getTeacherAnalyticsData() {
    return withErrorHandler(async () => {
        const teacher = await requireTeacher();
        return EducatorService.getTeacherAnalyticsData(teacher);
    }, "Failed to fetch analytics data.");
}
