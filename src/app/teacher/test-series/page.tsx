export const dynamic = "force-dynamic";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  CaretRight,
  Clock,
  DotsThreeVertical,
  FileText,
  Globe,
  MagnifyingGlass,
  Monitor,
  Plus,
  Sparkle,
  Stack,
  Users
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { TestSeriesTable } from "@/components/teacher/test-series-table";

export default async function TeacherExamsPage() {
    const teacher = await getCurrentUserOrDemoUser("TEACHER", ["TEACHER", "ADMIN"]);

    const examsRaw = await prisma.exam.findMany({
        where: teacher.role === "ADMIN"
            ? {}                               
            : { teacherId: teacher.id },       
        include: {
            batch: { select: { name: true } },
            _count: { select: { attempts: true, questions: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const exams = examsRaw.map(e => ({
        ...e,
        createdAt: e.createdAt.toISOString()
    }));

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
                <TestSeriesTable initialExams={exams} />
                
                <div className="p-8 bg-slate-50/50 border-t border-slate-50 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        End of Series Registry • Viewing {exams.length} of {exams.length} Assessment Items
                    </p>
                </div>
            </div>
        </div>
    );
}
