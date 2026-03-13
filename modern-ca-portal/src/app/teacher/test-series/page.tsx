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
    Stack
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export default async function TeacherExamsPage() {
    // ── Real auth — use the logged-in teacher (or demo teacher) ──────────────
    const teacher = await getCurrentUser(["TEACHER", "ADMIN"]);
    if (!teacher) throw new Error("Unauthorized");

    const exams = await prisma.exam.findMany({
        where: teacher.role === "ADMIN"
            ? {}                               // admin sees every exam
            : { teacherId: teacher.id },       // teacher sees only their own
        include: {
            batch: { select: { name: true } },
            _count: { select: { attempts: true, questions: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    // Real aggregate stats
    const totalAttempts = exams.reduce((s, e) => s + e._count.attempts, 0);
    const publishedExams = exams.filter((e) => e.status === "PUBLISHED");

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight font-outfit">
                        Test Series
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {teacher.role === "ADMIN"
                            ? "All MCQ series across every teacher."
                            : "Your published MCQ series. Upload via Question Bank → Bulk Upload."}
                    </p>
                </div>
                <div className="flex gap-3">
                    <a
                        href="/teacher/analytics"
                        className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Monitor size={20} weight="bold" /> View Analytics
                    </a>
                    <a
                        href="/teacher/questions"
                        className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={20} weight="bold" /> Upload MCQ Set
                    </a>
                </div>
            </div>

            {/* Quick Stats — from real DB */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        label: "Published Tests",
                        value: String(publishedExams.length),
                        icon: Stack,
                        color: "text-indigo-600",
                        bg: "bg-indigo-50",
                    },
                    {
                        label: "Total Attempts",
                        value: String(totalAttempts),
                        icon: Users,
                        color: "text-emerald-600",
                        bg: "bg-emerald-50",
                    },
                    {
                        label: "Total MCQ Series",
                        value: String(exams.length),
                        icon: TrendUp,
                        color: "text-blue-600",
                        bg: "bg-blue-50",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm flex items-center gap-6"
                    >
                        <div
                            className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                                stat.bg,
                                stat.color
                            )}
                        >
                            <stat.icon size={28} weight="bold" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                                {stat.label}
                            </div>
                            <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Exams Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        MCQ Series
                        <span className="ml-3 text-base font-normal text-slate-400">
                            ({exams.length})
                        </span>
                    </h3>
                    <div className="relative">
                        <MagnifyingGlass
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            weight="bold"
                        />
                        <input
                            type="text"
                            placeholder="Search tests..."
                            className="pl-12 pr-6 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all w-64"
                        />
                    </div>
                </div>

                {exams.length === 0 ? (
                    <div className="py-24 text-center text-slate-400">
                        <Stack size={48} className="mx-auto mb-4 opacity-30" weight="light" />
                        <p className="font-bold text-lg">No MCQ series yet</p>
                        <p className="text-sm mt-1">
                            Go to{" "}
                            <a href="/teacher/questions" className="text-indigo-500 underline">
                                Question Bank
                            </a>{" "}
                            → Bulk Upload → Publish as MCQ Series
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                                    <th className="px-8 py-4">Series Title</th>
                                    <th className="px-8 py-4">Category</th>
                                    <th className="px-8 py-4">Audience</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4">Questions</th>
                                    <th className="px-8 py-4">Attempts</th>
                                    <th className="px-8 py-4">Created</th>
                                    <th className="px-8 py-4" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {exams.map((exam) => (
                                    <tr
                                        key={exam.id}
                                        className="group hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                {exam.title}
                                            </div>
                                            <div className="text-xs text-slate-400 font-medium">
                                                {exam.duration} mins · {exam.totalMarks} marks
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                                                {exam.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            {exam.batch ? (
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                                    <Users size={14} /> {exam.batch.name}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                                    <Globe size={14} /> All Students
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div
                                                className={cn(
                                                    "flex items-center gap-2 text-xs font-black uppercase tracking-widest",
                                                    exam.status === "PUBLISHED"
                                                        ? "text-emerald-500"
                                                        : exam.status === "DRAFT"
                                                            ? "text-amber-500"
                                                            : "text-slate-400"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        exam.status === "PUBLISHED"
                                                            ? "bg-emerald-500"
                                                            : exam.status === "DRAFT"
                                                                ? "bg-amber-500"
                                                                : "bg-slate-400"
                                                    )}
                                                />
                                                {exam.status}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-600">
                                            {exam._count.questions} MCQs
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-600">
                                            {exam._count.attempts}
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-400">
                                            {new Date(exam.createdAt).toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100">
                                                <DotsThreeVertical size={20} weight="bold" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
