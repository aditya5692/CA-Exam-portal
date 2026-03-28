"use client";

import { loginAsDemoUser, verifyWidgetOtpAndLogin } from "@/actions/auth-actions";
import Msg91Widget from "@/components/auth/msg91-widget";
import {
    ArrowRight,
    ChalkboardTeacher,
    GraduationCap,
    IdentificationBadge,
    Phone,
    Spinner
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

type LoginRole = "student" | "teacher";

const DEMO_ACCOUNT_CARDS = [
    { label: "teacher1 (Super Admin)", registrationNumber: "TCHR001", email: "teacher1@demo.local", role: "teacher" as LoginRole },
    { label: "teacher2", registrationNumber: "TCHR002", email: "teacher2@demo.local", role: "teacher" as LoginRole },
    { label: "student1", registrationNumber: "STUD001", email: "student1@demo.local", role: "student" as LoginRole },
    { label: "student2", registrationNumber: "STUD002", email: "student2@demo.local", role: "student" as LoginRole },
];

const ROLE_META: Record<LoginRole, { title: string; description: string; icon: typeof IdentificationBadge }> = {
    student: {
        title: "Student Workspace",
        description: "Practice timed papers, revisit weak chapters, and track progress.",
        icon: IdentificationBadge
    },
    teacher: {
        title: "Teacher Workspace",
        description: "Manage batches, monitor student attempts, and publish materials.",
        icon: ChalkboardTeacher
    }
};

type AuthState = "IDLE" | "VERIFYING" | "FINALIZING" | "SUCCESS";

export default function LoginPage() {
    const router = useRouter();
    const [role, setRole] = useState<LoginRole>("student");
    const [phone, setPhone] = useState("");
    const [authState, setAuthState] = useState<AuthState>("IDLE");
    const [errorMessage, setErrorMessage] = useState("");

    const activeCards = useMemo(
        () => DEMO_ACCOUNT_CARDS.filter((account) => account.role === role),
        [role]
    );

    const hostname = useSyncExternalStore(
        () => () => undefined,
        () => window.location.hostname,
        () => "",
    );
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

    const normalizedPhone = useMemo(() => {
        const digits = phone.replace(/\D/g, "");
        if (digits.length === 10) return `91${digits}`;
        return digits;
    }, [phone]);

    async function handleStartVerification(event: React.FormEvent) {
        event.preventDefault();
        if (!phone || phone.length < 10) {
            setErrorMessage("Please enter a valid 10-digit phone number.");
            return;
        }

        setErrorMessage("");
        setAuthState("VERIFYING");
    }

    async function handleAuthSuccess(accessToken: string) {
        setAuthState("FINALIZING");
        console.log("LoginPage: Starting server-side verification...");

        try {
            const requestedRole = role.toUpperCase() as "STUDENT" | "TEACHER";
            const result = await verifyWidgetOtpAndLogin(accessToken, requestedRole);
            
            if (!result.success) {
                if (result.data && "roleMismatch" in result.data && result.data.roleMismatch) {
                    if (result.data.actualRole === "STUDENT" || result.data.actualRole === "TEACHER") {
                        setRole(result.data.actualRole.toLowerCase() as LoginRole);
                    }
                }
                setErrorMessage(result.message);
                setAuthState("IDLE");
                return;
            }

            setAuthState("SUCCESS");

            if ('needsRegistration' in result.data! && result.data.needsRegistration) {
                window.sessionStorage.setItem("pending-msg91-token", accessToken);
                console.log("LoginPage: New user detected. Redirecting to signup.");
                router.push(`/auth/signup?phone=${phone}&role=${role}&verified=true`);
                return;
            }

            const redirectTo = "redirectTo" in result.data
                ? result.data.redirectTo
                : role === "teacher"
                    ? "/teacher/dashboard"
                    : "/student/dashboard";

            console.log(`LoginPage: Login successful. Redirecting to ${redirectTo}`);
            router.push(redirectTo);
            router.refresh();
        } catch (err) {
            console.error("LoginPage: Finalization Error", err);
            setErrorMessage("An unexpected error occurred during finalization.");
            setAuthState("VERIFYING");
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 flex items-center justify-center p-6 sm:p-12">
            
            <div className="relative w-full max-w-5xl grid lg:grid-cols-[0.8fr_1.2fr] gap-0 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                
                {/* Left side panel (Dark) */}
                <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-12 text-white">
                    <div className="space-y-12">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900 shadow-lg">
                                <GraduationCap size={22} weight="bold" />
                            </div>
                            <div>
                                <div className="font-outfit text-xl font-bold tracking-tight text-white leading-none">Financly</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">CA Exam Workspace</div>
                            </div>
                        </Link>

                        <div className="space-y-6">
                            <h1 className="font-outfit text-4xl font-bold leading-tight tracking-tight text-white">
                                Enter your <span className="text-emerald-400">workspace</span> without the noise.
                            </h1>
                            <p className="text-base font-medium text-white/60 leading-relaxed">
                                Sign in with your phone and OTP to access your tailored workflow and continue your preparation.
                            </p>
                        </div>

                        <div className="grid gap-3 pt-4">
                            {(["student", "teacher"] as LoginRole[]).map((itemRole) => {
                                const meta = ROLE_META[itemRole];
                                const Icon = meta.icon;
                                const isActive = itemRole === role;

                                return (
                                    <div
                                        key={itemRole}
                                        className={cn(
                                            "rounded-xl border p-5 transition-all text-left",
                                            isActive
                                                ? "border-emerald-500/20 bg-white/5 text-white"
                                                : "border-white/5 text-white/40"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                                isActive ? "bg-emerald-500 text-slate-900" : "bg-white/5"
                                            )}>
                                                <Icon size={20} weight="bold" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-widest">{meta.title}</div>
                                                <div className="mt-1 text-sm font-medium leading-normal text-white/50">{meta.description}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/20">
                        TLS 1.3 Certified Session
                    </div>
                </div>

                {/* Right side form (Light) */}
                <div className="p-8 sm:p-12 flex flex-col justify-center">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="font-outfit text-3xl font-bold text-slate-900 tracking-tight">
                                {authState === "IDLE" ? "Welcome Back" : "Security Check"}
                            </h2>
                            <p className="text-sm font-medium text-slate-400 mt-1">
                                {authState === "IDLE" ? "Identify yourself to continue" : "Please complete the verification"}
                            </p>
                        </div>
                        <Link href="/" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest">
                            Home
                        </Link>
                    </div>

                    {/* Role Selector */}
                    <div className="mb-8 p-1 bg-slate-100 rounded-xl inline-flex w-full">
                        {([
                            { value: "student", label: "Student", icon: IdentificationBadge },
                            { value: "teacher", label: "Teacher", icon: ChalkboardTeacher }
                        ] as const).map((item) => {
                            const Icon = item.icon;
                            const isActive = role === item.value;

                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    disabled={authState !== "IDLE"}
                                    onClick={() => setRole(item.value)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold transition-all",
                                        isActive
                                            ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                            : "text-slate-500 hover:text-slate-900 disabled:opacity-50"
                                    )}
                                >
                                    <Icon size={18} weight="bold" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="min-h-[300px] flex flex-col">
                        {authState === "IDLE" ? (
                            <form className="space-y-6" onSubmit={handleStartVerification}>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone Number</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                                                <Phone size={20} weight="bold" />
                                            </span>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(event) => setPhone(event.target.value)}
                                                placeholder="EX: 9876543210"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-slate-900 focus:bg-white"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-sm transition-all hover:bg-slate-800 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                                    >
                                        Request OTP
                                        <ArrowRight size={20} weight="bold" />
                                    </button>
                                </div>

                                {isLocalhost && (
                                    <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-[10px] font-medium text-amber-700 leading-relaxed shadow-sm">
                                        <strong className="block mb-1 font-bold uppercase tracking-wider">Localhost Detected:</strong>
                                        MSG91 verification often fails on <code className="bg-amber-100/50 px-1 rounded text-amber-900 font-bold">localhost</code>. 
                                        Use <code className="bg-amber-100/50 px-1 rounded text-amber-900 font-bold">127.0.0.1:3000</code> for direct SDK testing.
                                    </div>
                                )}
                            </form>
                        ) : authState === "VERIFYING" ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                    <div className="flex-1">
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 leading-none mb-1">Verifying Number</div>
                                        <div className="text-xs font-bold text-slate-900 leading-none">+91 {phone}</div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setAuthState("IDLE")}
                                        className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 underline underline-offset-4"
                                    >
                                        Change
                                    </button>
                                </div>
                                <Msg91Widget
                                    phoneNumber={normalizedPhone}
                                    onSuccess={handleAuthSuccess}
                                    onFailure={(err) => {
                                        setErrorMessage(err);
                                        setAuthState("IDLE");
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12 animate-in fade-in zoom-in duration-500">
                                <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
                                    <Spinner className="animate-spin" size={32} weight="bold" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-slate-900">Finalizing Session</h3>
                                    <p className="text-xs font-medium text-slate-400 italic">Connecting to your secure workspace...</p>
                                </div>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="mt-6 rounded-lg bg-rose-50 border border-rose-100 px-4 py-3 text-xs font-bold text-rose-600 animate-in shake duration-300">
                                {errorMessage}
                            </div>
                        )}
                    </div>

                    {/* Demo Accounts List */}
                    {authState === "IDLE" && (
                        <div className="mt-12 bg-slate-50 rounded-xl border border-slate-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Quick Access</h3>
                            </div>
                            <div className="grid gap-2">
                                {activeCards.map((account) => (
                                    <div
                                        key={account.label}
                                        onClick={() => {
                                            setRole(account.role);
                                            setPhone(account.registrationNumber);
                                            setErrorMessage("");
                                        }}
                                        className="group flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200 p-4 rounded-xl hover:border-slate-900 cursor-pointer transition-colors"
                                    >
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{account.label}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">{account.registrationNumber}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                setAuthState("FINALIZING");
                                                const res = await loginAsDemoUser(account.registrationNumber);
                                                if (res.success && res.data && 'redirectTo' in res.data) {
                                                    router.push(res.data.redirectTo);
                                                } else {
                                                    setErrorMessage(res.message || "Login failed.");
                                                    setAuthState("IDLE");
                                                }
                                            }}
                                            className="mt-2 sm:mt-0 px-4 py-2 bg-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                        >
                                            Instant Login
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="mt-8 text-center text-xs font-bold text-slate-400 tracking-tight">
                        Don&apos;t have an account?{" "}
                        <Link href={`/auth/signup?role=${role}`} className="text-indigo-600 hover:underline">
                            Create for free
                        </Link>
                    </p>

                    <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[9px] font-bold uppercase tracking-widest text-slate-300">
                        <Link href="/privacy-policy" className="hover:text-slate-900 transition-colors">Privacy</Link>
                        <Link href="/terms-and-conditions" className="hover:text-slate-900 transition-colors">Terms</Link>
                        <Link href="/refund-policy" className="hover:text-slate-900 transition-colors">Refunds</Link>
                    </div>
                </div>
            </div>

        </div>
    );
}
