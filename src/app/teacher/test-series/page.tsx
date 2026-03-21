import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import {
    Plus,
    Monitor,
    Users,
    TrendUp,
    MagnifyingGlass,
    DotsThreeVertical,
    Globe,
    Stack,
    FileText,
    Clock,
    CaretRight,
    ArrowUpRight,
    Sparkle
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function TeacherExamsPage() {
    const teacher = await getCurrentUser(["TEACHER", "ADMIN"]);
    if (!teacher) throw new Error("Unauthorized");

    const exams = await prisma.exam.findMany({
        where: teacher.role === "ADMIN"
            ? {}                               
            : { teacherId: teacher.id },       
        include: {
            batch: { select: { name: true } },
            _count: { select: { attempts: true, questions: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const totalAttempts = exams.reduce((s, e) => s + e._count.attempts, 0);
    const publishedExams = exams.filter((e) => e.status === "PUBLISHED");

    return (
        <div className="space-y-6 pb-10 w-full max-w-[1280px] mx-auto font-outfit animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section with Premium Glow */}
            <div className="relative overflow-hidden rounded-[32px] bg-slate-900 p-10 text-white shadow-2xl group mb-4">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none group-hover:bg-indigo-500/15 transition-all duration-1000" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                                <Stack size={24} weight="bold" className="text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Assessment Engine</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tighter mb-4">Test Series</h1>
                        <p className="text-slate-400 text-base font-medium leading-relaxed max-w-2xl">
                            {teacher.role === "ADMIN"
                                ? "Centralized management for all academy-wide MCQ series and mock assessments."
                                : "Design and deploy high-fidelity MCQ series. Manage distribution and monitor real-time attempt data."}
                        </p>
                    </div>
                    
                    <div className="flex gap-4">
                        <Link
                            href="/teacher/analytics"
                            className="px-6 h-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 flex items-center gap-3"
                        >
                            <Monitor size={16} weight="bold" /> Analytics
                        </Link>
                        <Link
                            href="/teacher/questions"
                            className="px-6 h-14 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-3"
                        >
                            <Plus size={16} weight="bold" /> Add MCQ
                        </Link>
                    </div>

                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Published Series", value: publishedExams.length, icon: Stack, color: "text-indigo-600", bg: "bg-indigo-50", subtitle: "Live for students" },
                    { label: "Total Submissions", value: totalAttempts.toLocaleString(), icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", subtitle: "Across all exams" },
                    { label: "Question Pool", value: exams.reduce((s, e) => s + e._count.questions, 0).toLocaleString(), icon: Sparkle, color: "text-amber-500", bg: "bg-amber-50", subtitle: "Managed items" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white/80 backdrop-blur-md border border-slate-100 shadow-sm rounded-[24px] p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-indigo-100/50 group flex items-center gap-5">
                        <div className={cn("w-16 h-16 rounded-[22px] flex items-center justify-center transition-all duration-300 shadow-sm border border-slate-100/50 group-hover:scale-105", stat.bg, stat.color)}>
                            <stat.icon size={28} weight="bold" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                                {stat.label}
                            </div>
                            <div className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{stat.value}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{stat.subtitle}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Series Table Container */}
            <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col pt-6">
                <div className="px-8 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Repositories</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Found {exams.length} series in your vault</p>
                    </div>
                    
                    <div className="relative group">
                        <MagnifyingGlass
                            size={18}
                            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                            weight="bold"
                        />
                        <input
                            type="text"
                            placeholder="Filter assessment series..."
                            className="w-full md:w-80 pl-14 pr-8 py-4 rounded-[20px] bg-slate-50/50 border border-slate-100 text-[10px] uppercase font-black tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-sans placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {exams.length === 0 ? (
                    <div className="py-32 text-center space-y-4">
                        <div className="w-24 h-24 bg-slate-50 rounded-[32px] mx-auto flex items-center justify-center text-slate-200">
                            <Stack size={48} weight="light" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">No Series Found</h3>
                            <p className="text-xs text-slate-400 font-medium">Head to the <Link href="/teacher/questions" className="text-indigo-600 font-bold hover:underline">Question Bank</Link> to initialize your first series.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-100">
                        <table className="w-full text-left border-separate border-spacing-0 px-4">
                            <thead>
                                <tr className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">
                                    <th className="px-8 py-6">Identity & Metrics</th>
                                    <th className="px-8 py-6">Target Audience</th>
                                    <th className="px-8 py-6">Classification</th>
                                    <th className="px-8 py-6">Visibility</th>
                                    <th className="px-8 py-6">Engagement</th>
                                    <th className="px-8 py-6">Timestamp</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {exams.map((exam) => (
                                    <tr key={exam.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        <td className="px-8 py-7">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-white group-hover:border-indigo-100 group-hover:scale-110 transition-all duration-500">
                                                    <FileText size={22} weight="bold" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-1">
                                                        {exam.title}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                        <Clock size={12} weight="bold" /> {exam.duration} mins <span className="opacity-30">•</span> {exam.totalMarks} Marks
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-8 py-7">
                                            {exam.batch ? (
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                                    <Users size={14} weight="bold" /> {exam.batch.name}
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                    <Globe size={14} weight="bold" /> Global Access
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-8 py-7">
                                            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                {exam.examType || "PRACTICE"}
                                            </div>
                                        </td>

                                        <td className="px-8 py-7">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
                                                exam.status === "PUBLISHED" 
                                                    ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                                    : "bg-amber-50 border-amber-100 text-amber-600"
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", exam.status === "PUBLISHED" ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                                                {exam.status === "PUBLISHED" ? "Live Studio" : "Draft Workspace"}
                                            </div>
                                        </td>

                                        <td className="px-8 py-7">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base font-bold text-slate-900 tracking-tight">{exam._count.attempts}</span>
                                                    <ArrowUpRight size={14} className="text-emerald-500" weight="bold" />
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{exam._count.questions} Items</div>
                                            </div>
                                        </td>

                                        <td className="px-8 py-7">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {new Date(exam.createdAt).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </div>
                                        </td>

                                        <td className="px-8 py-7 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-md transition-all flex items-center justify-center group/opt">
                                                    <DotsThreeVertical size={20} weight="bold" />
                                                </button>
                                                <button className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 transition-all active:scale-95 shadow-md shadow-slate-900/10 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                                                    <CaretRight size={18} weight="bold" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                <div className="p-8 bg-slate-50/50 border-t border-slate-50 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        End of Series Registry • Viewing {exams.length} of {exams.length} Assessment Items
                    </p>
                </div>
            </div>
        </div>
    );
}
