import prisma from "@/lib/prisma/client";
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle,
  Prohibit
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { AdminDirectory } from "@/components/admin/admin-directory";

type User = {
  id: string;
  email: string | null;
  fullName: string | null;
  registrationNumber: string | null;
  role: string;
  isBlocked: boolean;
  createdAt: Date;
};

export default async function AdminUsersPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users = await (prisma as any).user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-outfit">User Management</h1>
          <p className="text-slate-500 font-medium">Oversee all platform participants and permissions.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2">
            <ShieldCheck size={20} weight="bold" /> Audit Logs
          </button>
          <button className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2">
            <UserPlus size={20} weight="bold" /> Add User
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
          <div key={stat.label} className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm flex items-center gap-6">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
              <stat.icon size={22} weight="bold" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</div>
              <div className="text-2xl font-black text-slate-900">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <AdminDirectory initialUsers={users} />
    </div>
  );
}