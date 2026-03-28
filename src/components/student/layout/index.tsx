import { requireSessionRole } from "@/lib/auth/route-guard";
import { ReactNode } from "react";
import { StudentLayoutClient } from "./layout-client";

export default async function StudentLayout({ children }: { children: ReactNode }) {
    const session = await requireSessionRole(["STUDENT", "ADMIN"]);

    const initials = (session.fullName ?? "Student")
        .split(" ")
        .map((word) => word[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const sessionData = {
        fullName: session.fullName,
        role: session.role,
        plan: session.plan ?? "Free"
    };

    return (
        <StudentLayoutClient session={sessionData} initials={initials}>
            {children}
        </StudentLayoutClient>
    );
}
