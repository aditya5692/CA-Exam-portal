import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { PastYearQuestionsDashboard } from "@/components/home/PastYearQuestionsDashboard";
import { getCurrentUser } from "@/lib/auth/session";

export default async function PastYearQuestionsPage() {
    const user = await getCurrentUser();

    return (
        <div className="min-h-screen bg-white">
            <Navbar user={user} />

            <main className="pt-24 sm:pt-32 pb-20">
                <PastYearQuestionsDashboard />
            </main>

            <Footer />
        </div>
    );
}
