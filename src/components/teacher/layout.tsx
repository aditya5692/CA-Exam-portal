import { requireSessionRole } from "@/lib/auth/route-guard";
import { ReactNode } from "react";
import { TeacherLayoutClient } from "./layout-client";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
    const session = await requireSessionRole(["TEACHER", "ADMIN"]);

    const sessionData = {
        fullName: session.fullName,
        role: session.role,
        isSuperAdmin: session.isSuperAdmin ?? false
    };

    return (
        <TeacherLayoutClient session={sessionData}>
            {children}
        </TeacherLayoutClient>
    );
}
