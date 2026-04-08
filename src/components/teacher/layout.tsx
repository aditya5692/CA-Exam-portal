import { requireSessionRole } from "@/lib/auth/route-guard";
import { ReactNode } from "react";
import { TeacherLayoutClient } from "./layout-client";
import prisma from "@/lib/prisma/client";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
    const session = await requireSessionRole(["TEACHER", "ADMIN"]);

    const sessionData = {
        fullName: session.fullName,
        role: session.role,
        isSuperAdmin: session.isSuperAdmin ?? false
    };

    const subjects = await prisma.subject.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" }
    });

    return (
        <TeacherLayoutClient session={sessionData} subjects={subjects}>
            {children}
        </TeacherLayoutClient>
    );
}
