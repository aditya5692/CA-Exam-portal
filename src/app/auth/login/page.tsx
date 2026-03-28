"use client";

import { loginAsDemoUser, requestOtp, verifyOtpAndLogin, verifyWidgetOtpAndLogin } from "@/actions/auth-actions";
import Msg91Widget from "@/components/auth/msg91-widget";
import {
    ArrowRight,
    ChalkboardTeacher,
    GraduationCap,
    IdentificationBadge,
    Phone,
    ShieldCheck,
    SignOut,
    Spinner
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
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

export default function LoginPage() {
    const router = useRouter();
    const [role, setRole] = useState<LoginRole>("student");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showWidget, setShowWidget] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const activeCards = useMemo(
        () => DEMO_ACCOUNT_CARDS.filter((account) => account.role === role),
        [role]
    );

    const isLocalhost = useMemo(() => {
        if (!mounted || typeof window === "undefined") return false;
        return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    }, [mounted]);

    const normalizedPhone = useMemo(() => {
        const digits = phone.replace(/\D/g, "");
        if (digits.length === 10) return `91${digits}`;
        return digits;
    }, [phone]);

    async function handleRequestOtp(event: React.FormEvent) {
        event.preventDefault();
        if (!phone || phone.length < 10) {
            setErrorMessage("Please enter a valid phone number.");
            return;
        }

        setErrorMessage("");
        
        if (normalizedPhone.length < 11) {
            setErrorMessage("Please enter a valid 10-digit phone number.");
            return;
        }

        setShowWidget(true);
    }

    async function handleWidgetSuccess(data: any) {
        // The widget returns { message: "JWT_TOKEN", type: "success" } or just the token string
        const accessToken = typeof data === 'string' ? data : data?.message;
        
        if (!accessToken) {
            setErrorMessage("Verification succeeded but no access token was provided.");
            return;
        }

        setIsSubmitting(true);
        setShowWidget(false);
        const result = await verifyWidgetOtpAndLogin(accessToken);
        setIsSubmitting(false);

        if (!result.success) {
            setErrorMessage(result.message);
            return;
        }

        if ('needsRegistration' in result.data! && result.data.needsRegistration) {
            router.push(`/auth/signup?phone=${phone}&verified=true`);
            return;
        }

        const loginData = result.data as any;
        const redirectTo = loginData.redirectTo || (role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");

        router.push(redirectTo);
        router.refresh();
    }

    async function handleVerifyOtp(event: React.FormEvent) {
        event.preventDefault();
        if (!otp || otp.length < 4) {
             setErrorMessage("Please enter the OTP.");
             return;
        }

        setIsSubmitting(true);
        setErrorMessage("");

        const result = await verifyOtpAndLogin(phone, otp);
        setIsSubmitting(false);

        if (!result.success) {
            setErrorMessage(result.message);
            return;
        }

        if ('needsRegistration' in result.data! && result.data.needsRegistration) {
            router.push(`/auth/signup?phone=${phone}&verified=true`);
            return;
        }

        const loginData = result.data as any;
        const redirectTo = loginData.redirectTo || (role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");

        router.push(redirectTo);
        router.refresh();
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
                                {step === "phone" ? "Welcome Back" : "Verify OTP"}
                            </h2>
                            <p className="text-sm font-medium text-slate-400 mt-1">
                                {step === "phone" ? "Identify yourself to continue" : `Code sent to ${phone}`}
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
                                    disabled={step === "otp"}
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

                    <form className="space-y-6" onSubmit={handleRequestOtp}>
                        {!showWidget ? (
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
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-sm transition-all hover:bg-slate-800 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                                >
                                    {isSubmitting ? <Spinner className="animate-spin" size={20} weight="bold" /> : "Request OTP"}
                                    {!isSubmitting && <ArrowRight size={20} weight="bold" />}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                                        <Phone size={14} weight="bold" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 leading-none mb-1">Verifying Number</div>
                                        <div className="text-xs font-bold text-slate-900 leading-none">+91 {phone}</div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setShowWidget(false)}
                                        className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 underline underline-offset-4"
                                    >
                                        Change
                                    </button>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                                    <Msg91Widget
                                        phoneNumber={normalizedPhone}
                                        onSuccess={handleWidgetSuccess}
                                        onFailure={(err) => {
                                            setErrorMessage(typeof err === "string" ? err : "Verification failed. Please try again.");
                                            setShowWidget(false);
                                        }}
                                        autoTrigger={true}
                                    />
                                </div>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="rounded-lg bg-rose-50 border border-rose-100 px-4 py-3 text-xs font-bold text-rose-600">
                                {errorMessage}
                            </div>
                        )}


                        {isLocalhost && !showWidget && (
                            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-[10px] font-medium text-amber-700 leading-relaxed shadow-sm">
                                <strong className="block mb-1 font-bold uppercase tracking-wider">Localhost Detected:</strong>
                                MSG91 verification often fails on <code className="bg-amber-100/50 px-1 rounded text-amber-900 font-bold">localhost</code>. 
                                <br />
                                1. Try accessing via <code className="bg-amber-100/50 px-1 rounded text-amber-900 font-bold">127.0.0.1:3000</code>.
                                <br />
                                2. Or disable **"re-Captcha validation"** in your MSG91 Widget dashboard.
                            </div>
                        )}
                    </form>

                    {/* Demo Accounts List - Simplified */}
                    <div className="mt-12 bg-slate-50 rounded-xl border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Demo Accounts</h3>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Quick Access</span>
                        </div>
                        <div className="grid gap-2">
                            {activeCards.map((account) => (
                                <div
                                    key={account.label}
                                    onClick={() => {
                                        setRole(account.role);
                                        setPhone(account.registrationNumber);
                                        setStep("phone");
                                        setErrorMessage("");
                                    }}
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200 p-3 rounded-lg hover:border-slate-900 cursor-pointer transition-colors"
                                >
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{account.label}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">{account.registrationNumber}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            setIsSubmitting(true);
                                            const res = await loginAsDemoUser(account.registrationNumber);
                                            if (res.success && res.data && 'redirectTo' in res.data) {
                                                router.push(res.data.redirectTo);
                                            } else {
                                                setErrorMessage(res.message || "Login failed.");
                                                setIsSubmitting(false);
                                            }
                                        }}
                                        className="mt-2 sm:mt-0 px-3 py-1.5 bg-slate-100 rounded text-[9px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                    >
                                        Login
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="mt-8 text-center text-xs font-bold text-slate-400 tracking-tight">
                        Don't have an account?{" "}
                        <Link href="/auth/signup" className="text-indigo-600 hover:underline">
                            Create for free
                        </Link>
                    </p>

                    <div className="mt-8 pt-8 border-t border-slate-100 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[9px] font-bold uppercase tracking-widest text-slate-300">
                        <Link href="/privacy-policy" className="hover:text-slate-900 transition-colors">Privacy</Link>
                        <Link href="/terms-and-conditions" className="hover:text-slate-900 transition-colors">Terms</Link>
                        <Link href="/refund-policy" className="hover:text-slate-900 transition-colors">Refunds</Link>
                    </div>
                </div>
            </div>

        </div>
    );
}
