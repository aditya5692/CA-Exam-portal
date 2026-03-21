import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { PastYearQuestionsDashboard } from "@/components/home/PastYearQuestionsDashboard";
import { getSessionPayload } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function PastYearQuestionsPage() {
    const session = await getSessionPayload();

    if (session) {
        if (session.role === "ADMIN") redirect("/admin/dashboard");
        if (session.role === "TEACHER") redirect("/teacher/past-year-questions");
        redirect("/student/past-year-questions");
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar user={session} />

            <main className="pt-24 sm:pt-32 pb-20">
                <PastYearQuestionsDashboard />
            </main>

            <Footer />
        </div>
    );
}
