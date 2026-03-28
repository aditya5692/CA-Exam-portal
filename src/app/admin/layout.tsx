import { requireSessionRole } from "@/lib/auth/route-guard";
import type { ReactNode } from "react";
import { TeacherLayoutClient } from "@/components/teacher/layout-client";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const admin = await requireSessionRole(["ADMIN", "TEACHER"]);

    if (admin.role !== "ADMIN" && !admin.isSuperAdmin) {
        redirect("/teacher/dashboard");
    }

    return (
        <TeacherLayoutClient session={{
            fullName: admin.fullName,
            role: admin.role,
            isSuperAdmin: admin.isSuperAdmin ?? false
        }}>
            {children}
        </TeacherLayoutClient>
    );
}
