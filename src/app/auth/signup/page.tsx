"use client";

import { register } from "@/actions/auth-actions";
import { ArrowRight, CheckCircle, Envelope, GraduationCap, Lock, Sparkle, User } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SIGNUP_POINTS = [
    "Start with full-length mock access and a cleaner exam rhythm.",
    "Keep revision material, PYQs, and progress in one place.",
    "Upgrade only when you need deeper analytics or more libraries."
];

export default function SignupPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");

        const result = await register({
            fullName,
            email,
            password,
            role: "STUDENT",
            department: "GENERAL"
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
        <div className="min-h-screen overflow-hidden bg-[#f5efe5] px-6 py-8 text-[#1f2b2f] sm:px-10 sm:py-10">
            <div className="absolute left-[-10rem] top-[-8rem] h-80 w-80 rounded-full bg-[#f2e3c0] blur-3xl opacity-70" />
            <div className="absolute bottom-[-10rem] right-[-8rem] h-96 w-96 rounded-full bg-[#dcebe6] blur-3xl opacity-70" />

            <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-8 lg:grid-cols-[1fr_0.96fr]">
                <div className="rounded-[40px] border border-[#e6dccd] bg-[rgba(255,253,249,0.94)] p-8 shadow-[0_28px_60px_rgba(55,48,38,0.08)] backdrop-blur-md sm:p-10">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#667370]">Student onboarding</div>
                            <h1 className="mt-3 font-outfit text-4xl font-black tracking-tight text-[#1f2b2f]">
                                Create your workspace
                            </h1>
                        </div>
                        <Link href="/" className="text-sm font-bold text-[#1f5c50] transition-colors hover:text-[#18493f]">
                            Back to homepage
                        </Link>
                    </div>

                    <div className="mb-6 rounded-[24px] border border-[#c5ddd5] bg-[#dcebe6] px-5 py-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#1f5c50] shadow-sm">
                                <Sparkle size={20} weight="fill" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1f5c50]">Start lean</div>
                                <p className="mt-1 text-sm font-medium leading-relaxed text-[#1f5c50]">
                                    Your free account is enough to begin mocks, revision, and chapter-level tracking before deciding on a premium plan.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-3">
                            <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#667370]">Full name</label>
                            <div className="relative group">
                                <User size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8b9693] transition-colors group-focus-within:text-[#1f5c50]" weight="bold" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(event) => setFullName(event.target.value)}
                                    placeholder="Aditya S"
                                    className="w-full rounded-[22px] border border-[#e6dccd] bg-[#f4ede2] py-4 pl-14 pr-6 text-sm font-medium text-[#1f2b2f] outline-none transition-all placeholder:text-[#8b9693] focus:border-[#c5ddd5] focus:bg-white focus:ring-4 focus:ring-[#dcebe6]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#667370]">Email</label>
                            <div className="relative group">
                                <Envelope size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8b9693] transition-colors group-focus-within:text-[#1f5c50]" weight="bold" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full rounded-[22px] border border-[#e6dccd] bg-[#f4ede2] py-4 pl-14 pr-6 text-sm font-medium text-[#1f2b2f] outline-none transition-all placeholder:text-[#8b9693] focus:border-[#c5ddd5] focus:bg-white focus:ring-4 focus:ring-[#dcebe6]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#667370]">Password</label>
                            <div className="relative group">
                                <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8b9693] transition-colors group-focus-within:text-[#1f5c50]" weight="bold" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Create a secure password"
                                    className="w-full rounded-[22px] border border-[#e6dccd] bg-[#f4ede2] py-4 pl-14 pr-6 text-sm font-medium text-[#1f2b2f] outline-none transition-all placeholder:text-[#8b9693] focus:border-[#c5ddd5] focus:bg-white focus:ring-4 focus:ring-[#dcebe6]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-[22px] border border-[#e6dccd] bg-[#fcfaf6] px-4 py-3">
                            <input type="checkbox" id="terms" className="mt-0.5 h-4 w-4 rounded border-[#d7c5a9] text-[#1f5c50] focus:ring-[#dcebe6]" required />
                            <label htmlFor="terms" className="text-sm font-medium leading-relaxed text-[#4f5b58]">
                                I agree to the{" "}
                                <Link href="#" className="font-bold text-[#1f5c50] hover:underline">
                                    Terms and Privacy Policy
                                </Link>
                            </label>
                        </div>

                        {errorMessage ? (
                            <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                                {errorMessage}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-3 rounded-[22px] border border-[#1f5c50] bg-[#1f5c50] py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_16px_34px_rgba(31,92,80,0.14)] transition-all duration-300 hover:bg-[#18493f] active:scale-95 disabled:opacity-70"
                        >
                            {isSubmitting ? "Creating account..." : "Create my account"}
                            <ArrowRight size={18} weight="bold" />
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.16em] text-[#8b9693]">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-[#1f5c50] transition-colors hover:text-[#18493f]">
                            Sign in
                        </Link>
                    </p>
                </div>

                <div className="flex flex-col justify-between rounded-[40px] border border-[#314148] bg-[#223036] p-8 text-[#fff8f0] shadow-[0_30px_70px_rgba(24,31,34,0.16)] sm:p-10">
                    <div className="space-y-8">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[#f2e3c0]">
                                <GraduationCap size={26} weight="bold" />
                            </div>
                            <div>
                                <div className="font-outfit text-2xl font-black tracking-tight text-white">Financly</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d9e8e3]">CA Exam Workspace</div>
                            </div>
                        </Link>

                        <div className="space-y-5">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#d9e8e3]">
                                Free entry point
                            </div>
                            <h2 className="font-outfit text-4xl font-black leading-[0.98] tracking-[-0.05em] text-white sm:text-5xl">
                                Start with the essentials and add depth later
                            </h2>
                            <p className="max-w-xl text-base font-medium leading-relaxed text-[#d0d9d6]">
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
                                    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#d9e8e3]">{metric.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-10 space-y-4">
                        {SIGNUP_POINTS.map((point, index) => (
                            <div key={point} className="flex items-start gap-4 rounded-[24px] border border-white/10 bg-white/5 px-5 py-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2e3c0] text-[#b7791f]">
                                    <CheckCircle size={20} weight="fill" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d9e8e3]">Step {index + 1}</div>
                                    <div className="mt-1 text-sm font-medium leading-relaxed text-[#d0d9d6]">{point}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
