"use client";

import { CheckCircle, ArrowRight, Rocket, Confetti, Star } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const planName = searchParams.get("plan") || "Pass PRO";
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/30 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/30 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="max-w-2xl w-full relative">
                {/* Main Card */}
                <div className="bg-white rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] p-12 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    
                    {/* Icon Container */}
                    <div className="relative mb-10 inline-block">
                        <div className="w-24 h-24 rounded-[32px] bg-emerald-500 text-white flex items-center justify-center shadow-[0_20px_40px_-5px_rgba(16,185,129,0.3)] animate-in zoom-in duration-700 delay-200">
                            <CheckCircle size={48} weight="bold" />
                        </div>
                        <div className="absolute -top-4 -right-4 w-10 h-10 rounded-xl bg-white shadow-lg flex items-center justify-center text-emerald-500 animate-bounce delay-500">
                            <Star size={20} weight="fill" />
                        </div>
                    </div>

                    <div className="relative space-y-4 mb-12">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 font-outfit tracking-tighter">
                            Payment <span className="text-emerald-500">Authorized</span>!
                        </h1>
                        <p className="text-lg text-slate-500 font-medium max-w-md mx-auto">
                            Welcome to <span className="font-bold text-slate-900">{planName}</span>. Your portal governance profile has been successfully upgraded.
                        </p>
                    </div>

                    {/* Features Brief */}
                    <div className="relative grid md:grid-cols-3 gap-6 mb-12">
                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 group/item hover:border-emerald-200 transition-all duration-300">
                            <Rocket size={24} weight="bold" className="text-emerald-500 mb-3 mx-auto group-hover/item:scale-110 transition-transform" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Instant Activation</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 group/item hover:border-emerald-200 transition-all duration-300">
                            <CheckCircle size={24} weight="bold" className="text-emerald-500 mb-3 mx-auto group-hover/item:scale-110 transition-transform" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Premium Tools</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 group/item hover:border-emerald-200 transition-all duration-300">
                            <Star size={24} weight="bold" className="text-emerald-500 mb-3 mx-auto group-hover/item:scale-110 transition-transform" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority Support</p>
                        </div>
                    </div>

                    {/* Primary CTA */}
                    <div className="relative flex flex-col sm:flex-row items-center gap-4 justify-center">
                        <Link 
                            href="/student/dashboard"
                            className="w-full sm:w-auto px-10 py-5 rounded-[24px] bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-slate-800 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group active:scale-95"
                        >
                            Enter Dashboard
                            <ArrowRight size={20} weight="bold" className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                        <Link 
                            href="/student/war-room"
                            className="w-full sm:w-auto px-10 py-5 rounded-[24px] bg-white text-slate-600 border border-slate-200 font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Explore War Room
                        </Link>
                    </div>
                </div>

                {/* Footer Security Note */}
                <div className="mt-10 text-center space-y-2 opacity-50">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Transaction Secured by Razorpay</p>
                    <p className="text-[10px] font-bold text-slate-400">Reference: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                </div>
            </div>
        </div>
    );
}
