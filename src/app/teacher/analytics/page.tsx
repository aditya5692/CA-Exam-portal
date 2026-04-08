export const dynamic = "force-dynamic";

import { getTeacherAnalyticsData } from "@/actions/educator-actions";
import { cn } from "@/lib/utils";
import {
    ArrowRight,
    ArrowUpRight,
    ChartBar,
    ChartLine,
    CheckCircle,
    Clock,
    Export,
    Stack,
    Target,
    TrendDown,
    TrendUp,
    UserFocus,
    Users,
    Warning,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default async function TeacherAnalyticsPage() {
    const res = await getTeacherAnalyticsData();

    // Graceful fallback if action fails
    if (!res.success || !res.data) {
        return (
            <div className="flex items-center justify-center py-40 text-center">
                <div className="space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto">
                        <Warning size={32} weight="fill" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Analytics Unavailable</h2>
                    <p className="text-sm text-slate-400 max-w-xs">{res.message ?? "Could not fetch analytics. Please try again."}</p>
                </div>
            </div>
        );
    }

    const { stats, trends, examPerformance, atRiskStudents, subjectAccuracy, topStudents, teacherName } = res.data;
    const isEmpty = stats.totalAttempts === 0;

    const statCards = [
        { label: "Total Attempts", value: stats.totalAttempts.toLocaleString(), icon: ChartBar, color: "text-indigo-600", bg: "bg-indigo-50", subtitle: "Across all your tests" },
        { label: "Avg Score", value: `${stats.avgScore}%`, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50", subtitle: "Class average" },
        { label: "Pass Rate", value: `${stats.passRate}%`, icon: CheckCircle, color: stats.passRate >= 60 ? "text-emerald-600" : "text-rose-600", bg: stats.passRate >= 60 ? "bg-emerald-50" : "bg-rose-50", subtitle: "≥40% threshold" },
        { label: "Active Students", value: stats.activeStudents.toLocaleString(), icon: Users, color: "text-violet-600", bg: "bg-violet-50", subtitle: "Unique test-takers" },
        { label: "Live Exams", value: stats.publishedExams.toString(), icon: Stack, color: "text-amber-600", bg: "bg-amber-50", subtitle: `of ${stats.totalExams} total exams` },
    ];

    const trendMax = Math.max(...trends.map(t => t.attempts), 1);

    return (
        <div className="w-full max-w-7xl mx-auto pb-12 font-outfit animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            Intelligence Engine
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Analytics</h1>
                        <p className="text-sm text-slate-400 font-medium max-w-xl">
                            Real-time performance data for {teacherName}&apos;s students — attempts, pass rates, at-risk detection, and subject mastery.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/teacher/students" className="h-11 px-5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-sm hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-2 shadow-sm">
                            <UserFocus size={16} weight="fill" /> View Students
                        </Link>
                        <button className="h-11 px-5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95">
                            <Export size={16} weight="bold" /> Export Report
                        </button>
                    </div>
                </div>
            </div>

            {isEmpty && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 flex items-center gap-3 text-amber-700 text-sm font-medium">
                    <Warning size={20} weight="fill" className="shrink-0" />
                    No submitted exam attempts yet — analytics will populate as students complete your tests.
                </div>
            )}

            {/* ── Stat Cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {statCards.map(stat => (
                    <div key={stat.label} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex items-center gap-4 hover:border-indigo-200 transition-all group">
                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-105 transition-transform", stat.bg, stat.color)}>
                            <stat.icon size={22} weight="fill" />
                        </div>
                        <div>
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                            <div className="text-xl font-black text-slate-900 leading-tight">{stat.value}</div>
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5">{stat.subtitle}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Middle Row: Trends + At-Risk ───────────────────────── */}
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">

                {/* 7-Day Attempt Trend */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                            <ChartLine size={20} weight="fill" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">7-Day Activity</h3>
                            <p className="text-[11px] text-slate-400 font-medium">Daily attempts + avg score</p>
                        </div>
                    </div>

                    <div className="flex items-end gap-2 h-32">
                        {trends.map((day, i) => {
                            const heightPct = trendMax > 0 ? (day.attempts / trendMax) * 100 : 0;
                            const isToday = i === 6;
                            return (
                                <div key={day.name} className="flex-1 flex flex-col items-center gap-1.5 group/bar">
                                    <div className="text-[9px] font-black text-slate-400 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                        {day.attempts > 0 ? `${day.score}%` : "—"}
                                    </div>
                                    <div className="w-full flex items-end" style={{ height: "80px" }}>
                                        <div
                                            className={cn(
                                                "w-full rounded-t-lg transition-all duration-500",
                                                day.attempts === 0 ? "opacity-30" : "",
                                                isToday ? "bg-indigo-600" : "bg-indigo-200 group-hover/bar:bg-indigo-400"
                                            )}
                                            style={{ height: day.attempts === 0 ? "4px" : `${Math.max(8, heightPct)}%` }}
                                        />
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase">{day.name}</div>
                                    {day.attempts > 0 && (
                                        <div className={cn("text-[9px] font-black", isToday ? "text-indigo-600" : "text-slate-400")}>
                                            {day.attempts}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* At-Risk Students */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                                <Warning size={20} weight="fill" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">At-Risk Students</h3>
                                <p className="text-[11px] text-slate-400 font-medium">Below class average</p>
                            </div>
                        </div>
                        <Link href="/teacher/students" className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                            All <ArrowRight size={12} weight="bold" />
                        </Link>
                    </div>

                    {atRiskStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                                <CheckCircle size={24} weight="fill" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700">All students on track</p>
                            <p className="text-xs text-slate-400">No students are significantly below average.</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {atRiskStudents.map((student, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-rose-100 hover:bg-rose-50/30 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-[11px] font-black text-slate-500 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600 transition-all">
                                            {student.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900 leading-tight">{student.name}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                                    student.status === "Critical" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                                )}>
                                                    {student.status}
                                                </span>
                                                <span className="text-[10px] text-slate-400">{student.attempts} attempt{student.attempts !== 1 ? "s" : ""}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-black text-slate-900">{student.score}%</div>
                                        <div className="flex items-center gap-0.5 text-[10px] text-rose-500 font-semibold justify-end">
                                            <TrendDown size={11} weight="bold" /> {Math.abs(student.deviation)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Bottom Row: Subject Accuracy + Exam Performance + Top Students ── */}
            <div className="grid lg:grid-cols-[1fr_1fr_0.8fr] gap-6">

                {/* Subject Accuracy Bars */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                            <Target size={20} weight="fill" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Subject Accuracy</h3>
                            <p className="text-[11px] text-slate-400 font-medium">From student topic progress</p>
                        </div>
                    </div>

                    {subjectAccuracy.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400 font-medium">
                            No topic progress data yet.<br />
                            <span className="text-xs">Populates as students practice with adaptive learning.</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {subjectAccuracy.map(sub => (
                                <div key={sub.subject} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[160px]">{sub.subject}</span>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className={cn("text-xs font-black", sub.accuracy >= 70 ? "text-emerald-600" : sub.accuracy >= 50 ? "text-amber-600" : "text-rose-600")}>
                                                {sub.accuracy}%
                                            </span>
                                            {sub.accuracy >= 70 ? <TrendUp size={12} weight="bold" className="text-emerald-500" /> : <TrendDown size={12} weight="bold" className="text-rose-400" />}
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-700", sub.accuracy >= 70 ? "bg-emerald-500" : sub.accuracy >= 50 ? "bg-amber-400" : "bg-rose-400")}
                                            style={{ width: `${sub.accuracy}%` }}
                                        />
                                    </div>
                                    <div className="text-[10px] text-slate-400">{sub.attempts.toLocaleString()} questions attempted</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Exam Performance Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                            <Stack size={20} weight="fill" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Exam Breakdown</h3>
                            <p className="text-[11px] text-slate-400 font-medium">Top attempted tests</p>
                        </div>
                    </div>

                    {examPerformance.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400 font-medium">No attempted exams yet.</div>
                    ) : (
                        <div className="space-y-2">
                            {examPerformance.map((exam, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/60 transition-all group">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[11px] font-black text-indigo-600 shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">{exam.title}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{exam.subject} · {exam.attempts} attempt{exam.attempts !== 1 ? "s" : ""}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-black text-slate-900">{exam.avgScore}%</div>
                                        <div className={cn("text-[10px] font-semibold flex items-center justify-end gap-0.5", exam.passRate >= 60 ? "text-emerald-500" : "text-rose-400")}>
                                            <ArrowUpRight size={11} weight="bold" /> {exam.passRate}% pass
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Students */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                            <UserFocus size={20} weight="fill" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Top Students</h3>
                            <p className="text-[11px] text-slate-400 font-medium">Ranked by XP</p>
                        </div>
                    </div>

                    {topStudents.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400 font-medium">No student XP data yet.</div>
                    ) : (
                        <div className="space-y-2.5">
                            {topStudents.map((s, i) => {
                                const medalColors = ["text-amber-500", "text-slate-400", "text-amber-700"];
                                return (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-violet-100 transition-all group">
                                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0", i < 3 ? "bg-amber-50 border border-amber-100" : "bg-slate-50 border border-slate-200", medalColors[i] ?? "text-slate-400")}>
                                            {s.rank}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-slate-900 truncate">{s.name}</div>
                                            <div className="text-[10px] text-slate-400">Lv.{s.level} · {s.xp.toLocaleString()} XP</div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-sm font-black text-emerald-600">{s.avgScore > 0 ? `${s.avgScore}%` : "—"}</div>
                                            <div className="text-[9px] text-slate-400">avg score</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Data freshness note */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                <Clock size={13} weight="bold" />
                Live data · Refreshes on every page load · All values computed from real exam attempts
            </div>
        </div>
    );
}
