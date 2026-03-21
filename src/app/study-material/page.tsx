import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { FreeResourcesDashboard } from "@/components/home/FreeResourcesDashboard";
import { getSessionPayload } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function StudyMaterialPage() {
    const session = await getSessionPayload();

    if (session) {
        if (session.role === "ADMIN") redirect("/admin/dashboard");
        if (session.role === "TEACHER") redirect("/teacher/free-resources");
        redirect("/student/free-resources");
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar user={session} />

            <main className="pt-24 sm:pt-32 pb-20">
                <FreeResourcesDashboard />
            </main>

            <Footer />
        </div>
    );
}
