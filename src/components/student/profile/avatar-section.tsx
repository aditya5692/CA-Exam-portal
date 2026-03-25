"use client";

import { Download,Edit3 } from "lucide-react";

interface ProfileHeaderProps {
    fullName: string;
    registrationNumber: string | null;
    status: string;
    onEdit: () => void;
    onResumeDownload: () => void;
    isResumeDownloadAvailable: boolean;
}

export function ProfileHeader({ 
    fullName, 
    registrationNumber, 
    status, 
    onEdit, 
    onResumeDownload,
    isResumeDownloadAvailable,
}: ProfileHeaderProps) {
    return (
        <div className="student-surface rounded-[32px] px-6 py-7 md:px-8 md:py-8 font-outfit">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-center gap-6 text-center md:text-left">
                <div className="relative w-28 h-28 rounded-[28px] overflow-hidden border border-[var(--student-border)] bg-[var(--student-panel-solid)] shadow-[0_18px_40px_rgba(55,48,38,0.08)]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(242,227,192,0.52),transparent_46%),radial-gradient(circle_at_75%_70%,rgba(220,235,230,0.78),transparent_48%)]" />
                    <div className="relative z-10 flex h-full w-full items-center justify-center text-[var(--student-accent-strong)]">
                         <span className="text-4xl font-black">{fullName.charAt(0)}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--student-border)] bg-[var(--student-panel-solid)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--student-accent)]" />
                        Student Profile
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-[var(--student-text)]">{fullName}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <span className="student-chip-accent rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                            {status}
                        </span>
                        {registrationNumber && (
                            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--student-muted)]">
                                <div className="h-1.5 w-1.5 rounded-full bg-[var(--student-support)]" />
                                {registrationNumber}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                <button 
                    onClick={onEdit}
                    className="student-button-secondary flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                </button>
                <button 
                    onClick={onResumeDownload}
                    disabled={!isResumeDownloadAvailable}
                    className="student-button-primary flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Download className="w-4 h-4" />
                    {isResumeDownloadAvailable ? "Download Resume" : "Resume Unavailable"}
                </button>
            </div>
        </div>
        </div>
    );
}
