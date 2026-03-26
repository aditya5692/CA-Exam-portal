"use client";

"use client";

import { ArrowRight,CheckCircle,Sparkle } from "@phosphor-icons/react";
import Link from "next/link";

export function ActivationSuccess({ planName }: { planName: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in zoom-in-95 duration-1000">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-[var(--landing-accent)]/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="relative w-24 h-24 bg-[var(--landing-accent)] rounded-[32px] flex items-center justify-center shadow-[var(--landing-shadow-accent-strong)] transform rotate-12 hover:rotate-0 transition-transform duration-500">
                    <CheckCircle size={48} weight="bold" className="text-white" />
                </div>
                <div className="absolute -top-4 -right-4 bg-[var(--landing-accent)] rounded-2xl p-2 shadow-lg animate-bounce">
                    <Sparkle size={20} weight="fill" className="text-white" />
                </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-[var(--landing-text)] font-outfit tracking-tight mb-4">
                You&apos;re Now <span className="text-[var(--landing-accent)]">{planName}!</span>
            </h1>

            <p className="text-[var(--landing-muted)] text-lg font-medium max-w-md mx-auto leading-relaxed mb-12">
                Your premium features have been activated. Get ready to experience the next level of CA preparation.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 w-full max-w-sm">
                <Link
                    href="/student/dashboard"
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[var(--landing-accent)] text-white font-bold text-sm shadow-[var(--landing-shadow-accent)] hover:bg-[var(--landing-accent-hover)] transition-all active:scale-95 group"
                >
                    Explore Dashboard <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[var(--landing-bg)] border border-[var(--landing-border)] text-[var(--landing-muted)] font-bold text-sm hover:bg-white hover:border-[var(--landing-muted-light)] transition-all active:scale-95"
                >
                    Return Home
                </Link>
            </div>

            <div className="mt-12 pt-12 border-t border-[var(--landing-border)] w-full max-w-lg">
                <p className="text-[var(--landing-muted-light)] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">What&apos;s New?</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <span className="px-3 py-1.5 rounded-lg bg-[var(--landing-selection-bg)] text-[var(--landing-accent)] text-[10px] font-bold uppercase tracking-wider">Advanced Analytics</span>
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Topic Heatmaps</span>
                    <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider">Priority Support</span>
                </div>
            </div>
        </div>
    );
}
