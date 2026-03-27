import { getSessionPayload } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { TeacherLayoutClient } from "@/components/teacher/layout-client";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const admin = await getSessionPayload();

    if (!admin || (admin.role !== "ADMIN" && !admin.isSuperAdmin)) {
        redirect("/auth/login");
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
