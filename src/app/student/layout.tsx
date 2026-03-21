import StudentLayout from "@/components/student/layout";
import type { ReactNode } from "react";

export default function StudentRouteLayout({ children }: { children: ReactNode }) {
    return <StudentLayout>{children}</StudentLayout>;
}