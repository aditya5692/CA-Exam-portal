"use client";

import Link from "next/link";
import { GraduationCap, ArrowRight, Envelope, Lock, User, Sparkle, CheckCircle } from "@phosphor-icons/react";

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col md:flex-row p-6 sm:p-12 gap-12 items-center justify-center relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

            {/* Left side: Value Prop */}
            <div className="hidden lg:flex flex-col max-w-lg space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                        <GraduationCap size={28} weight="bold" className="text-white" />
                    </div>
                    <span className="text-3xl font-bold text-gray-900 tracking-tight font-outfit">Financly</span>
                </Link>

                <div className="space-y-8">
                    <h2 className="text-5xl font-bold text-gray-900 font-outfit leading-tight">Join the next generation of <span className="text-indigo-600">toppers.</span></h2>
                    <div className="space-y-6">
                        {[
                            "Access to 18,000+ Mock Tests",
                            "NISM &amp; ACCA Standard Simulations",
                            "AI-Powered Subject Mastery Analytics",
                            "Unlimited Reattempts for Pass Pro users"
                        ].map((text, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                    <CheckCircle size={20} weight="bold" />
                                </div>
                                <p className="text-lg font-medium text-gray-600">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-xl shadow-gray-200/20 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                        <Sparkle size={32} weight="fill" className="text-indigo-600 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Start with a Free Mock Test</p>
                        <p className="text-xs text-gray-400 font-medium mt-1">No credit card required to begin your journey.</p>
                    </div>
                </div>
            </div>

            {/* Right side: Signup Card */}
            <div className="w-full max-w-md bg-white rounded-[40px] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-10 relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 font-outfit mb-2">Create Account</h1>
                    <p className="text-gray-400 font-medium uppercase tracking-widest text-[10px]">Start your 7-day free trial</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Full Name</label>
                        <div className="relative group">
                            <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Aditya S."
                                className="w-full bg-gray-50 border border-transparent rounded-[20px] py-4 pl-12 pr-4 text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Email Address</label>
                        <div className="relative group">
                            <Envelope size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="email"
                                placeholder="name@example.com"
                                className="w-full bg-gray-50 border border-transparent rounded-[20px] py-4 pl-12 pr-4 text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Password</label>
                        <div className="relative group">
                            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="password"
                                placeholder="Create a strong password"
                                className="w-full bg-gray-50 border border-transparent rounded-[20px] py-4 pl-12 pr-4 text-sm focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                        <input type="checkbox" id="terms" className="w-4 h-4 rounded-md border-gray-200 text-indigo-600 focus:ring-indigo-500" />
                        <label htmlFor="terms" className="text-xs text-gray-500 font-medium">I agree to the <Link href="#" className="text-indigo-600 font-bold border-b border-indigo-100">Terms &amp; Privacy Policy</Link></label>
                    </div>

                    <Link
                        href="/student/dashboard"
                        className="w-full py-5 rounded-[24px] bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-3 active:scale-95 translate-y-2"
                    >
                        Create My Account <ArrowRight size={18} weight="bold" />
                    </Link>
                </div>

                <p className="mt-10 text-center text-sm font-medium text-gray-500">
                    Already have an account? <Link href="/auth/login" className="text-indigo-600 font-bold hover:underline">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
