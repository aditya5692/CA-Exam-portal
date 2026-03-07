import type { ReactNode } from "react";
import StudentLayout from "@/components/student/layout";

export default function StudentRouteLayout({ children }: { children: ReactNode }) {
    return <StudentLayout>{children}</StudentLayout>;
}