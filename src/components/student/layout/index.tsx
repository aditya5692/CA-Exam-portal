import { getSessionPayload } from "@/lib/auth/session";
import { Bell,MagnifyingGlass,Question } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { StudentSidebar } from "../sidebar";

export default async function StudentLayout({ children }: { children: ReactNode }) {
    const session = await getSessionPayload();
    if (!session || (session.role !== "STUDENT" && session.role !== "ADMIN")) {
        redirect("/auth/login");
    }
    const initials = (session.fullName ?? "Student")
        .split(" ")
        .map((word) => word[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="flex h-screen bg-slate-50/30 overflow-hidden font-sans relative">
            {/* Ambient Background Blobs - permanently visible */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] opacity-60" />
                <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-purple-100/40 rounded-full blur-[100px] opacity-50" />
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px] opacity-60" />
            </div>
            <StudentSidebar showAdminLink={session.role === "ADMIN"} />
            <main className="flex-1 flex flex-col h-screen overflow-y-auto">
                {/* Global Top Navigation: Smart & Modern Vista */}
                <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-xl border-b border-slate-100/50 flex justify-between items-center h-16 md:h-20 px-8 transition-all shadow-sm">
                    {/* Search Bar - Refined Glassmorphism */}
                    <div className="relative flex items-center bg-slate-100/40 rounded-2xl px-5 py-3 w-full max-w-md focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:bg-white transition-all border border-slate-200/40 group">
                        <MagnifyingGlass size={20} weight="bold" className="text-slate-400 group-focus-within:text-indigo-500 transition-colors mr-3" />
                        <input
                            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 outline-none font-sans font-medium"
                            placeholder="Search exams, subjects or educators..."
                            type="text"
                        />
                        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-200/50 border border-slate-300/30 ml-2">
                            <span className="text-[10px] font-bold text-slate-500">/</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        {/* Action Suite */}
                        <div className="flex items-center gap-2">
                            <button className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100/80 transition-all relative group">
                                <Bell size={22} weight="bold" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-indigo-500 border-2 border-white group-hover:scale-110 transition-transform shadow-[0_0_8px_rgba(79,70,229,0.3)]"></span>
                            </button>
                            <button className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100/80 transition-all">
                                <Question size={22} weight="bold" />
                            </button>
                        </div>

                        <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

                        {/* Identity Section */}
                        <Link href="/student/profile" className="flex items-center gap-4 group">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-slate-900 leading-none font-outfit group-hover:text-indigo-600 transition-colors">
                                    {session.fullName ?? "Student"}
                                </p>
                                <div className="flex items-center justify-end gap-2 mt-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {session.plan === "PRO" ? "Premium" : session.plan === "ELITE" ? "Elite" : session.plan === "ENTERPRISE" ? "Enterprise" : "Free"}
                                    </span>
                                    <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">
                                        Select Level
                                    </span>
                                </div>
                            </div>
                            <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-400 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 shadow-lg shadow-indigo-100">
                                <div className="p-[1.5px] bg-white rounded-full">
                                    <div className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 text-xs font-black overflow-hidden border border-slate-100">
                                        {initials}
                                    </div>
                                </div>
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content - Standardized Spacing & Max-Width */}
                <div className="px-4 sm:px-6 md:px-8 py-10 max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-700 font-outfit">
                    {children}
                </div>
            </main>
        </div>
    );
}
