"use client";

import { verifyOtpAndRegister } from "@/actions/auth-actions";
import Msg91Widget from "@/components/auth/msg91-widget";
import { 
    ArrowRight, 
    CheckCircle, 
    DeviceMobile, 
    Envelope, 
    GraduationCap, 
    Lock, 
    Sparkle, 
    User,
    Spinner
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { cn } from "@/lib/utils";

const SIGNUP_POINTS = [
    "Start with full-length mock access and a cleaner exam rhythm.",
    "Keep revision material, PYQs, and progress in one place.",
    "Upgrade only when you need deeper analytics or more libraries."
];

function SignupFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchPhone = searchParams.get("phone") ?? "";
    const searchRole = searchParams.get("role")?.toUpperCase();
    const searchVerified = searchParams.get("verified") === "true";
    const initialRole = searchRole === "TEACHER" || searchRole === "STUDENT" ? searchRole : "STUDENT";
    const initialToken = typeof window !== "undefined"
        ? window.sessionStorage.getItem("pending-msg91-token") ?? ""
        : "";
    const initialStep = searchVerified
        ? initialToken
            ? "details"
            : searchPhone
                ? "verify"
                : "phone"
        : "phone";

    const [step, setStep] = useState<"phone" | "verify" | "details">(initialStep);
    const [phone, setPhone] = useState(searchPhone);
    const [msg91Token, setMsg91Token] = useState(initialToken);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"STUDENT" | "TEACHER">(initialRole);
    const [department, setDepartment] = useState("");
    const [caLevel, setCaLevel] = useState<"foundation" | "ipc" | "final">("final");
    const [attemptMonth, setAttemptMonth] = useState("5"); // Default to May
    const [attemptYear, setAttemptYear] = useState(new Date().getFullYear().toString());
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    function clearPendingVerification() {
        setMsg91Token("");
        if (typeof window !== "undefined") {
            window.sessionStorage.removeItem("pending-msg91-token");
        }
    }

    async function handleStartVerification(event: React.FormEvent) {
        event.preventDefault();
        setErrorMessage("");
        clearPendingVerification();

        const digitsOnly = phone.replace(/\D/g, "");
        if (digitsOnly.length < 10) {
            setErrorMessage("Please enter a valid 10-digit phone number.");
            return;
        }

        setStep("verify");
    }

    function handleWidgetSuccess(accessToken: string) {
        setMsg91Token(accessToken);
        window.sessionStorage.setItem("pending-msg91-token", accessToken);
        setErrorMessage("");
        setStep("details");
    }

    function handleVerificationSubmit(event: React.FormEvent) {
        event.preventDefault();
    }

    async function handleRegister(event: React.FormEvent) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");

        if (!msg91Token) {
            setIsSubmitting(false);
            setErrorMessage("Please verify your phone number before creating the account.");
            setStep("verify");
            return;
        }

        const result = await verifyOtpAndRegister({
            phone,
            otp: "VERIFIED",
            token: msg91Token,
            fullName,
            email,
            password,
            role,
            department: role === "TEACHER" ? department : undefined,
            examTargetLevel: role === "STUDENT" ? caLevel : undefined,
            examTargetMonth: role === "STUDENT" ? parseInt(attemptMonth) : undefined,
            examTargetYear: role === "STUDENT" ? parseInt(attemptYear) : undefined
        });

        setIsSubmitting(false);

        if (!result.success) {
            if (result.data && "roleMismatch" in result.data && result.data.roleMismatch) {
                if (result.data.actualRole === "STUDENT" || result.data.actualRole === "TEACHER") {
                    setRole(result.data.actualRole);
                }
            }
            setErrorMessage(result.message);
            return;
        }

        clearPendingVerification();
        router.push(result.data?.redirectTo || "/student/dashboard");
        router.refresh();
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 flex items-center justify-center p-6 sm:p-12">
            
            <div className="relative w-full max-w-6xl grid lg:grid-cols-[1.2fr_0.8fr] gap-0 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                
                {/* Right side form (Light) */}
                <div className="p-8 sm:p-12 flex flex-col justify-center order-2 lg:order-1 border-r border-slate-100">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="font-outfit text-3xl font-bold text-slate-900 tracking-tight">
                                {step === "phone" ? "Join the Workspace" : step === "verify" ? "Verify Number" : "Almost There"}
                            </h2>
                            <p className="text-sm font-medium text-slate-400 mt-1">
                                {step === "details" ? `Finalize your ${role.toLowerCase()} profile` : "Start your prep journey today"}
                            </p>
                        </div>
                        <Link href="/" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest leading-none">
                            Home
                        </Link>
                    </div>

                    <div className="mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm border border-indigo-50">
                            <Sparkle size={20} weight="fill" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest">Free Onboarding</h4>
                            <p className="mt-1 text-xs font-medium leading-relaxed text-indigo-700/80">
                                Your free account includes mock access and progress tracking. Upgrade only when you need deeper analytics.
                            </p>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={step === "phone" ? handleStartVerification : step === "verify" ? handleVerificationSubmit : handleRegister}>
                        {step === "phone" && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone Number</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                                        <DeviceMobile size={20} weight="bold" />
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
                        )}

                        {step === "verify" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Verified Channel</p>
                                        <p className="mt-1 text-xs font-bold text-slate-900">+91 {phone.replace(/\D/g, "").slice(-10)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            clearPendingVerification();
                                            setStep("phone");
                                        }}
                                        className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:underline"
                                    >
                                        Change Phone
                                    </button>
                                </div>

                                <Msg91Widget
                                    phoneNumber={phone.replace(/\D/g, "").length === 10 ? `91${phone.replace(/\D/g, "")}` : phone.replace(/\D/g, "")}
                                    onSuccess={handleWidgetSuccess}
                                    onFailure={(message) => {
                                        clearPendingVerification();
                                        setErrorMessage(message);
                                    }}
                                />
                            </div>
                        )}

                        {step === "details" && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Role Selection Toggle */}
                                <div className="p-1 bg-slate-100 rounded-lg flex w-full">
                                    {(["STUDENT", "TEACHER"] as const).map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setRole(r)}
                                            className={cn(
                                                "flex-1 py-2 px-4 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all",
                                                role === r 
                                                    ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                                                    : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Name</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                                                <User size={18} weight="bold" />
                                            </span>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(event) => setFullName(event.target.value)}
                                                placeholder="Aditya S"
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-slate-900"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                                                <Envelope size={18} weight="bold" />
                                            </span>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                placeholder="name@email.com"
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-slate-900"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {role === "STUDENT" ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">CA Level</label>
                                            <select
                                                value={caLevel}
                                                onChange={(e) => setCaLevel(e.target.value as "foundation" | "ipc" | "final")}
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-slate-900 cursor-pointer appearance-none"
                                                required
                                            >
                                                <option value="foundation">Foundation</option>
                                                <option value="ipc">Intermediate</option>
                                                <option value="final">Final</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Attempt Target</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <select
                                                    value={attemptMonth}
                                                    onChange={(e) => setAttemptMonth(e.target.value)}
                                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-slate-900 cursor-pointer appearance-none"
                                                    required
                                                >
                                                    <option value="5">May</option>
                                                    <option value="11">Nov</option>
                                                    <option value="1">Jan</option>
                                                </select>
                                                <select
                                                    value={attemptYear}
                                                    onChange={(e) => setAttemptYear(e.target.value)}
                                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-slate-900 cursor-pointer appearance-none"
                                                    required
                                                >
                                                    {[2024, 2025, 2026, 2027].map(year => (
                                                        <option key={year} value={year}>{year}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Academic Department</label>
                                        <input
                                            type="text"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            placeholder="EX: Direct Tax, Audit, Financial Reporting"
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-slate-900"
                                            required={role === "TEACHER"}
                                        />
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                                            <Lock size={18} weight="bold" />
                                        </span>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            placeholder="Min 8 characters"
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-slate-900"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="rounded-lg bg-rose-50 border border-rose-100 px-4 py-3 text-xs font-bold text-rose-600">
                                {errorMessage}
                            </div>
                        )}

                        {step !== "verify" && (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-sm transition-all hover:bg-slate-800 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Spinner className="animate-spin" size={20} weight="bold" />
                                ) : (
                                    <>
                                        {step === "phone" ? "Verify Phone" : "Create Account"}
                                        <ArrowRight size={20} weight="bold" />
                                    </>
                                )}
                            </button>
                        )}
                    </form>

                    <p className="mt-8 text-center text-xs font-bold text-slate-400 tracking-tight">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-indigo-600 hover:underline">
                            Sign in
                        </Link>
                    </p>

                    <div className="mt-8 pt-8 border-t border-slate-100 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[9px] font-bold uppercase tracking-widest text-slate-300">
                        <Link href="/privacy-policy" className="hover:text-slate-900 transition-colors">Privacy</Link>
                        <Link href="/terms-and-conditions" className="hover:text-slate-900 transition-colors">Terms</Link>
                        <Link href="/refund-policy" className="hover:text-slate-900 transition-colors">Refunds</Link>
                    </div>
                </div>

                {/* Left side panel (Dark) */}
                <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-12 text-white order-2">
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
                            <h2 className="font-outfit text-4xl font-bold leading-tight tracking-tight text-white">
                                Built for <span className="text-emerald-400">disciplined</span> preparation.
                            </h2>
                            <p className="text-base font-medium text-white/60 leading-relaxed">
                                Join thousands of aspirants who use our unified platform to reduce exam anxiety and improve attempt discipline.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {SIGNUP_POINTS.map((point, index) => (
                                <div key={index} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/5">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-slate-900">
                                        <CheckCircle size={18} weight="bold" />
                                    </div>
                                    <p className="text-sm font-medium text-white/70 leading-relaxed">{point}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/20">
                        Secure Registration · AES-256
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Spinner className="animate-spin text-slate-900" size={32} weight="bold" />
            </div>
        }>
            <SignupFormContent />
        </Suspense>
    );
}
