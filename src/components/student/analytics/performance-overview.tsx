"use client";
import type { StudentHistoryData } from "@/types/student";
import { ArrowRight,Sparkle,Target,TrendUp } from "@phosphor-icons/react";
import { Area,AreaChart,Bar,BarChart,CartesianGrid,Cell,ResponsiveContainer,Tooltip,XAxis,YAxis } from "recharts";

interface Props {
    data: StudentHistoryData;
}

export function StudentAnalyticsOverview({ data }: Props) {
    const { performanceTrend, comparativeAnalysis, weakTopics, examTargetDays, examTargetLabel, profile } = data;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Score Trend Card */}
                <div className="lg:col-span-2 p-10 rounded-2xl bg-white border border-slate-100 shadow-sm h-[400px] flex flex-col font-outfit relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-1">
                            <h3 className="font-outfit">Performance Trend</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Progress over time</p>
                        </div>
                        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 shadow-sm transition-all hover:bg-white active:scale-95">
                            <TrendUp size={18} weight="bold" className="text-indigo-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Improving</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceTrend}>
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
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{payload[0].payload.date}</p>
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
                <div className="p-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col h-[400px] transition-all duration-300 hover:shadow-md">
                    <div className="mb-8">
                        <h3 className="font-outfit">Global Ranking</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Benchmark against peers</p>
                    </div>
                    <div className="flex-1 w-full flex flex-col">
                        <div className="flex-1 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparativeAnalysis} layout="vertical" barSize={36}>
                                    <XAxis type="number" hide domain={[0, 100]} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        hide
                                    />
                                    <Bar dataKey="value" radius={[0, 12, 12, 0]} className="filter drop-shadow-sm">
                                        {comparativeAnalysis.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4 mt-8">
                            {comparativeAnalysis.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
                                    </div>
                                    <span className="text-base font-bold text-slate-900 font-outfit">{Math.round(item.value)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Personalized AI Insights */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-10 rounded-2xl bg-slate-900 text-white shadow-xl relative overflow-hidden group">
                    <div className="relative z-10 w-full space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                                <Sparkle size={24} weight="fill" className="text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300/80">AI Performance Insights</span>
                        </div>
                        <div>
                            <h2 className="text-white font-outfit mb-6">
                                {profile.avgAccuracy >= 75 ? "Excellent Progress" : "Keep Improving"}, <br/>
                                <span className="text-indigo-400">{profile.name.split(' ')[0]}</span>
                            </h2>
                            <p className="text-slate-400 font-medium text-base leading-relaxed max-w-2xl font-sans opacity-90">
                                {weakTopics.length > 0 
                                    ? `Your current accuracy is ${profile.avgAccuracy}%. We've identified ${weakTopics.join(', ')} as areas that need more attention. Focused practice on these topics will help you improve your score quickly.`
                                    : `Your current accuracy is ${profile.avgAccuracy}%. You are performing consistently across all modules. Keep up the good work to maintain your strong position.`}
                            </p>
                        </div>
                        <button className="flex items-center gap-3 px-8 py-4 rounded-xl bg-white text-slate-950 font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-50 transition-all active:scale-95 group/btn">
                            Detailed Breakdown <ArrowRight size={18} weight="bold" className="group-hover/btn:translate-x-1.5 transition-transform" />
                        </button>
                    </div>
                </div>

                <div className="p-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between group relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all duration-300 shadow-sm">
                                <Target size={24} weight="bold" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Exam Deadline</span>
                        </div>
                        <h4 className="font-bold text-slate-900 font-outfit mb-4">{examTargetLabel}</h4>
                        <div className="flex items-baseline gap-2 mb-8">
                            <span className="text-6xl font-bold text-indigo-600 font-outfit tracking-tight leading-none">{examTargetDays}</span>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Days Left</span>
                        </div>
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prep Readiness</span>
                            <span className="text-xl font-bold text-indigo-600 font-outfit leading-none">{profile.avgAccuracy}%</span>
                        </div>
                        <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1 shadow-inner">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${profile.avgAccuracy}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
