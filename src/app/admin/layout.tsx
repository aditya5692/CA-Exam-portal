import { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
    ShieldCheck, 
    Users, 
    BookOpen, 
    ChartBar, 
    SignOut,
    House,
    MagnifyingGlass,
    Bell,
    IdentificationBadge
} from "@phosphor-icons/react/dist/ssr";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const admin = await getCurrentUser("ADMIN");

    if (!admin) {
        redirect("/auth/login");
    }

    const navigation = [
        { label: "Control Center", href: "/admin/control-center", icon: ShieldCheck },
        { label: "User Management", href: "/admin/dashboard", icon: Users },
        { label: "Marketplace", href: "/admin/past-year-questions", icon: BookOpen },
    ];

    const initials = (admin.fullName ?? "Admin")
        .split(" ")
        .map((word) => word[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="flex min-h-screen bg-[#FDFDFF]">
            {/* Admin Sidebar */}
            <aside className="w-72 bg-slate-950 text-white flex flex-col h-screen sticky top-0 shadow-[20px_0_50px_rgba(0,0,0,0.05)] z-50 border-r border-white/5">
                <div className="p-8 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <ShieldCheck size={24} weight="fill" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight font-outfit">Financly</h2>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Admin Panel</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-6 space-y-2.5 mt-8">
                    {navigation.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all hover:bg-white/5 text-slate-400 hover:text-white group relative overflow-hidden active:scale-95"
                        >
                            <item.icon size={22} weight="bold" className="group-hover:text-indigo-400 transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                        </Link>
                    ))}
                    <div className="pt-8 border-t border-white/5 mt-8">
                        <Link
                            href="/student/dashboard"
                            className="flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all hover:bg-white/5 text-slate-500 hover:text-indigo-300 group active:scale-95"
                        >
                            <House size={20} weight="bold" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exit to Platform</span>
                        </Link>
                    </div>
                </nav>

                <div className="p-6 mt-auto border-t border-white/5">
                    <div className="bg-white/5 rounded-[24px] p-5 flex flex-col gap-4 border border-white/5">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-black border-2 border-slate-900 shadow-2xl">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate text-white uppercase tracking-wider">{admin.fullName}</p>
                                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.2em]">Super Admin</p>
                            </div>
                        </div>
                        <Link href="/auth/login" className="w-full py-3.5 rounded-[12px] bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 transition-all text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-white/5">
                            <SignOut size={14} weight="bold" /> Sign Out
                        </Link>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col">
                <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-12 sticky top-0 z-40">
                    <div className="flex-1 max-w-2xl relative">
                        <MagnifyingGlass size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" weight="bold" />
                        <input
                            type="text"
                            placeholder="Global Intelligence Search..."
                            className="w-full pl-14 pr-8 py-3.5 bg-slate-50 border border-slate-100 rounded-[20px] text-[10px] uppercase font-black tracking-[0.25em] focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 outline-none transition-all font-sans text-slate-900 placeholder:text-slate-300 shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="p-3 rounded-[16px] text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all relative border border-transparent hover:border-slate-100 shadow-sm">
                            <Bell size={24} weight="bold" />
                            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
                        </button>
                    </div>
                </header>

                <div className="p-8 max-w-[1600px] mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
