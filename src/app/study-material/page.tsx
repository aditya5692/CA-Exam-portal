import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { FreeResourcesDashboard } from "@/components/home/FreeResourcesDashboard";
import { getCurrentUser } from "@/lib/auth/session";

export default async function StudyMaterialPage() {
    const user = await getCurrentUser();
    const saveState = !user
        ? "login"
        : user.role === "STUDENT" || user.role === "ADMIN"
            ? "enabled"
            : "hidden";

    return (
        <div className="min-h-screen bg-white">
            <Navbar user={user} />

            <main className="pt-24 sm:pt-32 pb-20">
                <FreeResourcesDashboard
                    saveState={saveState}
                    loginHref="/auth/login"
                    showFeaturePrompt={!user}
                />
            </main>

            <Footer />
        </div>
    );
}
