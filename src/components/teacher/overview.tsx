"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getTeacherOverview, type TeacherOverviewData } from "@/actions/educator-actions";
import {
    Users,
    TrendUp,
    Clock,
    CheckCircle,
    CaretRight,
    Plus,
    FileText,
    Books,
    BellSimple,
    Trophy,
    Sparkle,
    FilePdf,
    List,
    Calendar,
    Target,
    Medal
} from "@phosphor-icons/react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

export default function DashboardOverview() {
    const [data, setData] = useState<TeacherOverviewData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const res = await getTeacherOverview();
            if (res.success && res.data) {
                setData(res.data);
            }
            setIsLoading(false);
        }
        void load();
    }, []);

    if (isLoading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-50 border-t-indigo-600 animate-spin" />
                    <Sparkle size={20} weight="fill" className="text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Loading Academy Data...</p>
            </div>
        );
    }

    if (!data) return (
        <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-[32px] border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                <Target size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-outfit mb-2">No Dashboard Data</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">We couldn&apos;t retrieve your academy metrics. Please try refreshing the page or contact support.</p>
        </div>
    );

    const STATS = [
        { label: "Active Students", value: data.stats.activeStudents.toLocaleString(), icon: Users, color: "text-blue-500", bg: "bg-blue-50", trend: data.stats.activeStudentsTrend },
        { label: "Avg. Test Score", value: `${data.stats.avgTestScore}%`, icon: TrendUp, color: "text-emerald-500", bg: "bg-emerald-50", trend: data.stats.avgScoreTrend },
        { label: "Avg. Time/Test", value: data.stats.avgTimePerTest, icon: Clock, color: "text-amber-500", bg: "bg-amber-50", trend: 0 },
        { label: "Tests Completed", value: data.stats.testsCompleted.toLocaleString(), icon: CheckCircle, color: "text-violet-500", bg: "bg-violet-50", trend: 0 },
    ];

    const QUICK_ACTIONS = [
        { label: "Create Test", href: "/teacher/test-series", icon: Plus, color: "bg-indigo-600 text-white" },
        { label: "Upload Material", href: "/teacher/materials", icon: FilePdf, color: "bg-slate-900 text-white" },
        { label: "Send Update", href: "/teacher/updates", icon: BellSimple, color: "bg-white text-slate-900 border border-slate-200" },
        { label: "Manage Batches", href: "/teacher/batches", icon: Books, color: "bg-white text-slate-900 border border-slate-200" },
    ];

    return (
        <div className="space-y-6 pb-10 w-full max-w-[1280px] mx-auto font-outfit animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Teacher Studio</span>
                    </div>
                    <h1 className="font-outfit tracking-tighter leading-tight text-2xl font-bold text-slate-900">
                        Welcome back, {data.teacherName}.
                    </h1>
                    <p className="text-slate-500 font-medium text-sm font-sans max-w-2xl leading-relaxed">
                        Your academy is performing <span className="text-emerald-600 font-bold">well above average</span> this week. Keep up the momentum!
                    </p>
                </div>
                <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/5 hover:bg-slate-800 transition-all active:scale-95 shrink-0 mb-1">
                    <Calendar size={18} weight="bold" className="text-indigo-400" />
                    Target Milestone: CA Final May 2026
                </div>
            </div>

            {/* Top 4 Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1 relative">
                {/* Decorative gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/20 via-transparent to-purple-50/20 blur-3xl -z-10" />

                {STATS.map((stat) => (
                    <div key={stat.label} className="bg-white/80 backdrop-blur-md border border-slate-100 shadow-sm rounded-[24px] p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-indigo-100/50 group flex flex-col justify-between min-h-[140px]">
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">
                                {stat.label}
                            </span>
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border border-slate-100/50 group-hover:bg-indigo-600 group-hover:text-white", stat.bg, stat.color)}>
                                <stat.icon size={20} weight="bold" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-slate-900 leading-none mt-2 tracking-tight font-outfit mb-3">{stat.value}</div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">
                            {stat.trend !== 0 ? (
                                <span className="text-emerald-500 flex items-center gap-1">+{stat.trend}% <TrendUp size={12} weight="bold" /></span>
                            ) : (
                                <span>Stable Performance</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1">
                {QUICK_ACTIONS.map((action) => (
                    <Link href={action.href} key={action.label} className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95 group",
                        action.color
                    )}>
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                            <action.icon size={20} weight="bold" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{action.label}</span>
                        <CaretRight size={14} weight="bold" className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid lg:grid-cols-3 gap-8 pt-4">
                {/* Left Column: Chart & Announcements */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Performance Chart */}
                    <div className="bg-white/80 backdrop-blur-md p-6 rounded-[24px] border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 font-outfit uppercase flex items-center gap-2">
                                    <Target size={20} className="text-indigo-500" weight="bold" />
                                    Performance Trends
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Daily average score across academy</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest border border-indigo-100">7 Days</button>
                                <button className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-colors">30 Days</button>
                            </div>
                        </div>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.trends}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700, className: "uppercase tracking-widest" }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                                        contentStyle={{
                                            backgroundColor: "#ffffff",
                                            borderColor: "#f1f5f9",
                                            borderRadius: "16px",
                                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                            border: "1px solid #f1f5f9",
                                            padding: "12px",
                                            fontFamily: "Outfit, sans-serif"
                                        }}
                                        itemStyle={{ color: "#4f46e5", fontWeight: "bold", fontSize: "12px" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#4f46e5"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Announcements */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="space-y-1">
                                <h2 className="flex items-center gap-3 font-outfit uppercase">
                                    <BellSimple size={20} className="text-slate-400" weight="bold" />
                                    Recent Announcements
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-8">Your latest updates to students</p>
                            </div>
                            <Link href="/teacher/updates" className="px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all duration-200 border border-slate-100 active:scale-95 shadow-sm">View All</Link>
                        </div>

                        <div className="space-y-4">
                            {data.recentAnnouncements.length === 0 ? (
                                <div className="p-12 bg-white rounded-[32px] border border-slate-100 text-center shadow-sm border-dashed border-2">
                                    <BellSimple size={40} className="mx-auto text-slate-200 mb-4 opacity-50" />
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No recent announcements</h3>
                                </div>
                            ) : (
                                data.recentAnnouncements.map((ann) => (
                                    <div key={ann.id} className="p-6 bg-white rounded-[24px] border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all duration-300 flex gap-5 group relative overflow-hidden">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 shrink-0 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-100">
                                            <BellSimple size={20} weight="bold" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                                <span className="text-indigo-600/80">{ann.batchName}</span> <span className="px-2 opacity-30">/</span> {ann.date}
                                            </div>
                                            <p className="text-sm font-medium text-slate-900 leading-relaxed line-clamp-2">
                                                {ann.content}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Top Students & Insights */}
                <div className="space-y-8">
                    <div className="space-y-1 mb-2">
                        <h2 className="flex items-center gap-3 uppercase font-outfit">
                            <Trophy size={20} className="text-slate-400" weight="bold" />
                            Top Performers
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-8">Highest achievers in your batches</p>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        {data.topStudents.length === 0 ? (
                            <div className="py-20 text-center text-slate-300 uppercase tracking-widest text-[10px] font-bold">
                                No Student Data
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data.topStudents.map((student, i) => (
                                    <div key={student.id} className="flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:bg-slate-50 group">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("text-xs font-bold w-5 text-center", i === 0 ? "text-amber-500" : "text-slate-400")}>
                                                {student.rank}
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xs font-bold uppercase shadow-sm group-hover:border-indigo-200 transition-colors">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold tracking-tight font-outfit leading-tight mb-0.5 text-slate-900">
                                                    {student.name}
                                                </div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                    LVL {student.level}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold tracking-tight font-outfit leading-tight mb-0.5 text-slate-900">{student.xp.toLocaleString()}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">XP</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Link href="/teacher/students"
                            className="block w-full text-center py-3.5 mt-6 text-[10px] font-bold tracking-widest uppercase text-slate-400 hover:text-slate-950 transition-all border border-slate-100 rounded-xl hover:bg-slate-50 active:scale-[0.98]">
                            View All Students
                        </Link>
                    </div>

                    {/* Academy Insight Card */}
                    <div className="bg-slate-900 p-6 rounded-[24px] border border-slate-800 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-700">
                            <Medal size={80} weight="bold" className="text-amber-500" />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                                <Sparkle size={20} weight="fill" />
                            </div>
                            <h4 className="text-white font-bold text-lg font-outfit leading-tight">Academy Growth</h4>
                            <p className="text-slate-400 text-xs leading-relaxed font-medium">
                                Your students have completed <span className="text-white font-bold">120+ new attempts</span> this week. Engagement is up by <span className="text-emerald-400 font-bold">18%</span>.
                            </p>
                            <button className="w-full py-3 rounded-xl bg-white text-slate-950 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-400 transition-all active:scale-95">Analyze Growth</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Recent Resources */}
            <div className="pt-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <h2 className="flex items-center gap-3 uppercase font-outfit">
                            <FilePdf size={20} className="text-slate-400" weight="bold" />
                            Recent Materials
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-8">The latest files you&apos;ve uploaded</p>
                    </div>
                    <Link href="/teacher/materials" className="px-5 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all duration-200 border border-slate-100 shadow-sm active:scale-95">Manage Library</Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-1">
                    {data.recentMaterials.length === 0 ? (
                        <div className="lg:col-span-4 p-12 text-center text-slate-300 bg-white rounded-[32px] border-2 border-slate-100 border-dashed uppercase tracking-widest text-[10px] font-bold shadow-sm">
                            No materials uploaded yet
                        </div>
                    ) : (
                        data.recentMaterials.map((res) => (
                            <Link href="/teacher/materials" key={res.id}
                                className="p-6 bg-white rounded-[24px] border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-pointer min-h-[140px] relative overflow-hidden">
                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                        <FilePdf size={18} weight="bold" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100/50">
                                        {res.type}
                                    </span>
                                </div>
                                <div className="z-10 relative">
                                    <h4 className="font-bold text-base text-slate-900 leading-tight mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors tracking-tight font-outfit">
                                        {res.title}
                                    </h4>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        {res.category} <span className="opacity-30 mx-1.5">•</span> {res.date}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
