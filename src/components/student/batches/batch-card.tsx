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
        <div className="group relative student-surface flex flex-col overflow-hidden rounded-[24px] border border-[var(--student-border)] bg-white transition-all duration-300 hover:shadow-xl hover:border-[var(--student-accent-soft-strong)] hover:-translate-y-1">
            {/* Top Pattern Area */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-[var(--student-accent-soft)]/20 via-transparent to-transparent -z-10" />

            <div className="p-6 flex-1">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)] flex items-center justify-center font-black text-lg shadow-sm border border-[var(--student-accent-soft-strong)]">
                            {initials}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-[var(--student-accent-strong)] transition-colors line-clamp-1">
                                {batch.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <ChalkboardTeacher size={12} weight="bold" />
                                {batch.teacherName}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Batch Stats Mesh */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="student-panel-muted rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <Notification size={16} weight="fill" className="text-indigo-500 mb-1" />
                        <span className="text-sm font-bold text-slate-900">{batch.announcementCount}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Updates</span>
                    </div>
                    <div className="student-panel-muted rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <FileText size={16} weight="fill" className="text-emerald-500 mb-1" />
                        <span className="text-sm font-bold text-slate-900">{batch.materialCount}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Notes</span>
                    </div>
                    <div className="student-panel-muted rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <Exam size={16} weight="fill" className="text-amber-500 mb-1" />
                        <span className="text-sm font-bold text-slate-900">{batch.examCount}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Exams</span>
                    </div>
                </div>

                {/* Batch Metadata */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="opacity-60" />
                            Joined {new Date(batch.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <div className="flex items-center gap-2">
                            <LinkIcon size={14} className="opacity-60" />
                            <span className="font-mono text-[10px] uppercase tracking-wider">{batch.uniqueJoinCode}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                <Link
                    href={`/student/updates?batch=${batch.id}`}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-[var(--student-accent-strong)] hover:bg-[var(--student-accent-strong)] hover:text-white hover:border-[var(--student-accent-strong)] transition-all shadow-sm active:scale-95 group/btn"
                >
                    Enter Batch Hub
                    <ArrowRight size={14} weight="bold" className="transition-transform group-hover/btn:translate-x-1" />
                </Link>
            </div>
        </div>
    );
}
