"use client";

import { toggleAdminExamFeatured, toggleAdminMaterialTrending, deleteAdminAnnouncement, createAdminAnnouncement } from "@/actions/admin-actions";
import { cn } from "@/lib/utils";
import { 
    CheckCircle, 
    Info, 
    Megaphone, 
    Monitor, 
    Notebook, 
    Sparkle, 
    Star, 
    Trash, 
    X,
    Plus,
    Clock
} from "@phosphor-icons/react";
import type { Exam, StudyMaterial } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface StudentSectionsManagerProps {
    exams: Exam[];
    materials: StudyMaterial[];
    announcements: any[];
}

export function StudentSectionsManager({ exams, materials, announcements }: StudentSectionsManagerProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<"exams" | "resources" | "announcements">("exams");
    
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showAnnounceModal, setShowAnnounceModal] = useState(false);

    const handleToggleExam = async (examId: string, isFeatured: boolean) => {
        const formData = new FormData();
        formData.append("examId", examId);
        formData.append("isFeatured", isFeatured.toString());
        
        startTransition(async () => {
            const res = await toggleAdminExamFeatured(formData);
            if (res.success) {
                setSuccess(isFeatured ? "Exam spotlighted" : "Exam removed from spotlight");
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    const handleToggleMaterial = async (materialId: string, isTrending: boolean) => {
        const formData = new FormData();
        formData.append("materialId", materialId);
        formData.append("isTrending", isTrending.toString());
        
        startTransition(async () => {
            const res = await toggleAdminMaterialTrending(formData);
            if (res.success) {
                setSuccess(isTrending ? "Marked as trending" : "Removed from trending");
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    const handleDeleteAnnouncement = async (id: string) => {
        const formData = new FormData();
        formData.append("announcementId", id);
        
        startTransition(async () => {
            const res = await deleteAdminAnnouncement(formData);
            if (res.success) {
                setSuccess("Announcement deleted");
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex gap-2 p-1.5 student-surface-dark inline-flex rounded-2xl">
                {[
                    { id: "exams", label: "Featured Exams", icon: Monitor },
                    { id: "resources", label: "Free Resources", icon: Notebook },
                    { id: "announcements", label: "Announcements", icon: Megaphone },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2.5 rounded-xl px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === tab.id 
                                ? "bg-white text-[var(--student-ink)] shadow-lg" 
                                : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <tab.icon size={18} weight="bold" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="student-surface min-h-[500px] overflow-hidden rounded-[40px]">
                {activeTab === "exams" && (
                    <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-outfit text-xl font-black tracking-tight text-[var(--student-text)]">Published Exams</h3>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                {exams.filter(e => (e as any).isFeatured).length} Spotlighted
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {exams.length === 0 ? (
                                <div className="col-span-full py-20 text-center text-sm font-medium text-[var(--student-muted)]">No published exams found.</div>
                            ) : (
                                exams.map(exam => (
                                    <div key={exam.id} className="group relative flex flex-col justify-between rounded-3xl border border-[var(--student-border)] bg-[var(--student-panel-muted)]/40 p-6 transition-all hover:border-[var(--student-accent-soft-strong)] hover:bg-white">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="rounded-xl bg-white p-3 shadow-sm group-hover:bg-[var(--student-accent-soft)] transition-colors">
                                                <Monitor size={20} className="text-[var(--student-accent-strong)]" weight="bold" />
                                            </div>
                                            <button 
                                                onClick={() => handleToggleExam(exam.id, !(exam as any).isFeatured)}
                                                disabled={isPending}
                                                className={cn(
                                                    "rounded-full p-2.5 transition-all shadow-sm",
                                                    (exam as any).isFeatured 
                                                        ? "bg-amber-100 text-amber-500 scale-110" 
                                                        : "bg-white text-[var(--student-muted)] opacity-40 hover:opacity-100"
                                                )}
                                            >
                                                <Star size={20} weight={ (exam as any).isFeatured ? "fill" : "bold"} />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-outfit text-lg font-black tracking-tight text-[var(--student-text)]">{exam.title}</h4>
                                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">
                                                <span>{exam.subject}</span>
                                                <span className="h-1 w-1 rounded-full bg-[var(--student-border-strong)]" />
                                                <span>{exam.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "resources" && (
                    <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-outfit text-xl font-black tracking-tight text-[var(--student-text)]">Public Resources</h3>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                {materials.filter(m => (m as any).isTrending).length} Trending
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {materials.length === 0 ? (
                                <div className="col-span-full py-20 text-center text-sm font-medium text-[var(--student-muted)]">No public resources found.</div>
                            ) : (
                                materials.map(mat => (
                                    <div key={mat.id} className="group relative flex flex-col justify-between rounded-3xl border border-[var(--student-border)] bg-[var(--student-panel-muted)]/40 p-6 transition-all hover:border-[var(--student-accent-soft-strong)] hover:bg-white">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="rounded-xl bg-white p-3 shadow-sm group-hover:bg-emerald-50 transition-colors">
                                                <Notebook size={20} className="text-emerald-500" weight="bold" />
                                            </div>
                                            <button 
                                                onClick={() => handleToggleMaterial(mat.id, !(mat as any).isTrending)}
                                                disabled={isPending}
                                                className={cn(
                                                    "rounded-full p-2.5 transition-all shadow-sm",
                                                    (mat as any).isTrending 
                                                        ? "bg-emerald-100 text-emerald-500 scale-110" 
                                                        : "bg-white text-[var(--student-muted)] opacity-40 hover:opacity-100"
                                                )}
                                            >
                                                <Sparkle size={20} weight={ (mat as any).isTrending ? "fill" : "bold"} />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-outfit text-lg font-black tracking-tight text-[var(--student-text)]">{mat.title}</h4>
                                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">
                                                <span>{mat.subType}</span>
                                                <span className="h-1 w-1 rounded-full bg-[var(--student-border-strong)]" />
                                                <span>{mat.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "announcements" && (
                    <div className="p-8 space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-outfit text-xl font-black tracking-tight text-[var(--student-text)]">Active Announcements</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {announcements.length === 0 ? (
                                <div className="py-20 text-center text-sm font-medium text-[var(--student-muted)]">No active announcements.</div>
                            ) : (
                                announcements.map(announce => (
                                    <div key={announce.id} className="group relative flex items-center justify-between rounded-3xl border border-[var(--student-border)] bg-[var(--student-panel-muted)]/20 p-6 transition-all hover:border-[var(--student-border-strong)] hover:bg-[var(--student-panel-muted)]/40">
                                        <div className="flex items-center gap-6">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-sm">
                                                <Megaphone size={24} weight="bold" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)] mb-1">
                                                    <span className="text-indigo-600">{announce.teacherName}</span>
                                                    <span>/</span>
                                                    <span>{announce.batchName}</span>
                                                    <span>/</span>
                                                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(announce.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="font-sans text-sm font-bold text-[var(--student-text)]">{announce.content}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteAnnouncement(announce.id)}
                                            className="rounded-xl p-3 text-rose-500 opacity-0 transition-all hover:bg-rose-50 group-hover:opacity-100"
                                        >
                                            <Trash size={20} weight="bold" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Toasts */}
            {(error || success) && (
                <div className="fixed bottom-10 right-10 z-[100] flex animate-in slide-in-from-right-full flex-col gap-3">
                    {error && (
                        <div className="flex items-center gap-4 rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-rose-600 shadow-lg">
                            <Info size={20} weight="fill" />
                            <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
                            <button onClick={() => setError(null)}><X size={16} weight="bold" /></button>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-4 text-emerald-600 shadow-lg">
                            <CheckCircle size={20} weight="fill" />
                            <p className="text-xs font-bold uppercase tracking-wider">{success}</p>
                            <button onClick={() => setSuccess(null)}><X size={16} weight="bold" /></button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
