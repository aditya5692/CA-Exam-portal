"use client";

import { refreshTokenAction } from "@/actions/auth-token-actions";
import {
    List
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
            "student-theme student-shell flex h-screen overflow-hidden font-sans relative text-[var(--student-text)]",
            whiteBackground && "bg-white"
        )}>
            {/* Ambient Background Blobs - hidden when white bg is active */}
            {!whiteBackground && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-[-10%] left-[-10%] h-[42%] w-[42%] rounded-full bg-[rgba(242,227,192,0.44)] blur-[120px] opacity-70" />
                    <div className="absolute right-[-8%] top-[16%] h-[34%] w-[34%] rounded-full bg-[rgba(220,235,230,0.5)] blur-[105px] opacity-70" />
                    <div className="absolute bottom-[-12%] left-[22%] h-[38%] w-[38%] rounded-full bg-[rgba(223,214,198,0.44)] blur-[120px] opacity-70" />
                </div>
            )}

            {/* Backdrop for mobile */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-[var(--student-ink)]/20 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-[70] transition-transform duration-500 md:relative md:translate-x-0",
                isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <StudentSidebar
                    showAdminLink={session.role === "ADMIN"}
                    onClose={() => setIsMobileSidebarOpen(false)}
                />
            </div>

            <main className="flex-1 flex flex-col h-screen overflow-y-auto">
                {/* Global Top Navigation */}
                <header
                    className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-[var(--student-border)] bg-[var(--student-panel)]/80 px-3 md:px-8 shadow-[0_12px_30px_rgba(55,48,38,0.06)] backdrop-blur-xl transition-all"
                    style={{ height: "var(--tuner-header-height, 80px)", display: "var(--tuner-header-display, flex)" }}
                >
                    <div className="flex items-center gap-2 md:gap-4 flex-1">
                        {/* Mobile Toggle */}
                        <button
                            className="rounded-xl border border-[var(--student-border)] bg-[var(--student-panel)]/92 p-2 text-[var(--student-muted-strong)] shadow-sm transition-all hover:bg-white active:scale-95 md:hidden"
                            onClick={() => setIsMobileSidebarOpen(true)}
                        >
                            <List size={20} weight="bold" />
                        </button>

                        {/* Global Search Component */}
                        <GlobalSearch role="STUDENT" />
                    </div>

                    <div className="flex items-center gap-2 md:gap-8 ml-2">
                        {/* Action Suite */}
                        <div className="flex items-center gap-1 md:gap-2">
                            <NotificationBell />
                            {/* White Background Toggle */}
                            <button
                                onClick={toggleBackground}
                                title={whiteBackground ? "Switch to warm background" : "Switch to white background"}
                                className={cn(
                                    "hidden rounded-xl p-2.5 transition-all sm:block",
                                    whiteBackground
                                        ? "bg-[var(--student-accent-strong)] text-white shadow-md"
                                        : "text-[var(--student-muted)] hover:bg-[var(--student-panel)]/80 hover:text-[var(--student-accent-strong)]"
                                )}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                                    <path d="M221.67,90.91,141.41,25.18a20,20,0,0,0-26.82,0L34.33,90.91A19.93,19.93,0,0,0,28,105.47V208a12,12,0,0,0,12,12H104a12,12,0,0,0,12-12V160h24v48a12,12,0,0,0,12,12h64a12,12,0,0,0,12-12V105.47A19.93,19.93,0,0,0,221.67,90.91ZM216,208H152V160a12,12,0,0,0-12-12H116a12,12,0,0,0-12,12v48H52V105.47l76-65.78,88,76Z" />
                                </svg>
                            </button>
                        </div>

                        <div className="hidden h-8 w-px bg-[var(--student-border)] sm:block"></div>

                        {/* Identity Section */}
                        <Link href="/student/profile" className="flex items-center gap-2 md:gap-4 group shrink-0">
                            <div className="text-right hidden md:block">
                                <p className="font-outfit text-sm font-bold leading-none text-[var(--student-text)] transition-colors group-hover:text-[var(--student-accent-strong)]">
                                    {session.fullName ?? "Student"}
                                </p>
                                <div className="flex items-center justify-end gap-2 mt-1.5">
                                    <span className="rounded-full border border-[var(--student-border)] bg-[var(--student-panel-muted)] px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[var(--student-muted-strong)]">
                                        {session.plan ?? "Free"}
                                    </span>
                                </div>
                            </div>
                            <div className="relative rounded-2xl border border-[var(--student-border)] bg-[var(--student-panel)]/92 p-1 shadow-[0_10px_24px_rgba(55,48,38,0.08)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_26px_rgba(55,48,38,0.1)]">
                                <div className="rounded-xl border border-[var(--student-accent-soft-strong)] bg-[var(--student-accent-soft)] p-0.5">
                                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px] bg-[var(--student-panel)]/90 text-[10px] font-black text-[var(--student-accent-strong)] md:h-10 md:w-10 md:text-xs">
                                        {initials}
                                    </div>
                                </div>
                                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--student-panel)]/95 bg-[var(--student-success)] shadow-sm md:h-3.5 md:w-3.5"></div>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <div
                    className="mx-auto w-full max-w-[1600px] animate-in px-4 font-outfit fade-in slide-in-from-bottom-2 duration-700 sm:px-6 md:px-8 tuner-content-container"
                >
                    {children}
                </div>
            </main>
        </div>
    );
}
