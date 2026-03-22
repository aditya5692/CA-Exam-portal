import { getSessionPayload } from "@/lib/auth/session";
import { Bell, BookOpen, House, MagnifyingGlass, ShieldCheck, SignOut, Users } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const admin = await getSessionPayload();

    if (!admin || (admin.role !== "ADMIN" && !admin.isSuperAdmin)) {
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
        <div className="student-theme flex min-h-screen bg-[var(--student-bg)] text-[var(--student-text)]">
            <aside className="flex h-screen w-72 flex-col border-r border-[var(--student-border)] bg-[var(--student-ink)] text-white shadow-[20px_0_50px_rgba(24,31,34,0.08)]">
                <div className="border-b border-white/8 p-8">
                    <div className="flex items-center gap-3">
                        <div className="student-icon-tile flex h-10 w-10 items-center justify-center rounded-xl shadow-[0_14px_28px_rgba(31,92,80,0.18)]">
                            <ShieldCheck size={24} weight="fill" className="text-[var(--student-accent-strong)]" />
                        </div>
                        <div>
                            <h2 className="font-outfit text-lg font-black tracking-tight">Financly</h2>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#a8d0c5]">Admin Panel</p>
                        </div>
                    </div>
                </div>

                <nav className="mt-8 flex-1 space-y-2.5 px-6">
                    {navigation.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group relative flex items-center gap-4 rounded-[20px] px-6 py-4 text-[var(--student-border)] transition-all hover:bg-white/6 hover:text-white active:scale-95"
                        >
                            <item.icon size={22} weight="bold" className="transition-colors group-hover:text-[#f2d295]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                        </Link>
                    ))}

                    <div className="mt-8 border-t border-white/8 pt-8">
                        <Link
                            href="/student/dashboard"
                            className="group flex items-center gap-4 rounded-[20px] px-6 py-4 text-[var(--student-border)] transition-all hover:bg-white/6 hover:text-[#f2d295] active:scale-95"
                        >
                            <House size={20} weight="bold" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exit to Platform</span>
                        </Link>
                    </div>
                </nav>

                <div className="mt-auto border-t border-white/8 p-6">
                    <div className="rounded-[24px] border border-white/8 bg-white/6 p-5">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2b7a69] text-sm font-black shadow-[0_18px_30px_rgba(31,92,80,0.2)]">
                                {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold uppercase tracking-wider text-white">{admin.fullName}</p>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a8d0c5]">Super Admin</p>
                            </div>
                        </div>
                        <Link
                            href="/auth/login"
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[12px] border border-white/8 bg-white/6 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-rose-500/10 hover:text-rose-300"
                        >
                            <SignOut size={14} weight="bold" /> Sign Out
                        </Link>
                    </div>
                </div>
            </aside>

            <main className="student-shell flex flex-1 flex-col">
                <header className="sticky top-0 z-40 flex h-24 items-center justify-between border-b border-[var(--student-border)] bg-[rgba(255,253,249,0.82)] px-12 backdrop-blur-xl">
                    <div className="relative max-w-2xl flex-1">
                        <MagnifyingGlass size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--student-muted)]" weight="bold" />
                        <input
                            type="text"
                            placeholder="Global intelligence search..."
                            className="w-full rounded-[20px] border border-[var(--student-border)] bg-[var(--student-panel-muted)] py-3.5 pl-14 pr-8 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--student-text)] outline-none transition-all placeholder:text-[var(--student-muted)]/55 focus:border-[var(--student-accent-soft-strong)] focus:bg-[var(--student-panel-solid)] focus:ring-4 focus:ring-[var(--student-accent-soft)]/70"
                        />
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="relative rounded-[16px] border border-[var(--student-border)] bg-[var(--student-panel-solid)] p-3 text-[var(--student-muted)] shadow-sm transition-all hover:bg-[var(--student-panel-muted)] hover:text-[var(--student-accent-strong)]">
                            <Bell size={24} weight="bold" />
                            <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--student-panel-solid)] bg-rose-500" />
                        </button>
                    </div>
                </header>

                <div className="mx-auto w-full max-w-[1600px] p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
