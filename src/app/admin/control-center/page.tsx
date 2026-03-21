"use client";

import { useState, useEffect } from "react";
import { 
    Users, 
    ShieldCheck, 
    BookOpen, 
    Monitor, 
    ChartBar, 
    DownloadSimple, 
    Plus,
    Gear,
    Pulse,
    FileText,
    ArrowRight,
    SealCheck,
    Broadcast
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getAdminMetrics, AdminMetricsData } from "@/actions/admin-index-actions";

export default function AdminControlCenter() {
    const [metrics, setMetrics] = useState<AdminMetricsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            const res = await getAdminMetrics();
            if (res.success && res.data) {
                setMetrics(res.data);
            }
            setLoading(false);
        };
        fetchMetrics();
    }, []);

    const sections = [
        {
            title: "User Management",
            desc: "Add, modify, or suspend platform members.",
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            link: "/admin/dashboard",
            features: ["Role Assignment", "Account Blocking", "Permission Overrides"]
        },
        {
            title: "Resource Marketplace",
            desc: "Manage PDF resources, PYQs, and RTPs.",
            icon: BookOpen,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            link: "/admin/past-year-questions",
            features: ["Upload Verified PDFs", "Teacher Association", "Unlimited Access Control"]
        },
        {
            title: "Exam & MCQ Arena",
            desc: "Control subject-wise exams and question banks.",
            icon: Monitor,
            color: "text-blue-600",
            bg: "bg-blue-50",
            link: "/teacher/questions", 
            features: ["Bulk MCQ Import", "Exam Timing", "Difficulty Balancing"]
        },
        {
            title: "System Configuration",
            desc: "Global feature flags and platform settings.",
            icon: Gear,
            color: "text-slate-600",
            bg: "bg-slate-100",
            link: "#",
            features: ["Maintenance Mode", "Feature Toggles", "API Settings"]
        }
    ];

    return (
        <div className="min-h-screen bg-[#FDFDFF] pb-20 animate-in fade-in duration-1000">
            {/* Header / Hero */}
            <div className="relative bg-slate-900 overflow-hidden rounded-b-[64px] mb-16 shadow-2xl shadow-indigo-900/20">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#4f46e5_0%,transparent_50%)]" />
                <div className="max-w-7xl mx-auto px-8 py-24 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[12px] bg-white/5 border border-white/10 text-indigo-300 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-sm">
                                <ShieldCheck size={14} weight="fill" /> Admin Command Center
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter font-outfit">
                                Elite Control <span className="text-indigo-400">Board.</span>
                            </h1>
                            <p className="text-slate-400 font-medium max-w-xl text-lg font-sans">
                                Oversee all platform metrics, manage content entities, and control system features from a centralized professional hub.
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-3xl border border-white/10 rounded-[32px] p-10 flex items-center gap-8 shadow-2xl shadow-black/40 group hover:bg-white/15 transition-all duration-500">
                            <div className="w-20 h-20 rounded-[24px] bg-indigo-500/20 flex items-center justify-center text-indigo-300 shadow-inner group-hover:scale-110 transition-transform duration-700">
                                <Broadcast size={40} weight="bold" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-2 opacity-60">Global Status</div>
                                <div className="text-white font-black text-2xl flex items-center gap-3 font-outfit tracking-tight">
                                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
                                    Operational
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 space-y-12">
                {/* Live Performance Index */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <MetricCard 
                        label="Total Students" 
                        value={loading ? "..." : (metrics?.metrics.students.toString() ?? "0")} 
                        trend="+12% this week" 
                        icon={Users} 
                        color="indigo" 
                    />
                    <MetricCard 
                        label="Exam Attempts" 
                        value={loading ? "..." : (metrics?.metrics.attempts.toString() ?? "0")} 
                        trend="+45 from yesterday" 
                        icon={ChartBar} 
                        color="blue" 
                    />
                    <MetricCard 
                        label="Resource Downloads" 
                        value={loading ? "..." : (metrics?.metrics.downloads.toString() ?? "0")} 
                        trend="Premium Access Active" 
                        icon={DownloadSimple} 
                        color="emerald" 
                    />
                    <MetricCard 
                        label="MCQ Bank" 
                        value={loading ? "..." : (metrics?.metrics.mcqs.toString() ?? "0")} 
                        trend="6 Subjects Indexed" 
                        icon={FileText} 
                        color="amber" 
                    />
                </div>

                {/* Module Directory */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-outfit">Platform Orchestration</h2>
                            <p className="text-slate-500 font-medium font-sans">Direct granular control over specific site clusters.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {sections.map(section => (
                            <Link 
                                key={section.title}
                                href={section.link}
                                className="group relative p-10 rounded-[40px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(79,70,229,0.08)] hover:-translate-y-1.5 transition-all duration-500 overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                                    <section.icon size={160} weight="bold" />
                                </div>
                                
                                <div className="flex items-start gap-8 relative z-10">
                                    <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center shrink-0 shadow-lg transition-transform duration-500 group-hover:scale-110 shadow-current/10", section.bg, section.color)}>
                                        <section.icon size={32} weight="bold" />
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight font-outfit">{section.title}</h3>
                                            <p className="text-slate-500 text-sm leading-relaxed max-w-sm font-sans">{section.desc}</p>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2.5">
                                            {section.features.map(f => (
                                                <span key={f} className="px-3 py-1.5 rounded-[12px] bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all duration-300">
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                        
                                        <div className="pt-2 flex items-center gap-2 text-indigo-600 font-bold text-[11px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform duration-300">
                                            Launch Module <ArrowRight weight="bold" size={16} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* System Activity & Health */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 p-8 rounded-[40px] bg-white border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <Pulse size={24} className="text-rose-500" weight="bold" />
                                Recent User Activity
                            </h3>
                            <Link href="/admin/dashboard" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Manage All Users</Link>
                        </div>
                        <div className="space-y-4">
                            {metrics?.recentUsers.map(user => (
                                <div key={user.id} className="p-4 rounded-2xl bg-slate-50/50 flex items-center justify-between group hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600 font-bold">
                                            {user.fullName?.[0] ?? user.email?.[0] ?? "?"}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{user.fullName ?? "Anonymous"}</div>
                                            <div className="text-xs text-slate-400 font-medium">{user.role} • {user.email}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400 font-bold">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 rounded-[40px] bg-indigo-600 text-white shadow-xl shadow-indigo-200 flex flex-col justify-between overflow-hidden relative">
                        <div className="absolute top--10 right--10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        <div className="space-y-6 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                                <SealCheck size={24} weight="bold" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black font-outfit leading-tight">Elite Support Desk</h3>
                                <p className="text-indigo-100 text-sm font-medium">Your platform is 100% indexed and content-verified. For specialized assistance, contact the deepmind engine.</p>
                            </div>
                        </div>
                        <button className="mt-8 w-full py-4 rounded-2xl bg-white text-indigo-600 font-bold text-sm shadow-lg hover:shadow-indigo-400/20 transition-all active:scale-95">
                            Connect with Engine
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface MetricCardProps {
    label: string;
    value: string;
    trend: string;
    icon: any;
    color: "indigo" | "blue" | "emerald" | "amber";
}

function MetricCard({ label, value, trend, icon: Icon, color }: MetricCardProps) {
    const colors = {
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100 shadow-[0_4px_12px_rgba(79,70,229,0.1)]",
        blue: "text-blue-600 bg-blue-50 border-blue-100 shadow-[0_4px_12px_rgba(37,99,235,0.1)]",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-[0_4px_12px_rgba(5,150,105,0.1)]",
        amber: "text-amber-600 bg-amber-50 border-amber-100 shadow-[0_4px_12px_rgba(217,119,6,0.1)]",
    };

    return (
        <div className="p-10 rounded-[48px] bg-white border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.05)] flex flex-col justify-between gap-12 hover:shadow-[0_30px_70px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-700 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-indigo-50 transition-all duration-700" />
            <div className="flex items-start justify-between relative z-10">
                <div className={cn("w-16 h-16 rounded-[22px] flex items-center justify-center transition-all duration-700 group-hover:rotate-12 group-hover:scale-110", colors[color])}>
                    <Icon size={32} weight="bold" />
                </div>
                <div className="px-4 py-2 rounded-[14px] bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] border border-slate-100 group-hover:bg-white group-hover:text-slate-600 group-hover:border-slate-200 transition-all duration-500 shadow-sm">
                    {trend}
                </div>
            </div>
            <div className="relative z-10">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 opacity-60">{label}</div>
                <div className="text-5xl font-black text-slate-950 font-outfit tracking-tighter leading-none">{value}</div>
            </div>
        </div>
    );
}
