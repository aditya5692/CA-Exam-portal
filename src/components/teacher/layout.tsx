import { getSessionPayload } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { TeacherLayoutClient } from "./layout-client";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
    const session = await getSessionPayload();

    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
        redirect("/auth/login");
    }

    const sessionData = {
        fullName: session.fullName,
        role: session.role
    };

    return (
        <TeacherLayoutClient session={sessionData}>
            {children}
        </TeacherLayoutClient>
    );
}

