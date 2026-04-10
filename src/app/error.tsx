"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Warning, House, ArrowClockwise } from "@phosphor-icons/react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Error Structure:", error);
    }, [error]);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--landing-bg)] p-6 text-center">
            {/* Background elements */}
            <div className="absolute left-[-5rem] top-[-5rem] h-64 w-64 rounded-full bg-[var(--landing-destructive)]/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-5rem] right-[-5rem] h-64 w-64 rounded-full bg-[var(--landing-selection-bg)] blur-3xl opacity-30 pointer-events-none" />

            <div className="relative max-w-md w-full rounded-[40px] border border-[var(--landing-border)] bg-[var(--landing-panel)] p-10 shadow-[var(--landing-shadow-lg)] backdrop-blur-md">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--landing-destructive-bg)] text-[var(--landing-destructive)]">
                    <Warning size={32} weight="bold" />
                </div>

                <h1 className="  text-3xl font-black tracking-tight text-[var(--landing-text)]">
                    Something went wrong
                </h1>
                
                <p className="mt-4 text-sm font-medium leading-relaxed text-[var(--landing-muted)]">
                    We encountered an unexpected error while preparing your workspace. 
                    {error.digest && (
                        <span className="block mt-2 font-mono text-[10px] opacity-70">
                            Error ID: {error.digest}
                        </span>
                    )}
                </p>

                <div className="mt-8 flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--landing-accent)] bg-[var(--landing-accent)] py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[var(--landing-shadow-accent)] transition-all hover:bg-[var(--landing-accent-hover)] active:scale-95"
                    >
                        <ArrowClockwise size={16} weight="bold" />
                        Try again
                    </button>
                    
                    <Link
                        href="/"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg)] py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--landing-text)] transition-all hover:bg-[var(--landing-panel)] active:scale-95"
                    >
                        <House size={16} weight="bold" />
                        Back to Home
                    </Link>
                </div>
            </div>

            <div className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--landing-muted-light)]">
                Financly Support
            </div>
        </div>
    );
}
