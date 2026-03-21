"use client";

import { logout } from "@/actions/auth-actions";
import { cn } from "@/lib/utils";
import {
  CaretDown,
  CaretLeft,
  CaretRight,
  IdentificationBadge,
  ShieldCheck,
  SignOut,
  Target,
  User,
  Gear
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_SECTIONS = [
    {
        title: "MAIN MENU",
        items: [
            { label: "Dashboard", href: "/student/dashboard", icon: "dashboard" },
            { label: "Study Notes", href: "/student/materials", icon: "description" },
            { label: "Question Banks", href: "/student/past-year-questions", icon: "quiz" },
            { label: "Free Resources", href: "/student/free-resources", icon: "auto_stories" },
            { label: "Mock Tests", href: "/student/exams", icon: "assignment_turned_in" },
            { label: "Academy Updates", href: "/student/updates", icon: "campaign" },
        ]
    },
    {
        title: "PERSONAL",
        items: [
            { label: "My Progress", href: "/student/analytics", icon: "trending_up" },
            { label: "Saved Items", href: "/student/saved-items", icon: "bookmark" },
        ]
    }
];

export function StudentSidebar({ showAdminLink = false }: { showAdminLink?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setMounted(true);
            const saved = localStorage.getItem("sidebar-collapsed");
            if (saved !== null) setIsCollapsed(saved === "true");
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", String(newState));
        if (newState) setIsProfileOpen(false); // Close profile on collapse
    };

    const handleLogout = async () => {
        await logout();
        router.push("/");
        router.refresh();
    };

    if (!mounted) return <aside className="w-64 bg-white border-r h-screen" />;

    return (
        <aside
            className={cn(
                "bg-slate-50/20 backdrop-blur-xl border-r border-slate-200 flex flex-col h-screen sticky top-0 z-50 transition-all duration-500 ease-in-out group/sidebar overflow-hidden",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Collapse Toggle Button */}
            <button
                onClick={toggleCollapse}
                className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:scale-110 hover:bg-slate-50 transition-all z-[60] opacity-0 group-hover/sidebar:opacity-100"
            >
                {isCollapsed ? <CaretRight size={14} weight="bold" /> : <CaretLeft size={14} weight="bold" />}
            </button>

            {/* Sidebar Branding */}
            <div className={cn("px-8 py-10 transition-all duration-500", isCollapsed && "px-7")}>
                <Link href="/student/dashboard" className="flex items-center gap-4 group/logo cursor-pointer no-underline outline-none">
                    <div className="shrink-0 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-indigo-500/15 blur-xl rounded-full scale-0 group-hover/logo:scale-[2] transition-transform duration-700 opacity-0 group-hover/logo:opacity-100" />
                        <div className={cn(
                            "relative flex items-center justify-center bg-indigo-600 rounded-[14px] shadow-lg shadow-indigo-500/20 transform-gpu transition-all duration-500",
                            "group-hover/logo:shadow-indigo-500/40 group-hover/logo:-translate-y-0.5 active:scale-95",
                            isCollapsed ? "w-10 h-10" : "w-11 h-11"
                        )}>
                            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="white" strokeWidth="1.5" className="animate-pulse" />
                            </svg>
                        </div>
                    </div>

                    {!isCollapsed && (
                        <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-700 delay-75">
                            <h1 className="text-2xl font-black text-slate-900 font-outfit tracking-[-0.04em] leading-none translate-y-0.5">
                                Financly
                            </h1>
                            <div className="flex items-center gap-1.5 mt-2">
                                <div className="h-[2px] w-3 bg-indigo-500/40 rounded-full" />
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-[1px]">
                                    Student Portal
                                </p>
                            </div>
                        </div>
                    )}
                </Link>
            </div>

            <nav className={cn("flex-1 px-4 space-y-1 transition-all duration-500 overflow-y-auto custom-scrollbar", isCollapsed && "px-2")}>
                {NAV_SECTIONS[0].items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={isCollapsed ? item.label : ""}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out font-inter text-sm font-medium active:scale-95",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700 font-semibold shadow-sm shadow-indigo-500/5"
                                    : "text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{item.icon}</span>
                            {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}

                {!isCollapsed && (
                    <div className="pt-8 pb-4">
                        <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 opacity-80">
                            Personal Hub
                        </h3>
                        <div className="space-y-1">
                            {NAV_SECTIONS[1].items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-inter text-sm font-medium active:scale-95",
                                            isActive
                                                ? "bg-indigo-50 text-indigo-700 font-semibold"
                                                : "text-slate-600 hover:bg-slate-100"
                                        )}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </nav>

            {!isCollapsed && (
                <div className="px-6 mb-8">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group/goal transition-all duration-500 hover:shadow-md">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover/goal:bg-indigo-500/10 transition-colors" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <Target size={14} weight="bold" className="text-indigo-500" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Goal Progress</span>
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex items-end justify-between">
                                    <div className="text-sm font-black text-slate-900">13/20</div>
                                    <div className="text-[10px] font-bold text-slate-400">Exams</div>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                        style={{ width: "65%" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar Footer: Redesigned Profile Dropdown */}
            <div className={cn("p-4 mt-auto border-t border-slate-100 transition-all duration-500", isCollapsed && "px-2")}>
                <div className={cn(
                    "bg-white rounded-[24px] shadow-2xl shadow-slate-200/50 border border-slate-100 transition-all duration-500 overflow-hidden",
                    isCollapsed ? "p-1" : "p-2",
                    isProfileOpen && !isCollapsed && "pb-4"
                )}>
                    {/* Profile Trigger */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsProfileOpen(!isProfileOpen);
                        }}
                        className={cn(
                            "w-full flex items-center transition-all duration-300 rounded-2xl group relative z-[70]",
                            isCollapsed 
                                ? "justify-center py-2" 
                                : "gap-3 px-3 py-2.5 hover:bg-slate-50",
                            isProfileOpen && !isCollapsed && "bg-slate-50"
                        )}
                    >
                        <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500",
                            isProfileOpen && !isCollapsed ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-100 text-slate-600"
                        )}>
                            <User size={20} weight={isProfileOpen ? "fill" : "bold"} />
                        </div>
                        
                        {!isCollapsed && (
                            <div className="flex-1 flex items-center justify-between overflow-hidden">
                                <div className="text-left">
                                    <div className="text-xs font-black text-slate-900 truncate">My Account</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Student Profile</div>
                                </div>
                                <CaretDown 
                                    size={14} 
                                    weight="bold" 
                                    className={cn("text-slate-400 transition-transform duration-300", isProfileOpen && "rotate-180")}
                                />
                            </div>
                        )}
                    </button>

                    {/* Submenu: Accordion Style */}
                    {!isCollapsed && isProfileOpen && (
                        <div className="mt-2 space-y-1 px-1 animate-in slide-in-from-top-2 duration-300">
                            <Link
                                href="/student/profile"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all text-[13px] font-bold group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                                    <Gear size={16} weight="bold" />
                                </div>
                                Settings
                            </Link>

                            {showAdminLink && (
                                <Link
                                    href="/admin/control-center"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all text-[13px] font-bold group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                                        <ShieldCheck size={16} weight="bold" />
                                    </div>
                                    Admin
                                </Link>
                            )}

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-all text-[13px] font-bold group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-rose-50/50 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                                    <SignOut size={16} weight="bold" className="group-hover:text-rose-600" />
                                </div>
                                Logout
                            </button>
                        </div>
                    )}

                    {/* Collapsed State Icon */}
                    {isCollapsed && (
                        <Link 
                            href="/student/profile" 
                            className="mt-1 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                            <Gear size={20} weight="bold" />
                        </Link>
                    )}
                </div>
            </div>
        </aside>
    );
}
