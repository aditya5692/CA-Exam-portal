import TeacherLayout from "@/components/teacher/layout";
import type { ReactNode } from "react";

export default function TeacherRouteLayout({ children }: { children: ReactNode }) {
    return <TeacherLayout>{children}</TeacherLayout>;
}