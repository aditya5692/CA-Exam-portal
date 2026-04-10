import DashboardOverview from "@/components/teacher/overview";
import { requireSessionRole } from "@/lib/auth/route-guard";

export default async function TeacherDashboardPage() {
    await requireSessionRole(["TEACHER", "ADMIN"]);
    
    return <DashboardOverview />;
}
