"use client";
// Refresh: 2026-03-26-v1

import { Play, Clock, BookOpen, FileText } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ResumeCardProps = {
    progress: {
        resourceType: string;
        resourceId: string;
        data: Record<string, unknown>;
        updatedAt: Date;
    } | null;
};

export function ResumeCard({ progress }: ResumeCardProps) {
    if (!progress) return null;

    const { resourceType, resourceId, data, updatedAt } = progress;
    
    // Determine the redirect URL and label based on resource type
    let href = "/student/dashboard";
    let label = "Continue Learning";
    let sublabel = "Pick up where you left off";
    let Icon = BookOpen;

    if (resourceType === "VIDEO") {
        const d = data as { time?: number; title?: string };
        href = `/student/courses/watch/${resourceId}?t=${d.time || 0}`;
        label = "Resume Video";
        sublabel = d.title || "Continue watching";
        Icon = Play;
    } else if (resourceType === "EXAM") {
        href = `/exam/war-room?examId=${resourceId}`;
        label = "Resume Exam";
        sublabel = "Continue your attempt";
        Icon = FileText;
    } else if (resourceType === "CHAPTER") {
        const d = data as { chapterName?: string };
        href = `/student/chapters/${resourceId}`;
        label = "Resume Reading";
        sublabel = d.chapterName || "Continue reading";
        Icon = BookOpen;
    }

    return (
        <div className="group relative overflow-hidden rounded-lg border border-[var(--student-accent-soft-strong)] bg-white p-6 shadow-[0_20px_40px_rgba(31,92,80,0.08)] transition-all hover:shadow-[0_24px_48px_rgba(31,92,80,0.12)]">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-[var(--student-accent-soft)]/20 blur-3xl transition-transform group-hover:scale-110" />
            
            <div className="relative flex items-center gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)] shadow-sm">
                    <Icon size={28} weight="fill" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-accent-strong)]">Last Activity</span>
                        <span className="h-1 w-1 rounded-full bg-[var(--student-border-strong)] opacity-30" />
                        <span className="text-[10px] font-bold text-[var(--student-muted)] uppercase tracking-wider flex items-center gap-1">
                            <Clock size={12} /> {new Date(updatedAt).toLocaleDateString()}
                        </span>
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-[var(--student-text)] truncate">{label}</h3>
                    <p className="text-sm font-medium text-[var(--student-muted)] truncate opacity-80">{sublabel}</p>
                </div>

                <Link 
                    href={href}
                    className="flex h-12 items-center gap-3 rounded-lg bg-[var(--student-accent-strong)] px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg transition-all hover:bg-[var(--student-accent-stronger)] active:scale-95"
                >
                    Resume <Play size={16} weight="bold" />
                </Link>
            </div>
        </div>
    );
}
