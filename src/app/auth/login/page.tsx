"use client";

import { login } from "@/actions/auth-actions";
import {
  ArrowRight,
  ChalkboardTeacher,
  Envelope,
  GoogleLogo,
  GraduationCap,
  IdentificationBadge,
  Lock,
  ShieldCheck,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo,useState } from "react";

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

        const redirectTo =
            result.data?.redirectTo ??
            (role === "admin" ? "/admin/dashboard" : role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");

        router.push(redirectTo);
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

            <div className="w-full max-w-md bg-white rounded-[40px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-12 relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-slate-900 font-outfit mb-3 tracking-tight">Welcome Back</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Access your learning studio</p>
                </div>

                <div className="flex p-1.5 bg-slate-50 rounded-2xl mb-10 gap-1 border border-slate-100">
                    <button
                        type="button"
                        onClick={() => setRole("student")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${role === "student" ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        <IdentificationBadge size={18} weight={role === "student" ? "fill" : "bold"} />
                        Student
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole("teacher")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${role === "teacher" ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        <ChalkboardTeacher size={18} weight={role === "teacher" ? "fill" : "bold"} />
                        Teacher
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole("admin")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${role === "admin" ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        <ShieldCheck size={18} weight={role === "admin" ? "fill" : "bold"} />
                        Admin
                    </button>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-4">Credentials</label>
                        <div className="relative group">
                            <Envelope size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" weight="bold" />
                            <input
                                type="text"
                                value={identifier}
                                onChange={(event) => setIdentifier(event.target.value)}
                                placeholder={role === "admin" ? "ADMIN001 or admin@demo.local" : "TCHR001 / STUD001 or email"}
                                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4.5 pl-14 pr-6 text-sm font-medium focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none font-sans"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center ml-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Security Key</label>
                            <Link href="#" className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] hover:underline">Forgot?</Link>
                        </div>
                        <div className="relative group">
                            <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" weight="bold" />
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4.5 pl-14 pr-6 text-sm font-medium focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none font-sans"
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
                        className="w-full py-5 rounded-[20px] bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-slate-900 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 mt-6"
                    >
                        {isSubmitting ? "Authenticating..." : "Sign In Securely"} <ArrowRight size={18} weight="bold" />
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

                <div className="mt-8">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                        <div className="relative flex justify-center text-[9px] uppercase tracking-[0.3em] font-bold text-slate-300"><span className="bg-white px-6">Third Party Auth</span></div>
                    </div>
                    <button
                        type="button"
                        className="w-full py-4 border border-slate-100 rounded-[20px] bg-slate-50 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600 hover:bg-white hover:border-indigo-100 transition-all active:scale-95 group font-sans"
                    >
                        <GoogleLogo size={20} weight="bold" className="text-rose-500 group-hover:scale-110 transition-transform" />
                        Continue with Google
                    </button>
                </div>

                <p className="mt-10 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Don&apos;t have an account? <Link href="/auth/signup" className="text-indigo-600 hover:underline hover:text-indigo-700 transition-colors">Create for Free</Link>
                </p>
            </div>
        </div>
    );
}
