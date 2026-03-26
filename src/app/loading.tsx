"use client";

import React from "react";

export default function GlobalLoading() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--landing-bg)] p-6">
            <div className="relative">
                {/* Outer ring */}
                <div className="h-16 w-16 rounded-full border-t-2 border-r-2 border-[var(--landing-accent)] animate-spin" />
                
                {/* Inner ring (reverse spin) */}
                <div className="absolute inset-1 rounded-full border-b-2 border-l-2 border-[var(--landing-accent)]/30 animate-[spin_1.5s_linear_infinite_reverse]" />
                
                {/* Center dot */}
                <div className="absolute inset-[40%] rounded-full bg-[var(--landing-accent)] animate-pulse" />
            </div>
            
            <div className="mt-8 flex flex-col items-center">
                <div className="font-outfit text-sm font-black uppercase tracking-[0.3em] text-[var(--landing-text)] animate-pulse">
                    Financly
                </div>
                <div className="mt-2 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--landing-muted)]">
                    Initializing workspace...
                </div>
            </div>
            
            {/* Subtle background ornamentation like the landing page */}
            <div className="absolute left-[-5rem] top-[-5rem] h-64 w-64 rounded-full bg-[var(--landing-warm)] blur-3xl opacity-30 pointer-events-none" />
            <div className="absolute bottom-[-5rem] right-[-5rem] h-64 w-64 rounded-full bg-[var(--landing-selection-bg)] blur-3xl opacity-30 pointer-events-none" />
        </div>
    );
}
