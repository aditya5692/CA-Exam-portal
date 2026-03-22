"use client";

import { cn } from "@/lib/utils";
import { Bell, List, MagnifyingGlass, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { TeacherSidebar } from "./sidebar";

interface TeacherLayoutClientProps {
    children: ReactNode;
    session: {
        fullName: string | null;
        role: string;
    };
}

export function TeacherLayoutClient({ children, session }: TeacherLayoutClientProps) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="student-theme student-shell relative flex h-screen overflow-hidden font-sans">
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-[rgba(34,48,54,0.18)] backdrop-blur-sm md:hidden"
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
                    showAdminLink={session.role === "ADMIN"}
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setIsMobileSidebarOpen(false)}
                />
            </div>

            <div className="flex h-screen flex-1 flex-col overflow-y-auto">
                <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[var(--student-border)] bg-[rgba(255,253,249,0.82)] px-4 shadow-sm backdrop-blur-md md:h-14 md:px-6">
                    <div className="flex flex-1 items-center gap-4">
                        <button
                            className="student-button-secondary rounded-xl p-2.5 md:hidden"
                            onClick={() => setIsMobileSidebarOpen(true)}
                        >
                            <List size={22} weight="bold" />
                        </button>

                        <div className="relative w-full max-w-xs md:max-w-80">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--student-muted)]" size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-muted)] py-1.5 pl-9 pr-4 text-xs font-medium text-[var(--student-text)] placeholder:text-[var(--student-muted)]/70 transition-all focus:border-[var(--student-accent-soft-strong)] focus:bg-[var(--student-panel-solid)] focus:outline-none focus:ring-2 focus:ring-[var(--student-accent-soft)]"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="relative rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-1.5 text-[var(--student-muted)] transition-all hover:bg-[var(--student-panel-solid)] hover:text-[var(--student-text)]">
                            <Bell size={18} />
                            <div className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--student-support)] border-2 border-[var(--student-panel-solid)]" />
                        </button>
                        <div className="mx-1 hidden h-6 w-px bg-[var(--student-border)] sm:block" />
                        <Link href="/teacher/profile" className="group flex cursor-pointer items-center gap-2 md:gap-3">
                            <div className="hidden text-right sm:block">
                                <p className="text-sm font-bold text-[var(--student-text)] transition-all group-hover:text-[var(--student-accent-strong)]">
                                    {session.fullName ?? "Teacher"}
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--student-muted)]">
                                    Faculty
                                </p>
                            </div>
                            <div className="student-icon-tile flex h-8 w-8 items-center justify-center rounded-xl shadow-[0_12px_24px_rgba(31,92,80,0.12)] md:h-10 md:w-10">
                                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[var(--student-panel-solid)]">
                                    <UserCircle size={28} className="text-[var(--student-accent-strong)]" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </header>

                <main className="w-full overflow-x-hidden p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
