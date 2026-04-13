"use client";

import { 
    toggleAdminExamFeatured, 
    toggleAdminMaterialTrending, 
    deleteAdminManagedMaterial,
    updateAdminManagedMaterial,
    deleteAdminManagedExam,
    updateAdminManagedExam,
    getAdminExamDetails,
    adminUpdateVaultQuestion,
    adminDeleteVaultQuestion
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
    
    const [editingExam, setEditingExam] = useState<any>(null);
    const [editingMaterial, setEditingMaterial] = useState<any>(null);
    const [examQuestions, setExamQuestions] = useState<any[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

    const handleUpdateExam = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const res = await updateAdminManagedExam(formData);
            if (res.success) {
                setSuccess("Exam metadata synchronized");
                setEditingExam(null);
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    const handleUpdateMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const res = await updateAdminManagedMaterial(formData);
            if (res.success) {
                setSuccess("Material policies updated");
                setEditingMaterial(null);
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    const handleDeleteContent = async (id: string) => {
        const formData = new FormData();
        if (contentType === "exams") formData.append("examId", id);
        else formData.append("materialId", id);

        startTransition(async () => {
            const res = contentType === "exams" ? await deleteAdminManagedExam(formData) : await deleteAdminManagedMaterial(formData);
            if (res.success) {
                setSuccess("Content permanently decommissioned");
                setDeletingId(null);
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    const loadExamDetail = async (exam: any) => {
        setEditingExam(exam);
        setLoadingQuestions(true);
        const res = await getAdminExamDetails(exam.id);
        if (res.success && res.data) {
            setExamQuestions(res.data.questions);
        }
        setLoadingQuestions(false);
    };

    const handleUpdateQuestion = async (qId: string, text: string, options: string[], correct: number[], subject: string) => {
        const formData = new FormData();
        formData.append("questionId", qId);
        formData.append("text", text);
        formData.append("subject", subject);
        formData.append("options", JSON.stringify(options));
        formData.append("correct", JSON.stringify(correct));

        startTransition(async () => {
            const res = await adminUpdateVaultQuestion(formData);
            if (res.success) {
                setSuccess("Question content overridden successfully");
            } else {
                setError(res.message);
            }
        });
    };

    return (
        <div className="student-surface overflow-hidden rounded-lg">
            {/* Control Bar */}
            <div className="flex flex-col border-b border-[var(--student-border)] p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10 gap-6">
                <div className="flex bg-[var(--student-panel-muted)] p-1.5 rounded-lg border border-[var(--student-border)]">
                    <button 
                        onClick={() => setContentType("materials")}
                        className={cn(
                            "flex items-center gap-2.5 px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            contentType === "materials" ? "bg-white text-[var(--student-text)] shadow-sm" : "text-[var(--student-muted)] hover:text-[var(--student-text)]"
                        )}
                    >
                        <FileText size={18} weight="bold" /> Study Materials
                    </button>
                    <button 
                        onClick={() => setContentType("exams")}
                        className={cn(
                            "flex items-center gap-2.5 px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
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
                        className="w-full rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-muted)] py-4 pl-14 pr-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-text)] transition-all placeholder:text-[var(--student-muted)] focus:border-[var(--student-accent-soft-strong)] focus:bg-white sm:w-80"
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
                                onEdit={() => setEditingMaterial(m)}
                                onDelete={() => setDeletingId(m.id)}
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
                                onEdit={() => loadExamDetail(e)}
                                onDelete={() => setDeletingId(e.id)}
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

            {/* Modals */}
            {editingExam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-4xl h-[85vh] rounded-lg bg-white shadow-2xl animate-in zoom-in-95 flex flex-col overflow-hidden">
                        <div className="p-8 border-b flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">Exam Intelligence</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Gaining direct oversight: {editingExam.title}</p>
                            </div>
                            <button onClick={() => {setEditingExam(null); setExamQuestions([]);}} className="p-2"><X size={24} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-12">
                            {/* Metadata Section */}
                            <form onSubmit={handleUpdateExam} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <input type="hidden" name="examId" value={editingExam.id} />
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Display Title</label>
                                    <input name="title" defaultValue={editingExam.title} className="w-full rounded-lg border p-4 text-sm font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assessment Sector</label>
                                    <input name="category" defaultValue={editingExam.category} className="w-full rounded-lg border p-4 text-sm font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duration (Min)</label>
                                    <input name="duration" type="number" defaultValue={editingExam.duration} className="w-full rounded-lg border p-4 text-sm font-bold" />
                                </div>
                                <div className="md:col-start-4">
                                    <button disabled={isPending} type="submit" className="w-full h-full rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all">
                                        Update Metadata
                                    </button>
                                </div>
                            </form>

                            {/* Question Bank Bridge */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-dashed pb-4 border-slate-200">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Question Content Control</h4>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">{examQuestions.length} Questions Linked</span>
                                </div>

                                {loadingQuestions ? (
                                    <div className="py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Syncing Question DNA...</div>
                                ) : (
                                    <div className="space-y-4">
                                        {examQuestions.map((eq, i) => (
                                            <QuestionEditorRow 
                                                key={eq.id} 
                                                index={i + 1} 
                                                question={eq.question} 
                                                onSave={(text, opts, corr, sub) => handleUpdateQuestion(eq.question.id, text, opts, corr, sub)}
                                                isPending={isPending}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editingMaterial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-lg rounded-lg bg-white p-10 shadow-2xl animate-in zoom-in-95">
                        <div className="mb-8 flex items-center justify-between">
                            <h3 className="  text-2xl font-black tracking-tight">Material Oversight</h3>
                            <button onClick={() => setEditingMaterial(null)} className="p-2"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleUpdateMaterial} className="space-y-6">
                            <input type="hidden" name="materialId" value={editingMaterial.id} />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resource Title</label>
                                <input name="title" defaultValue={editingMaterial.title} className="w-full rounded-lg border p-4 text-sm font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visibility</label>
                                    <select name="isPublic" defaultValue={editingMaterial.isPublic.toString()} className="w-full rounded-lg border p-4 text-xs font-bold bg-white">
                                        <option value="true">Public Access</option>
                                        <option value="false">Private Ledger</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Protection</label>
                                    <select name="isProtected" defaultValue={editingMaterial.isProtected.toString()} className="w-full rounded-lg border p-4 text-xs font-bold bg-white">
                                        <option value="true">Shield On (Protected)</option>
                                        <option value="false">Shield Off (Raw)</option>
                                    </select>
                                </div>
                            </div>
                            <button disabled={isPending} type="submit" className="w-full rounded-lg bg-slate-900 py-5 text-[10px] font-black uppercase tracking-widest text-white">
                                {isPending ? "Syncing Logic..." : "Recast Material Policy"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {deletingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md rounded-lg bg-white p-10 shadow-2xl animate-in zoom-in-95">
                        <Trash size={48} weight="duotone" className="text-rose-500 mb-6" />
                        <h3 className="  text-2xl font-black tracking-tight mb-2">Confirm Destruction?</h3>
                        <p className="text-xs font-bold text-slate-400 leading-relaxed mb-8">
                            This will permanently purge this {contentType === "exams" ? "Assessment" : "Study Resource"} from the platform. ALL linked student attempts and progress logs will be erased.
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleDeleteContent(deletingId)}
                                disabled={isPending}
                                className="flex-1 rounded-lg bg-rose-600 py-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-rose-700"
                            >
                                {isPending ? "Decommissioning..." : "Yes, Destroy"}
                            </button>
                            <button 
                                onClick={() => setDeletingId(null)}
                                className="flex-1 rounded-lg bg-slate-100 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toasts */}
            {(error || success) && (
                <div className="fixed bottom-10 right-10 z-[100] flex flex-col gap-3">
                    {error && (
                        <div className="flex items-center gap-4 rounded-lg border border-rose-100 bg-rose-50 px-6 py-4 text-rose-600 shadow-xl backdrop-blur-md">
                            <Info size={20} weight="fill" />
                            <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                            <button onClick={() => setError(null)}><X size={16} weight="bold" /></button>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-4 rounded-lg border border-emerald-100 bg-emerald-50 px-6 py-4 text-emerald-600 shadow-xl backdrop-blur-md">
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
    onEdit: () => void;
    onDelete: () => void;
    isPending: boolean;
}

function ContentCard({ title, author, category, badge, isActive, activeLabel, activeIcon: Icon, onToggle, onEdit, onDelete, isPending }: CardProps) {
    return (
        <div className={cn(
            "group relative overflow-hidden rounded-lg border transition-all duration-300",
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
                    <div className="flex gap-2">
                        <button 
                            disabled={isPending}
                            onClick={onToggle}
                            className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg transition-all",
                                isActive 
                                    ? "bg-amber-400 text-slate-900 shadow-[0_0_15px_rgba(251,191,36,0.5)]" 
                                    : "bg-white border border-slate-100 text-slate-400 hover:text-amber-500 hover:border-amber-200"
                            )}
                        >
                            <Icon size={20} weight={isActive ? "fill" : "bold"} />
                        </button>
                        <button 
                            onClick={onDelete}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Trash size={18} weight="bold" />
                        </button>
                    </div>
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
                    <button 
                        onClick={onEdit}
                        className={cn(
                            "flex w-full items-center justify-center gap-2 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                            isActive ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-900 text-white shadow-xl hover:scale-105"
                        )}
                    >
                        <PencilSimple size={16} weight="bold" /> Configure Content
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

function QuestionEditorRow({ index, question, onSave, isPending }: { index: number, question: any, onSave: (t: string, o: string[], c: number[], s: string) => void, isPending: boolean }) {
    const [text, setText] = useState(question.text);
    const [subject, setSubject] = useState(question.subject || "");
    const [options, setOptions] = useState<string[]>(question.options.map((o: any) => o.text));
    const [correct, setCorrect] = useState<number[]>(question.options.map((o: any, idx: number) => o.isCorrect ? idx : -1).filter((i: number) => i !== -1));
    const [isEdited, setIsEdited] = useState(false);

    const toggleCorrect = (idx: number) => {
        setIsEdited(true);
        setCorrect(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    };

    const handleOptionChange = (idx: number, val: string) => {
        setIsEdited(true);
        const next = [...options];
        next[idx] = val;
        setOptions(next);
    };

    return (
        <div className="group rounded-lg border border-slate-100 bg-slate-50/50 p-6 transition-all hover:bg-white hover:border-indigo-100 hover:shadow-lg">
            <div className="mb-4 flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white text-[10px] font-black">#{index}</span>
                <div className="flex items-center gap-3">
                    <input 
                        value={subject} 
                        onChange={(e) => {setSubject(e.target.value); setIsEdited(true);}}
                        placeholder="Subject DNA..." 
                        className="bg-white border rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider outline-none focus:border-indigo-400 appearance-none" 
                    />
                    <button 
                        disabled={!isEdited || isPending}
                        onClick={() => {onSave(text, options, correct, subject); setIsEdited(false);}}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-20 transition-all"
                    >
                        {isPending ? "Syncing..." : "Override DNA"}
                    </button>
                </div>
            </div>
            
            <textarea 
                value={text} 
                onChange={(e) => {setText(e.target.value); setIsEdited(true);}}
                rows={2}
                className="w-full bg-white border border-slate-100 rounded-lg p-4 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-200 resize-none mb-4 shadow-sm"
            />

            <div className="grid grid-cols-2 gap-3">
                {options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                        <input 
                            value={opt} 
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            className="flex-1 bg-white border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-indigo-200 shadow-sm"
                        />
                        <button 
                            onClick={() => toggleCorrect(idx)}
                            className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center border transition-all",
                                correct.includes(idx) ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-white text-slate-300 hover:text-emerald-500"
                            )}
                        >
                            <CheckCircle size={20} weight={correct.includes(idx) ? "fill" : "bold"} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}


