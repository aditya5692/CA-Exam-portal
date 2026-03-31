import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { FreeResourcesDashboard } from "@/components/home/FreeResourcesDashboard";
import { getCurrentUser } from "@/lib/auth/session";
import { Lexend } from "next/font/google";

const lexend = Lexend({
    subsets: ["latin"],
    display: "swap",
});

export default async function PastYearQuestionsPage() {
    const user = await getCurrentUser();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            <Navbar user={user} />

            <main className="pt-24 sm:pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    {/* High-Impact Hero Banner */}
                    <div className="mb-16 bg-white border border-slate-200 rounded-[2.5rem] p-10 lg:p-16 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/5 to-transparent"></div>
                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                            <div className="max-w-2xl space-y-6 text-center lg:text-left">
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold uppercase tracking-widest text-blue-600">
                                    Archive Library
                                </span>
                                <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-950">
                                    Past Year <span className="text-blue-600">Archives.</span>
                                </h1>
                                <p className="text-slate-600 text-lg font-medium leading-relaxed max-w-xl">
                                    The definitive collection of ICAI question papers and suggested answers from 2018 to 2024.
                                </p>
                            </div>
                            <div className="flex flex-col items-center lg:items-end gap-3">
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-slate-950 tracking-tight">850+</div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Files Downloaded</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <FreeResourcesDashboard 
                        saveState={user ? "enabled" : "login"}
                        initialSubType="PYQ"
                        defaultView="TABLE"
                    />
                </div>
            </main>

            <Footer />
        </div>
    );
}
