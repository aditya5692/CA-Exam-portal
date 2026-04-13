export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { cn } from "@/lib/utils";
import {
    Monitor,
    Plus,
    Sparkle,
    Stack,
    Users,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { TestSeriesTable } from "@/components/teacher/test-series-table";

export default async function TeacherExamsPage() {
    const teacher = await requireAuth(["TEACHER", "ADMIN"]);

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
        <div className="w-full max-w-7xl mx-auto pb-12   animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Actionable Header - INPUT Focus */}
            <div className="mb-10 relative">
                <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 px-4">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            Workflow Management
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Test Series Pipeline</h1>
                        <p className="text-slate-500 font-medium text-sm max-w-xl leading-relaxed">
                            {teacher.role === "ADMIN"
                                ? "Centralized management for all academy-wide MCQ series and mock assessments."
                                : "Design, schedule, and distribute high-fidelity MCQ test series to your batches."}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                        <Link
                            href="/teacher/analytics"
                            className="h-12 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 transition-all active:scale-95 flex items-center gap-2 px-5 shadow-sm"
                        >
                            <Monitor size={16} weight="fill" className="text-amber-500" /> View Analytics
                        </Link>
                        <Link
                            href="/teacher/test-series/create"
                            className="h-12 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 px-6 shadow-md shadow-indigo-600/20"
                        >
                            <Plus size={18} weight="bold" /> Build New Series
                        </Link>
                    </div>
                </div>
            </div>

            {/* Performance Metrics - OUTPUT Focus */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                    { label: "Live Assessments", value: publishedExams.length, icon: Stack, color: "text-indigo-600", bg: "bg-indigo-50", subtitle: "Active for students" },
                    { label: "Total Submissions", value: totalAttempts.toLocaleString(), icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", subtitle: "Evaluated attempts" },
                    { label: "Asset Inventory", value: exams.reduce((s, e) => s + e._count.questions, 0).toLocaleString(), icon: Sparkle, color: "text-amber-600", bg: "bg-amber-50", subtitle: "Indexed test items" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white border border-slate-100 shadow-sm rounded-lg p-6 relative overflow-hidden transition-all duration-300 hover:border-indigo-200 group flex items-center gap-5">
                        <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm border border-slate-100 group-hover:scale-105", stat.bg, stat.color)}>
                            <stat.icon size={24} weight="fill" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 pb-0.5">
                                {stat.label}
                            </div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight leading-none">{stat.value}</div>
                            <div className="text-[10px] font-medium text-slate-400 mt-1.5">{stat.subtitle}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Series Pipeline - PROCESS Focus */}
            <div className="flex flex-col">
                <TestSeriesTable initialExams={exams} />

                <div className="p-6 bg-slate-50/80 border-t border-slate-100 text-center">
                    <p className="text-xs font-semibold text-slate-400">
                        Workflow Process Segment • Viewing {exams.length} of {exams.length} active assessments
                    </p>
                </div>
            </div>
        </div>
    );
}
