"use client";

import { logout } from "@/actions/auth-actions";
import { clearClientSessionState } from "@/lib/client/session-cleanup";
import { cn } from "@/lib/utils";
import { GraduationCap, List, SignOut, X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "Test Series", href: "/exam" },
    { label: "Study Materials", href: "/study-material" },
    { label: "Plans", href: "/pricing" },
];

export function Navbar({ user }: { user?: { fullName: string | null; role: string } | null }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const dashboardHref =
        user?.role === "ADMIN"
            ? "/admin/dashboard"
            : user?.role === "TEACHER"
                ? "/teacher/dashboard"
                : "/student/dashboard";

    return (
        <nav className={cn(
            "fixed left-0 right-0 top-0 z-[100] transition-all duration-500 px-4 sm:px-8",
            isScrolled 
                ? "py-3 bg-white/70 backdrop-blur-2xl border-b border-slate-200 shadow-sm" 
                : "py-6 bg-transparent"
        )}>
            <div className="mx-auto flex max-w-7xl items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f2cbd] text-white shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105">
                        <GraduationCap size={22} weight="bold" />
                    </div>
                    <div>
                        <div className="  text-xl font-bold tracking-tight text-slate-900">Financly</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#0f2cbd]/60">CA Test Series</div>
                    </div>
                </Link>

                <div className="hidden items-center gap-8 md:flex">
                    <div className="flex items-center gap-7">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="relative text-[12px] font-extrabold uppercase tracking-[0.12em] text-slate-600 transition-all hover:text-blue-600 group/nav"
                            >
                                {link.label}
                                <span className={cn(
                                    "absolute -bottom-2 left-0 h-[2px] bg-blue-600 transition-all duration-300 rounded-full",
                                    pathname === link.href ? "w-full" : "w-0 group-hover/nav:w-1/2"
                                )}></span>
                            </Link>
                        ))}
                    </div>

                    <div className="h-4 w-px bg-slate-200" />

                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                {user.role === "STUDENT" && (
                                    <Link
                                        href="/student/analytics"
                                        className="px-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-600 hover:text-blue-600 transition-colors"
                                    >
                                        Analytics
                                    </Link>
                                )}
                                <Link
                                    href={dashboardHref}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-sm transition-all hover:bg-slate-50"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={async () => {
                                        await logout();
                                        clearClientSessionState();
                                        router.push("/");
                                        router.refresh();
                                    }}
                                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 transition-all hover:bg-slate-100 active:scale-95"
                                >
                                    <SignOut size={16} weight="bold" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="px-3 text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="rounded-lg bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-95"
                                >
                                    Join Free
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <button
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-900 md:hidden"
                    onClick={() => setIsMobileMenuOpen((open) => !open)}
                >
                    {isMobileMenuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
                </button>
            </div>

            {isMobileMenuOpen && (
                <div className="absolute left-6 right-6 top-full mt-2 rounded-lg border border-slate-200 bg-white p-4 shadow-xl animate-in slide-in-from-top-2 duration-200 md:hidden">
                    <div className="flex flex-col gap-2">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-lg px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        
                        <div className="h-px bg-slate-100 my-2" />
                        
                        {user ? (
                            <div className="flex flex-col gap-2">
                                <Link
                                    href={dashboardHref}
                                    className="rounded-lg bg-slate-900 py-3 text-center text-sm font-bold text-white"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={async () => {
                                        setIsMobileMenuOpen(false);
                                        await logout();
                                        clearClientSessionState();
                                        router.push("/");
                                        router.refresh();
                                    }}
                                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-bold text-slate-500"
                                >
                                    <SignOut size={16} weight="bold" />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/auth/login"
                                    className="rounded-lg border border-slate-200 py-3 text-center text-sm font-bold text-slate-900"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="rounded-lg bg-slate-900 py-3 text-center text-sm font-bold text-white"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Join Free
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
