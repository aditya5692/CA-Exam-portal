"use client";

import { StudentBatchDetail } from "@/actions/batch-actions";
import { cn } from "@/lib/utils";
import {
    Calendar,
    ChalkboardTeacher,
    Link as LinkIcon,
    ArrowRight,
    Notification,
    FileText,
    Exam
} from "@phosphor-icons/react";
import Link from "next/link";

interface BatchCardProps {
    batch: StudentBatchDetail;
}

export function BatchCard({ batch }: BatchCardProps) {
    const initials = batch.teacherName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="group relative student-surface flex flex-col overflow-hidden rounded-xl border border-[var(--student-border)] bg-white transition-all duration-500 hover:shadow-2xl hover:border-[var(--student-accent-soft-strong)] hover:-translate-y-2">
            {/* Top Pattern Area with Animated Gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-[var(--student-accent-soft)] via-transparent to-transparent opacity-40 -z-10 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[var(--student-accent-soft)]/30 blur-3xl group-hover:bg-[var(--student-accent-soft)]/50 transition-all duration-500" />

            <div className="p-7 flex-1 flex flex-col">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white text-[var(--student-accent-strong)] flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/5 border border-slate-100 group-hover:bg-[var(--student-accent-strong)] group-hover:text-white group-hover:rotate-3 transition-all duration-500 ring-4 ring-transparent group-hover:ring-indigo-50">
                            {initials}
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-[var(--student-accent-strong)] transition-colors line-clamp-1 tracking-tight">
                                {batch.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-slate-500 transition-colors">
                                <ChalkboardTeacher size={14} weight="bold" className="text-indigo-500/70" />
                                {batch.teacherName}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Batch Stats Mesh with Vibrancy */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="relative group/stat student-panel-muted rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all hover:bg-white hover:shadow-md hover:scale-105">
                        <Notification size={18} weight="fill" className="text-indigo-500 mb-1.5 transition-transform group-hover/stat:rotate-12" />
                        <span className="text-base font-black text-slate-900 tracking-tight">{batch.announcementCount}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Updates</span>
                    </div>
                    <div className="relative group/stat student-panel-muted rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all hover:bg-white hover:shadow-md hover:scale-105">
                        <FileText size={18} weight="fill" className="text-emerald-500 mb-1.5 transition-transform group-hover/stat:rotate-12" />
                        <span className="text-base font-black text-slate-900 tracking-tight">{batch.materialCount}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Notes</span>
                    </div>
                    <div className="relative group/stat student-panel-muted rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all hover:bg-white hover:shadow-md hover:scale-105">
                        <Exam size={18} weight="fill" className="text-amber-500 mb-1.5 transition-transform group-hover/stat:rotate-12" />
                        <span className="text-base font-black text-slate-900 tracking-tight">{batch.examCount}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Exams</span>
                    </div>
                </div>

                {/* Batch Metadata Footer */}
                <div className="mt-auto space-y-4 pt-4 border-t border-slate-100/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500">
                            <Calendar size={16} className="text-slate-400" />
                            Joined {new Date(batch.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="badge-pill bg-slate-50 border-slate-200 text-slate-400 font-mono">
                            {batch.uniqueJoinCode}
                        </div>
                    </div>

                    <Link
                        href={`/student/updates?batch=${batch.id}`}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[var(--student-accent-strong)] text-[11px] font-black uppercase tracking-[0.15em] text-white transition-all shadow-xl shadow-indigo-600/20 active:scale-95 hover:brightness-110 group/btn overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                        Enter Batch Hub
                        <ArrowRight size={16} weight="bold" className="transition-transform group-hover/btn:translate-x-1.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
