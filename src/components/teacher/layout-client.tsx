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

    return (
        <div className="student-theme student-shell relative flex h-screen overflow-hidden  ">
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-[var(--landing-panel-dark)]/20 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-[70] transition-transform duration-500 md:relative md:translate-x-0",
                    isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <TeacherSidebar
                    showAdminLink={session.role === "ADMIN" || session.isSuperAdmin}
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setIsMobileSidebarOpen(false)}
                    isSuperAdmin={session.isSuperAdmin}
                />
            </div>

            <div className="flex h-screen flex-1 flex-col overflow-y-auto">
                {/* Global Top Navigation */}
                <header 
                    className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-[var(--student-border)] bg-[var(--student-panel)]/80 px-3 md:px-8 shadow-[0_12px_30px_rgba(55,48,38,0.06)] backdrop-blur-xl transition-all"
                    style={{ height: "var(--tuner-header-height, 80px)", display: "var(--tuner-header-display, flex)" }}
                >
                    <div className="flex items-center gap-2 md:gap-4 flex-1">
                        {/* Mobile Toggle */}
                        <button 
                            className="rounded-lg border border-[var(--student-border)] bg-[var(--student-panel)]/90 p-2 text-[var(--student-muted-strong)] shadow-sm transition-all hover:bg-white active:scale-95 md:hidden"
                            onClick={() => setIsMobileSidebarOpen(true)}
                        >
                            <List size={20} weight="bold" />
                        </button>

                        {/* Global Search Component */}
                        <GlobalSearch role="TEACHER" />
                        
                        {/* Global Subject Filter */}
                        <div className="hidden sm:block ml-2">
                            <SubjectFilter subjects={subjects} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-8 ml-2">
                        {/* Action Suite */}
                        <div className="flex items-center gap-1 md:gap-2">
                            <NotificationBell />
                        </div>

                        <div className="hidden h-8 w-px bg-[var(--student-border)] sm:block"></div>

                        {/* Identity Section */}
                        <Link href="/teacher/profile" className="flex items-center gap-2 md:gap-4 group shrink-0">
                            <div className="hidden text-right md:block">
                                <p className="  text-sm font-bold leading-none text-[var(--student-text)] transition-colors group-hover:text-[var(--student-accent-strong)]">
                                    {session.fullName ?? "Teacher"}
                                </p>
                                <div className="flex items-center justify-end gap-2 mt-1.5">
                                    <span className="rounded-full border border-[var(--student-border)] bg-[var(--student-panel-muted)] px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[var(--student-muted-strong)]">
                                        Faculty
                                    </span>
                                </div>
                            </div>
                            <div className="relative rounded-lg border border-[var(--student-border)] bg-[var(--student-panel)]/90 p-1 shadow-[0_10px_24px_rgba(55,48,38,0.08)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_26px_rgba(55,48,38,0.1)]">
                                <div className="rounded-lg border border-[var(--student-accent-soft-strong)] bg-[var(--student-accent-soft)] p-0.5">
                                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-[var(--student-panel)]/90 text-[10px] font-black text-[var(--student-accent-strong)] md:h-10 md:w-10">
                                        <UserCircle size={28} className="text-[var(--student-accent-strong)]" />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--student-panel)]/95 bg-[var(--student-success)] shadow-sm md:h-3.5 md:w-3.5"></div>
                            </div>
                        </Link>
                    </div>
                </header>

                <main 
                    className="w-full overflow-x-hidden px-4 md:px-6 tuner-content-container"
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
