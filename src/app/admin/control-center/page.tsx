"use client";

import { getAdminMetrics } from "@/actions/admin-index-actions";
import { cn } from "@/lib/utils";
import type { AdminMetricsData } from "@/types/admin";
import {
    ArrowRight,
    BookOpen,
    Broadcast,
    ChartBar,
    DownloadSimple,
    FileText,
    Gear,
    Monitor,
    Pulse,
    SealCheck,
    ShieldCheck,
    Users
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
        void fetchMetrics();
    }, []);

    const sections = [
        {
            title: "User Management",
            desc: "Add, modify, or suspend platform members.",
            icon: Users,
            color: "text-[var(--student-accent-strong)]",
            bg: "bg-[var(--student-accent-soft)]",
            link: "/admin/dashboard",
            features: ["Role Assignment", "Account Blocking", "Permission Overrides"]
        },
        {
            title: "Resource Marketplace",
            desc: "Manage PDF resources, PYQs, and RTPs.",
            icon: BookOpen,
            color: "text-[var(--student-success)]",
            bg: "bg-[#e5f0e9]",
            link: "/admin/past-year-questions",
            features: ["Upload Verified PDFs", "Teacher Association", "Unlimited Access Control"]
        },
        {
            title: "Exam and MCQ Arena",
            desc: "Control subject-wise exams and question banks.",
            icon: Monitor,
            color: "text-[var(--student-support)]",
            bg: "bg-[var(--student-support-soft)]",
            link: "/teacher/questions",
            features: ["Bulk MCQ Import", "Exam Timing", "Difficulty Balancing"]
        },
        {
            title: "System Configuration",
            desc: "Global feature flags and platform settings.",
            icon: Gear,
            color: "text-[var(--student-muted-strong)]",
            bg: "bg-[var(--student-panel-muted)]",
            link: "#",
            features: ["Maintenance Mode", "Feature Toggles", "API Settings"]
        }
    ];

    return (
        <div className="space-y-12 pb-20 animate-in fade-in duration-1000">
            <div className="student-surface-dark relative overflow-hidden rounded-[44px] px-8 py-18 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(242,227,192,0.14),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(220,235,230,0.18),transparent_24%)]" />
                <div className="relative z-10 flex flex-col justify-between gap-12 md:flex-row md:items-end">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-[12px] border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a8d0c5] backdrop-blur-sm">
                            <ShieldCheck size={14} weight="fill" /> Admin Command Center
                        </div>
                        <h1 className="font-outfit text-5xl font-black tracking-tighter md:text-7xl">
                            Platform control,
                            <span className="text-[#f2d295]"> without noise.</span>
                        </h1>
                        <p className="max-w-xl font-sans text-lg font-medium text-white/65">
                            Oversee platform metrics, manage content entities, and steer system-wide controls from a calmer operations surface.
                        </p>
                    </div>

                    <div className="rounded-[32px] border border-white/10 bg-white/8 p-10 backdrop-blur-3xl">
                        <div className="flex items-center gap-8">
                            <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#8dbdaf]/16 text-[#bfe1d6] shadow-inner">
                                <Broadcast size={40} weight="bold" />
                            </div>
                            <div>
                                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/45">Global Status</div>
                                <div className="flex items-center gap-3 font-outfit text-2xl font-black tracking-tight text-white">
                                    <div className="h-3.5 w-3.5 rounded-full bg-[#2f7d55] shadow-[0_0_20px_rgba(47,125,85,0.8)]" />
                                    Operational
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <MetricCard
                    label="Total Students"
                    value={loading ? "..." : (metrics?.metrics.students.toString() ?? "0")}
                    trend="+12% this week"
                    icon={Users}
                    color="accent"
                />
                <MetricCard
                    label="Exam Attempts"
                    value={loading ? "..." : (metrics?.metrics.attempts.toString() ?? "0")}
                    trend="+45 from yesterday"
                    icon={ChartBar}
                    color="support"
                />
                <MetricCard
                    label="Resource Downloads"
                    value={loading ? "..." : (metrics?.metrics.downloads.toString() ?? "0")}
                    trend="Premium access active"
                    icon={DownloadSimple}
                    color="success"
                />
                <MetricCard
                    label="MCQ Bank"
                    value={loading ? "..." : (metrics?.metrics.mcqs.toString() ?? "0")}
                    trend="6 subjects indexed"
                    icon={FileText}
                    color="neutral"
                />
            </div>

            <div className="space-y-8">
                <div className="space-y-1">
                    <h2 className="font-outfit text-3xl font-bold tracking-tight text-[var(--student-text)]">Platform Orchestration</h2>
                    <p className="font-sans font-medium text-[var(--student-muted)]">Direct control over the main system clusters.</p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {sections.map(section => (
                        <Link
                            key={section.title}
                            href={section.link}
                            className="student-surface group relative overflow-hidden rounded-[40px] p-10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(55,48,38,0.08)]"
                        >
                            <div className="absolute right-0 top-0 p-10 opacity-[0.04] transition-opacity duration-500 group-hover:opacity-[0.08]">
                                <section.icon size={160} weight="bold" />
                            </div>

                            <div className="relative z-10 flex items-start gap-8">
                                <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] shadow-lg transition-transform duration-500 group-hover:scale-110 shadow-current/10", section.bg, section.color)}>
                                    <section.icon size={32} weight="bold" />
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <h3 className="font-outfit text-2xl font-bold tracking-tight text-[var(--student-text)]">{section.title}</h3>
                                        <p className="max-w-sm font-sans text-sm leading-relaxed text-[var(--student-muted)]">{section.desc}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2.5">
                                        {section.features.map(feature => (
                                            <span key={feature} className="student-chip rounded-[12px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em]">
                                                {feature}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--student-accent-strong)] transition-transform duration-300 group-hover:translate-x-2">
                                        Launch Module <ArrowRight weight="bold" size={16} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="student-surface md:col-span-2 rounded-[40px] p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-3 text-xl font-black tracking-tight text-[var(--student-text)]">
                            <Pulse size={24} className="text-rose-500" weight="bold" />
                            Recent User Activity
                        </h3>
                        <Link href="/admin/dashboard" className="text-[10px] font-black uppercase tracking-widest text-[var(--student-accent-strong)] hover:underline">
                            Manage All Users
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {metrics?.recentUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between rounded-2xl border border-transparent bg-[var(--student-panel-muted)]/70 p-4 transition-colors hover:border-[var(--student-border)] hover:bg-[var(--student-panel-muted)]">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--student-panel-solid)] text-[var(--student-accent-strong)] font-bold shadow-sm">
                                        {user.fullName?.[0] ?? user.email?.[0] ?? "?"}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-[var(--student-text)]">{user.fullName ?? "Anonymous"}</div>
                                        <div className="text-xs font-medium text-[var(--student-muted)]">{user.role} · {user.email}</div>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-[var(--student-muted)]">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="student-surface-dark relative flex flex-col justify-between overflow-hidden rounded-[40px] p-8 text-white">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[rgba(255,255,255,0.08)] blur-3xl" />
                    <div className="relative z-10 space-y-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                            <SealCheck size={24} weight="bold" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-outfit text-2xl font-black leading-tight">Support Desk</h3>
                            <p className="text-sm font-medium text-white/70">
                                The platform is indexed and content-verified. Use the support lane when operations need manual intervention.
                            </p>
                        </div>
                    </div>
                    <button className="mt-8 w-full rounded-2xl bg-white px-4 py-4 text-sm font-bold text-[var(--student-accent-strong)] shadow-lg transition-all hover:bg-[#f3f0ea] active:scale-95">
                        Connect with Support
                    </button>
                </div>
            </div>
        </div>
    );
}

interface MetricCardProps {
    label: string;
    value: string;
    trend: string;
    icon: typeof Users;
    color: "accent" | "support" | "success" | "neutral";
}

function MetricCard({ label, value, trend, icon: Icon, color }: MetricCardProps) {
    const colors = {
        accent: "text-[var(--student-accent-strong)] bg-[var(--student-accent-soft)] border-[var(--student-accent-soft-strong)]",
        support: "text-[var(--student-support)] bg-[var(--student-support-soft)] border-[var(--student-support-soft-strong)]",
        success: "text-[var(--student-success)] bg-[#e5f0e9] border-[#cfe0d5]",
        neutral: "text-[var(--student-muted-strong)] bg-[var(--student-panel-muted)] border-[var(--student-border)]",
    } as const;

    return (
        <div className="student-surface group relative flex flex-col justify-between gap-12 overflow-hidden rounded-[48px] p-10 transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_30px_70px_rgba(55,48,38,0.1)]">
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[var(--student-panel-muted)] blur-3xl transition-all duration-700 group-hover:bg-[var(--student-accent-soft)]" />
            <div className="relative z-10 flex items-start justify-between">
                <div className={cn("flex h-16 w-16 items-center justify-center rounded-[22px] border transition-all duration-700 group-hover:rotate-12 group-hover:scale-110", colors[color])}>
                    <Icon size={32} weight="bold" />
                </div>
                <div className="student-chip rounded-[14px] px-4 py-2 text-[9px] font-black uppercase tracking-[0.25em]">
                    {trend}
                </div>
            </div>
            <div className="relative z-10">
                <div className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--student-muted)] opacity-70">{label}</div>
                <div className="font-outfit text-5xl font-black leading-none tracking-tighter text-[var(--student-text)]">{value}</div>
            </div>
        </div>
    );
}
