"use client";

import { logout } from "@/actions/auth-actions";
import { cn } from "@/lib/utils";
import {
    CaretDown,
    CaretLeft,
    CaretRight,
    House,
    Notebook,
    Books,
    Sparkle,
    SuitcaseSimple,
    Megaphone,
    ChartPolar,
    Bookmarks,
    Gear,
    SignOut,
    User,
    ShieldCheck,
    IdentificationBadge,
    X
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ComponentType, useState, useSyncExternalStore } from "react";

// --- Types & Data ---

type SidebarIcon = ComponentType<{
    size?: string | number;
    weight?: "fill" | "bold";
    className?: string;
}>;

interface NavItem {
    label: string;
    href: string;
    icon: SidebarIcon;
}

const MAIN_NAV: NavItem[] = [
    { label: "Dashboard", href: "/student/dashboard", icon: House },
    { label: "Study Notes", href: "/student/materials", icon: Notebook },
    { label: "Resource Library", href: "/student/free-resources", icon: Sparkle },
    { label: "Mock Tests", href: "/student/exams", icon: SuitcaseSimple },
    { label: "Academy Updates", href: "/student/updates", icon: Megaphone },
];

const PERSONAL_NAV: NavItem[] = [
    { label: "My Progress", href: "/student/analytics", icon: ChartPolar },
    { label: "Saved Items", href: "/student/saved-items", icon: Bookmarks },
    { label: "Redeem Code", href: "/student/redeem", icon: IdentificationBadge },
];

// --- Sub-components ---

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
                    ? "bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)] shadow-sm"
                    : "text-[var(--student-muted)] hover:bg-[var(--student-panel)]/80 hover:text-[var(--student-text)]"
            )}
        >
            {isActive && (
                <div className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-[var(--student-accent-strong)]" />
            )}
            <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center transition-colors",
                isActive ? "text-[var(--student-accent-strong)]" : "text-[var(--student-muted)] group-hover/item:text-[var(--student-text)]"
            )}>
                <item.icon
                    size={20}
                    weight={isActive ? "fill" : "bold"}
                />
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
                        isCollapsed ? "flex justify-center" : "flex items-center gap-3 hover:bg-[var(--student-panel)]/80",
                        isProfileOpen && "bg-[var(--student-panel)]/90 shadow-sm"
                    )}
                >
                    <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                        isProfileOpen
                            ? "bg-[var(--student-accent-strong)] text-white"
                            : "border border-[var(--student-border)] bg-[var(--student-panel-muted)] text-[var(--student-muted-strong)]"
                    )}>
                        <User size={20} weight={isProfileOpen ? "fill" : "bold"} />
                    </div>

                    {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between overflow-hidden text-left">
                            <div>
                                <div className="truncate text-xs font-bold text-[var(--student-text)]">My Account</div>
                                <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--student-muted)]">Student</div>
                            </div>
                            <CaretDown
                                size={12}
                                weight="bold"
                                className={cn("text-[var(--student-muted)] transition-transform", isProfileOpen && "rotate-180")}
                            />
                        </div>
                    )}
                </button>

                {!isCollapsed && isProfileOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 animate-in rounded-xl border border-[var(--student-border)] bg-[var(--student-panel-solid)] p-1 shadow-[0_18px_32px_rgba(55,48,38,0.08)] fade-in slide-in-from-bottom-2 duration-200">
                        <Link
                            href="/student/profile"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold text-[var(--student-muted-strong)] transition-all hover:bg-[var(--student-accent-soft)] hover:text-[var(--student-accent-strong)]"
                        >
                            <Gear size={16} weight="bold" />
                            Settings
                        </Link>
                        {showAdminLink && (
                            <Link
                                href="/admin/control-center"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold text-[var(--student-muted-strong)] transition-all hover:bg-[var(--student-accent-soft)] hover:text-[var(--student-accent-strong)]"
                            >
                                <ShieldCheck size={16} weight="bold" />
                                Admin
                            </Link>
                        )}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-all text-xs font-bold"
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

// --- Main Component ---

export function StudentSidebar({
    showAdminLink = false,
    onClose
}: {
    showAdminLink?: boolean;
    onClose?: () => void;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const mounted = useSyncExternalStore(
        () => () => undefined,
        () => true,
        () => false
    );
    const isCollapsed = useSyncExternalStore(
        (callback) => {
            const notify = () => callback();
            window.addEventListener("storage", notify);
            window.addEventListener("sidebar-collapsed-change", notify);
            return () => {
                window.removeEventListener("storage", notify);
                window.removeEventListener("sidebar-collapsed-change", notify);
            };
        },
        () => localStorage.getItem("sidebar-collapsed") === "true",
        () => false
    );

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        localStorage.setItem("sidebar-collapsed", String(newState));
        window.dispatchEvent(new Event("sidebar-collapsed-change"));
        if (newState) setIsProfileOpen(false);
    };

    const handleLogout = async () => {
        await logout();
        router.push("/");
        router.refresh();
    };

    if (!mounted) return <aside className="h-screen w-64 border-r border-[var(--student-border)] bg-[var(--student-panel)]/90" />;

    return (
        <aside
            className={cn(
                "group/sidebar sticky top-0 z-50 flex h-screen flex-col overflow-hidden border-r border-[var(--student-border)] bg-[var(--student-panel)]/90 shadow-[16px_0_40px_rgba(55,48,38,0.04)] backdrop-blur-xl transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-64"
            )}
            role="navigation"
            aria-label="Student Sidebar"
        >
            {/* Collapse Toggle */}
            <button
                onClick={toggleCollapse}
                className="absolute -right-3 top-20 z-[60] hidden h-6 w-6 items-center justify-center rounded-full border border-[var(--student-border)] bg-[var(--student-panel-solid)] text-[var(--student-muted-strong)] opacity-0 shadow-[0_8px_18px_rgba(55,48,38,0.08)] transition-all hover:bg-white group-hover/sidebar:opacity-100 md:flex"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <CaretRight size={12} weight="bold" /> : <CaretLeft size={12} weight="bold" />}
            </button>

            {/* Close Button (Mobile) */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute -right-12 top-4 rounded-xl border border-[var(--student-border)] bg-[var(--student-panel-solid)] p-2 text-[var(--student-muted-strong)] shadow-md md:hidden"
                >
                    <X size={20} weight="bold" />
                </button>
            )}

            {/* Branding */}
            <div className="p-6 transition-all duration-300">
                <Link href="/student/dashboard" className="flex items-center gap-3 outline-none">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--student-accent-strong)] shadow-[0_12px_28px_rgba(31,92,80,0.18)]">
                        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-tight leading-none text-[var(--student-text)]">
                                Financly
                            </h1>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--student-muted)]">
                                Student Portal
                            </p>
                        </div>
                    )}
                </Link>
            </div>

            <nav className={cn("flex-1 px-3 space-y-0.5 mt-2 overflow-y-auto custom-scrollbar", isCollapsed && "px-2")}>
                {MAIN_NAV.map((item) => (
                    <SidebarNavItem
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
                        isCollapsed={isCollapsed}
                    />
                ))}

                {!isCollapsed && (
                    <div className="pt-6 pb-2">
                        <h3 className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--student-muted)]">
                            Personal
                        </h3>
                        <div className="space-y-0.5">
                            {PERSONAL_NAV.map((item) => (
                                <SidebarNavItem
                                    key={item.href}
                                    item={item}
                                    isActive={pathname === item.href}
                                    isCollapsed={isCollapsed}
                                />
                            ))}
                        </div>
                    </div>
                )}
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
