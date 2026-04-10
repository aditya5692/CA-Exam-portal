"use client";

import { MetricCard } from "./metric-card";
import { 
    Users, 
    ChartBar, 
    DownloadSimple, 
    FileText, 
    Pulse,
    SealCheck,
    Broadcast
} from "@phosphor-icons/react";
import Link from "next/link";
import type { AdminMetricsData } from "@/types/admin";

interface StatusViewProps {
    metrics: AdminMetricsData;
}

export function StatusView({ metrics }: StatusViewProps) {
    return (
        <div className="space-y-10">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    label="Total Students"
                    value={metrics.metrics.students.toString()}
                    trend="Market reach expanding"
                    icon={Users}
                    color="accent"
                />
                <MetricCard
                    label="Exam Attempts"
                    value={metrics.metrics.attempts.toString()}
                    trend="Activity increasing"
                    icon={ChartBar}
                    color="support"
                />
                <MetricCard
                    label="Resource Downloads"
                    value={metrics.metrics.downloads.toString()}
                    trend="Cloud sync active"
                    icon={DownloadSimple}
                    color="success"
                />
                <MetricCard
                    label="MCQ Bank"
                    value={metrics.metrics.mcqs.toString()}
                    trend="Content indexed"
                    icon={FileText}
                    color="neutral"
                />
            </div>

            {/* Main Operational Panel */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 student-surface rounded-[40px] p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="flex items-center gap-3 text-2xl font-black tracking-tight text-[var(--student-text)]">
                                <Pulse size={32} className="text-rose-500 animate-pulse" weight="bold" />
                                Real-time Activity
                            </h3>
                            <p className="text-sm font-medium text-[var(--student-muted)]">Live snapshot of the most recent user registrations and interactions.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {metrics.recentUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between rounded-3xl border border-transparent bg-[var(--student-panel-muted)]/50 p-5 transition-all hover:border-[var(--student-border)] hover:bg-white hover:shadow-sm">
                                <div className="flex items-center gap-5">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--student-accent-strong)] font-black shadow-sm border border-[var(--student-border)]">
                                        {user.fullName?.[0] || user.email?.[0]?.toUpperCase() || "?"}
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-[var(--student-text)]">{user.fullName || "New User"}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs font-black uppercase tracking-widest text-[var(--student-muted-strong)] opacity-60">{user.role}</span>
                                            <span className="h-1 w-1 rounded-full bg-[var(--student-border)]" />
                                            <span className="text-xs font-medium text-[var(--student-muted)]">{user.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted-strong)] opacity-40">
                                    {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    {/* System Health Card */}
                    <div className="student-surface-dark relative flex flex-col justify-between overflow-hidden rounded-[40px] p-10 text-white min-h-[340px]">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(242,210,149,0.15),transparent_40%)]" />
                        <div className="relative z-10 space-y-8">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md shadow-inner border border-white/5">
                                <Broadcast size={32} weight="fill" className="text-[#f2d295]" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="  text-3xl font-black leading-tight">System Status</h3>
                                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse" />
                                    Fully Operational
                                </div>
                                <p className="text-sm font-medium text-white/60 leading-relaxed">
                                    All content clusters are indexed. Real-time monitoring active.
                                </p>
                            </div>
                        </div>
                        <button className="relative z-10 mt-8 group flex items-center justify-center gap-3 w-full rounded-[20px] bg-white px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-[var(--student-accent-strong)] shadow-xl transition-all hover:bg-[#f3f0ea] hover:-translate-y-1 active:scale-95">
                            Run Diagnostics
                        </button>
                    </div>

                    {/* Support Quick Link */}
                    <div className="student-surface rounded-[40px] p-8 border-dashed border-2">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
                                <SealCheck size={24} weight="bold" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-[var(--student-text)]">Admin Support</h4>
                                <p className="text-xs font-medium text-[var(--student-muted)]">Manual intervention desk.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
