"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
    GraduationCap,
    ArrowRight,
    Envelope,
    Lock,
    GoogleLogo,
    IdentificationBadge,
    ChalkboardTeacher,
    ShieldCheck,
} from "@phosphor-icons/react";
import { login } from "@/actions/auth-actions";

type LoginRole = "student" | "teacher" | "admin";

const DEMO_ACCOUNT_CARDS = [
    { label: "admin", registrationNumber: "ADMIN001", email: "admin@demo.local", role: "admin" as LoginRole },
    { label: "teacher1", registrationNumber: "TCHR001", email: "teacher1@demo.local", role: "teacher" as LoginRole },
    { label: "teacher2", registrationNumber: "TCHR002", email: "teacher2@demo.local", role: "teacher" as LoginRole },
    { label: "student1", registrationNumber: "STUD001", email: "student1@demo.local", role: "student" as LoginRole },
    { label: "student2", registrationNumber: "STUD002", email: "student2@demo.local", role: "student" as LoginRole },
];

export default function LoginPage() {
    const router = useRouter();
    const [role, setRole] = useState<LoginRole>("student");
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const activeCards = useMemo(
        () => DEMO_ACCOUNT_CARDS.filter((account) => account.role === role),
        [role]
    );

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");

        const result = await login({
            identifier,
            password,
            role: role.toUpperCase() as "ADMIN" | "TEACHER" | "STUDENT",
        });

        setIsSubmitting(false);

        if (!result.success) {
            setErrorMessage(result.message);
            return;
        }

        router.push(result.redirectTo);
        router.refresh();
    }

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

            <Link href="/" className="flex items-center gap-3 mb-10 relative z-10 group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                    <GraduationCap size={28} weight="bold" className="text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900 tracking-tight font-outfit">Financly</span>
            </Link>

            <div className="w-full max-w-md bg-white rounded-[40px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-10 relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 font-outfit mb-2">Welcome Back</h1>
                    <p className="text-gray-400 font-medium uppercase tracking-widest text-[10px]">Access your learning studio</p>
                </div>

                <div className="flex p-1.5 bg-gray-50 rounded-2xl mb-8 gap-1">
                    <button
                        type="button"
                        onClick={() => setRole("student")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${role === "student" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        <IdentificationBadge size={18} weight={role === "student" ? "fill" : "regular"} />
                        Student
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole("teacher")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${role === "teacher" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        <ChalkboardTeacher size={18} weight={role === "teacher" ? "fill" : "regular"} />
                        Teacher
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole("admin")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${role === "admin" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        <ShieldCheck size={18} weight={role === "admin" ? "fill" : "regular"} />
                        Admin
                    </button>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Registration Number Or Email</label>
                        <div className="relative group">
                            <Envelope size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                value={identifier}
                                onChange={(event) => setIdentifier(event.target.value)}
                                placeholder={role === "admin" ? "ADMIN001 or admin@demo.local" : "TCHR001 / STUD001 or email"}
                                className="w-full bg-gray-50 border border-transparent rounded-[20px] py-4 pl-12 pr-4 text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-4">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password</label>
                            <Link href="#" className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline">Forgot?</Link>
                        </div>
                        <div className="relative group">
                            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="demo123"
                                className="w-full bg-gray-50 border border-transparent rounded-[20px] py-4 pl-12 pr-4 text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    {errorMessage ? (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                            {errorMessage}
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 rounded-[24px] bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-3 active:scale-95 translate-y-2 disabled:opacity-70"
                    >
                        {isSubmitting ? "Signing In..." : "Sign In Now"} <ArrowRight size={18} weight="bold" />
                    </button>
                </form>

                <div className="mt-8 rounded-[28px] border border-gray-100 bg-gray-50/70 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Demo Logins</p>
                    <p className="mt-1 text-sm font-medium text-gray-600">
                        Use password <span className="font-bold text-indigo-600">demo123</span> for all demo accounts.
                    </p>
                    <div className="mt-4 grid gap-3">
                        {activeCards.map((account) => (
                            <button
                                key={account.label}
                                type="button"
                                onClick={() => {
                                    setRole(account.role);
                                    setIdentifier(account.registrationNumber);
                                    setPassword("demo123");
                                    setErrorMessage("");
                                }}
                                className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left transition-all hover:border-indigo-200 hover:bg-indigo-50/40"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{account.label}</p>
                                        <p className="text-xs font-medium text-gray-500">{account.registrationNumber}</p>
                                    </div>
                                    <p className="text-xs font-medium text-indigo-600">{account.email}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-12">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold"><span className="bg-white px-4 text-gray-300">Or continue with</span></div>
                    </div>
                    <button
                        type="button"
                        className="w-full py-4 border border-gray-100 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95 group"
                    >
                        <GoogleLogo size={20} className="text-red-500 group-hover:scale-110 transition-transform" />
                        Google Account
                    </button>
                </div>

                <p className="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                    Flexible yearly plans designed to empower both ambitious students and professional educators in the CA journey.
                </p>

                <p className="mt-10 text-center text-sm font-medium text-gray-500">
                    Don&apos;t have an account? <Link href="/auth/signup" className="text-indigo-600 font-bold hover:underline">Create for Free</Link>
                </p>
            </div>
        </div>
    );
}
