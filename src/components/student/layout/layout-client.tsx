"use client";

import { refreshTokenAction } from "@/actions/auth-token-actions";
import {
    List,
    ChartPieSlice,
    Scroll
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { StudentSidebar } from "../sidebar";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/shared/notification-bell";
import { GlobalSearch } from "@/components/shared/global-search";

interface StudentLayoutClientProps {
    children: ReactNode;
    session: {
        fullName: string | null;
        role: string;
        plan: string | null;
    };
    initials: string;
}

export function StudentLayoutClient({ children, session, initials }: StudentLayoutClientProps) {
    const pathname = usePathname();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [whiteBackground, setWhiteBackground] = useState(false);

    // Session Heartbeat: Silent refresh every 5 minutes
    useEffect(() => {
        // Don't heartbeat on auth pages
        if (pathname?.startsWith("/auth")) return;

        const heartbeat = async () => {
            try {
                const result = await refreshTokenAction();
                if (!result.success) {
                    console.warn("Session refresh failed:", result.message);
                }
            } catch (err) {
                console.error("Heartbeat error:", err);
            }
        };

        // Initial check and then interval
        heartbeat();
        const interval = setInterval(heartbeat, 1000 * 60 * 5); // 5 minutes

        return () => clearInterval(interval);
    }, [pathname]);

    // Persist preference
    useEffect(() => {
        const saved = localStorage.getItem("student-white-bg");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (saved === "true") setWhiteBackground(true);
    }, []);

    const toggleBackground = () => {
        setWhiteBackground(prev => {
            const next = !prev;
            localStorage.setItem("student-white-bg", String(next));
            return next;
        });
    };

    return (
        <div className={cn(
            "student-theme student-shell flex h-screen flex-col relative text-[var(--student-text)]",
            whiteBackground && "bg-white"
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
                    
                    <Link href="/student/dashboard" className="flex items-center gap-3 outline-none">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--student-accent-strong)] shadow-sm">
                            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="hidden flex-col md:flex">
                            <h1 className="text-lg font-black tracking-tight leading-none text-[var(--student-text)]">
                                Financly
                            </h1>
                            <p className="mt-1 text-[8px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                Student Portal
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Center: Universal Search */}
                <div className="hidden lg:flex flex-1 justify-center max-w-2xl px-10">
                    <GlobalSearch role="STUDENT" />
                </div>

                {/* Right: Actions & Identity */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                    </div>

                    <div className="hidden h-5 w-px bg-[var(--student-border)] sm:block"></div>

                    <Link href="/student/profile" className="group flex items-center gap-3.5 transition-all hover:translate-y-[-1px] active:scale-95">
                        <div className="hidden text-right lg:block">
                            <p className="text-[13px] font-bold leading-none text-[var(--student-text)] transition-colors group-hover:text-blue-600">
                                {session.fullName ?? "Student"}
                            </p>
                            <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-blue-600/70">
                                {session.plan ?? "Elite"} Portal
                            </p>
                        </div>
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--student-border)] bg-slate-50 p-0.5 shadow-sm transition-all group-hover:border-blue-600/30 group-hover:shadow-md">
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-[11px] font-black text-blue-700">
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
                    "fixed inset-y-0 left-0 z-[70] transition-transform duration-500 md:relative md:translate-x-0 md:pt-0 pt-[72px]",
                    isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <StudentSidebar
                        showAdminLink={session.role === "ADMIN"}
                        onClose={() => setIsMobileSidebarOpen(false)}
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
