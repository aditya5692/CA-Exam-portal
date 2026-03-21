"use client";

import { logout } from "@/actions/auth-actions";
import { cn } from "@/lib/utils";
import {
  BellSimple,
  Books,
  ChartPieSlice,
  Files,
  FileText,
  GraduationCap,
  IdentificationBadge,
  SignOut,
  Sparkle,
  Users,
  CaretDown,
  User,
  Gear
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
    { label: "Overview", href: "/teacher/dashboard", icon: ChartPieSlice },
    { label: "Test Series", href: "/teacher/test-series", icon: FileText },
    { label: "Question Bank", href: "/teacher/questions", icon: Books },
    { label: "Study Materials", href: "/teacher/materials", icon: Books },
    { label: "Free Resources", href: "/teacher/free-resources", icon: Sparkle },
    { label: "Past Year Questions", href: "/teacher/past-year-questions", icon: Files },
    { label: "My Batches", href: "/teacher/batches", icon: GraduationCap },
    { label: "Updates", href: "/teacher/updates", icon: BellSimple },
    { label: "Students", href: "/teacher/students", icon: Users },
    { label: "Analytics", href: "/teacher/analytics", icon: ChartPieSlice },
    { label: "My Plan", href: "/teacher/plan", icon: Sparkle },
];

export function TeacherSidebar({ showAdminLink = false }: { showAdminLink?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.push("/");
        router.refresh();
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
            <div className="p-6 pb-8">
                <Link href="/teacher/dashboard" className="flex items-center gap-4 group/logo cursor-pointer no-underline outline-none">
                    <div className="shrink-0 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-indigo-500/15 blur-xl rounded-full scale-0 group-hover/logo:scale-[2] transition-transform duration-700 opacity-0 group-hover/logo:opacity-100" />
                        
                        <div className="relative w-11 h-11 flex items-center justify-center bg-indigo-600 rounded-[14px] shadow-lg shadow-indigo-500/20 transform-gpu transition-all duration-500 group-hover/logo:shadow-indigo-500/40 group-hover/logo:-translate-y-0.5 active:scale-95">
                            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="white" strokeWidth="1.5" className="animate-pulse" />
                            </svg>
                        </div>
                    </div>

                    <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-700 delay-75">
                        <h1 className="text-2xl font-black text-slate-900 font-outfit tracking-[-0.04em] leading-none translate-y-0.5">
                            Financly
                        </h1>
                        <div className="flex items-center gap-1.5 mt-2 transition-all duration-500 group-hover/logo:translate-x-1">
                            <div className="h-[2px] w-3 bg-indigo-500/40 rounded-full" />
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-[1px]">
                                Teacher Studio
                            </p>
                        </div>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 uppercase tracking-widest text-[10px] font-bold"
                            )}
                        >
                            <item.icon
                                size={20}
                                weight={isActive ? "fill" : "regular"}
                                className={cn(
                                    "transition-all",
                                    isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                                )}
                            />
                            <span className="font-semibold text-sm">{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-gray-50 space-y-2">
                <div className={cn(
                    "bg-slate-50 rounded-[24px] p-2 transition-all duration-500 border border-slate-100/50",
                    isProfileOpen && "bg-white shadow-xl shadow-slate-200/50 pb-4"
                )}>
                    {/* Teacher Profile Trigger */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsProfileOpen(!isProfileOpen);
                        }}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 group relative z-[70]",
                            isProfileOpen ? "bg-indigo-50" : "hover:bg-white hover:shadow-sm"
                        )}
                    >
                        <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500",
                            isProfileOpen ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white border border-slate-100 text-slate-400"
                        )}>
                            <User size={20} weight={isProfileOpen ? "fill" : "bold"} />
                        </div>
                        <div className="flex-1 flex items-center justify-between text-left">
                            <div>
                                <div className="text-xs font-black text-slate-900">Faculty Hub</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">My Account</div>
                            </div>
                            <CaretDown size={14} weight="bold" className={cn("text-slate-400 transition-transform duration-300", isProfileOpen && "rotate-180")} />
                        </div>
                    </button>

                    {/* Teacher Submenu */}
                    {isProfileOpen && (
                        <div className="mt-2 space-y-1 px-1 animate-in slide-in-from-top-2 duration-300">
                            <Link
                                href="/teacher/profile"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all text-[13px] font-bold group"
                            >
                                <Gear size={16} weight="bold" className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                Account Settings
                            </Link>

                            {showAdminLink && (
                                <Link
                                    href="/admin/dashboard"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all text-[13px] font-bold group"
                                >
                                    <IdentificationBadge size={16} weight="bold" className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    Admin Center
                                </Link>
                            )}

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-all text-[13px] font-bold group"
                            >
                                <SignOut size={16} weight="bold" className="text-rose-400 group-hover:text-rose-600 transition-colors" />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
