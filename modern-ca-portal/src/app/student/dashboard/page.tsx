import StudentLayout from "@/components/student/layout";
import {
    Calendar,
    ArrowRight,
    Play,
    Clock,
    GraduationCap,
    Sparkle,
    IdentificationBadge,
    Trophy
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";

const UPCOMING_EXAMS = [
    { title: "Corporate Law Mock", date: "Tomorrow, 10:00 AM", duration: "180 min", icon: GraduationCap },
    { title: "Direct Tax Simulation", date: "Mar 15, 02:00 PM", duration: "120 min", icon: IdentificationBadge },
];

const RECENT_RESULTS = [
    { exam: "Financial Reporting", score: 84, date: "Yesterday", status: "Pass" },
    { exam: "Audit & Assurance", score: 52, date: "3 days ago", status: "Fail" },
];

export default function StudentDashboardPage() {
    return (
        <StudentLayout>
            <div className="space-y-12 pb-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 px-2 py-1 bg-indigo-50 rounded-md">Elite Member</span>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 font-outfit tracking-tight">Welcome back, Aditya.</h1>
                        <p className="text-gray-500 text-lg font-medium mt-1">You&apos;re on track to complete Group 1 preparation in 18 days.</p>
                    </div>
                    <Link
                        href="/student/exams"
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 group"
                    >
                        Start Mock Exam <Play size={18} weight="fill" className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Progress Overview Section */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Summary Cards */}
                        <div className="grid sm:grid-cols-3 gap-6">
                            <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] group hover:border-indigo-100 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center mb-4 transition-all">
                                    <Clock size={20} weight="bold" />
                                </div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Study Hours</div>
                                <div className="text-2xl font-bold text-gray-900 font-outfit">124.5h</div>
                                <div className="text-[10px] font-bold text-emerald-500 mt-2">+12% from last week</div>
                            </div>
                            <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] group hover:border-indigo-100 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center mb-4 transition-all">
                                    <Trophy size={20} weight="bold" />
                                </div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Exams</div>
                                <div className="text-2xl font-bold text-gray-900 font-outfit">18</div>
                                <div className="text-[10px] font-bold text-gray-400 mt-2">Avg. Score: 72%</div>
                            </div>
                            <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] group hover:border-indigo-100 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center mb-4 transition-all">
                                    <Sparkle size={20} weight="bold" />
                                </div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Rank</div>
                                <div className="text-2xl font-bold text-gray-900 font-outfit">#142</div>
                                <div className="text-[10px] font-bold text-indigo-500 mt-2">Top 10% in Academy</div>
                            </div>
                        </div>

                        {/* Recent Results */}
                        <div className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-gray-900 font-outfit">Recent Performance</h3>
                                <Link href="/student/analytics" className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:underline">View All Analytics →</Link>
                            </div>
                            <div className="space-y-4">
                                {RECENT_RESULTS.map((result, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:border-indigo-100 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                                                result.status === "Pass" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                            )}>
                                                {result.score}%
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{result.exam}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{result.date}</div>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full",
                                            result.status === "Pass" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                        )}>
                                            {result.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar section */}
                    <div className="space-y-8">
                        {/* Upcoming Events */}
                        <div className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-full">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <Calendar size={20} weight="bold" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 font-outfit">Upcoming Exams</h3>
                            </div>
                            <div className="space-y-6">
                                {UPCOMING_EXAMS.map((exam, i) => (
                                    <div key={i} className="relative pl-6 border-l-2 border-gray-100 hover:border-indigo-600 transition-colors py-1">
                                        <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border-2 border-gray-200" />
                                        <div className="font-bold text-gray-900 group">{exam.title}</div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                <Clock size={12} /> {exam.date}
                                            </div>
                                            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                                                {exam.duration}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-10 py-4 rounded-2xl bg-gray-50 text-gray-600 font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100">
                                View Full Calendar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
