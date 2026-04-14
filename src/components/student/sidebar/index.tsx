"use client";

import { logout } from "@/actions/auth-actions";
import { clearClientSessionState } from "@/lib/client/session-cleanup";
import { cn } from "@/lib/utils";
import {
    CaretDown,
    CaretLeft,
    CaretRight,
    House,
    Notebook,
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
    X,
    Users
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

interface NavGroup {
    label: string;
    icon: SidebarIcon;
    items: NavItem[];
}

const ACADEMIC_HUB: NavItem[] = [
    { label: "Dashboard", href: "/student/dashboard", icon: House },
    { label: "Mock Tests", href: "/student/exams", icon: SuitcaseSimple },
    { label: "My Batches", href: "/student/batches", icon: Users },
];

const CONTENT_HUB: NavItem[] = [
    { label: "Study Notes", href: "/student/materials", icon: Notebook },
    { label: "Free Resources", href: "/student/free-resources", icon: Sparkle },
    { label: "Updates", href: "/student/updates", icon: Megaphone },
];

const PERSONAL_HUB: NavItem[] = [
    { label: "My Progress", href: "/student/analytics", icon: ChartPolar },
    { label: "Saved Items", href: "/student/saved-items", icon: Bookmarks },
    { label: "Redeem Code", href: "/student/redeem", icon: IdentificationBadge },
];

// --- Sub-components ---

function SidebarSubItem({
    item,
    isActive,
    isFirst,
    isLast
}: {
    item: NavItem;
    isActive: boolean;
    isFirst: boolean;
    isLast: boolean;
}) {
    return (
        <Link
            href={item.href}
            className={cn(
                "group/sub relative flex items-center gap-3 py-3 pl-4 pr-4 transition-all duration-200 rounded-lg mx-2",
                isActive ? "bg-white text-[var(--student-accent-strong)] shadow-sm border border-[var(--student-border)]" : "text-[var(--student-muted)] hover:bg-[var(--student-panel-muted)] hover:text-[var(--student-text)]"
            )}
        >
            <item.icon size={18} weight={isActive ? "fill" : "bold"} className={cn("shrink-0", isActive ? "text-[var(--student-accent-strong)]" : "opacity-70 group-hover/sub:opacity-100")} />
            <span className={cn(
                "text-[13px] font-medium transition-colors",
                isActive ? "font-bold" : ""
            )}>
                {item.label}
            </span>
        </Link>
    );
}

function SidebarNavGroup({
    label,
    icon: Icon,
    items,
    pathname,
    isCollapsed
}: {
    label: string;
    icon: SidebarIcon;
    items: NavItem[];
    pathname: string;
    isCollapsed: boolean;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const hasActiveChild = items.some(item => pathname === item.href);

    if (isCollapsed) {
        return (
            <div className="flex flex-col items-center gap-2 py-2">
                <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-all",
                    hasActiveChild ? "bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)]" : "text-[var(--student-muted)]"
                )}>
                    <Icon size={22} weight={hasActiveChild ? "fill" : "bold"} />
                </div>
            </div>
        );
    }

    return (
        <div className="py-1">
            <div className="px-4 py-3 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--student-muted)]/50">{label}</span>
            </div>

            <div className="space-y-0.5">
                {items.map((item, idx) => (
                    <SidebarSubItem
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
                        isFirst={idx === 0}
                        isLast={idx === items.length - 1}
                    />
                ))}
            </div>
        </div>
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
                        "w-full rounded-lg p-2 transition-all duration-200",
                        isCollapsed ? "flex justify-center" : "flex items-center gap-3 hover:bg-[var(--student-panel)]/80",
                        isProfileOpen && "bg-[var(--student-panel)]/90 shadow-sm"
                    )}
                >
                    <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
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
                    <div className="absolute bottom-full left-0 right-0 mb-2 animate-in rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-solid)] p-1 shadow-[0_18px_32px_rgba(55,48,38,0.08)] fade-in slide-in-from-bottom-2 duration-200">
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
        clearClientSessionState();
        router.push("/");
        router.refresh();
    };

    if (!mounted) return <aside className="h-screen w-64 border-r border-[var(--student-border)] bg-[var(--student-panel)]/90" />;

    return (
        <aside
            className={cn(
                "group/sidebar sticky top-0 z-50 flex h-full flex-col overflow-hidden border-r border-[var(--student-border)] bg-[var(--student-panel-muted)] transition-all duration-300 ease-in-out pt-4",
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
                    className="absolute -right-12 top-4 rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-solid)] p-2 text-[var(--student-muted-strong)] shadow-md md:hidden"
                >
                    <X size={20} weight="bold" />
                </button>
            )}



            <nav className={cn("flex-1 px-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar", isCollapsed && "px-2")}>
                <SidebarNavGroup
                    label="Academic Hub"
                    icon={House}
                    items={ACADEMIC_HUB}
                    pathname={pathname}
                    isCollapsed={isCollapsed}
                />

                <SidebarNavGroup
                    label="Content Hub"
                    icon={Notebook}
                    items={CONTENT_HUB}
                    pathname={pathname}
                    isCollapsed={isCollapsed}
                />

                <SidebarNavGroup
                    label="Personal"
                    icon={ChartPolar}
                    items={PERSONAL_HUB}
                    pathname={pathname}
                    isCollapsed={isCollapsed}
                />
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
