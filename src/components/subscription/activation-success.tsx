"use client";

import { ArrowRight,CheckCircle,Sparkle } from "@phosphor-icons/react";
import Link from "next/link";

export function ActivationSuccess({ planName }: { planName: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in zoom-in-95 duration-1000">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="relative w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-indigo-500/40 transform rotate-12 hover:rotate-0 transition-transform duration-500">
                    <CheckCircle size={48} weight="bold" className="text-white" />
                </div>
                <div className="absolute -top-4 -right-4 bg-emerald-500 rounded-2xl p-2 shadow-lg animate-bounce">
                    <Sparkle size={20} weight="fill" className="text-white" />
                </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-outfit tracking-tight mb-4">
                You&apos;re Now <span className="text-indigo-600">{planName}!</span>
            </h1>

            <p className="text-gray-500 text-lg font-medium max-w-md mx-auto leading-relaxed mb-12">
                Your premium features have been activated. Get ready to experience the next level of CA preparation.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 w-full max-w-sm">
                <Link
                    href="/student/dashboard"
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 group"
                >
                    Explore Dashboard <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-600 font-bold text-sm hover:bg-white hover:border-gray-200 transition-all active:scale-95"
                >
                    Return Home
                </Link>
            </div>

            <div className="mt-12 pt-12 border-t border-gray-100 w-full max-w-lg">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">What&apos;s New?</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider">Advanced Analytics</span>
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Topic Heatmaps</span>
                    <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider">Priority Support</span>
                </div>
            </div>
        </div>
    );
}
