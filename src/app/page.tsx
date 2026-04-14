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
    Target,
    House,
    MagnifyingGlass,
    Bell,
    UserCircle,
    List,
    ChartPieSlice,
    BookOpen,
    Notebook
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

// --- Live UI Mockup Component ---

function LiveDashboardPreview() {
    return (
        <div className="relative w-full max-w-[580px] aspect-[1.4] bg-white rounded-2xl border border-slate-200/60 shadow-[0_32px_80px_-16px_rgba(15,44,189,0.1)] overflow-hidden flex flex-col group/mockup">
            {/* Minimalist Top Bar */}
            <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-4 flex-1">
                    <List size={20} className="text-slate-400 group-hover/mockup:text-blue-600 transition-colors" />
                    <div className="h-8 flex-1 max-w-[200px] rounded-lg bg-slate-50 border border-slate-100 flex items-center px-3 gap-2">
                        <MagnifyingGlass size={14} className="text-slate-300" />
                        <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Bell size={20} className="text-slate-400" />
                        <div className="absolute top-0 right-0 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 ring-2 ring-white overflow-hidden">
                        <UserCircle size={24} weight="fill" />
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Pro Sidebar (Collapsed) */}
                <div className="w-16 border-r border-slate-100 bg-slate-50/50 flex flex-col items-center py-6 gap-6 z-10">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                        <House size={20} weight="fill" />
                    </div>
                    <div className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all">
                        <Exam size={20} />
                    </div>
                    <div className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all">
                        <Notebook size={20} />
                    </div>
                    <div className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all mt-auto mb-2">
                        <ChartPieSlice size={20} />
                    </div>
                </div>

                {/* Dashboard Context */}
                <div className="flex-1 p-6 space-y-6 overflow-hidden bg-white relative text-slate-900">
                    {/* Background Subtle Pattern - Note: .bg-dot-grid should be in globals.css */}
                    <div className="absolute inset-0 bg-dot-grid opacity-[0.1] pointer-events-none"></div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-end justify-between">
                            <div className="space-y-1">
                                <div className="text-[10px] font-black uppercase tracking-widest text-blue-600">Daily Mastery</div>
                                <h4 className="text-xl font-bold text-slate-900 tracking-tight">Focus Metrics.</h4>
                            </div>
                            <div className="flex gap-2 text-slate-900">
                                <div className="px-3 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Sparkle size={12} className="text-blue-400" />
                                    AIR 12 Trace
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* SVG Radar Chart Simulation */}
                            <div className="relative aspect-square rounded-2xl border border-slate-100 bg-slate-50/30 p-4 flex flex-col items-center justify-center">
                                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl ">
                                    {/* Radar Polygons */}
                                    <path d="M50 10 L90 35 L75 85 L25 85 L10 35 Z" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
                                    <path d="M50 20 L80 40 L70 75 L30 75 L20 40 Z" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
                                    <path d="M50 35 L65 45 L60 65 L40 65 L35 45 Z" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
                                    
                                    {/* Data Line */}
                                    <path 
                                        d="M50 15 L85 38 L65 70 L40 85 L20 30 Z" 
                                        fill="rgba(37, 99, 235, 0.1)" 
                                        stroke="#2563EB" 
                                        strokeWidth="1.5" 
                                        strokeLinejoin="round"
                                        className="animate-in fade-in duration-1000"
                                    />
                                    
                                    {/* Value Points */}
                                    {[15, 38, 70, 85, 30].map((v, i) => {
                                        const angles = [0, 72, 144, 216, 288];
                                        const r = v;
                                        const x = 50 + r * Math.sin(angles[i] * Math.PI / 180) * 0.4;
                                        const y = 50 - r * Math.cos(angles[i] * Math.PI / 180) * 0.4;
                                        return <circle key={i} cx={x} cy={y} r="1.5" fill="white" stroke="#2563EB" strokeWidth="1" />;
                                    })}
                                </svg>
                                <div className="mt-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Subject Mastery Radar</div>
                            </div>

                            {/* Recent Activity / Assessment Card */}
                            <div className="space-y-4 text-slate-900">
                                <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm space-y-3 group/card transition-all hover:border-blue-600/20 hover:shadow-md">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <BookOpen size={16} weight="bold" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-900">CA Final - Audit</div>
                                            <div className="text-[9px] text-slate-400 font-medium">Chapter 4. Professional Ethics</div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400">Progress</span>
                                            <span className="text-blue-600">85% Correct</span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full w-[85%] bg-blue-600 rounded-full group-hover/card:scale-x-105 origin-left transition-transform"></div>
                                        </div>
                                    </div>
                                    <button className="w-full py-2 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-blue-600 transition-colors">
                                        Resume Mock
                                    </button>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Peer Rank</span>
                                        <span className="text-emerald-500">Top 2%</span>
                                    </div>
                                    <div className="flex items-end gap-1.5 h-8">
                                        {[40, 70, 45, 90, 65, 80, 55, 95].map((h, i) => (
                                            <div key={i} style={{ height: `${h}%` }} className="w-full bg-blue-600/10 rounded-t-sm group-hover/mockup:bg-blue-600/20 transition-colors"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Soft Overlay */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-white/0 rounded-2xl ring-1 ring-slate-900/5 ring-inset"></div>
        </div>
    );
}

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
                {/* Specialized Hero - Live UI Preview */}
                <section className="relative min-h-[85vh] flex items-center pt-24 pb-20 overflow-hidden bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 border-b border-slate-100">
                    {/* Background Subtle Glow */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[140px]"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px]"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100/50 text-blue-700 text-[10px] font-extrabold tracking-[0.2em] uppercase shadow-sm">
                                <Sparkle size={14} weight="fill" className="text-emerald-500" />
                                High-Integrity Prep • Financly
                            </div>

                            <div className="space-y-8">
                                <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-950 tracking-tighter leading-[0.95]">
                                    Specialized
                                    <span className="text-blue-600 block mt-2 underline decoration-blue-100 decoration-8 underline-offset-[12px]">CA Test Series.</span>
                                </h1>
                                <p className="max-w-xl text-xl text-slate-600 leading-relaxed font-medium">
                                    A high-performance workspace to run mocks, revisit chapters, and stay aligned with your next attempt. No noise, just discipline.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                                <Link
                                    href="/exam"
                                    className="brand-button-primary w-full sm:w-auto"
                                >
                                    Enter Test Series
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                                >
                                    Explore Pass Pro
                                </Link>
                            </div>

                            <div className="flex items-center gap-8 pt-8 border-t border-slate-50">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-800 overflow-hidden shadow-xl">
                                            <img src={`https://i.pravatar.cc/100?u=user${i}`} alt="user" />
                                        </div>
                                    ))}
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">+12k</div>
                                </div>
                                <div className="text-sm font-medium text-slate-500">
                                    <span className="text-slate-950 font-bold block mb-1 uppercase tracking-widest text-[10px]">Trusted Community</span>
                                    Preparing for CA Foundation & Inter
                                </div>
                            </div>
                        </div>

                        <div className="relative group lg:block hidden">
                            <div className="absolute inset-0 bg-blue-600/5 rounded-full blur-[140px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            
                            {/* Floating High-Status Badges */}
                            <div className="absolute -top-6 -left-6 z-30 animate-bounce transition-all duration-1000 scale-90 xxl:scale-100">
                                <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 p-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.06)] flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <ShieldCheck size={24} weight="fill" />
                                    </div>
                                    <div className="pr-2 text-slate-900">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Trust Engine</div>
                                        <div className="text-sm font-bold text-slate-900 leading-none">Verified Results</div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -bottom-10 -right-10 z-30 transition-all duration-700 hover:scale-105 scale-90 xxl:scale-100">
                                <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                                        <Target size={28} weight="bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-blue-400 opacity-60">Accuracy Rank</div>
                                        <div className="text-xl font-black text-white leading-none tracking-tighter">94.8% <span className="text-[10px] font-medium text-emerald-400">↑ 2.4%</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* The Live UI Component */}
                            <div className="relative z-20">
                                <LiveDashboardPreview />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.5),transparent)]" />
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center pointer-events-none">
                            {[
                                { val: "12.5M+", lbl: "MCQS ATTEMPTED" },
                                { val: "98.2%", lbl: "ACCURACY TRACKED" },
                                { val: "450k+", lbl: "ASPIRANTS JOINED" },
                                { val: "Rank 1", lbl: "STUDY WORKSPACE" },
                            ].map((s, i) => (
                                <div key={i} className="space-y-4">
                                    <div className="text-4xl md:text-5xl lg:text-7xl font-black italic tracking-tighter text-white font-mono">
                                        {s.val}
                                    </div>
                                    <div className="text-[10px] md:text-xs font-black text-blue-400 uppercase tracking-[0.3em] opacity-80">
                                        {s.lbl}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-32 bg-slate-50 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 space-y-32">
                        <div className="max-w-3xl space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/5 border border-blue-600/10 text-blue-600 text-[10px] font-bold uppercase tracking-[0.25em]">
                                The Engineering behind the Prep
                            </div>
                            <h2 className="text-4xl lg:text-7xl font-extrabold text-slate-950 tracking-tighter leading-[1.1]">
                                Built for <span className="text-blue-600">Focus,</span><br />not just features.
                            </h2>
                            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">
                                A high-performance environment designed for the serious candidate who values structural discipline and deep subject analytics over fluff.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-24 text-slate-900">
                            {[
                                {
                                    id: "01",
                                    icon: Timer,
                                    title: "Exam-Grade Simulation",
                                    desc: "Proctored 3-hour tests designed around real ICAI patterns. No distractions, just pure focus and time-tested discipline.",
                                    accent: "text-blue-600"
                                },
                                {
                                    id: "02",
                                    icon: Target,
                                    title: "Subject-Wise Precision",
                                    desc: "Focus on Foundation, Inter, or Final chapters with curated banks. Revisit weak areas with subject-level drill sets.",
                                    accent: "text-blue-600"
                                },
                                {
                                    id: "03",
                                    icon: ChartLineUp,
                                    title: "Unified Hub Progress",
                                    desc: "Mocks, PYQs, and revision materials in one workspace. Stay aligned with your next attempt without bouncing between tools.",
                                    accent: "text-blue-600"
                                }
                            ].map((feature, idx) => (
                                <div key={idx} className="group relative pt-12">
                                    {/* Architectural Background Number */}
                                    <div className="absolute top-0 left-0 text-7xl font-black text-transparent [-webkit-text-stroke:1px_rgba(15,44,189,0.08)] select-none italic tracking-tighter">
                                        {feature.id}
                                    </div>
                                    
                                    <div className="relative space-y-6">
                                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-blue-600 group-hover:text-blue-600 group-hover:shadow-blue-600/10">
                                            <feature.icon size={28} weight="bold" />
                                        </div>
                                        <div className="space-y-4 text-slate-900">
                                            <h3 className="text-2xl font-bold text-slate-950 tracking-tight">{feature.title}</h3>
                                            <p className="text-slate-500 text-lg font-medium leading-relaxed">{feature.desc}</p>
                                        </div>
                                        <div className="h-1 w-12 bg-slate-200 group-hover:w-16 group-hover:bg-blue-600 transition-all duration-500"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <Testimonials />

                {/* Flagship White-Card CTA */}
                <section className="px-6 py-24 bg-slate-50 relative overflow-hidden">
                    <div className="mx-auto max-w-7xl rounded-lg bg-white border border-slate-200 p-10 lg:p-20 text-center relative shadow-[0_40px_100px_-20px_rgba(15,44,189,0.05)] overflow-hidden">
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

                            <p className="text-xl lg:text-2xl text-slate-600 font-medium leading-relaxed">
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

                            <div className="pt-12 flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-40 grayscale hover:grayscale-0 transition-all">
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
