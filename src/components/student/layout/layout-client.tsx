"use client";

import { Bell, List, MagnifyingGlass, Question } from "@phosphor-icons/react";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { StudentSidebar } from "../sidebar";
import { cn } from "@/lib/utils";

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
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="student-theme student-shell flex h-screen overflow-hidden font-sans relative text-[var(--student-text)]">
            {/* Ambient Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] h-[42%] w-[42%] rounded-full bg-[rgba(242,227,192,0.44)] blur-[120px] opacity-70" />
                <div className="absolute right-[-8%] top-[16%] h-[34%] w-[34%] rounded-full bg-[rgba(220,235,230,0.5)] blur-[105px] opacity-70" />
                <div className="absolute bottom-[-12%] left-[22%] h-[38%] w-[38%] rounded-full bg-[rgba(223,214,198,0.44)] blur-[120px] opacity-70" />
            </div>

            {/* Backdrop for mobile */}
            {isMobileSidebarOpen && (
                <div 
                    className="fixed inset-0 z-[60] bg-[#201a13]/20 backdrop-blur-sm md:hidden"
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
                <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[var(--student-border)] bg-[rgba(255,250,242,0.8)] px-4 shadow-[0_12px_30px_rgba(55,48,38,0.06)] backdrop-blur-xl transition-all md:h-20 md:px-8">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Mobile Toggle */}
                        <button 
                            className="rounded-xl border border-[var(--student-border)] bg-[rgba(255,253,249,0.92)] p-2.5 text-[var(--student-muted-strong)] shadow-sm transition-all hover:bg-white active:scale-95 md:hidden"
                            onClick={() => setIsMobileSidebarOpen(true)}
                        >
                            <List size={22} weight="bold" />
                        </button>

                        {/* Search Bar */}
                        <div className="group relative flex w-full max-w-md items-center rounded-2xl border border-[var(--student-border)] bg-[rgba(255,253,249,0.72)] px-4 py-2.5 transition-all focus-within:border-[var(--student-border-strong)] focus-within:bg-white focus-within:ring-4 focus-within:ring-[rgba(31,92,80,0.08)] md:px-5 md:py-3">
                            <MagnifyingGlass size={20} weight="bold" className="mr-3 shrink-0 text-[var(--student-muted)] transition-colors group-focus-within:text-[var(--student-accent)]" />
                            <input
                                className="w-full border-none bg-transparent text-sm font-medium text-[var(--student-text)] placeholder:text-[var(--student-muted)] outline-none focus:ring-0"
                                placeholder="Search..."
                                type="text"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-8">
                        {/* Action Suite */}
                        <div className="flex items-center gap-1 md:gap-2">
                            <button className="group relative rounded-xl p-2 text-[var(--student-muted)] transition-all hover:bg-white/80 hover:text-[var(--student-accent-strong)] md:p-2.5">
                                <Bell size={22} weight="bold" />
                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-[rgba(255,250,242,0.95)] bg-[var(--student-support)]"></span>
                            </button>
                            <button className="hidden rounded-xl p-2.5 text-[var(--student-muted)] transition-all hover:bg-white/80 hover:text-[var(--student-accent-strong)] sm:block">
                                <Question size={22} weight="bold" />
                            </button>
                        </div>

                        <div className="hidden h-8 w-px bg-[var(--student-border)] sm:block"></div>

                        {/* Identity Section */}
                        <Link href="/student/profile" className="flex items-center gap-2 md:gap-4 group">
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
                            <div className="relative rounded-2xl border border-[var(--student-border)] bg-[rgba(255,253,249,0.92)] p-1 shadow-[0_10px_24px_rgba(55,48,38,0.08)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_26px_rgba(55,48,38,0.1)]">
                                <div className="rounded-xl border border-[var(--student-accent-soft-strong)] bg-[var(--student-accent-soft)] p-0.5">
                                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px] bg-[rgba(255,250,242,0.9)] text-[10px] font-black text-[var(--student-accent-strong)] md:h-10 md:w-10 md:text-xs">
                                        {initials}
                                    </div>
                                </div>
                                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[rgba(255,250,242,0.95)] bg-[var(--student-success)] shadow-sm md:h-3.5 md:w-3.5"></div>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <div className="mx-auto w-full max-w-[1600px] animate-in px-4 py-6 font-outfit fade-in slide-in-from-bottom-2 duration-700 sm:px-6 md:px-8 md:py-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
