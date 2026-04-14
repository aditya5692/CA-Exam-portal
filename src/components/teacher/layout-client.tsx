"use client";

import { cn } from "@/lib/utils";
import { List, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { TeacherSidebar } from "./sidebar";
import { NotificationBell } from "@/components/shared/notification-bell";
import { GlobalSearch } from "@/components/shared/global-search";
import { SubjectFilter } from "@/components/admin/subject-filter";

interface TeacherLayoutClientProps {
    children: ReactNode;
    session: {
        fullName: string | null;
        role: string;
        isSuperAdmin: boolean;
    };
    subjects?: { id: string; name: string }[];
}

export function TeacherLayoutClient({ children, session, subjects = [] }: TeacherLayoutClientProps) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const initials = session.fullName?.split(" ").map(n => n[0]).join("") ?? "FY";

    return (
        <div className={cn(
            "student-theme student-shell flex h-screen flex-col relative text-[var(--student-text)]",
        )}>
            {/* Global Top Bar (The Shell) */}
            <header
                className="glass-header z-[100] h-[72px] shrink-0 border-b border-[var(--student-border)] px-6"
            >
                {/* Left: Branding */}
                <div className="flex w-64 items-center gap-4">
                    <button
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-all hover:bg-slate-50 active:scale-95 md:hidden"
                        onClick={() => setIsMobileSidebarOpen(true)}
                    >
                        <List size={18} weight="bold" />
                    </button>
                    
                    <Link href="/teacher/dashboard" className="flex items-center gap-3 outline-none">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 shadow-sm">
                            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="hidden flex-col md:flex">
                            <h1 className="text-lg font-black tracking-tight leading-none text-[var(--student-text)]">
                                Financly
                            </h1>
                            <p className="mt-1 text-[8px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                {session.role === "ADMIN" ? "Administration" : "Teacher Studio"}
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Center: Universal Search & Filters */}
                <div className="hidden lg:flex flex-1 items-center justify-center gap-4 max-w-2xl px-10">
                    <GlobalSearch role="TEACHER" />
                    <SubjectFilter subjects={subjects} />
                </div>

                {/* Right: Actions & Identity */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                    </div>

                    <div className="hidden h-5 w-px bg-[var(--student-border)] sm:block"></div>

                    <Link href="/teacher/profile" className="group flex items-center gap-3.5 transition-all hover:translate-y-[-1px] active:scale-95">
                        <div className="hidden text-right lg:block">
                            <p className="text-[13px] font-bold leading-none text-[var(--student-text)] transition-colors group-hover:text-emerald-600">
                                {session.fullName ?? "Teacher"}
                            </p>
                            <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600/70">
                                {session.role === "ADMIN" ? "Admin" : "Faculty"} Portal
                            </p>
                        </div>
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--student-border)] bg-slate-50 p-0.5 shadow-sm transition-all group-hover:border-emerald-600/30 group-hover:shadow-md">
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-[11px] font-black text-emerald-700">
                                {initials}
                            </div>
                        </div>
                    </Link>
                </div>
            </header>

            {/* Layout Content: Sidebar + Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Backdrop for mobile */}
                {isMobileSidebarOpen && (
                    <div
                        className="fixed inset-0 z-[60] bg-[var(--student-ink)]/20 backdrop-blur-sm md:hidden"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}

                {/* Sidebar Container */}
                <div className={cn(
                    "fixed inset-y-0 left-0 z-[70] transition-transform duration-500 md:relative md:translate-x-0 md:pt-0 pt-[72px] bg-white",
                    isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <TeacherSidebar
                        showAdminLink={session.role === "ADMIN" || session.isSuperAdmin}
                        isOpen={isMobileSidebarOpen}
                        onClose={() => setIsMobileSidebarOpen(false)}
                        isSuperAdmin={session.isSuperAdmin}
                    />
                </div>

                <main className="flex-1 overflow-y-auto bg-[var(--student-bg)]">
                    {/* Page Content */}
                    <div
                        className="mx-auto w-full max-w-[1400px] animate-in px-8 py-10 md:px-10 lg:px-12 tuner-content-container"
                    >
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
