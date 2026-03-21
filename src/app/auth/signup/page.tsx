"use client";

import { register } from "@/actions/auth-actions";
import { ArrowRight,CheckCircle,Envelope,GraduationCap,Lock,Sparkle,User } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
        <div className="min-h-screen bg-[#fafafa] flex flex-col md:flex-row p-6 sm:p-12 gap-12 items-center justify-center relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

            {/* Left side: Value Prop */}
            <div className="hidden lg:flex flex-col max-w-lg space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="w-14 h-14 rounded-[18px] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/30 group-hover:scale-105 transition-all">
                        <GraduationCap size={32} weight="bold" className="text-white" />
                    </div>
                    <span className="text-3xl font-bold text-slate-900 tracking-tight font-outfit uppercase tracking-[0.05em]">Financly</span>
                </Link>

                <div className="space-y-10">
                    <h2 className="text-5xl md:text-6xl font-bold text-slate-900 font-outfit leading-[1.1] tracking-tighter">Join the next generation of <span className="text-indigo-600">toppers.</span></h2>
                    <div className="space-y-6">
                        {[
                            "Access to 18,000+ Mock Tests",
                            "NISM & ACCA Standard Simulations",
                            "AI-Powered Subject Mastery Analytics",
                            "Unlimited Reattempts for Pass Pro users"
                        ].map((text, i) => (
                            <div key={i} className="flex items-center gap-5 group">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm border border-emerald-100">
                                    <CheckCircle size={22} weight="bold" />
                                </div>
                                <p className="text-lg font-medium text-slate-600 font-sans tracking-tight">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[20px] bg-indigo-50 flex items-center justify-center border border-indigo-100">
                        <Sparkle size={32} weight="fill" className="text-indigo-600 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-base font-bold text-slate-900 font-outfit">Start with a Free Mock Test</p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">No credit card required</p>
                    </div>
                </div>
            </div>

            {/* Right side: Signup Card */}
            <div className="w-full max-w-md bg-white rounded-[40px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-12 relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-slate-900 font-outfit mb-3 tracking-tight">Create Account</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Start your 7-day free trial</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-4">Full Identity</label>
                        <div className="relative group">
                            <User size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" weight="bold" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Aditya S."
                                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4.5 pl-14 pr-6 text-sm font-medium focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none font-sans"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-4">Communication</label>
                        <div className="relative group">
                            <Envelope size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" weight="bold" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4.5 pl-14 pr-6 text-sm font-medium focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none font-sans"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-4">Security Access</label>
                        <div className="relative group">
                            <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" weight="bold" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-4.5 pl-14 pr-6 text-sm font-medium focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none font-sans"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                        <input type="checkbox" id="terms" className="w-4 h-4 rounded-md border-gray-200 text-indigo-600 focus:ring-indigo-500" required />
                        <label htmlFor="terms" className="text-xs text-gray-500 font-medium">I agree to the <Link href="#" className="text-indigo-600 font-bold border-b border-indigo-100">Terms & Privacy Policy</Link></label>
                    </div>

                    {errorMessage && (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                            {errorMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 rounded-[20px] bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-slate-900 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 mt-8 disabled:opacity-70"
                    >
                        {isSubmitting ? "Creating Account..." : "Create My Account"} <ArrowRight size={18} weight="bold" />
                    </button>
                </form>

                <p className="mt-12 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Already have an account? <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 transition-colors">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
