"use client";

import {
    GraduationCap,
    ArrowRight,
    Play,
    Clock,
    IdentificationBadge,
    Trophy,
    BookOpen,
    ChartLineUp,
    ShieldCheck,
    Sparkle
} from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const EXAM_CATEGORIES = [
    { title: "CA Foundation", count: 124, icon: BookOpen, color: "bg-indigo-50", iconColor: "text-indigo-600" },
    { title: "CA Intermediate", count: 350, icon: GraduationCap, color: "bg-emerald-50", iconColor: "text-emerald-600" },
    { title: "CA Final", count: 210, icon: Trophy, color: "bg-amber-50", iconColor: "text-amber-600" },
];

const RECENT_MOCKS = [
    { title: "Financial Reporting - Full Mock", duration: "180 min", level: "Final", type: "Full Length" },
    { title: "Corporate Law - Chapter 3", duration: "45 min", level: "Inter", type: "Topic Wise" },
    { title: "Audit Verification Process", duration: "30 min", level: "Inter", type: "Pro Practice" },
];

export default function StudentExamsPage() {
    return (
            <div className="space-y-12 pb-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 px-2 py-1 bg-indigo-50 rounded-md">18,000+ Tests Available</span>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 font-outfit tracking-tight">Mock Exam Library</h1>
                        <p className="text-gray-500 text-lg font-medium mt-1">Select your course and start a proctor-simulated test session.</p>
                    </div>
                </div>

                {/* Search & Filter Shell */}
                <div className="flex flex-wrap gap-4">
                    {["All Exams", "Previous Year Papers", "Topic Tests", "Chapter Tests", "Pro Live Tests"].map((tab, i) => (
                        <button
                            key={i}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                                i === 0 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:border-gray-200"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Categories */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="grid sm:grid-cols-3 gap-6">
                            {EXAM_CATEGORIES.map((cat, i) => (
                                <div key={i} className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] group hover:border-indigo-100 transition-all cursor-pointer">
                                    <div className={`w-12 h-12 rounded-2xl ${cat.color} ${cat.iconColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                        <cat.icon size={24} weight="bold" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 font-outfit mb-1">{cat.title}</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{cat.count} Tests Available</p>
                                </div>
                            ))}
                        </div>

                        {/* Recent Tests List */}
                        <div className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-gray-900 font-outfit">Recommended for You</h3>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                    <ShieldCheck size={16} weight="bold" /> ICAI Pattern 2026
                                </div>
                            </div>
                            <div className="space-y-4">
                                {RECENT_MOCKS.map((mock, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:border-indigo-100 transition-all group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-indigo-600">
                                                <IdentificationBadge size={28} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{mock.title}</div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">{mock.level}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                        <Clock size={12} /> {mock.duration}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/student/exams/session`}
                                            className="px-6 py-2.5 rounded-xl bg-white border border-gray-100 text-indigo-600 font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                        >
                                            Start Session <Play size={14} weight="fill" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pro Value Prop Sidebar */}
                    <div className="space-y-8">
                        <div className="p-8 rounded-[40px] bg-indigo-900 text-white relative overflow-hidden group">
                            <Sparkle size={80} weight="fill" className="absolute -top-4 -right-4 opacity-10" />
                            <h3 className="text-2xl font-bold font-outfit mb-4 relative z-10">Get CA Pass Pro</h3>
                            <ul className="space-y-4 mb-10 relative z-10">
                                {[
                                    "Unlimited Reattempts",
                                    "10 Years Previous Papers",
                                    "Subject Mastery Heatmaps",
                                    "All India Mock Scores"
                                ].map((text, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-indigo-100">
                                        <CheckCircle size={18} weight="bold" className="text-emerald-400" /> {text}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href="/pricing"
                                className="w-full py-4 rounded-2xl bg-white text-indigo-900 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-95"
                            >
                                Upgrade Now <ArrowRight size={18} weight="bold" />
                            </Link>
                        </div>

                        <div className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center gap-3 mb-6">
                                <ChartLineUp size={24} className="text-indigo-600" />
                                <h4 className="text-lg font-bold text-gray-900 font-outfit">Your Readiness</h4>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                        Law <span>82%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-600" style={{ width: "82%" }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                        Audit <span>44%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500" style={{ width: "44%" }} />
                                    </div>
                                </div>
                            </div>
                            <Link href="/student/analytics" className="w-full mt-8 py-3 rounded-xl bg-gray-50 text-gray-500 font-bold text-[10px] uppercase tracking-widest text-center block hover:bg-gray-100 transition-all">Detailed Analysis</Link>
                        </div>
                    </div>
                </div>
            </div>
    );
}

function CheckCircle({ size, weight, className }: { size: number, weight?: "fill" | "regular" | "bold" | "thin" | "light" | "duotone", className?: string }) {
    return <svg className={className} width={size} height={size} viewBox="0 0 256 256"><path fill="currentColor" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m45.66 85.66l-56 56a8 8 0 0 1-11.32 0l-24-24a8 8 0 0 1 11.32-11.32L112 148.69l50.34-50.35a8 8 0 0 1 11.32 11.32" /></svg>;
}
