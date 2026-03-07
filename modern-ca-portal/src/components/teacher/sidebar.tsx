"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    GraduationCap
} from "@phosphor-icons/react";

const NAV_ITEMS = [
    { label: "Overview", href: "/teacher/dashboard", icon: ChartPieSlice },
    { label: "Test Series", href: "/teacher/test-series", icon: FileText },
    { label: "Question Bank", href: "/teacher/questions", icon: Books },
    { label: "Study Materials", href: "/teacher/materials", icon: Books },
    { label: "My Batches", href: "/teacher/batches", icon: GraduationCap },
    { label: "Updates", href: "/teacher/updates", icon: BellSimple },
    { label: "Students", href: "/teacher/students", icon: Users },
    { label: "Analytics", href: "/teacher/analytics", icon: ChartPieSlice },
    { label: "Subscription", href: "/pricing", icon: Books },
    { label: "Academy", href: "/teacher/academy", icon: GraduationCap },
];

export function TeacherSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <FileText size={22} weight="bold" className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 text-lg tracking-tight">Financly</h1>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Teacher Studio</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
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
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all font-medium"
                >
                    <IdentificationBadge size={20} />
                    <span className="text-sm">My Profile</span>
                </Link>
                <Link
                    href="/teacher/settings"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all font-medium"
                >
                    <Gear size={20} />
                    <span className="text-sm">Settings</span>
                </Link>
                <Link
                    href="/"
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 transition-all font-medium"
                >
                    <SignOut size={20} weight="bold" />
                    <span className="text-sm">Sign Out</span>
                </Link>
            </div>
        </aside>
    );
}
