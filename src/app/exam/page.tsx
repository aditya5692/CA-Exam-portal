import { getPublicMockExams } from "@/actions/publish-exam-actions";
import { getSessionPayload } from "@/lib/auth/session";
import { Lexend } from "next/font/google";
import Link from "next/link";
import { Navbar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";
import { cn } from "@/lib/utils";

const lexend = Lexend({
    subsets: ["latin"],
    display: "swap",
});

export default async function PublicExamsPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedSearchParams = await searchParams;
    const session = await getSessionPayload();
    const examsRes = await getPublicMockExams();
    let exams = examsRes.data ?? [];

    const filter = typeof resolvedSearchParams.filter === 'string' ? resolvedSearchParams.filter : 'all';
    const sort = typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : 'newest';

    // Apply Filters
    if (filter === 'practice') {
        exams = exams.filter(e => e.examType === 'PRACTICE');
    } else if (filter === 'mock') {
        exams = exams.filter(e => e.examType === 'MTP');
    } else if (filter === 'final') {
        exams = exams.filter(e => e.examType === 'RTP');
    }

    // Apply Sort (Default from DB is newest first)
    if (sort === 'oldest') {
        exams.reverse();
    }

    return (
        <div className={cn(lexend.className, "bg-slate-50 min-h-screen text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden")}>
            <Navbar user={session} />

            <main className="pt-24 sm:pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6 lg:px-10">
                    {/* Standardized Hero Banner - Light Premium */}
                    <div className="mb-16 bg-white border border-slate-200 rounded-lg p-10 lg:p-16 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/5 to-transparent"></div>
                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 text-center lg:text-left">
                            <div className="max-w-xl space-y-6">
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold uppercase tracking-widest text-blue-600">
                                    Exam-Grade Simulation
                                </span>
                                <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-tight text-slate-950">
                                    Ready for a <span className="text-blue-600">Live Mock?</span>
                                </h1>
                                <p className="text-slate-600 text-lg font-medium leading-relaxed">
                                    Simulate the real exam experience with our proctored 3-hour tests and deep subject analytics.
                                </p>
                            </div>
                            <Link 
                                href={session ? "/student/exams" : "/auth/signup"}
                                className="brand-button-primary !py-5 !px-12 !text-lg shadow-xl shadow-blue-500/20"
                            >
                                Start Free Simulation
                            </Link>
                        </div>
                    </div>

                    {/* Sub Navigation & Filters */}
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 border-b border-slate-200 pb-8">
                        <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto no-scrollbar">
                            <Link href={`/exam?filter=all&sort=${sort}`} className={cn("px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors", filter === 'all' ? "bg-white shadow-sm text-[#0f2cbd]" : "text-slate-600 hover:text-[#0f2cbd]")}>All Tests</Link>
                            <Link href={`/exam?filter=practice&sort=${sort}`} className={cn("px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors", filter === 'practice' ? "bg-white shadow-sm text-[#0f2cbd]" : "text-slate-600 hover:text-[#0f2cbd]")}>Practice</Link>
                            <Link href={`/exam?filter=mock&sort=${sort}`} className={cn("px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors", filter === 'mock' ? "bg-white shadow-sm text-[#0f2cbd]" : "text-slate-600 hover:text-[#0f2cbd]")}>Mock Exams</Link>
                            <Link href={`/exam?filter=final&sort=${sort}`} className={cn("px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors", filter === 'final' ? "bg-white shadow-sm text-[#0f2cbd]" : "text-slate-600 hover:text-[#0f2cbd]")}>Final Prep</Link>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-center">
                            <span className="text-sm text-slate-500 font-medium">Sort by:</span>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <Link href={`/exam?filter=${filter}&sort=newest`} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors", sort === 'newest' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900")}>
                                    Newest
                                </Link>
                                <Link href={`/exam?filter=${filter}&sort=oldest`} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors", sort === 'oldest' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900")}>
                                    Oldest
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Industrial Grid Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {exams.length > 0 ? (
                            exams.map((exam) => {
                                const type = exam.examType === "MTP" ? "Mock" : exam.examType === "RTP" ? "Final" : "Practice";
                                const tagBg = 
                                    type === "Practice" ? "bg-blue-100 text-blue-700" : 
                                    type === "Mock" ? "bg-emerald-100 text-emerald-700" : 
                                    "bg-rose-100 text-rose-700";

                                 return (
                                    <div 
                                        key={exam.id} 
                                        className="premium-card flex flex-col border-slate-200 group"
                                    >
                                        <div className="p-6 flex-1 space-y-5">
                                            <div className="flex items-center justify-between">
                                                <span className={`${tagBg} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest`}>
                                                    {type}
                                                </span>
                                                <div className="flex -space-x-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    {[1, 2].map(i => (
                                                        <div key={i} className="size-6 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                                                            <img src={`https://i.pravatar.cc/50?u=u${exam.id}${i}`} alt="user" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-slate-950 font-bold text-base leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
                                                    {exam.title}
                                                </h3>
                                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                                    {exam.subject}
                                                </p>
                                            </div>
                                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <span className="material-symbols-outlined text-sm font-bold">quiz</span>
                                                    <span className="text-xs font-bold">{exam.questionCount} Qs</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <span className="material-symbols-outlined text-sm font-bold">schedule</span>
                                                    <span className="text-xs font-bold">{exam.duration} Min</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link 
                                            href={session ? `/exam/war-room/?id=${exam.id}` : "/auth/signup"}
                                            className="w-full py-4 text-center border-t border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white hover:bg-blue-600 transition-all"
                                        >
                                            Enter Simulation
                                        </Link>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-24 text-center space-y-6 glass-surface border-slate-200">
                                <div className="flex justify-center">
                                    <div className="size-20 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
                                        <span className="material-symbols-outlined text-5xl">inventory_2</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-slate-950">No public mock tests yet</h4>
                                    <p className="text-slate-500 max-w-xs mx-auto">Check back later or register to join a batch for curated assessments.</p>
                                </div>
                                <Link href="/auth/signup" className="brand-button-primary">
                                    Create Free Account
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {exams.length > 0 && (
                        <div className="flex items-center justify-center mt-16 gap-3">
                            <button className="flex size-11 items-center justify-center rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all active:scale-95">
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            <button className="flex size-11 items-center justify-center rounded-lg bg-[#0f2cbd] text-white font-bold shadow-lg shadow-blue-500/20">1</button>
                            <button className="flex size-11 items-center justify-center rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all font-bold">2</button>
                            <button className="flex size-11 items-center justify-center rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all active:scale-95">
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        </div>
                    )}

                    {/* CTA Section - Harmonized */}
                    <div className="mt-32 mb-12 bg-white border border-slate-200 rounded-lg p-12 lg:p-24 relative overflow-hidden text-center shadow-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-emerald-50/50 opacity-50"></div>
                        <div className="relative z-10 space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold tracking-widest uppercase">
                                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                Build Momentum first
                            </div>
                            <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-slate-950 underline underline-offset-[12px] decoration-blue-500/20">
                                Your Workspace, Your Rules.
                            </h2>
                            <p className="text-slate-600 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
                                Every mock attempt is a step closer to your final certification. No noise, just discipline.
                            </p>
                            <div className="pt-6 flex justify-center">
                                <Link 
                                    href="/auth/signup"
                                    className="brand-button-primary !py-6 !px-16 !text-xl"
                                >
                                    Join the Hub
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
