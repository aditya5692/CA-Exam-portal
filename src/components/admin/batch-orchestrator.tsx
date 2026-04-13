"use client";

import { 
    updateAdminManagedBatch, 
    deleteAdminManagedBatch,
    createAdminManagedBatch,
    createAdminAnnouncement
} from "@/actions/admin-actions";
import { cn } from "@/lib/utils";
import { 
    Broadcast, 
    Users, 
    Trash, 
    PencilSimple, 
    MagnifyingGlass,
    Stack,
    IdentificationBadge,
    Plus,
    X,
    CheckCircle,
    Info,
    Megaphone
} from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import type { Batch, User } from "@prisma/client";
import { useRouter } from "next/navigation";

interface BatchOrchestratorProps {
    batches: (Batch & { 
        teacher: { fullName: string | null; email: string };
        _count: { students: number; exams: number; announcements: number };
    })[];
    teachers: { id: string; fullName: string | null; email: string }[];
}

export function BatchOrchestrator({ batches, teachers }: BatchOrchestratorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState("");
    
    const [editingBatch, setEditingBatch] = useState<any>(null);
    const [announcingBatch, setAnnouncingBatch] = useState<any>(null);
    
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filteredBatches = batches.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.teacher.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.uniqueJoinCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUpdateBatch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        startTransition(async () => {
            const res = await updateAdminManagedBatch(formData);
            if (res.success) {
                setSuccess("Batch configuration updated");
                setEditingBatch(null);
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    const handleCreateBatch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        startTransition(async () => {
            const res = await createAdminManagedBatch(formData);
            if (res.success) {
                setSuccess("New training cluster initialized");
                setIsCreating(false);
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    const handleDeleteBatch = async (batchId: string) => {
        const formData = new FormData();
        formData.append("batchId", batchId);
        
        startTransition(async () => {
            const res = await deleteAdminManagedBatch(formData);
            if (res.success) {
                setSuccess("Batch decommissioned successfully");
                setDeletingId(null);
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    const handleSendAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        startTransition(async () => {
            const res = await createAdminAnnouncement(formData);
            if (res.success) {
                setSuccess("Global announcement broadcasted");
                setAnnouncingBatch(null);
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    return (
        <div className="student-surface overflow-hidden rounded-lg">
            {/* Header */}
            <div className="flex flex-col border-b border-[var(--student-border)] p-10 lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                    <h3 className="  text-2xl font-black tracking-tight text-[var(--student-text)]">Pulse Orchestrator</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)] mt-1">Managing {batches.length} active training clusters</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <MagnifyingGlass size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--student-muted)]" weight="bold" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search batches or codes..."
                            className="w-full rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-muted)] py-4 pl-14 pr-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-text)] transition-all placeholder:text-[var(--student-muted)] focus:border-[var(--student-accent-soft-strong)] focus:bg-white sm:w-80"
                        />
                    </div>
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex h-14 items-center gap-3 rounded-lg bg-slate-900 px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus size={18} weight="bold" /> Initialize Batch
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="p-8 lg:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredBatches.map(batch => (
                        <div key={batch.id} className="group relative overflow-hidden rounded-lg border border-[var(--student-border)] bg-white p-8 transition-all hover:shadow-2xl hover:-translate-y-1">
                            <div className="mb-6 flex items-start justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)]">
                                    <Stack size={24} weight="bold" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">Join Code</p>
                                    <p className="  text-sm font-black text-slate-800">{batch.uniqueJoinCode}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="  text-xl font-black tracking-tight text-slate-900 truncate">{batch.name}</h4>
                                    <p className="text-xs font-bold text-slate-400">Led by {batch.teacher.fullName || batch.teacher.email}</p>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-slate-50">
                                    <Stat icon={Users} label="Students" value={batch._count.students} />
                                    <Stat icon={Megaphone} label="Broadcasts" value={batch._count.announcements} />
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                    onClick={() => setEditingBatch(batch)}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-100 bg-slate-50 py-3 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100"
                                >
                                    <PencilSimple size={16} weight="bold" /> Configure
                                </button>
                                <button 
                                    onClick={() => setAnnouncingBatch(batch)}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-[9px] font-black uppercase tracking-widest text-white shadow-xl hover:scale-105"
                                >
                                    <Broadcast size={16} weight="bold" /> Broadcast
                                </button>
                                <button 
                                    onClick={() => setDeletingId(batch.id)}
                                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all"
                                >
                                    <Trash size={18} weight="bold" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modals */}
            {editingBatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-lg rounded-lg bg-white p-10 shadow-2xl animate-in zoom-in-95">
                        <div className="mb-8 flex items-center justify-between">
                            <h3 className="  text-2xl font-black tracking-tight">Batch Governance</h3>
                            <button onClick={() => setEditingBatch(null)} className="p-2"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleUpdateBatch} className="space-y-6">
                            <input type="hidden" name="batchId" value={editingBatch.id} />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cluster Name</label>
                                <input name="name" defaultValue={editingBatch.name} className="w-full rounded-lg border p-4 text-sm font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Educator</label>
                                <select name="teacherId" defaultValue={editingBatch.teacherId} className="w-full rounded-lg border p-4 text-sm font-bold">
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName || t.email}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unique Identifier (Join Code)</label>
                                <input name="uniqueJoinCode" defaultValue={editingBatch.uniqueJoinCode} className="w-full rounded-lg border p-4 text-sm font-bold" />
                            </div>
                            <button disabled={isPending} type="submit" className="w-full rounded-lg bg-slate-900 py-5 text-[10px] font-black uppercase tracking-widest text-white">
                                {isPending ? "Syncing..." : "Apply Reconfiguration"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {announcingBatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-lg rounded-lg bg-white p-10 shadow-2xl animate-in zoom-in-95">
                        <div className="mb-8 flex items-center justify-between">
                            <h3 className="  text-2xl font-black tracking-tight">Direct Broadcast</h3>
                            <button onClick={() => setAnnouncingBatch(null)} className="p-2"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSendAnnouncement} className="space-y-6">
                            <input type="hidden" name="batchId" value={announcingBatch.id} />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message Content</label>
                                <textarea name="content" rows={4} placeholder="What would you like to broadcast to this cluster?" className="w-full rounded-lg border p-5 text-sm font-bold" />
                            </div>
                            <div className="rounded-lg bg-amber-50 p-4 flex gap-3">
                                <Info size={20} weight="fill" className="text-amber-500 shrink-0" />
                                <p className="text-[10px] font-medium text-amber-900 leading-relaxed uppercase tracking-wider">
                                    This message will be visible to all {announcingBatch._count.students} students in {announcingBatch.name}.
                                </p>
                            </div>
                            <button disabled={isPending} type="submit" className="w-full rounded-lg bg-slate-900 py-5 text-[10px] font-black uppercase tracking-widest text-white">
                                {isPending ? "Transmitting..." : "Send Announcement"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-lg rounded-lg bg-white p-10 shadow-2xl animate-in zoom-in-95">
                        <div className="mb-8 flex items-center justify-between">
                            <h3 className="  text-2xl font-black tracking-tight">Initialize Cluster</h3>
                            <button onClick={() => setIsCreating(false)} className="p-2"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateBatch} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cluster Name</label>
                                <input name="name" required placeholder="Session 2024-25..." className="w-full rounded-lg border p-4 text-sm font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assign Head Educator</label>
                                <select name="teacherId" required className="w-full rounded-lg border p-4 text-sm font-bold appearance-none">
                                    <option value="">Select an educator...</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName || t.email}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custom Join Code (Optional)</label>
                                <input name="uniqueJoinCode" placeholder="LEAVE BLANK FOR AUTO-GEN" className="w-full rounded-lg border p-4 text-sm font-bold" />
                            </div>
                            <button disabled={isPending} type="submit" className="w-full rounded-lg bg-slate-900 py-5 text-[10px] font-black uppercase tracking-widest text-white">
                                {isPending ? "Initializing..." : "Confirm Provisioning"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {deletingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md rounded-lg bg-white p-10 shadow-2xl animate-in zoom-in-95">
                        <X size={48} weight="duotone" className="text-rose-500 mb-6" />
                        <h3 className="  text-2xl font-black tracking-tight mb-2">Decommission Batch?</h3>
                        <p className="text-xs font-bold text-slate-400 leading-relaxed mb-8">
                            This will permanently dissolve the training cluster. Students will lose access to shared material links. THIS ACTION CANNOT BE REVERSED.
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleDeleteBatch(deletingId)}
                                disabled={isPending}
                                className="flex-1 rounded-lg bg-rose-600 py-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-rose-700"
                            >
                                {isPending ? "Dissolving..." : "Yes, Dissolve"}
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

function Stat({ icon: Icon, label, value }: any) {
    return (
        <div className="flex items-center gap-2.5">
            <div className="text-slate-400">
                <Icon size={16} weight="bold" />
            </div>
            <div>
                <p className="text-[18px] font-black tracking-tight text-slate-900 leading-none">{value}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{label}</p>
            </div>
        </div>
    );
}
