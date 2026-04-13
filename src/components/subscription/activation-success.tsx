"use client";

import { CheckCircle, Sparkle, Spinner } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ActivationSuccess({ planName }: { planName: string }) {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push(`/payment/success?plan=${encodeURIComponent(planName)}`);
        }, 2000);
        return () => clearTimeout(timer);
    }, [router, planName]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 animate-in fade-in zoom-in-95 duration-1000">
            <div className="relative mb-10">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="relative w-24 h-24 bg-emerald-500 rounded-lg flex items-center justify-center shadow-2xl shadow-emerald-100 transform rotate-12 transition-transform duration-700">
                    <CheckCircle size={48} weight="bold" className="text-white" />
                </div>
                <div className="absolute -top-4 -right-4 bg-slate-900 rounded-lg p-2.5 shadow-xl animate-bounce">
                    <Sparkle size={20} weight="fill" className="text-emerald-400" />
                </div>
            </div>

            <div className="space-y-4 mb-10">
                <h2 className="text-3xl font-black text-slate-800   tracking-tight leading-tight">
                    Authorization <span className="text-emerald-500">Confirmed!</span>
                </h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Preparing your Pro Workspace...</p>
            </div>

            <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-lg border border-slate-100">
                <Spinner size={20} weight="bold" className="text-emerald-500 animate-spin" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Redirecting to Success Journey</span>
            </div>
        </div>
    );
}
