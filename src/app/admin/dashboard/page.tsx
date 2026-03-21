import prisma from "@/lib/prisma/client";
import { User } from "@prisma/client";
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle,
  Prohibit,
  FilePdf
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { AdminDirectory } from "@/components/admin/admin-directory";
import Link from "next/link";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight font-outfit">User Management</h1>
          <p className="text-slate-500 font-medium font-sans">Oversee all platform participants and permissions.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button className="px-5 py-3 rounded-[16px] bg-white border border-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:text-slate-900 transition-all duration-300 active:scale-95 flex items-center gap-2">
            <ShieldCheck size={18} weight="bold" /> Audit Logs
          </button>
          <Link href="/admin/control-center" className="px-5 py-3 rounded-[16px] bg-indigo-50/50 border border-indigo-100 text-indigo-700 font-black text-[10px] uppercase tracking-widest shadow-[0_4px_12px_rgba(79,70,229,0.05)] hover:bg-indigo-100 transition-all duration-300 active:scale-95 flex items-center gap-2">
            <ShieldCheck size={18} weight="bold" /> Command Center
          </Link>
          <Link href="/admin/past-year-questions" className="px-5 py-3 rounded-[16px] bg-slate-100 border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all duration-300 active:scale-95 flex items-center gap-2">
            <FilePdf size={18} weight="bold" /> PYQ Hub
          </Link>
          <button className="px-6 py-3 rounded-[16px] bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest shadow-[0_10px_25px_rgba(0,0,0,0.15)] hover:bg-indigo-600 transition-all duration-300 active:scale-95 flex items-center gap-2">
            <UserPlus size={18} weight="bold" /> Add User
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Users", value: users.length.toString(), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Active Teachers", value: users.filter((u: User) => u.role === 'TEACHER').length.toString(), icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Students", value: users.filter((u: User) => u.role === 'STUDENT').length.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Blocked", value: users.filter((u: User) => u.isBlocked).length.toString(), icon: Prohibit, color: "text-rose-600", bg: "bg-rose-50" },
        ].map(stat => (
          <div key={stat.label} className="p-10 rounded-[40px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-500 flex items-center gap-6">
            <div className={cn("w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-110", stat.bg, stat.color)}>
              <stat.icon size={32} weight="bold" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1.5 opacity-60">{stat.label}</div>
              <div className="text-4xl font-black text-slate-950 font-outfit tracking-tighter leading-none">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <AdminDirectory initialUsers={users} />
    </div>
  );
}