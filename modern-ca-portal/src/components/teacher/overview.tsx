"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    Users,
    TrendUp,
    Clock,
    CheckCircle,
    CaretRight
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

const DATA = [
    { name: "Mon", attempts: 400, score: 72 },
    { name: "Tue", attempts: 300, score: 78 },
    { name: "Wed", attempts: 200, score: 75 },
    { name: "Thu", attempts: 278, score: 82 },
    { name: "Fri", attempts: 189, score: 85 },
    { name: "Sat", attempts: 239, score: 80 },
    { name: "Sun", attempts: 349, score: 88 },
];

const STATS = [
    { label: "Active Students", value: "1,284", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Avg. Test Score", value: "76.4%", icon: TrendUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Avg. Time/Test", value: "24m 12s", icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Tests Completed", value: "8,942", icon: CheckCircle, color: "text-violet-400", bg: "bg-violet-400/10" },
];

export default function DashboardOverview() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-outfit tracking-tight">Dashboard Overview</h1>
                    <p className="text-gray-500 text-sm mt-1">Welcome back, Nikhil. Here&apos;s your academy&apos;s performance at a glance.</p>
                </div>
                <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95">
                    Generate Report <CaretRight weight="bold" />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {STATS.map((stat) => (
                    <div key={stat.label} className="p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] group hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                            <div className={cn("p-3 rounded-xl", stat.bg)}>
                                <stat.icon size={24} className={stat.color} />
                            </div>
                            <div className="px-2 py-1 rounded-lg bg-emerald-50 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                +12.5% <TrendUp size={12} weight="bold" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-none">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2 font-outfit">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 p-8 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 font-outfit">Performance Trends</h3>
                            <p className="text-xs text-gray-400 font-medium">Daily average score across all tests</p>
                        </div>
                        <select className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={DATA}>
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
                                    tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderColor: "#f1f5f9",
                                        borderRadius: "16px",
                                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                        border: "1px solid #f1f5f9",
                                        padding: "12px"
                                    }}
                                    itemStyle={{ color: "#4f46e5", fontWeight: "bold" }}
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

                <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 font-outfit mb-6">Recent Activity</h3>
                    <div className="space-y-6 flex-1">
                        {[
                            { user: "Aditya Rao", action: "Attempted Module 1", time: "2m ago", color: "bg-indigo-500" },
                            { user: "Sana Khan", action: "Completed Test Series", time: "15m ago", color: "bg-emerald-500" },
                            { user: "Nikhil Jain", action: "Uploaded Questions", time: "1h ago", color: "bg-violet-500" },
                            { user: "Ritika Sharma", action: "Joined Academy", time: "3h ago", color: "bg-amber-500" }
                        ].map((act, i) => (
                            <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center p-0.5 shadow-md shadow-gray-200 transition-transform group-hover:scale-110", act.color)}>
                                    <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center text-gray-600 font-bold text-xs">
                                        {act.user.split(' ').map(n => n[0]).join('')}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-all leading-tight">{act.user}</p>
                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{act.action}</p>
                                </div>
                                <span className="text-[10px] text-gray-300 font-bold whitespace-nowrap">{act.time}</span>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-8 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 text-xs font-bold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all uppercase tracking-widest active:scale-95">
                        View All Activity
                    </button>
                </div>
            </div>
        </div>
    );
}
