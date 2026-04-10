import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { cn } from "@/lib/utils";
import { Testimonials } from "@/components/common/testimonials";
import { getSessionPayload } from "@/lib/auth/session";
import {
    CaretRight,
    ChalkboardTeacher,
    ChartLineUp,
    CheckCircle,
    Exam,
    GraduationCap,
    Play,
    ShieldCheck,
    Sparkle,
    Timer,
    Books,
    Trophy,
    Target
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";

const FEATURE_CARDS = [
    {
        title: "Exam-grade simulation",
        description: "Timed practice, answer discipline, and review cues designed around the pace students actually need.",
        icon: Exam,
        color: "blue"
    },
    {
        title: "Subject-wise precision",
        description: "Focus on CA Foundation, Inter, or Final chapters with curated MCQ banks and instant feedback.",
        icon: Books,
        color: "emerald"
    },
    {
        title: "High-yield Analytics",
        description: "Identify patterns in your mistakes and track your accuracy across different subjects in real-time.",
        icon: ChartLineUp,
        color: "rose"
    }
];

export default async function Home() {
    const session = await getSessionPayload();

    if (session) {
        if (session.role === "ADMIN") redirect("/admin/dashboard");
        if (session.role === "TEACHER") redirect("/teacher/dashboard");
        redirect("/student/dashboard");
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
            <Navbar user={session} />

            <main>
                {/* Simplified Minimalist Hero - Light Premium */}
                <section className="relative min-h-[75vh] flex items-center pt-20 pb-12 overflow-hidden bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 border-b border-slate-100">
                    {/* Background Subtle Glow */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]"></div>
                    </div>
                    <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-10">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100/50 text-blue-700 text-[10px] font-extrabold tracking-[0.2em] uppercase shadow-sm">
                                <Sparkle size={14} weight="fill" className="text-emerald-500" />
                                High-Integrity Prep • Financly
                            </div>

                            <div className="space-y-6">
                                <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-950 tracking-tighter leading-[0.95]">
                                    Specialized
                                    <span className="text-blue-600 block mt-2 underline decoration-blue-100 decoration-8 underline-offset-[12px]">CA Test Series.</span>
                                </h1>
                                <p className="max-w-xl text-xl text-slate-600 leading-relaxed font-medium">
                                    A high-performance workspace to run mocks, revisit chapters, and stay aligned with your next attempt. No noise, just discipline.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
                                <Link
                                    href="/exam"
                                    className="brand-button-primary w-full sm:w-auto"
                                >
                                    Enter Test Series
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                                >
                                    Explore Pass Pro
                                </Link>
                            </div>

                            <div className="flex items-center gap-8 pt-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 overflow-hidden shadow-xl">
                                            <img src={`https://i.pravatar.cc/100?u=user${i}`} alt="user" />
                                        </div>
                                    ))}
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-900">+12k</div>
                                </div>
                                <div className="text-sm font-medium text-slate-500">
                                    <span className="text-slate-950 font-bold block mb-1">Join 12,000+ students</span>
                                    Preparing for CA Foundation & Inter
                                </div>
                            </div>
                        </div>

                        <div className="relative group lg:block hidden">
                            <div className="absolute inset-0 bg-blue-500/20 rounded-[2.5rem] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <div className="relative glass-surface rounded-[2.5rem] border-white/10 p-4 shadow-2xl scale-100 hover:scale-[1.02] transition-transform duration-500 overflow-hidden">
                                <div className="bg-slate-900 rounded-[2rem] overflow-hidden border border-white/5 relative">
                                    {/* Mock Dashboard UI Preview */}
                                    <div className="p-8 space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div className="h-4 w-32 bg-slate-800 rounded-full"></div>
                                            <div className="flex gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20"></div>
                                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20"></div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="h-32 rounded-2xl bg-white/5 border border-white/5 p-6 space-y-4">
                                                <div className="h-3 w-12 bg-emerald-500/40 rounded-full"></div>
                                                <div className="h-4 w-20 bg-white/20 rounded-full"></div>
                                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full w-[75%] bg-emerald-500 rounded-full"></div>
                                                </div>
                                            </div>
                                            <div className="h-32 rounded-2xl bg-white/5 border border-white/5 p-6 space-y-4">
                                                <div className="h-3 w-12 bg-blue-500/40 rounded-full"></div>
                                                <div className="h-4 w-20 bg-white/20 rounded-full"></div>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-4 w-1 bg-blue-500/40 rounded-full"></div>)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-48 rounded-2xl bg-white/[0.02] border border-white/5 p-6 relative overflow-hidden group/chart">
                                            <div className="h-full w-full flex items-end justify-between gap-2">
                                                {[40, 70, 45, 90, 65, 80, 55, 95].map((h, i) => (
                                                    <div
                                                        key={i}
                                                        style={{ height: `${h}%` }}
                                                        className="w-full bg-gradient-to-t from-[#0f2cbd]/40 to-blue-400 group-hover/chart:translate-y-[-10%] transition-transform duration-500 rounded-t-lg"
                                                    ></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PLATFORM MOMENTUM STRIP - DARK PREMIUM MATCHING IMAGE */}
                <section className="py-16 bg-[#0B1222] text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.5),transparent)]" />
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center pointer-events-none">
                            {[
                                { val: "12.5M+", lbl: "MCQS ATTEMPTED" },
                                { val: "98.2%", lbl: "ACCURACY TRACKED" },
                                { val: "450k+", lbl: "ASPIRANTS JOINED" },
                                { val: "Rank 1", lbl: "STUDY WORKSPACE" },
                            ].map((s, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="text-4xl md:text-5xl lg:text-7xl font-black italic tracking-tighter text-white">
                                        {s.val}
                                    </div>
                                    <div className="text-[10px] md:text-xs font-black text-blue-500 uppercase tracking-[0.2em]">
                                        {s.lbl}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* REDESIGNED: Industrial Feature Hub - High Status */}
                <section className="py-24 bg-slate-50 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 space-y-24">
                        <div className="max-w-3xl space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0f2cbd]/5 border border-[#0f2cbd]/10 text-[#0f2cbd] text-[10px] font-bold uppercase tracking-widest">
                                The Engineering behind the Prep
                            </div>
                            <h2 className="text-4xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-tight">
                                Built for <span className="text-blue-600">Focus,</span> not just features.
                            </h2>
                            <p className="text-xl text-slate-600 font-medium leading-relaxed">
                                A high-performance environment designed for the serious candidate who values structural discipline and deep subject analytics over fluff.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
                            {[
                                {
                                    id: "01",
                                    title: "Exam-Grade Simulation",
                                    desc: "Proctored 3-hour tests designed around real ICAI patterns. No distractions, just pure focus and time-tested discipline.",
                                    accent: "text-blue-600"
                                },
                                {
                                    id: "02",
                                    title: "Subject-Wise Precision",
                                    desc: "Focus on Foundation, Inter, or Final chapters with curated banks. Revisit weak areas with subject-level drill sets.",
                                    accent: "text-emerald-500"
                                },
                                {
                                    id: "03",
                                    title: "Unified Hub Progress",
                                    desc: "Mocks, PYQs, and revision materials in one workspace. Stay aligned with your next attempt without bouncing between tools.",
                                    accent: "text-slate-950"
                                }
                            ].map((feature, idx) => (
                                <div key={idx} className="group space-y-8 relative">
                                    <div className="text-7xl font-extrabold text-slate-950/5 select-none transition-colors group-hover:text-blue-600/10 italic tracking-tighter">
                                        {feature.id}
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-bold text-slate-950 tracking-tight">{feature.title}</h3>
                                        <p className="text-slate-600 text-lg font-medium leading-relaxed">{feature.desc}</p>
                                    </div>
                                    <div className="h-0.5 w-12 bg-slate-200 group-hover:w-full group-hover:bg-[#0f2cbd] transition-all duration-500"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <Testimonials />

                {/* REDESIGNED: Flagship White-Card CTA */}
                <section className="px-6 py-24 bg-slate-50 relative overflow-hidden">
                    <div className="mx-auto max-w-7xl rounded-[3rem] bg-white border border-slate-200 p-10 lg:p-20 text-center relative shadow-[0_40px_100px_-20px_rgba(15,44,189,0.05)] overflow-hidden">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(15,44,189,0.03),transparent)]"></div>

                        <div className="relative z-10 space-y-12 max-w-4xl mx-auto">
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100/50 px-6 py-2 text-xs font-extrabold text-emerald-600 uppercase tracking-widest shadow-sm">
                                <Target size={16} weight="bold" />
                                Build momentum first.
                            </div>

                            <h2 className="text-4xl lg:text-7xl font-extrabold text-slate-950 tracking-tighter leading-[0.95]">
                                Ready to accelerate your <span className="text-blue-600 block sm:inline italic">CA Prep?</span>
                            </h2>

                            <p className="text-xl lg:text-2xl text-slate-600 font-medium   leading-relaxed">
                                Join the high-integrity workspace where discipline meets performance. Claim your access to Financly today.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-6">
                                <Link
                                    href="/auth/signup"
                                    className="brand-button-primary !py-6 !px-16 !text-xl shadow-[0_25px_60px_-15px_rgba(15,44,189,0.4)]"
                                >
                                    Join Financly Free
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="px-12 py-5 text-xl font-bold text-slate-950 hover:text-blue-600 transition-all flex items-center gap-3 group"
                                >
                                    View Pricing
                                    <CaretRight size={15} weight="bold" className="transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>

                            <div className="pt-12 flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Trusted by students from:</div>
                                <div className="font-extrabold text-lg text-slate-950 tracking-tighter">foundation.com</div>
                                <div className="font-extrabold text-lg text-slate-950 tracking-tighter">interhub</div>
                                <div className="font-extrabold text-lg text-slate-950 tracking-tighter">finalprep.in</div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
