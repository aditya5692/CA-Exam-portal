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
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { cn } from "@/lib/utils";

import { Lexend } from "next/font/google";

const lexend = Lexend({
    subsets: ["latin"],
    display: "swap",
});

const SIGNUP_POINTS = [
    "Start with full-length mock access and a cleaner exam rhythm.",
    "Keep revision material, PYQs, and progress in one place.",
    "Upgrade only when you need deeper analytics or more libraries."
];

function SignupFormContent() {
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
        console.log("SignupPage: Widget verified successfully. Received token.");
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
        console.log("SignupPage: Starting registration for phone:", phone);
        setIsSubmitting(true);
        setErrorMessage("");

        if (!msg91Token) {
            console.warn("SignupPage: Registration attempted without verified token.");
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

        console.log("SignupPage: Registration server response received:", result.success ? "SUCCESS" : "FAILED", result.message);
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
        console.log("SignupPage: Redirecting to:", result.data?.redirectTo || "/student/dashboard");
        window.location.assign(result.data?.redirectTo || "/student/dashboard");
    }

    return (
        <div className={cn(lexend.className, "min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 flex flex-col items-center justify-center p-6 sm:p-12")}>
            
            <div className="mb-10 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                <Link href="/" className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-[#0f2cbd] text-white shadow-2xl shadow-blue-600/30 active:scale-95 transition-transform">
                    <GraduationCap size={28} weight="bold" />
                </Link>
                <div className="text-center">
                    <h1 className="text-xl font-extrabold tracking-tighter text-slate-950 italic">Financly</h1>
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#0f2cbd]/60">CA Test Series</p>
                </div>
            </div>

            <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(15,44,189,0.06)] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-1000">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/30 to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(15,44,189,0.02),transparent)] pointer-events-none"></div>

                <div className="p-8 sm:p-14 flex flex-col items-stretch">
                    <div className="mb-10 space-y-3 text-center">
                        <h2 className="text-2xl font-extrabold text-slate-950 tracking-tighter">
                            {step === "phone" ? "Create Workspace" : step === "verify" ? "Security Check" : "Finalize Profile"}
                        </h2>
                        <p className="text-[13px] font-medium text-slate-500">
                            {step === "details" ? `Identify yourself as a ${role.toLowerCase()} to stay aligned.` : "Join the high-integrity prep ecosystem."}
                        </p>
                    </div>

                    <div className="mb-12 p-6 bg-[#0f2cbd]/5 rounded-3xl border border-[#0f2cbd]/10 flex items-start gap-5 shadow-sm">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0f2cbd] shadow-sm border border-[#0f2cbd]/10">
                            <Sparkle size={20} weight="fill" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-extrabold text-[#0f2cbd] uppercase tracking-[0.3em]">Flagship Onboarding</h4>
                            <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-600 opacity-90">
                                Your free account includes unlimited mock simulation and archive access. Upgrade only for advanced subject analytics.
                            </p>
                        </div>
                    </div>

                    <form className="space-y-8" onSubmit={step === "phone" ? handleStartVerification : step === "verify" ? handleVerificationSubmit : handleRegister}>
                        {step === "phone" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Verification Number</label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors">
                                            <DeviceMobile size={22} weight="bold" />
                                        </span>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(event) => setPhone(event.target.value)}
                                            placeholder="Enter 10-digit number"
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-5 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#0f2cbd] focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="brand-button-primary w-full !py-4.5 shadow-[0_25px_60px_-15px_rgba(15,44,189,0.3)] flex items-center justify-center gap-3"
                                >
                                    <span>Proceed to Verification</span>
                                    <ArrowRight size={20} weight="bold" className="transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>
                        )}

                        {step === "verify" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/50 px-5 py-4 shadow-sm">
                                    <div>
                                        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#0f2cbd]">Active Channel</p>
                                        <p className="mt-1 text-sm font-bold text-slate-900">+91 {phone.replace(/\D/g, "").slice(-10)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            clearPendingVerification();
                                            setStep("phone");
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest text-[#0f2cbd] hover:text-rose-600 transition-colors border border-blue-200 bg-white"
                                    >
                                        Change
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
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Role Selection - Industrial Toggle */}
                                <div className="p-1.5 bg-slate-100 rounded-2xl flex w-full shadow-inner border border-slate-200/50">
                                    {(["STUDENT", "TEACHER"] as const).map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setRole(r)}
                                            className={cn(
                                                "flex-1 py-3 px-6 rounded-xl text-[11px] font-extrabold uppercase tracking-widest transition-all",
                                                role === r 
                                                    ? "bg-white text-[#0f2cbd] shadow-md shadow-black/5" 
                                                    : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            {r} Portal
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Identity Name</label>
                                        <div className="relative group">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors">
                                                <User size={20} weight="bold" />
                                            </span>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(event) => setFullName(event.target.value)}
                                                placeholder="Full Name"
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#0f2cbd] focus:bg-white"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Email Node</label>
                                        <div className="relative group">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors">
                                                <Envelope size={20} weight="bold" />
                                            </span>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                placeholder="Professional Email"
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#0f2cbd] focus:bg-white"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {role === "STUDENT" ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Aspirant Level</label>
                                            <select
                                                value={caLevel}
                                                onChange={(e) => setCaLevel(e.target.value as "foundation" | "ipc" | "final")}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-sm font-bold text-slate-900 outline-none focus:border-[#0f2cbd] focus:bg-white cursor-pointer appearance-none shadow-sm"
                                                required
                                            >
                                                <option value="foundation">CA Foundation</option>
                                                <option value="ipc">CA Intermediate</option>
                                                <option value="final">CA Final</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Attempt Target</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <select
                                                    value={attemptMonth}
                                                    onChange={(e) => setAttemptMonth(e.target.value)}
                                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-sm font-bold text-slate-900 outline-none focus:border-[#0f2cbd] focus:bg-white cursor-pointer appearance-none shadow-sm"
                                                    required
                                                >
                                                    <option value="5">May</option>
                                                    <option value="11">Nov</option>
                                                    <option value="1">Jan</option>
                                                </select>
                                                <select
                                                    value={attemptYear}
                                                    onChange={(e) => setAttemptYear(e.target.value)}
                                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 px-6 text-sm font-bold text-slate-900 outline-none focus:border-[#0f2cbd] focus:bg-white cursor-pointer appearance-none shadow-sm"
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
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Academic Department</label>
                                        <input
                                            type="text"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            placeholder="Direct Tax, Audit, Financial Reporting, etc."
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-5 px-6 text-sm font-bold text-slate-900 outline-none focus:border-[#0f2cbd] focus:bg-white transition-all shadow-sm"
                                            required={role === "TEACHER"}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-1">Secure Password</label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f2cbd] transition-colors">
                                            <Lock size={20} weight="bold" />
                                        </span>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            placeholder="Minimum 8 characters"
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-14 pr-6 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#0f2cbd] focus:bg-white"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-5 text-xs font-bold text-rose-600 animate-in shake duration-300 flex items-center gap-3 shadow-sm">
                                <div className="size-2 rounded-full bg-rose-600 animate-pulse"></div>
                                {errorMessage}
                            </div>
                        )}

                        {step !== "verify" && (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="brand-button-primary w-full !py-5 !text-base shadow-[0_25px_60px_-15px_rgba(15,44,189,0.3)] flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? (
                                    <Spinner className="animate-spin" size={24} weight="bold" />
                                ) : (
                                    <>
                                        <span>{step === "phone" ? "Secure My Access" : "Establish Profile Node"}</span>
                                        <ArrowRight size={20} weight="bold" className="transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        )}
                    </form>

                    <p className="mt-12 text-center text-xs font-bold text-slate-400 tracking-tight">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-[#0f2cbd] hover:underline underline-offset-4 decoration-blue-100 font-extrabold decoration-4">
                            Sign in to workspace
                        </Link>
                    </p>

                    <div className="mt-16 pt-8 border-t border-slate-100 flex flex-wrap justify-center gap-x-8 gap-y-3 text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-300">
                        <Link href="/privacy-policy" className="hover:text-slate-950 transition-colors">Privacy Infrastructure</Link>
                        <Link href="/terms-and-conditions" className="hover:text-slate-950 transition-colors">Terms of Prep</Link>
                        <Link href="/refund-policy" className="hover:text-slate-950 transition-colors">Reliability Hub</Link>
                    </div>
                </div>
            </div>
            
            <div className="mt-12 text-center opacity-30 pointer-events-none px-6">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-slate-400 italic">Flagship Onboarding Architecture v2.0</div>
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
