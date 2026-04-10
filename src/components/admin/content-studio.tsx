"use client";

import { 
    toggleAdminExamFeatured, 
    toggleAdminMaterialTrending, 
    deleteAdminManagedMaterial,
    updateAdminManagedMaterial
} from "@/actions/admin-actions";
import { cn } from "@/lib/utils";
import { 
    Star, 
    Lightning, 
    Trash, 
    PencilSimple, 
    MagnifyingGlass,
    FileText,
    Exam as ExamIcon,
    CheckCircle,
    X,
    Info,
    ArrowSquareOut
} from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import type { StudyMaterial, Exam } from "@prisma/client";
import { useRouter } from "next/navigation";

interface ContentStudioProps {
    materials: (StudyMaterial & { uploadedBy: { fullName: string | null } })[];
    exams: (Exam & { teacher: { fullName: string | null } })[];
}

export function ContentStudio({ materials, exams }: ContentStudioProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState("");
    const [contentType, setContentType] = useState<"materials" | "exams">("materials");
    
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const filteredMaterials = materials.filter(m => 
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.uploadedBy.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredExams = exams.filter(e => 
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.teacher.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleFeatured = async (examId: string, current: boolean) => {
        const formData = new FormData();
        formData.append("examId", examId);
        formData.append("isFeatured", (!current).toString());
        
        startTransition(async () => {
            const res = await toggleAdminExamFeatured(formData);
            if (res.success) {
                setSuccess(current ? "Exam unfeatured" : "Exam featured");
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    const handleToggleTrending = async (materialId: string, current: boolean) => {
        const formData = new FormData();
        formData.append("materialId", materialId);
        formData.append("isTrending", (!current).toString());
        
        startTransition(async () => {
            const res = await toggleAdminMaterialTrending(formData);
            if (res.success) {
                setSuccess(current ? "Material unmarked" : "Material marked as trending");
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    return (
        <div className="student-surface overflow-hidden rounded-[40px]">
            {/* Control Bar */}
            <div className="flex flex-col border-b border-[var(--student-border)] p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10 gap-6">
                <div className="flex bg-[var(--student-panel-muted)] p-1.5 rounded-2xl border border-[var(--student-border)]">
                    <button 
                        onClick={() => setContentType("materials")}
                        className={cn(
                            "flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            contentType === "materials" ? "bg-white text-[var(--student-text)] shadow-sm" : "text-[var(--student-muted)] hover:text-[var(--student-text)]"
                        )}
                    >
                        <FileText size={18} weight="bold" /> Study Materials
                    </button>
                    <button 
                        onClick={() => setContentType("exams")}
                        className={cn(
                            "flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            contentType === "exams" ? "bg-white text-[var(--student-text)] shadow-sm" : "text-[var(--student-muted)] hover:text-[var(--student-text)]"
                        )}
                    >
                        <ExamIcon size={18} weight="bold" /> Exams & Mocks
                    </button>
                </div>

                <div className="relative">
                    <MagnifyingGlass size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--student-muted)]" weight="bold" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search content or educators..."
                        className="w-full rounded-[20px] border border-[var(--student-border)] bg-[var(--student-panel-muted)] py-4 pl-14 pr-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-text)] transition-all placeholder:text-[var(--student-muted)] focus:border-[var(--student-accent-soft-strong)] focus:bg-white sm:w-80"
                    />
                </div>
            </div>

            {/* Content List */}
            <div className="p-8 lg:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {contentType === "materials" ? (
                        filteredMaterials.map(m => (
                            <ContentCard 
                                key={m.id}
                                title={m.title}
                                author={m.uploadedBy.fullName || "Unknown"}
                                category={m.category || "General"}
                                badge={m.subType}
                                isActive={(m as any).isTrending}
                                activeLabel="Trending"
                                activeIcon={Lightning}
                                onToggle={() => handleToggleTrending(m.id, (m as any).isTrending)}
                                isPending={isPending}
                            />
                        ))
                    ) : (
                        filteredExams.map(e => (
                            <ContentCard 
                                key={e.id}
                                title={e.title}
                                author={e.teacher.fullName || "Unknown"}
                                category={e.examType || "Mock"}
                                badge={e.status}
                                isActive={(e as any).isFeatured}
                                activeLabel="Featured"
                                activeIcon={Star}
                                onToggle={() => handleToggleFeatured(e.id, (e as any).isFeatured)}
                                isPending={isPending}
                            />
                        ))
                    )}

                    {(contentType === "materials" ? filteredMaterials : filteredExams).length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <p className="text-sm font-bold text-[var(--student-muted)]">No content discovered in this sector.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Toasts */}
            {(error || success) && (
                <div className="fixed bottom-10 right-10 z-[100] flex flex-col gap-3">
                    {error && (
                        <div className="flex items-center gap-4 rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-rose-600 shadow-xl backdrop-blur-md">
                            <Info size={20} weight="fill" />
                            <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                            <button onClick={() => setError(null)}><X size={16} weight="bold" /></button>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-4 text-emerald-600 shadow-xl backdrop-blur-md">
                            <CheckCircle size={20} weight="fill" />
                            <p className="text-[10px] font-black uppercase tracking-widest">{success}</p>
                            <button onClick={() => setSuccess(null)}><X size={16} weight="bold" /></button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

interface CardProps {
    title: string;
    author: string;
    category: string;
    badge: string;
    isActive: boolean;
    activeLabel: string;
    activeIcon: any;
    onToggle: () => void;
    isPending: boolean;
}

function ContentCard({ title, author, category, badge, isActive, activeLabel, activeIcon: Icon, onToggle, isPending }: CardProps) {
    return (
        <div className={cn(
            "group relative overflow-hidden rounded-[32px] border transition-all duration-300",
            isActive 
                ? "bg-slate-900 border-slate-800 shadow-2xl scale-[1.02]" 
                : "bg-[var(--student-panel-muted)] border-[var(--student-border)] hover:bg-white hover:shadow-xl hover:-translate-y-1"
        )}>
            <div className="p-8">
                <div className="mb-4 flex items-start justify-between">
                    <span className={cn(
                        "rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest",
                        isActive ? "bg-white/10 text-white/60" : "bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)]"
                    )}>
                        {badge}
                    </span>
                    <button 
                        disabled={isPending}
                        onClick={onToggle}
                        className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                            isActive 
                                ? "bg-amber-400 text-slate-900 shadow-[0_0_15px_rgba(251,191,36,0.5)]" 
                                : "bg-white border border-slate-100 text-slate-400 hover:text-amber-500 hover:border-amber-200"
                        )}
                    >
                        <Icon size={20} weight={isActive ? "fill" : "bold"} />
                    </button>
                </div>

                <div className="space-y-1">
                    <h4 className={cn(
                        "  text-lg font-black tracking-tight line-clamp-2",
                        isActive ? "text-white" : "text-[var(--student-text)]"
                    )}>
                        {title}
                    </h4>
                    <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        isActive ? "text-white/40" : "text-[var(--student-muted)]"
                    )}>
                        By {author} · {category}
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-dashed border-slate-200 opacity-0 group-hover:opacity-100 transition-all">
                    <button className={cn(
                        "flex w-full items-center justify-center gap-2 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all",
                        isActive ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-900 text-white shadow-xl hover:scale-105"
                    )}>
                        <ArrowSquareOut size={16} weight="bold" /> View Resources
                    </button>
                </div>
            </div>

            {isActive && (
                <div className="absolute top-0 right-0 p-4">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-400">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-widest">{activeLabel}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
