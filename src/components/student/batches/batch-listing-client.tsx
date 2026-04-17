"use client";

import React, { useState, useEffect, useCallback } from "react";
import { StudentBatchDetail, getStudentBatches } from "@/actions/batch-actions";
import { BatchCard } from "./batch-card";
import { Users, Plus, ArrowsClockwise, GraduationCap, IdentificationBadge } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BatchListingClientProps {
    initialBatches: StudentBatchDetail[];
}

export function BatchListingClient({ initialBatches }: BatchListingClientProps) {
    const [batches, setBatches] = useState<StudentBatchDetail[]>(initialBatches);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setLastUpdated(new Date());
    }, []);

    const refreshBatches = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const res = await getStudentBatches();
            if (res.success && res.data) {
                setBatches(res.data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error("Failed to refresh batches:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Heartbeat: Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refreshBatches();
        }, 60000);
        return () => clearInterval(interval);
    }, [refreshBatches]);

    const educatorCount = new Set(batches.map(b => b.teacherId)).size;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="group student-surface rounded-xl p-6 border-l-4 border-l-indigo-600 flex items-center gap-5 transition-all hover:shadow-lg hover:border-indigo-600/30">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-transform group-hover:scale-110">
                        <Users size={24} weight="fill" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">{batches.length}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Active Enrollments</div>
                    </div>
                </div>

                <div className="group student-surface rounded-xl p-6 border-l-4 border-l-emerald-600 flex items-center gap-5 transition-all hover:shadow-lg hover:border-emerald-600/30">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
                        <GraduationCap size={24} weight="fill" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">{educatorCount}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Educators</div>
                    </div>
                </div>

                <div className="group student-surface rounded-xl p-6 border-l-4 border-l-amber-600 flex items-center gap-5 transition-all hover:shadow-lg hover:border-amber-600/30">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center transition-transform group-hover:scale-110">
                        <IdentificationBadge size={24} weight="fill" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry Status</div>
                        <div className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Verified Profiling
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Indicator & Manual Refresh */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-emerald shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <div className="absolute w-4 h-4 rounded-full border border-emerald-500/20 animate-ping opacity-20" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/80">Live Connection</span>
                        <span className="text-[9px] font-bold text-slate-400">
                            Last synced: {mounted && lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--:--:--"}
                        </span>
                    </div>
                </div>

                <button 
                    onClick={refreshBatches}
                    disabled={isRefreshing}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-[9px] font-black uppercase tracking-widest text-slate-500 hover:border-indigo-600/30 hover:text-indigo-600 transition-all shadow-sm active:scale-95",
                        isRefreshing && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <ArrowsClockwise size={12} weight="bold" className={cn(isRefreshing && "animate-spin")} />
                    {isRefreshing ? "Syncing..." : "Refresh Now"}
                </button>
            </div>

            {/* Batch Grid or Empty State */}
            {batches.length === 0 ? (
                <div className="student-surface rounded-xl p-20 text-center border-dashed border-2 border-[var(--student-border)] bg-slate-50/30 backdrop-blur-sm">
                    <div className="w-20 h-20 rounded-2xl bg-white text-slate-300 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <Users size={40} weight="thin" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No active enrollments found</h3>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8 text-sm leading-relaxed">
                        Attach your profile to an instructional segment using the access payload provided by your educator.
                    </p>
                    <Link
                        href="/student/redeem"
                        className="student-button-primary inline-flex items-center gap-2 rounded-lg px-8 py-4 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
                    >
                        <Plus size={18} weight="bold" />
                        Enter Access Payload
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {batches.map((batch, index) => (
                        <div 
                            key={batch.id} 
                            style={{ animationDelay: `${index * 100}ms` }}
                            className="animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both"
                        >
                            <BatchCard batch={batch} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
