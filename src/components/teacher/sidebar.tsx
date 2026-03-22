"use client";

import { logout } from "@/actions/auth-actions";
import { cn } from "@/lib/utils";
import {
    BellSimple,
    Books,
    CaretDown,
    CaretLeft,
    CaretRight,
    ChartPieSlice,
    FileText,
    Files,
    Gear,
    GraduationCap,
    IdentificationBadge,
    SignOut,
    Sparkle,
    User,
    Users,
    X,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface NavItem {
    label: string;
    href: string;
    icon: Icon;
}

const NAV_ITEMS: NavItem[] = [
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

function SidebarNavItem({
    item,
    isActive,
    isCollapsed
}: {
    item: NavItem;
    isActive: boolean;
    isCollapsed: boolean;
}) {
    return (
        <Link
            href={item.href}
            title={isCollapsed ? item.label : ""}
            className={cn(
                "group/item relative flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200",
                isActive
                    ? "bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)]"
                    : "text-[var(--student-muted)] hover:bg-[var(--student-panel-muted)] hover:text-[var(--student-text)]"
            )}
        >
            {isActive && (
                <div className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-[var(--student-accent-strong)]" />
            )}
            <div
                className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isActive
                        ? "text-[var(--student-accent-strong)]"
                        : "text-[var(--student-muted)] group-hover/item:text-[var(--student-text)]"
                )}
            >
                <item.icon size={20} weight={isActive ? "fill" : "bold"} />
            </div>
            {!isCollapsed && <span className="text-sm font-semibold">{item.label}</span>}
        </Link>
    );
}

function UserProfile({
    isCollapsed,
    isProfileOpen,
    setIsProfileOpen,
    handleLogout,
    showAdminLink
}: {
    isCollapsed: boolean;
    isProfileOpen: boolean;
    setIsProfileOpen: (open: boolean) => void;
    handleLogout: () => void;
    showAdminLink: boolean;
}) {
    return (
        <div className="mt-auto border-t border-[var(--student-border)] p-3">
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={cn(
                        "w-full rounded-xl p-2 transition-all duration-200",
                        isCollapsed ? "flex justify-center" : "flex items-center gap-3 hover:bg-[var(--student-panel-muted)]",
                        isProfileOpen && "bg-[var(--student-panel-muted)]"
                    )}
                >
                    <div
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                            isProfileOpen ? "bg-[var(--student-accent-strong)] text-white" : "bg-[var(--student-panel-muted)] text-[var(--student-muted)]"
                        )}
                    >
                        <User size={20} weight={isProfileOpen ? "fill" : "bold"} />
                    </div>

                    {!isCollapsed && (
                        <div className="flex flex-1 items-center justify-between overflow-hidden text-left">
                            <div>
                                <div className="truncate text-xs font-bold text-[var(--student-text)]">My Account</div>
                                <div className="text-[10px] font-medium uppercase tracking-tighter text-[var(--student-muted)]">Faculty</div>
                            </div>
                            <CaretDown size={12} weight="bold" className={cn("text-[var(--student-muted)] transition-transform", isProfileOpen && "rotate-180")} />
                        </div>
                    )}
                </button>

                {!isCollapsed && isProfileOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-[var(--student-border)] bg-[var(--student-panel-solid)] p-1 shadow-[0_18px_36px_rgba(55,48,38,0.08)] animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <Link
                            href="/teacher/profile"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold text-[var(--student-muted-strong)] transition-all hover:bg-[var(--student-accent-soft)] hover:text-[var(--student-accent-strong)]"
                        >
                            <Gear size={16} weight="bold" />
                            Settings
                        </Link>
                        {showAdminLink && (
                            <Link
                                href="/admin/dashboard"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold text-[var(--student-muted-strong)] transition-all hover:bg-[var(--student-accent-soft)] hover:text-[var(--student-accent-strong)]"
                            >
                                <IdentificationBadge size={16} weight="bold" />
                                Admin
                            </Link>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold text-rose-500 transition-all hover:bg-rose-50"
                        >
                            <SignOut size={16} weight="bold" />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export function TeacherSidebar({
    showAdminLink = false,
    isOpen,
    onClose
}: {
    showAdminLink?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window === "undefined") {
            return false;
        }
        return localStorage.getItem("teacher-sidebar-collapsed") === "true";
    });
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const toggleCollapse = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem("teacher-sidebar-collapsed", String(nextState));
        if (nextState) setIsProfileOpen(false);
    };

    const handleLogout = async () => {
        await logout();
        router.push("/");
        router.refresh();
    };

    return (
        <aside
            className={cn(
                "group/sidebar z-50 flex h-screen flex-col overflow-hidden border-r border-[var(--student-border)] bg-[rgba(255,253,249,0.94)] backdrop-blur-md transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-64"
            )}
            role="navigation"
            aria-label="Teacher Sidebar"
        >
            <button
                onClick={toggleCollapse}
                className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-[var(--student-border)] bg-[var(--student-panel-solid)] shadow-sm transition-all hover:bg-[var(--student-panel-muted)] z-[60] opacity-0 group-hover/sidebar:opacity-100 md:flex"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <CaretRight size={12} weight="bold" /> : <CaretLeft size={12} weight="bold" />}
            </button>

            {onClose && isOpen && (
                <button
                    onClick={onClose}
                    className="absolute -right-12 top-4 rounded-xl border border-[var(--student-border)] bg-[var(--student-panel-solid)] p-2 text-[var(--student-muted)] shadow-md md:hidden"
                >
                    <X size={20} weight="bold" />
                </button>
            )}

            <div className="p-6 transition-all duration-300">
                <Link href="/teacher/dashboard" className="flex items-center gap-3 outline-none">
                    <div className="student-icon-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-[0_14px_28px_rgba(31,92,80,0.12)]">
                        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-[var(--student-accent-strong)]" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold leading-none tracking-tight text-[var(--student-text)]">
                                Financly
                            </h1>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)]">
                                Teacher Studio
                            </p>
                        </div>
                    )}
                </Link>
            </div>

            <nav className={cn("mt-2 flex-1 space-y-1 overflow-y-auto px-3", isCollapsed && "px-2")}>
                {NAV_ITEMS.map((item) => (
                    <SidebarNavItem
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
                        isCollapsed={isCollapsed}
                    />
                ))}
            </nav>

            <UserProfile
                isCollapsed={isCollapsed}
                isProfileOpen={isProfileOpen}
                setIsProfileOpen={setIsProfileOpen}
                handleLogout={handleLogout}
                showAdminLink={showAdminLink}
            />
        </aside>
    );
}
