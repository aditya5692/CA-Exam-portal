"use client";

import { requestOtp, verifyOtpAndRegister } from "@/actions/auth-actions";
import { ArrowLeft, ArrowRight, CheckCircle, DeviceMobile, Envelope, GraduationCap, Lock, ShieldCheck, Sparkle, User } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

const SIGNUP_POINTS = [
    "Start with full-length mock access and a cleaner exam rhythm.",
    "Keep revision material, PYQs, and progress in one place.",
    "Upgrade only when you need deeper analytics or more libraries."
];

function SignupFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [step, setStep] = useState<"phone" | "otp" | "details">("phone");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [dob, setDob] = useState("");
    const [location, setLocation] = useState("");
    const [caLevel, setCaLevel] = useState<"foundation" | "ipc" | "final">("final");
    const [attemptMonth, setAttemptMonth] = useState("5"); // Default to May
    const [attemptYear, setAttemptYear] = useState(new Date().getFullYear().toString());
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const p = searchParams.get("phone");
        const v = searchParams.get("verified");
        if (p) setPhone(p);
        if (v === "true") {
            setStep("details");
            setOtp("VERIFIED");
        }
    }, [searchParams]);

    async function handleRequestOtp(event: React.FormEvent) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");

        const result = await requestOtp(phone);
        setIsSubmitting(false);

        if (result.success) {
            setStep("otp");
        } else {
            setErrorMessage(result.message);
        }
    }

    async function handleVerifyOtp(event: React.FormEvent) {
        event.preventDefault();
        setStep("details"); 
    }

    async function handleRegister(event: React.FormEvent) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");

        const result = await verifyOtpAndRegister({
            phone,
            otp,
            fullName,
            email,
            password,
            role: "STUDENT",
            dob,
            location,
            examTargetLevel: caLevel,
            examTargetMonth: parseInt(attemptMonth),
            examTargetYear: parseInt(attemptYear)
        });

        setIsSubmitting(false);

        if (!result.success) {
            setErrorMessage(result.message);
            return;
        }

        router.push(result.data?.redirectTo || "/student/dashboard");
        router.refresh();
    }

    return (
        <div className="min-h-screen overflow-hidden bg-[var(--landing-bg)] px-6 py-8 text-[var(--landing-text)] sm:px-10 sm:py-10">
            <div className="absolute left-[-10rem] top-[-8rem] h-80 w-80 rounded-full bg-[var(--landing-warm)] blur-3xl opacity-70" />
            <div className="absolute bottom-[-10rem] right-[-8rem] h-96 w-96 rounded-full bg-[var(--landing-selection-bg)] blur-3xl opacity-70" />

            <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-8 lg:grid-cols-[1fr_0.96fr]">
                <div className="rounded-[40px] border border-[var(--landing-border)] bg-[var(--landing-panel)] p-8 shadow-[var(--landing-shadow-lg)] backdrop-blur-md sm:p-10">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--landing-muted)]">Student onboarding</div>
                            <h1 className="mt-3 font-outfit text-4xl font-black tracking-tight text-[var(--landing-text)]">
                                Create your workspace
                            </h1>
                        </div>
                        <Link href="/" className="text-sm font-bold text-[var(--landing-accent)] transition-colors hover:text-[var(--landing-accent-hover)]">
                            Back to homepage
                        </Link>
                    </div>

                    <div className="mb-6 rounded-[24px] border border-[var(--landing-selection-bg)] bg-[var(--landing-selection-bg)] px-5 py-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--landing-accent)] shadow-sm">
                                <Sparkle size={20} weight="fill" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--landing-accent)]">Start lean</div>
                                <p className="mt-1 text-sm font-medium leading-relaxed text-[var(--landing-accent)]">
                                    Your free account is enough to begin mocks, revision, and chapter-level tracking before deciding on a premium plan.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={step === "phone" ? handleRequestOtp : step === "otp" ? handleVerifyOtp : handleRegister}>
                        {step === "phone" && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">Phone Number</label>
                                <div className="relative group">
                                    <DeviceMobile size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--landing-muted-light)] transition-colors group-focus-within:text-[var(--landing-accent)]" weight="bold" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(event) => setPhone(event.target.value)}
                                        placeholder="Enter your phone number"
                                        className="w-full rounded-[22px] border border-[var(--landing-border)] bg-[var(--landing-bg)] py-4 pl-14 pr-6 text-sm font-medium text-[var(--landing-text)] outline-none transition-all placeholder:text-[var(--landing-muted-light)] focus:border-[var(--landing-border-strong)] focus:bg-white focus:ring-4 focus:ring-[var(--landing-selection-bg)]"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {step === "otp" && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center justify-between">
                                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">Verification Code</label>
                                    <button type="button" onClick={() => setStep("phone")} className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--landing-accent)] hover:underline flex items-center gap-1">
                                        <ArrowLeft size={10} /> Change
                                    </button>
                                </div>
                                <div className="relative group">
                                    <ShieldCheck size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--landing-muted-light)] transition-colors group-focus-within:text-[var(--landing-accent)]" weight="bold" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(event) => setOtp(event.target.value)}
                                        placeholder="Enter OTP"
                                        className="w-full tracking-[0.5em] text-center rounded-[22px] border border-[var(--landing-border)] bg-[var(--landing-bg)] py-4 pl-14 pr-6 text-lg font-black text-[var(--landing-text)] outline-none transition-all placeholder:text-sm placeholder:tracking-normal focus:border-[var(--landing-selection-bg)] focus:bg-white focus:ring-4 focus:ring-[var(--landing-selection-bg)]"
                                        required
                                        maxLength={6}
                                    />
                                </div>
                                <p className="text-center text-[10px] font-medium text-[var(--landing-muted)]">
                                    OTP sent to <span className="font-bold text-[var(--landing-text)]">{phone}</span>
                                </p>
                            </div>
                        )}

                        {step === "details" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">Full name</label>
                                        <div className="relative group">
                                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--landing-muted-light)] transition-colors group-focus-within:text-[var(--landing-accent)]" weight="bold" />
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(event) => setFullName(event.target.value)}
                                                placeholder="Aditya S"
                                                className="w-full rounded-[18px] border border-[var(--landing-border)] bg-[var(--landing-bg)] py-3.5 pl-12 pr-4 text-sm font-medium text-[var(--landing-text)] outline-none transition-all placeholder:text-[var(--landing-muted-light)] focus:border-[var(--landing-selection-bg)] focus:bg-white focus:ring-4 focus:ring-[var(--landing-selection-bg)]"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">Email Address</label>
                                        <div className="relative group">
                                            <Envelope size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--landing-muted-light)] transition-colors group-focus-within:text-[var(--landing-accent)]" weight="bold" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                placeholder="aditya@example.com"
                                                className="w-full rounded-[18px] border border-[var(--landing-border)] bg-[var(--landing-bg)] py-3.5 pl-12 pr-4 text-sm font-medium text-[var(--landing-text)] outline-none transition-all placeholder:text-[var(--landing-muted-light)] focus:border-[var(--landing-selection-bg)] focus:bg-white focus:ring-4 focus:ring-[var(--landing-selection-bg)]"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">CA Level</label>
                                        <select
                                            value={caLevel}
                                            onChange={(e) => setCaLevel(e.target.value as any)}
                                            className="w-full rounded-[18px] border border-[var(--landing-border)] bg-[var(--landing-bg)] py-3.5 px-4 text-sm font-medium text-[var(--landing-text)] outline-none transition-all focus:border-[var(--landing-border-strong)] focus:bg-white focus:ring-4 focus:ring-[var(--landing-selection-bg)] appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="foundation">CA Foundation</option>
                                            <option value="ipc">CA Intermediate</option>
                                            <option value="final">CA Final</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">CA Attempt Due</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                value={attemptMonth}
                                                onChange={(e) => setAttemptMonth(e.target.value)}
                                                className="w-full rounded-[18px] border border-[var(--landing-border)] bg-[var(--landing-bg)] py-3.5 px-4 text-sm font-medium text-[var(--landing-text)] outline-none transition-all focus:border-[var(--landing-border-strong)] focus:bg-white focus:ring-4 focus:ring-[var(--landing-selection-bg)] appearance-none cursor-pointer"
                                                required
                                            >
                                                <option value="1">Jan</option>
                                                <option value="2">Feb</option>
                                                <option value="3">Mar</option>
                                                <option value="4">Apr</option>
                                                <option value="5">May</option>
                                                <option value="6">Jun</option>
                                                <option value="7">Jul</option>
                                                <option value="8">Aug</option>
                                                <option value="9">Sep</option>
                                                <option value="10">Oct</option>
                                                <option value="11">Nov</option>
                                                <option value="12">Dec</option>
                                            </select>
                                            <select
                                                value={attemptYear}
                                                onChange={(e) => setAttemptYear(e.target.value)}
                                                className="w-full rounded-[18px] border border-[var(--landing-border)] bg-[var(--landing-bg)] py-3.5 px-4 text-sm font-medium text-[var(--landing-text)] outline-none transition-all focus:border-[var(--landing-border-strong)] focus:bg-white focus:ring-4 focus:ring-[var(--landing-selection-bg)] appearance-none cursor-pointer"
                                                required
                                            >
                                                {[2024, 2025, 2026, 2027, 2028].map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={dob}
                                            onChange={(e) => setDob(e.target.value)}
                                            className="w-full rounded-[18px] border border-[var(--landing-border)] bg-[var(--landing-bg)] py-3.5 px-4 text-sm font-medium text-[var(--landing-text)] outline-none transition-all focus:border-[var(--landing-border-strong)] focus:bg-white focus:ring-4 focus:ring-[var(--landing-selection-bg)] cursor-pointer"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">City & State</label>
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="Mumbai, Maharashtra"
                                            className="w-full rounded-[18px] border border-[var(--landing-border)] bg-[var(--landing-bg)] py-3.5 px-4 text-sm font-medium text-[var(--landing-text)] outline-none transition-all placeholder:text-[var(--landing-muted-light)] focus:border-[var(--landing-border-strong)] focus:bg-white focus:ring-4 focus:ring-[var(--landing-selection-bg)]"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-muted)]">Create Password</label>
                                    <div className="relative group">
                                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--landing-muted-light)] transition-colors group-focus-within:text-[var(--landing-accent)]" weight="bold" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            placeholder="Choose a secure password"
                                            className="w-full rounded-[18px] border border-[var(--landing-border)] bg-[var(--landing-bg)] py-3.5 pl-12 pr-4 text-sm font-medium text-[var(--landing-text)] outline-none transition-all placeholder:text-[var(--landing-muted-light)] focus:border-[var(--landing-border-strong)] focus:bg-white focus:ring-4 focus:ring-[var(--landing-selection-bg)]"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {errorMessage ? (
                            <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                                {errorMessage}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-3 rounded-[22px] border border-[var(--landing-accent)] bg-[var(--landing-accent)] py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_16px_34px_rgba(31,92,80,0.14)] transition-all duration-300 hover:bg-[var(--landing-accent-hover)] active:scale-95 disabled:opacity-70"
                        >
                            {isSubmitting 
                                ? "Processing..." 
                                : step === "phone" 
                                    ? "Request OTP" 
                                    : step === "otp" 
                                        ? "Verify Code" 
                                        : "Complete Registration"}
                            <ArrowRight size={18} weight="bold" />
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.16em] text-[var(--landing-muted-light)]">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-[var(--landing-accent)] transition-colors hover:text-[var(--landing-accent-hover)]">
                            Sign in
                        </Link>
                    </p>

                    {/* Razorpay Compliance Footer */}
                    <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-[var(--landing-border)] pt-6 text-[9px] font-black uppercase tracking-[0.12em] text-[var(--landing-muted-light)]">
                        <Link href="/contact" className="hover:text-[var(--landing-accent)]">Contact</Link>
                        <Link href="/privacy-policy" className="hover:text-[var(--landing-accent)]">Privacy Policy</Link>
                        <Link href="/terms-and-conditions" className="hover:text-[var(--landing-accent)]">Terms & Conditions</Link>
                        <Link href="/refund-policy" className="hover:text-[var(--landing-accent)]">Refund Policy</Link>
                    </div>
                </div>

                <div className="flex flex-col justify-between rounded-[40px] border border-[var(--landing-border-dark)] bg-[var(--landing-panel-dark)] p-8 text-white shadow-[0_30px_70px_rgba(24,31,34,0.16)] sm:p-10">
                    <div className="space-y-8">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[var(--landing-warm)]">
                                <GraduationCap size={26} weight="bold" />
                            </div>
                            <div>
                                <div className="font-outfit text-2xl font-black tracking-tight text-white">Financly</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">CA Exam Workspace</div>
                            </div>
                        </Link>

                        <div className="space-y-5">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                                Free entry point
                            </div>
                            <h2 className="font-outfit text-4xl font-black leading-[0.98] tracking-[-0.05em] text-white sm:text-5xl">
                                Start with the essentials and add depth later
                            </h2>
                            <p className="max-w-xl text-base font-medium leading-relaxed text-white/70">
                                The goal is not to drown you in features on day one. Get the basic workspace right first, then layer in premium tools when they become useful.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                { value: "Mocks", label: "Ready on day one" },
                                { value: "PYQs", label: "Linked to revision" },
                                { value: "Progress", label: "Visible early" }
                            ].map((metric) => (
                                <div key={metric.label} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-5">
                                    <div className="font-outfit text-3xl font-black tracking-tight text-white">{metric.value}</div>
                                    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/60">{metric.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-10 space-y-4">
                        {SIGNUP_POINTS.map((point, index) => (
                            <div key={point} className="flex items-start gap-4 rounded-[24px] border border-white/10 bg-white/5 px-5 py-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--landing-warm)] text-[var(--landing-accent)]">
                                    <CheckCircle size={20} weight="fill" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Step {index + 1}</div>
                                    <div className="mt-1 text-sm font-medium leading-relaxed text-white/70">{point}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--landing-bg)]">
                <div className="animate-pulse text-[var(--landing-accent)] font-black uppercase tracking-widest">Loading...</div>
            </div>
        }>
            <SignupFormContent />
        </Suspense>
    );
}
