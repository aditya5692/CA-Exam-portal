"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/actions/auth-actions";
import { cn } from "@/lib/utils";
import {
    ChartPieSlice,
    BellSimple,
    Books,
    Users,
    IdentificationBadge,
    Gear,
    SignOut,
    FileText,
    GraduationCap,
    Files,
    Sparkle
} from "@phosphor-icons/react";

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
                        {/* Interactive Glow Effect */}
                        <div className="absolute inset-0 bg-indigo-500/15 blur-xl rounded-full scale-0 group-hover/logo:scale-[2] transition-transform duration-700 opacity-0 group-hover/logo:opacity-100" />
                        
                        {/* Premium Logo Container */}
                        <div className="relative w-11 h-11 flex items-center justify-center bg-indigo-600 rounded-[14px] shadow-lg shadow-indigo-500/20 transform-gpu transition-all duration-500 group-hover/logo:shadow-indigo-500/40 group-hover/logo:-translate-y-0.5 active:scale-95">
                            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M21 7L12 12L3 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] leading-none mb-[1px]">
                                Teacher Studio
                            </p>
                        </div>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
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
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
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

            <div className="p-4 mt-auto border-t border-gray-100 space-y-1">
                <Link
                    href="/teacher/profile"
                    className="flex items-center gap-3 px-4 py-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all font-medium"
                >
                    <IdentificationBadge size={20} />
                    <span className="text-sm">My Profile</span>
                </Link>
                {showAdminLink ? (
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all font-medium"
                    >
                        <IdentificationBadge size={20} />
                        <span className="text-sm">Admin Center</span>
                    </Link>
                ) : null}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 transition-all font-medium"
                >
                    <SignOut size={20} weight="bold" />
                    <span className="text-sm">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
