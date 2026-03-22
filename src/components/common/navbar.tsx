"use client";

import { logout } from "@/actions/auth-actions";
import { cn } from "@/lib/utils";
import { GraduationCap, List, SignOut, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "Study Material", href: "/study-material" },
    { label: "Past Year Questions", href: "/past-year-questions" },
    { label: "Mock Exams", href: "/student/exams" },
    { label: "Pricing", href: "/pricing" },
    { label: "Analytics", href: "/student/analytics" },
];

export function Navbar({ user }: { user?: { fullName: string | null; role: string } | null }) {
    const router = useRouter();
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
        <nav className="fixed left-0 right-0 top-0 z-[100] px-6 pt-4 sm:px-12">
            <div
                className={cn(
                    "mx-auto flex max-w-7xl items-center justify-between rounded-[28px] border px-4 py-3 transition-all duration-300 sm:px-5",
                    isScrolled
                        ? "border-[#e6dccd] bg-[rgba(255,253,249,0.92)] shadow-[0_18px_40px_rgba(55,48,38,0.08)] backdrop-blur-xl"
                        : "border-transparent bg-transparent"
                )}
            >
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#c5ddd5] bg-[#dcebe6] text-[#1f5c50] shadow-[0_12px_28px_rgba(31,92,80,0.12)] transition-transform duration-300 group-hover:scale-105">
                        <GraduationCap size={24} weight="bold" />
                    </div>
                    <div>
                        <div className="font-outfit text-xl font-black tracking-tight text-[#1f2b2f]">Financly</div>
                        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#667370]">CA Exam Workspace</div>
                    </div>
                </Link>

                <div className="hidden items-center gap-7 md:flex">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#667370] transition-colors hover:text-[#1f5c50]"
                        >
                            {link.label}
                        </Link>
                    ))}

                    <div className="mx-1 h-6 w-px bg-[#d7c5a9]" />

                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <Link
                                    href={dashboardHref}
                                    className="rounded-xl border border-[#e6dccd] bg-[rgba(255,253,249,0.94)] px-4 py-2.5 text-sm font-bold text-[#1f2b2f] shadow-[0_10px_20px_rgba(55,48,38,0.05)] transition-all hover:bg-white"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={async () => {
                                        await logout();
                                        router.push("/");
                                        router.refresh();
                                    }}
                                    className="flex items-center gap-2 rounded-xl border border-[#d7c5a9] bg-[#f4ede2] px-4 py-2.5 text-sm font-bold text-[#4f5b58] transition-all hover:bg-[#efe5d6] active:scale-95"
                                >
                                    <SignOut size={18} weight="bold" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="px-2 py-2 text-sm font-bold text-[#1f2b2f] transition-colors hover:text-[#1f5c50]"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="rounded-xl border border-[#1f5c50] bg-[#1f5c50] px-5 py-2.5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(31,92,80,0.15)] transition-all hover:bg-[#18493f] active:scale-95"
                                >
                                    Join Free
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <button
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e6dccd] bg-[rgba(255,253,249,0.92)] text-[#1f2b2f] shadow-[0_10px_20px_rgba(55,48,38,0.05)] md:hidden"
                    onClick={() => setIsMobileMenuOpen((open) => !open)}
                >
                    {isMobileMenuOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
                </button>
            </div>

            {isMobileMenuOpen && (
                <div className="mx-auto mt-3 max-w-7xl rounded-[28px] border border-[#e6dccd] bg-[rgba(255,253,249,0.96)] p-5 shadow-[0_20px_44px_rgba(55,48,38,0.08)] backdrop-blur-xl animate-in slide-in-from-top-4 duration-300 md:hidden">
                    <div className="flex flex-col gap-3">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-2xl px-4 py-3 text-sm font-bold text-[#1f2b2f] transition-colors hover:bg-[#f4ede2] hover:text-[#1f5c50]"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="my-5 h-px bg-[#e6dccd]" />

                    <div className="flex flex-col gap-3">
                        {user ? (
                            <>
                                <Link
                                    href={dashboardHref}
                                    className="rounded-2xl border border-[#e6dccd] bg-[rgba(255,253,249,0.94)] px-4 py-3 text-center text-sm font-bold text-[#1f2b2f]"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={async () => {
                                        setIsMobileMenuOpen(false);
                                        await logout();
                                        router.push("/");
                                        router.refresh();
                                    }}
                                    className="flex items-center justify-center gap-2 rounded-2xl border border-[#d7c5a9] bg-[#f4ede2] px-4 py-3 text-sm font-bold text-[#4f5b58]"
                                >
                                    <SignOut size={18} weight="bold" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="rounded-2xl border border-[#e6dccd] bg-[rgba(255,253,249,0.94)] px-4 py-3 text-center text-sm font-bold text-[#1f2b2f]"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="rounded-2xl border border-[#1f5c50] bg-[#1f5c50] px-4 py-3 text-center text-sm font-bold text-white shadow-[0_14px_28px_rgba(31,92,80,0.15)]"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Start for Free
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
