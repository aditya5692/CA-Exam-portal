"use client";

import { logout } from "@/actions/auth-actions";
import { clearClientSessionState } from "@/lib/client/session-cleanup";
import { cn } from "@/lib/utils";
import {
    BellSimple,
    Books,
    CaretDown,
    CaretLeft,
    CaretRight,
    ChartPieSlice,
    FileText,
    Gear,
    GraduationCap,
    IdentificationBadge,
    SignOut,
    Sparkle,
    Stack,
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

interface NavGroup {
    label: string;
    icon: Icon;
    items: NavItem[];
}

const ACADEMY_MANAGEMENT: NavItem[] = [
    { label: "Overview", href: "/teacher/dashboard", icon: ChartPieSlice },
    { label: "My Batches", href: "/teacher/batches", icon: GraduationCap },
    { label: "Students", href: "/teacher/students", icon: Users },
];

const QUESTIONS_HUB: NavItem[] = [
    { label: "Question Bank", href: "/teacher/question-bank", icon: Stack },
    { label: "Case Studies", href: "/teacher/case-studies", icon: Books },
];

const ASSESSMENT_HUB: NavItem[] = [
    { label: "Test Series", href: "/teacher/test-series", icon: FileText },
    { label: "Study Materials", href: "/teacher/free-resources", icon: Sparkle },
];

const INSIGHTS_NAV: NavItem[] = [
    { label: "Analytics", href: "/teacher/analytics", icon: ChartPieSlice },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
    { label: "Platform Governance", href: "/admin/control-center", icon: IdentificationBadge },
];

// --- Sub-components ---

function SidebarSubItem({
    item,
    isActive
}: {
    item: NavItem;
    isActive: boolean;
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
    icon: Icon;
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
                {items.map((item) => (
                    <SidebarSubItem
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
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
    showAdminLink,
    isSuperAdmin
}: {
    isCollapsed: boolean;
    isProfileOpen: boolean;
    setIsProfileOpen: (open: boolean) => void;
    handleLogout: () => void;
    showAdminLink: boolean;
    isSuperAdmin: boolean;
}) {
    return (
        <div className="mt-auto border-t border-[var(--student-border)] p-3">
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={cn(
                        "w-full rounded-lg p-2 transition-all duration-200",
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
                                <div className="text-[10px] font-medium uppercase tracking-tighter text-[var(--student-muted)]">
                                    {showAdminLink ? "Administrator" : "Faculty"}
                                </div>
                            </div>
                            <CaretDown size={12} weight="bold" className={cn("text-[var(--student-muted)] transition-transform", isProfileOpen && "rotate-180")} />
                        </div>
                    )}
                </button>

                {!isCollapsed && isProfileOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-solid)] p-1 shadow-[0_18px_36px_rgba(55,48,38,0.08)] animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <Link
                            href="/teacher/profile"
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
    onClose,
    isSuperAdmin
}: {
    showAdminLink?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
    isSuperAdmin?: boolean;
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
        clearClientSessionState();
        router.push("/");
        router.refresh();
    };

    return (
        <aside
            className={cn(
                "group/sidebar z-50 flex h-full flex-col overflow-hidden border-r border-[var(--student-border)] bg-[var(--student-panel-muted)] transition-all duration-300 ease-in-out pt-4",
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
                    className="absolute -right-12 top-4 rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-solid)] p-2 text-[var(--student-muted)] shadow-md md:hidden"
                >
                    <X size={20} weight="bold" />
                </button>
            )}



            <nav className={cn("mt-2 flex-1 space-y-1 overflow-y-auto px-3 custom-scrollbar", isCollapsed && "px-2")}>
                <SidebarNavGroup
                    label="Academy"
                    icon={IdentificationBadge}
                    items={ACADEMY_MANAGEMENT}
                    pathname={pathname}
                    isCollapsed={isCollapsed}
                />

                <SidebarNavGroup
                    label="Questions"
                    icon={Stack}
                    items={QUESTIONS_HUB}
                    pathname={pathname}
                    isCollapsed={isCollapsed}
                />

                <SidebarNavGroup
                    label="Assessment"
                    icon={FileText}
                    items={ASSESSMENT_HUB}
                    pathname={pathname}
                    isCollapsed={isCollapsed}
                />

                <SidebarNavGroup
                    label="Insights"
                    icon={ChartPieSlice}
                    items={INSIGHTS_NAV}
                    pathname={pathname}
                    isCollapsed={isCollapsed}
                />

                {showAdminLink && (
                    <div className="mt-8 border-t border-[var(--student-border)] pt-4">
                        <SidebarNavGroup
                            label="Governance"
                            icon={IdentificationBadge}
                            items={ADMIN_NAV_ITEMS}
                            pathname={pathname}
                            isCollapsed={isCollapsed}
                        />
                    </div>
                )}
            </nav>

            <UserProfile
                isCollapsed={isCollapsed}
                isProfileOpen={isProfileOpen}
                setIsProfileOpen={setIsProfileOpen}
                handleLogout={handleLogout}
                showAdminLink={showAdminLink}
                isSuperAdmin={isSuperAdmin || false}
            />
        </aside>
    );
}
