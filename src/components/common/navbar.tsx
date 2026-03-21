"use client";

import { logout } from "@/actions/auth-actions";
import { cn } from "@/lib/utils";
import { GraduationCap,List,SignOut,X } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect,useState } from "react";

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

    const NAV_LINKS = [
        { label: "Home", href: "/" },
        { label: "Study Material", href: "/study-material" },
        { label: "Past Year Questions", href: "/past-year-questions" },
        { label: "Mock Exams", href: "/student/exams" },
        { label: "Pricing", href: "/pricing" },
        { label: "Analytics", href: "/student/analytics" },
    ];

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 sm:px-12",
                isScrolled
                    ? "py-3 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm"
                    : "py-6 bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                        <GraduationCap size={24} weight="bold" className="text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-bold text-gray-900 tracking-tight font-outfit">Financly</span>
                        <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">Exam Studio</div>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-widest py-2"
                        >
                            {link.label}
                        </Link>
                    ))}

                    <div className="h-6 w-px bg-gray-200 mx-2" />

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Link
                                    href={user.role === "ADMIN" ? "/admin/dashboard" : user.role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard"}
                                    className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={async () => {
                                        await logout();
                                        router.push("/");
                                        router.refresh();
                                    }}
                                    className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-900 font-bold text-sm shadow-sm hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <SignOut size={18} weight="bold" /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    Join Free
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 rounded-xl bg-gray-50 text-gray-900"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-6 shadow-2xl animate-in slide-in-from-top-4 duration-300 md:hidden">
                    <div className="flex flex-col gap-6">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-lg font-bold text-gray-900"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <hr className="border-gray-100" />
                        <div className="flex flex-col gap-4">
                            {user ? (
                                <>
                                    <Link
                                        href={user.role === "ADMIN" ? "/admin/dashboard" : user.role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard"}
                                        className="w-full py-4 text-center font-bold text-gray-900 border border-gray-100 rounded-2xl"
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
                                        className="w-full py-4 text-center font-bold text-gray-900 bg-gray-100 rounded-2xl flex items-center justify-center gap-2"
                                    >
                                        <SignOut size={18} weight="bold" /> Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/auth/login"
                                        className="w-full py-4 text-center font-bold text-gray-900 border border-gray-100 rounded-2xl"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/auth/signup"
                                        className="w-full py-4 text-center font-bold text-white bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Start for Free
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
