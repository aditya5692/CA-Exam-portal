import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { FreeResourcesDashboard } from "@/components/home/FreeResourcesDashboard";
import { getCurrentUser } from "@/lib/auth/session";

export default async function StudyMaterialPage() {
    const user = await getCurrentUser();

    return (
        <div className="min-h-screen bg-white font-outfit">
            <Navbar user={user} />

            <main className="pt-24 sm:pt-32 pb-20">
                <div className="max-w-[1600px] mx-auto px-6">
                    <FreeResourcesDashboard 
                        saveState={user ? "enabled" : "login"}
                        defaultView="GRID"
                    />
                </div>
            </main>

            <Footer />
        </div>
    );
}
