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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Score Trend Card */}
                <div className="student-surface lg:col-span-2 relative flex h-[320px] md:h-[400px] flex-col overflow-hidden rounded-lg p-6 md:p-10  ">
                    <div className="flex items-center justify-between mb-4 md:mb-8">
                        <div className="space-y-1">
                            <h3 className="text-lg md:text-xl  ">Performance Trend</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 md:mt-2">Progress over time</p>
                        </div>
                        <div className="student-chip hidden sm:flex items-center gap-2.5 rounded-lg px-4 py-2 transition-all active:scale-95">
                            <TrendUp size={16} weight="bold" className="text-[var(--student-accent-strong)]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Improving</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceTrend}>
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--student-accent)" stopOpacity={0.16} />
                                        <stop offset="95%" stopColor="var(--student-accent)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--student-muted)', fontSize: 12, fontWeight: 600 }}
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
                                                <div className="bg-[var(--student-panel)] p-4 rounded-lg shadow-xl border border-[var(--student-border)] animate-in zoom-in-95 duration-200">
                                                    <p className="text-[10px] font-bold text-[var(--student-muted)] uppercase tracking-widest mb-1">{payload[0].payload.date}</p>
                                                    <p className="text-2xl font-bold text-[var(--student-text)]  ">{payload[0].value}%</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="var(--student-accent)"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#scoreGradient)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Error Distribution (Conditional) */}
                {data.errorDistribution && data.errorDistribution.length > 0 ? (
                    <div className="student-surface flex h-[350px] md:h-[400px] flex-col rounded-lg p-6 md:p-10 transition-all duration-300 hover:shadow-[0_18px_30px_rgba(55,48,38,0.08)]">
                        <div className="mb-6 md:mb-8">
                            <h3 className="text-lg md:text-xl  ">Error Distribution</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 md:mt-2">Self-Diagnosis Insights</p>
                        </div>
                        <div className="flex-1 w-full flex flex-col">
                            <div className="flex-1 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.errorDistribution} layout="vertical" barSize={36}>
                                        <XAxis type="number" hide domain={[0, 100]} />
                                        <YAxis
                                            type="category"
                                            dataKey="label"
                                            hide
                                        />
                                        <Bar dataKey="value" radius={[0, 12, 12, 0]} className="filter drop-shadow-sm" minPointSize={4}>
                                            {data.errorDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3 mt-6">
                                {data.errorDistribution.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                                        </div>
                                        <span className="text-sm md:text-base font-bold text-slate-900  ">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Fallback to Performance Benchmark if no sub-tags yet */
                    <div className="student-surface flex h-[350px] md:h-[400px] flex-col rounded-lg p-6 md:p-10 transition-all duration-300 hover:shadow-[0_18px_30px_rgba(55,48,38,0.08)]">
                        <div className="mb-6 md:mb-8">
                            <h3 className="text-lg md:text-xl  ">Performance Benchmark</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 md:mt-2">Accuracy vs Peers</p>
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
                                        <Bar dataKey="value" radius={[0, 12, 12, 0]} className="filter drop-shadow-sm" minPointSize={4}>
                                            {comparativeAnalysis.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3 mt-6">
                                {comparativeAnalysis.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
                                        </div>
                                        <span className="text-sm md:text-base font-bold text-slate-900  ">{Math.round(item.value)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Personalized AI Insights */}
            <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
                <div className="student-surface-dark lg:col-span-2 relative overflow-hidden rounded-lg p-6 md:p-10 text-white">
                    <div className="relative z-10 w-full space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="student-icon-tile-warm flex h-12 w-12 items-center justify-center rounded-lg">
                                    <Sparkle size={24} weight="fill" className="text-[var(--student-support)]" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/65">Performance Notes</span>
                            </div>
                            {(profile?.rank ?? 0) > 0 && (
                                <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/10 text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5 whitespace-nowrap">Global Rank</p>
                                    <p className="text-xl font-bold   text-[var(--student-support)]">#{profile.rank}</p>
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl text-white   mb-4 md:mb-6 leading-tight">
                                {profile.avgAccuracy >= 75 ? "Excellent Progress" : "Keep Improving"}, <br/>
                                <span className="text-[var(--student-support-soft)]">{profile.name.split(' ')[0]}</span>
                            </h2>
                            <p className="text-slate-400 font-medium text-base leading-relaxed max-w-2xl   opacity-90">
                                {data.errorDistribution && data.errorDistribution.length > 0 ? (
                                    <>
                                        You know the concepts, but 
                                        <span className="text-white mx-1 font-bold">
                                            {data.errorDistribution.find(e => e.name === "SILLY")?.value || 0}%
                                        </span>
                                        of your errors are due to Silly Mistakes. 
                                        <span className="text-[var(--student-support-soft)] ml-1 font-bold italic">Slow down.</span>
                                        {weakTopics.length > 0 && ` We've also flagged ${weakTopics.slice(0, 2).join(' and ')} for conceptual review.`}
                                    </>
                                ) : (
                                    weakTopics.length > 0 
                                        ? `Your current accuracy is ${profile.avgAccuracy}%. We've identified ${weakTopics.slice(0, 3).join(', ')} as areas that need more attention. Focused practice on these topics will help you improve your score quickly.`
                                        : `Your current accuracy is ${profile.avgAccuracy}%. You are performing consistently across all modules. Keep up the good work to maintain your strong position.`
                                )}
                            </p>
                        </div>
                        <button className="student-button-secondary group/btn flex items-center gap-3 rounded-lg px-8 py-4 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95">
                            Detailed Breakdown <ArrowRight size={18} weight="bold" className="group-hover/btn:translate-x-1.5 transition-transform" />
                        </button>
                    </div>
                </div>

                <div className="student-surface relative flex flex-col justify-between overflow-hidden rounded-lg p-10">
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="student-icon-tile flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300">
                                <Target size={24} weight="bold" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Exam Deadline</span>
                        </div>
                        <h4 className="font-bold text-slate-900   mb-4">{examTargetLabel}</h4>
                        <div className="flex items-baseline gap-2 mb-4 md:mb-8">
                            <span className="  text-4xl md:text-6xl font-bold leading-none tracking-tight text-[var(--student-accent-strong)]">{examTargetDays}</span>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Days Left</span>
                        </div>
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prep Readiness</span>
                            <span className="  text-xl font-bold leading-none text-[var(--student-accent-strong)]">{profile.avgAccuracy}%</span>
                        </div>
                        <div className="h-4 w-full overflow-hidden rounded-full border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-1 shadow-inner">
                            <div className="h-full rounded-full bg-[var(--student-accent)] transition-all duration-1000" style={{ width: `${profile.avgAccuracy}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
