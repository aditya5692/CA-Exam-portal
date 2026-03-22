import { getSessionPayload } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { StudentLayoutClient } from "./layout-client";

export default async function StudentLayout({ children }: { children: ReactNode }) {
    const session = await getSessionPayload();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
        redirect("/auth/login");
    }
    const initials = (session.fullName ?? "Student")
        .split(" ")
        .map((word) => word[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const sessionData = {
        fullName: session.fullName,
        role: session.role,
        plan: (session as any).plan ?? "Free"
    };

    return (
        <StudentLayoutClient session={sessionData} initials={initials}>
            {children}
        </StudentLayoutClient>
    );
}
