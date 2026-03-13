"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from "recharts";
import { Sparkle, TrendUp, Target, Brain, ArrowRight } from "@phosphor-icons/react";

const TREND_DATA = [
    { date: "Oct", score: 45 },
    { date: "Nov", score: 52 },
    { date: "Dec", score: 48 },
    { date: "Jan", score: 65 },
    { date: "Feb", score: 78 },
    { date: "Mar", score: 84 },
];

const COMPARATIVE_DATA = [
    { name: "My Score", value: 84, color: "#4f46e5" },
    { name: "Cohort Avg", value: 68, color: "#94a3b8" },
    { name: "Topper Avg", value: 96, color: "#10b981" },
];

export function StudentAnalyticsOverview() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Score Trend Card */}
                <div className="lg:col-span-2 p-8 rounded-3xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 font-outfit">Performance Trend</h3>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Consistency Analysis</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                            <TrendUp size={16} weight="bold" />
                            <span className="text-xs font-bold">+12% this month</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={TREND_DATA}>
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    hide
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 animate-in zoom-in-95 duration-200">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{payload[0].payload.date} Result</p>
                                                    <p className="text-2xl font-bold text-gray-900 font-outfit">{payload[0].value}%</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#4f46e5"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#scoreGradient)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Comparative Analysis */}
                <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col h-[400px]">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-900 font-outfit">Global Ranking</h3>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Comparative Benchmarking</p>
                    </div>
                    <div className="flex-1 w-full flex flex-col">
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={COMPARATIVE_DATA} layout="vertical" barSize={32}>
                                    <XAxis type="number" hide domain={[0, 100]} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        hide
                                    />
                                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                        {COMPARATIVE_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4 mt-6">
                            {COMPARATIVE_DATA.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 font-outfit">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Personalized AI Insights */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-8 rounded-[32px] bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Brain size={160} weight="fill" />
                    </div>
                    <div className="relative z-10 w-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                                <Sparkle size={20} weight="fill" className="text-white" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100">Personalized Insights</span>
                        </div>
                        <h2 className="text-3xl font-bold font-outfit mb-4 leading-tight">You&apos;re doing great, but Audit needs attention.</h2>
                        <p className="text-indigo-100 font-medium leading-relaxed mb-8 max-w-xl">
                            Based on your last 3 mock tests, your accuracy in <b>Company Law</b> is 92%, while <b>Internal Audit</b> concepts are at 44%. We recommend 15 hours of focused study on the latter this week.
                        </p>
                        <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-indigo-600 font-bold text-sm shadow-lg hover:bg-indigo-50 transition-all active:scale-95 group/btn">
                            View Study Roadmap <ArrowRight size={18} weight="bold" className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                <div className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center">
                                <Target size={20} weight="bold" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Next Milestone</span>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 font-outfit mb-2">Intermediate Group 1</h4>
                        <div className="flex items-baseline gap-1 mb-8">
                            <span className="text-4xl font-bold text-indigo-600 font-outfit">18</span>
                            <span className="text-gray-400 font-bold text-sm uppercase">Days Left</span>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                            Preparation Progress <span>72%</span>
                        </div>
                        <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                            <div className="h-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.3)] animate-pulse" style={{ width: '72%' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
