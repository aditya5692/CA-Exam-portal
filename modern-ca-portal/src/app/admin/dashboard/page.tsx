import prisma from "@/lib/prisma/client";
import { getCurrentUserOrDemoUser } from "@/lib/auth/session";

export default async function AdminDashboardPage() {
    const admin = await getCurrentUserOrDemoUser("ADMIN");
    const [teachers, students, batches, materials, updates] = await Promise.all([
        prisma.user.count({ where: { role: "TEACHER" } }),
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.batch.count(),
        prisma.studyMaterial.count(),
        prisma.announcement.count(),
    ]);

    return (
        <div className="min-h-screen bg-[#f8fafc] p-8 md:p-12">
            <div className="mx-auto max-w-6xl space-y-8">
                <div className="rounded-[32px] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] border border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600">Admin Dashboard</p>
                    <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{admin.fullName ?? "Portal Admin"}</h1>
                    <p className="mt-3 max-w-2xl text-slate-600">
                        This is the admin demo landing page for the seeded login account. It gives you a clean entry point until a full admin module is built.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-[28px] border border-slate-100 bg-white p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Teachers</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{teachers}</p>
                    </div>
                    <div className="rounded-[28px] border border-slate-100 bg-white p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Students</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{students}</p>
                    </div>
                    <div className="rounded-[28px] border border-slate-100 bg-white p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Batches</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{batches}</p>
                    </div>
                    <div className="rounded-[28px] border border-slate-100 bg-white p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Materials</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{materials}</p>
                    </div>
                    <div className="rounded-[28px] border border-slate-100 bg-white p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Updates</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">{updates}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
