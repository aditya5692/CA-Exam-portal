import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { FreeResourcesDashboard } from "@/components/home/FreeResourcesDashboard";
import { getCurrentUser } from "@/lib/auth/session";
import { Lexend } from "next/font/google";
import { redirect } from "next/navigation";

const lexend = Lexend({
    subsets: ["latin"],
    display: "swap",
});

export default async function StudyMaterialPage() {
    const user = await getCurrentUser();

    if (user?.role === "STUDENT") {
        redirect("/student/free-resources");
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            <Navbar user={user} />

            <main className="pt-24 sm:pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    {/* High-Impact Hero Banner */}
                    <div className="mb-16 bg-white border border-slate-200 rounded-lg p-10 lg:p-16 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/5 to-transparent"></div>
                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                            <div className="max-w-2xl space-y-6 text-center lg:text-left">
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                                    Unified Resource Vault
                                </span>
                                <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-950">
                                    Study <span className="text-indigo-600">Archives.</span>
                                </h1>
                                <p className="text-slate-600 text-lg font-medium leading-relaxed max-w-xl">
                                    Access a comprehensive library of Chapter-wise Notes, RTPs, and the complete Archive of Past Year Papers from 2018 to 2024.
                                </p>
                            </div>
                            <div className="flex flex-col items-center lg:items-end gap-3">
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-slate-950 tracking-tight">2,500+</div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Verified Assets</div>
                                </div>
                            </div>
                        </div>
                    </div>

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
