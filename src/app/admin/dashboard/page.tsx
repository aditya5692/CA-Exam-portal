import { AdminDirectory } from "@/components/admin/admin-directory";
import prisma from "@/lib/prisma/client";
import { cn } from "@/lib/utils";
import { FilePdf, Prohibit, ShieldCheck, UserPlus, Users } from "@phosphor-icons/react/dist/ssr";
import type { User } from "@prisma/client";
import Link from "next/link";

export default async function AdminUsersPage() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div className="space-y-3">
                    <div className="student-chip inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--student-accent)]" />
                        Admin Directory
                    </div>
                    <h1 className="font-outfit text-4xl font-black tracking-tight text-[var(--student-text)]">User Management</h1>
                    <p className="font-sans font-medium text-[var(--student-muted)]">Oversee all platform participants and permissions.</p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <button className="student-button-secondary flex items-center gap-2 rounded-[16px] px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                        <ShieldCheck size={18} weight="bold" /> Audit Logs
                    </button>
                    <Link href="/admin/control-center" className="student-chip-accent flex items-center gap-2 rounded-[16px] px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                        <ShieldCheck size={18} weight="bold" /> Command Center
                    </Link>
                    <Link href="/admin/past-year-questions" className="student-button-secondary flex items-center gap-2 rounded-[16px] px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                        <FilePdf size={18} weight="bold" /> PYQ Hub
                    </Link>
                    <button className="student-button-primary flex items-center gap-2 rounded-[16px] px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                        <UserPlus size={18} weight="bold" /> Add User
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                {[
                    { label: "Total Users", value: users.length.toString(), icon: Users, color: "text-[var(--student-accent-strong)]", bg: "bg-[var(--student-accent-soft)]" },
                    { label: "Active Teachers", value: users.filter((u: User) => u.role === "TEACHER").length.toString(), icon: ShieldCheck, color: "text-[var(--student-success)]", bg: "bg-[#e5f0e9]" },
                    { label: "Total Students", value: users.filter((u: User) => u.role === "STUDENT").length.toString(), icon: Users, color: "text-[var(--student-support)]", bg: "bg-[var(--student-support-soft)]" },
                    { label: "Blocked", value: users.filter((u: User) => u.isBlocked).length.toString(), icon: Prohibit, color: "text-rose-600", bg: "bg-rose-50" },
                ].map(stat => (
                    <div key={stat.label} className="student-surface flex items-center gap-6 rounded-[40px] p-10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(55,48,38,0.08)]">
                        <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] shadow-sm", stat.bg, stat.color)}>
                            <stat.icon size={32} weight="bold" />
                        </div>
                        <div>
                            <div className="mb-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--student-muted)] opacity-70">{stat.label}</div>
                            <div className="font-outfit text-4xl font-black leading-none tracking-tighter text-[var(--student-text)]">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <AdminDirectory initialUsers={users} />
        </div>
    );
}
