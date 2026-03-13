import type { ReactNode } from "react";
import TeacherLayout from "@/components/teacher/layout";

export default function TeacherRouteLayout({ children }: { children: ReactNode }) {
    return <TeacherLayout>{children}</TeacherLayout>;
}