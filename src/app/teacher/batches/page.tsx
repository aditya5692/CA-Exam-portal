"use client";

import { useEffect, useMemo, useState } from "react";
import { createBatch, deleteBatch, getTeacherBatches, updateBatch } from "@/actions/batch-actions";
import { 
    Calendar, 
    Copy, 
    PencilLine, 
    Plus, 
    ShieldCheck, 
    Trash, 
    User, 
    Users, 
    X,
    CaretRight,
    CheckCircle,
    Info,
    Sparkle
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Student = {
    id: string;
    fullName: string | null;
    email: string | null;
    registrationNumber: string | null;
};

type Enrollment = {
    id: string;
    joinedAt: string | Date;
    student: Student;
};

type Announcement = {
    id: string;
    content: string;
    createdAt: string | Date;
    teacher?: {
        id: string;
        fullName: string | null;
        email: string | null;
    };
};

type EducatorSummary = {
    id: string;
    fullName: string | null;
    email: string | null;
};

type Batch = {
    id: string;
    teacherId: string;
    name: string;
    uniqueJoinCode: string;
    createdAt: string | Date;
    teacher?: EducatorSummary;
    enrollments: Enrollment[];
    announcements: Announcement[];
    _count: { enrollments: number; announcements: number };
};

type EducatorOption = {
    id: string;
    fullName: string | null;
    email: string | null;
    role: string;
};

export default function TeacherBatchesPage() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [availableTeachers, setAvailableTeachers] = useState<EducatorOption[]>([]);
    const [isAdminView, setIsAdminView] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
    const [batchName, setBatchName] = useState("");
    const [selectedOwnerId, setSelectedOwnerId] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const load = async () => {
        const res = await getTeacherBatches();
        if (!res.success) {
            return;
        }

        const loadedBatches = (res.data?.batches ?? []) as Batch[];
        const nextTeachers = (res.data?.availableTeachers ?? []) as EducatorOption[];
        setBatches(loadedBatches);
        setAvailableTeachers(nextTeachers);
        setIsAdminView(Boolean(res.data?.isAdminView));
        setSelectedBatchId((current) => (loadedBatches.some((batch) => batch.id === current) ? current : loadedBatches[0]?.id ?? null));
        setSelectedOwnerId((current) => current || nextTeachers[0]?.id || "");
    };

    useEffect(() => {
        void load();
    }, []);

    const selectedBatch = useMemo(
        () => batches.find((batch) => batch.id === selectedBatchId) ?? null,
        [batches, selectedBatchId],
    );

    const openCreateModal = () => {
        setEditingBatch(null);
        setBatchName("");
        setSelectedOwnerId(availableTeachers[0]?.id || "");
        setShowCreateModal(true);
    };

    const openEditModal = (batch: Batch) => {
        setEditingBatch(batch);
        setBatchName(batch.name);
        setSelectedOwnerId(batch.teacher?.id || batch.teacherId || availableTeachers[0]?.id || "");
        setShowCreateModal(true);
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setEditingBatch(null);
        setBatchName("");
        setSelectedOwnerId(availableTeachers[0]?.id || "");
    };

    const handleSaveBatch = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSaving(true);
        const formData = new FormData();
        formData.append("name", batchName);
        if (isAdminView) {
            formData.append("teacherId", selectedOwnerId);
        }

        const res = editingBatch
            ? (() => {
                formData.append("batchId", editingBatch.id);
                return updateBatch(formData);
            })()
            : createBatch(formData);

        const response = await res;
        setIsSaving(false);

        if (response.success) {
            closeModal();
            void load();
        } else {
            alert(response.message || "Unable to save batch.");
        }
    };

    const handleDeleteBatch = async (batchId: string) => {
        const confirmed = window.confirm("Delete this batch? Linked enrollments and updates for this batch will also be removed.");
        if (!confirmed) {
            return;
        }

        setIsDeleting(true);
        const formData = new FormData();
        formData.append("batchId", batchId);
        const res = await deleteBatch(formData);
        setIsDeleting(false);

        if (res.success) {
            if (selectedBatchId === batchId) {
                const nextBatch = batches.find((batch) => batch.id !== batchId);
                setSelectedBatchId(nextBatch?.id ?? null);
            }
            void load();
        } else {
            alert(res.message || "Unable to delete batch.");
        }
    };

    const copyCode = (code: string) => {
        void navigator.clipboard.writeText(code);
        setCopiedCode(code);
        window.setTimeout(() => setCopiedCode(null), 1800);
    };

    const formatDate = (value: string | Date) =>
        new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    return (
        <div className="space-y-6 pb-10 w-full max-w-[1280px] mx-auto font-outfit animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Student Management</span>
                    </div>
                    <h1 className="font-outfit tracking-tighter leading-tight text-3xl font-bold text-slate-900">
                        {isAdminView ? "Academy Batches" : "Batch Directory"}
                    </h1>
                    <p className="text-slate-500 font-medium text-base font-sans max-w-2xl leading-relaxed">
                        {isAdminView
                            ? "Overview of all batch segments and enrollment data across the entire academy."
                            : "Create unique learning environments for your students and manage their access through join codes."}
                    </p>
                </div>
                <div className="flex gap-4 mb-1">
                    {isAdminView && (
                        <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-widest shadow-sm shrink-0 transition-all">
                             <ShieldCheck size={18} weight="bold" className="text-indigo-400" /> Academy Admin
                        </div>
                    )}
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-3 bg-slate-900 hover:bg-indigo-600 text-white font-black text-[10px] tracking-widest uppercase px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-900/10 transition-all active:scale-95"
                    >
                        <Plus size={18} weight="bold" /> Create New Batch
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.85fr_1.15fr] gap-8">
                {/* Batch List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Segments</h2>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">{batches.length} Batches Active</p>
                        </div>
                         <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                             <Users size={18} weight="bold" className="text-slate-400" />
                         </div>
                    </div>
                    
                    {batches.length === 0 ? (
                        <div className="py-24 text-center space-y-4 bg-white/50 rounded-[32px] border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-full mx-auto flex items-center justify-center text-slate-200">
                                <Users size={32} weight="light" />
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Batches Yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {batches.map((batch) => (
                                <div
                                    key={batch.id}
                                    onClick={() => setSelectedBatchId(batch.id)}
                                    className={cn(
                                        "cursor-pointer rounded-[24px] border p-6 transition-all duration-300 relative group overflow-hidden",
                                        selectedBatch?.id === batch.id 
                                            ? "border-indigo-200 bg-indigo-50/50 shadow-md" 
                                            : "border-slate-100 bg-white hover:border-indigo-100 hover:shadow-sm"
                                    )}
                                >
                                    {selectedBatch?.id === batch.id && (
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Sparkle size={60} weight="fill" className="text-indigo-600" />
                                        </div>
                                    )}
                                    
                                    <div className="flex items-start justify-between gap-4 mb-6">
                                        <div>
                                            <h3 className={cn("text-xl font-bold tracking-tight font-outfit mb-1 transition-colors", selectedBatch?.id === batch.id ? "text-indigo-900" : "text-slate-900")}>{batch.name}</h3>
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/60 border border-black/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    <Users size={14} weight="bold" /> {batch._count.enrollments} Students
                                                </div>
                                                {isAdminView && (
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        By: {batch.teacher?.fullName?.split(" ")[0] || "Educator"}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); openEditModal(batch); }}
                                                className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 shadow-sm transition-all"
                                            >
                                                <PencilLine size={18} weight="bold" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); void handleDeleteBatch(batch.id); }}
                                                className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-100 shadow-sm transition-all"
                                                disabled={isDeleting}
                                            >
                                                <Trash size={18} weight="bold" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className={cn(
                                        "flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-300",
                                        selectedBatch?.id === batch.id ? "bg-white border-indigo-100" : "bg-slate-50/50 border-slate-100 group-hover:bg-white"
                                    )}>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Access Token</p>
                                            <code className="text-base font-mono font-black tracking-[0.2em] text-indigo-600">{batch.uniqueJoinCode}</code>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); copyCode(batch.uniqueJoinCode); }}
                                            className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95",
                                                copiedCode === batch.uniqueJoinCode ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-indigo-600"
                                            )}
                                        >
                                            {copiedCode === batch.uniqueJoinCode ? <CheckCircle size={18} weight="bold" /> : <Copy size={18} weight="bold" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail View */}
                <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col p-8 min-h-[600px]">
                    {selectedBatch ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-bold text-slate-900 tracking-tighter font-outfit">{selectedBatch.name}</h2>
                                    <div className="flex flex-wrap gap-3">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                            <Calendar size={16} weight="bold" /> Established {formatDate(selectedBatch.createdAt)}
                                        </div>
                                        {isAdminView && (
                                             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                 <User size={16} weight="bold" /> {selectedBatch.teacher?.fullName || "Educator"}
                                             </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: "Active Cohort", value: selectedBatch._count.enrollments, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", unit: "Students" },
                                    { label: "Updates Pushed", value: selectedBatch._count.announcements, icon: Sparkle, color: "text-amber-500", bg: "bg-amber-50", unit: "Pushes" },
                                    { label: "Join Link", value: selectedBatch.uniqueJoinCode, icon: Copy, color: "text-emerald-600", bg: "bg-emerald-50", isCode: true },
                                ].map((item) => (
                                    <div key={item.label} className="p-6 rounded-[28px] bg-slate-50/50 border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-md transition-all">
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", item.bg, item.color)}>
                                            <item.icon size={22} weight="bold" />
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                        <div className={cn("text-2xl font-bold tracking-tight font-outfit", item.isCode ? "font-mono tracking-widest text-indigo-600" : "text-slate-900")}>
                                            {item.value}
                                        </div>
                                        {!item.isCode && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.unit}</p>}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                                {/* Student List */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                            <Users size={16} weight="bold" /> Segment Students
                                        </h3>
                                    </div>
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                                        {selectedBatch.enrollments.length === 0 ? (
                                            <div className="p-10 text-center bg-slate-50/50 rounded-[24px] border border-dashed border-slate-100">
                                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No Active Enrollment</p>
                                            </div>
                                        ) : (
                                            selectedBatch.enrollments.map((enr) => (
                                                <div key={enr.id} className="p-5 rounded-[24px] bg-white border border-slate-100 hover:shadow-md transition-all flex items-center justify-between gap-4 group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                            <User size={20} weight="bold" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 leading-tight mb-1">{enr.student.fullName || "Cadet"}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{enr.student.registrationNumber || "No Reg ID"}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Joined</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(enr.joinedAt)}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Updates List */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                            <Sparkle size={16} weight="bold" /> Segment History
                                        </h3>
                                    </div>
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                                        {selectedBatch.announcements.length === 0 ? (
                                            <div className="p-10 text-center bg-slate-50/50 rounded-[24px] border border-dashed border-slate-100">
                                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No Broadcast History</p>
                                            </div>
                                        ) : (
                                            selectedBatch.announcements.map((ann) => (
                                                <div key={ann.id} className="p-6 rounded-[24px] bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                                                    <p className="text-sm font-medium leading-relaxed font-sans text-slate-600 group-hover:text-slate-900 transition-colors mb-4 line-clamp-3">
                                                        {ann.content}
                                                    </p>
                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100/50">
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            {formatDate(ann.createdAt)}
                                                        </div>
                                                        <div className="p-1.5 rounded-lg bg-white border border-slate-100">
                                                            <CaretRight size={14} weight="bold" className="text-slate-300" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 px-10">
                            <div className="w-24 h-24 rounded-[32px] bg-slate-50 flex items-center justify-center text-slate-200">
                                <Users size={48} weight="light" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Vault Preview</h3>
                                <p className="text-sm font-bold text-slate-400 max-w-xs leading-relaxed">Select a batch from the directory to inspect its cohort and push history.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-100">
                        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                    {editingBatch ? <PencilLine size={24} weight="bold" /> : <Plus size={24} weight="bold" />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight font-outfit">{editingBatch ? "Update Segment" : "Initialize Batch"}</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control access and visibility</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all">
                                <X size={20} weight="bold" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveBatch} className="p-10 space-y-8">
                            {isAdminView && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Segment Owner</label>
                                    <select
                                        value={selectedOwnerId}
                                        onChange={(e) => setSelectedOwnerId(e.target.value)}
                                        className="w-full h-14 border border-slate-100 rounded-2xl px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-sans font-semibold"
                                    >
                                        <option value="">Select educator</option>
                                        {availableTeachers.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {(t.fullName || t.email || "Educator") + (t.role === "ADMIN" ? " (Admin)" : "")}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Batch Designation</label>
                                <input
                                    type="text"
                                    value={batchName}
                                    onChange={(e) => setBatchName(e.target.value)}
                                    placeholder="e.g. CA Final Audit May 2026"
                                    className="w-full h-14 border border-slate-100 rounded-2xl px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-sans font-semibold"
                                />
                                <div className="flex items-start gap-2 p-4 rounded-xl bg-amber-50/50 border border-amber-100/50 mt-4">
                                     <Info size={16} weight="fill" className="text-amber-500 mt-0.5 shrink-0" />
                                     <p className="text-[10px] font-semibold text-amber-700 leading-relaxed">
                                         {editingBatch ? "Modifying the designation will update the student-facing label instantly. Join code is immutable." : "Initializing this batch will generate a high-entropy unique join code for secure student registration."}
                                     </p>
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={isSaving || !batchName.trim() || (isAdminView && !selectedOwnerId)}
                                className="w-full h-16 bg-slate-900 hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-[24px] shadow-lg shadow-indigo-900/10 transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle size={18} weight="bold" />
                                )}
                                {isSaving ? "Finalizing Registry..." : editingBatch ? "Commit Changes" : "Create Segment and Code"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
