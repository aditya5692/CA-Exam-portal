"use client";

import { createBatch,deleteBatch,getTeacherBatches,updateBatch } from "@/actions/batch-actions";
import { createStudentAccess, bulkCreateStudentAccess, getTeacherStudents, sendCodesViaMailchimp } from "@/actions/student-manager-actions";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CaretDown,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Copy,
  GraduationCap,
  HandPointing,
  Info,
  PaperPlaneRight,
  PencilLine,
  Plus,
  ShieldCheck,
  Sparkle,
  Trash,
  UploadSimple,
  User,
  Users,
  X
} from "@phosphor-icons/react";
import { useEffect,useMemo,useState } from "react";

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

type StudentAccessCode = {
    id: string;
    code: string;
    name: string;
    email: string;
    caLevel: string | null;
    subject: string | null;
    status: string;
    isEmailed: boolean;
    createdAt: string | Date;
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

    // Invite Management State
    const [pendingInvites, setPendingInvites] = useState<StudentAccessCode[]>([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [inviteName, setInviteName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteLevel, setInviteLevel] = useState("");
    const [inviteSubject, setInviteSubject] = useState("");
    const [csvContent, setCsvContent] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [activeTab, setActiveTab] = useState<"enrolled" | "pending">("enrolled");

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
        const timer = window.setTimeout(() => {
            void load();
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, []);

    const loadInvites = async (batchId: string) => {
        const res = await getTeacherStudents(batchId);
        if (res.success) {
            setPendingInvites((res.data || []) as any);
        }
    };

    useEffect(() => {
        if (selectedBatchId) {
            void loadInvites(selectedBatchId);
        }
    }, [selectedBatchId]);

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

    const handleCreateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatchId) return;
        setIsInviting(true);
        const res = await createStudentAccess({
            name: inviteName,
            email: inviteEmail,
            caLevel: inviteLevel,
            subject: inviteSubject,
            batchId: selectedBatchId
        });
        setIsInviting(false);
        if (res.success && res.data) {
            setPendingInvites([res.data as any, ...pendingInvites]);
            setShowInviteModal(false);
            setInviteName(""); setInviteEmail(""); setInviteLevel(""); setInviteSubject("");
        } else {
            alert(res.message);
        }
    };

    const handleBulkInvite = async () => {
        if (!csvContent || !selectedBatchId) return;
        setIsInviting(true);
        const lines = csvContent.split("\n").map(l => l.trim()).filter(l => l);
        const data = lines.map(line => {
            const values = line.split(",");
            return {
                name: values[0]?.trim() || "Unknown",
                email: values[1]?.trim() || "",
                caLevel: values[2]?.trim() || "",
                subject: values[3]?.trim() || ""
            };
        }).filter(item => item.email);

        const res = await bulkCreateStudentAccess(data, selectedBatchId);
        setIsInviting(false);
        if (res.success) {
            setShowBulkModal(false);
            setCsvContent("");
            void loadInvites(selectedBatchId);
        } else {
            alert(res.message);
        }
    };

    const handleSendInvites = async () => {
        const pendingIds = pendingInvites.filter(c => !c.isEmailed).map(c => c.id);
        if (pendingIds.length === 0) {
            alert("No pending emails to send.");
            return;
        }
        setIsSending(true);
        const res = await sendCodesViaMailchimp(pendingIds);
        setIsSending(false);
        if (res.success) {
            setPendingInvites(pendingInvites.map(c => pendingIds.includes(c.id) ? { ...c, isEmailed: true } : c));
        } else {
            alert(res.message);
        }
    };

    const formatDate = (value: string | Date) =>
        new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    return (
        <div className="space-y-6 pb-20 w-full max-w-[1400px] mx-auto   animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8 px-4 lg:px-0">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.4)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Batch Management</span>
                    </div>
                    <h1 className="  tracking-tighter leading-tight text-4xl font-bold text-slate-900">
                        {isAdminView ? "Academy Dashboard" : "My Batches"}
                    </h1>
                    <p className="text-slate-500 font-medium text-base   max-w-2xl leading-relaxed">
                        {isAdminView
                            ? "Comprehensive management of all batches and student enrollment patterns."
                            : "Create and manage learning environments. Share codes or send individual invitations to track progress."}
                    </p>
                </div>
                <div className="flex gap-4 mb-1">
                    {isAdminView && (
                        <div className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-white border border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-widest shadow-sm shrink-0 transition-all">
                             <ShieldCheck size={20} weight="bold" className="text-indigo-400" /> Admin Oversight
                        </div>
                    )}
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] tracking-[0.2em] uppercase px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 group"
                    >
                        <Plus size={20} weight="bold" className="group-hover:rotate-90 transition-transform" /> Start New Batch
                    </button>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 px-4 lg:px-0">
                {[
                    { label: "Active Batches", value: batches.length, icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Total Students", value: batches.reduce((acc, b) => acc + b._count.enrollments, 0), icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Open Invitations", value: pendingInvites.length, icon: PaperPlaneRight, color: "text-amber-500", bg: "bg-amber-50" },
                ].map((stat) => (
                    <div key={stat.label} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                            <stat.icon size={26} weight="bold" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <div className="text-2xl font-bold   text-slate-900">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {!selectedBatchId ? (
                /* Batch Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 lg:px-0 pb-10">
                    {batches.length === 0 ? (
                        <div className="col-span-full py-32 text-center space-y-6 bg-white/50 rounded-[48px] border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 rounded-full mx-auto flex items-center justify-center text-slate-200">
                                <Users size={40} weight="light" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Active Batches</h3>
                                <p className="text-xs text-slate-400 mt-2">Get started by creating your first batch.</p>
                            </div>
                        </div>
                    ) : (
                        batches.map((batch) => (
                            <div
                                key={batch.id}
                                className="group relative bg-white rounded-[40px] border border-slate-100 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-slate-200 hover:-translate-y-1.5"
                            >
                                <div className="flex items-start justify-between gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 transition-all duration-500 group-hover:scale-110 group-hover:border-indigo-200">
                                        <GraduationCap size={28} weight="bold" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); openEditModal(batch); }} className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100">
                                            <PencilLine size={18} weight="bold" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); void handleDeleteBatch(batch.id); }} className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100">
                                            <Trash size={18} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 mb-8">
                                    <h3 className="text-2xl font-bold tracking-tighter text-slate-900 transition-colors line-clamp-1">{batch.name}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg">
                                            <Users size={14} weight="bold" /> {batch._count.enrollments} Students
                                        </span>
                                        {isAdminView && (
                                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest truncate max-w-[120px]">
                                                {batch.teacher?.fullName || "Educator"}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-50 mb-8 flex items-center justify-between transition-all duration-500 group-hover:border-slate-100 group-hover:bg-slate-50/80">
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Class Join Code</p>
                                        <code className="text-base font-mono font-black tracking-widest text-indigo-600">{batch.uniqueJoinCode}</code>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); copyCode(batch.uniqueJoinCode); }}
                                        className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm",
                                            copiedCode === batch.uniqueJoinCode ? "bg-emerald-500 text-white" : "bg-white text-slate-400 hover:text-indigo-600 border border-slate-100"
                                        )}
                                    >
                                        {copiedCode === batch.uniqueJoinCode ? <CheckCircle size={18} weight="bold" /> : <Copy size={18} weight="bold" />}
                                    </button>
                                </div>

                                <button 
                                    onClick={() => setSelectedBatchId(batch.id)}
                                    className="w-full py-4 bg-slate-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:bg-indigo-600 transition-all active:scale-95"
                                >
                                    Manage Students & Invites
                                </button>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* Specialized Management View (Overlay feel) */
                <div className="animate-in fade-in slide-in-from-right-8 duration-500 px-4 lg:px-0 pb-20">
                    <button 
                        onClick={() => setSelectedBatchId(null)}
                        className="mb-8 flex items-center gap-2.5 text-slate-400 hover:text-indigo-600 font-bold transition-all group"
                    >
                        <div className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center group-hover:border-indigo-100 transition-all">
                            <CaretLeft size={16} weight="bold" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to All Batches</span>
                    </button>

                    <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm p-10 lg:p-14 space-y-12">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                            <div className="space-y-4">
                                <h2 className="text-4xl font-bold tracking-tighter text-slate-900  ">{selectedBatch?.name}</h2>
                                <div className="flex flex-wrap gap-3">
                                    <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                                        <Calendar size={16} weight="bold" /> Created {selectedBatch && formatDate(selectedBatch.createdAt)}
                                    </div>
                                    <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <ShieldCheck size={16} weight="bold" /> Joined by {selectedBatch?._count.enrollments} Students
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowInviteModal(true)} className="px-8 py-4 bg-white border border-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                                    Invite Student
                                </button>
                                <button onClick={() => setShowBulkModal(true)} className="px-8 py-4 bg-white border border-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                                    Bulk CSV Invite
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 px-1 py-1 bg-slate-50 border border-slate-100 rounded-[32px]">
                            <button 
                                onClick={() => setActiveTab("enrolled")}
                                className={cn("py-4 rounded-[28px] text-[10px] font-black uppercase tracking-widest transition-all", activeTab === "enrolled" ? "bg-white text-indigo-600 shadow-md" : "text-slate-400 hover:text-slate-600")}
                            >
                                Enrolled Students ({selectedBatch?.enrollments.length || 0})
                            </button>
                            <button 
                                onClick={() => setActiveTab("pending")}
                                className={cn("py-4 rounded-[28px] text-[10px] font-black uppercase tracking-widest transition-all", activeTab === "pending" ? "bg-white text-indigo-600 shadow-md" : "text-slate-400 hover:text-slate-600")}
                            >
                                Pending Invitations ({pendingInvites.length})
                            </button>
                        </div>

                        {activeTab === "enrolled" ? (
                            <div className="space-y-4">
                                {selectedBatch?.enrollments.length === 0 ? (
                                    <div className="py-32 text-center bg-slate-50/50 rounded-[40px] border border-dashed border-slate-100 space-y-4">
                                        <Users size={40} className="mx-auto text-slate-200" weight="light" />
                                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No Active Enrollments</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {selectedBatch?.enrollments.map((enr) => (
                                            <div key={enr.id} className="p-6 rounded-[32px] bg-white border border-slate-100 hover:shadow-xl hover:shadow-indigo-600/5 transition-all flex items-center gap-5 group">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                    <User size={22} weight="bold" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 leading-tight mb-0.5 truncate">{enr.student.fullName || "Student"}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{enr.student.email || "Email Hidden"}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {pendingInvites.length > 0 && (
                                    <button 
                                        onClick={handleSendInvites}
                                        disabled={isSending}
                                        className="w-full py-6 bg-indigo-600 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 group disabled:opacity-50 active:scale-95"
                                    >
                                        <PaperPlaneRight size={20} weight="bold" className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                                        {isSending ? "Handing over to Mailchimp..." : `Send Invites to All ${pendingInvites.filter(i => !i.isEmailed).length} Students`}
                                    </button>
                                )}

                                {pendingInvites.length === 0 ? (
                                    <div className="py-32 text-center bg-slate-50/50 rounded-[40px] border border-dashed border-slate-100 space-y-4">
                                        <ShieldCheck size={40} className="mx-auto text-slate-200" weight="light" />
                                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No Pending Invitations</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {pendingInvites.map((invite) => (
                                            <div key={invite.id} className="p-6 rounded-[32px] bg-white border border-slate-100 hover:shadow-xl hover:shadow-indigo-600/5 transition-all space-y-6 group">
                                                <div className="flex items-center justify-between">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px] group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        INV
                                                    </div>
                                                    <div className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest", invite.status === "VERIFIED" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                                                        {invite.status}
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 leading-tight mb-0.5 truncate">{invite.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{invite.email}</p>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                    <code className="text-[10px] font-mono font-black text-indigo-600">{invite.code}</code>
                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest", invite.isEmailed ? "text-emerald-500" : "text-slate-300")}>
                                                        {invite.isEmailed ? "Emailed" : "Draft"}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* Create/Edit Batch Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 overflow-hidden">
                        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                    {editingBatch ? <PencilLine size={24} weight="bold" /> : <Plus size={24} weight="bold" />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight   text-slate-900">{editingBatch ? "Edit Batch" : "New Batch"}</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Define your learning environment</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all">
                                <X size={20} weight="bold" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveBatch} className="p-10 space-y-8">
                            {isAdminView && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Assign Teacher</label>
                                    <select
                                        value={selectedOwnerId}
                                        onChange={(e) => setSelectedOwnerId(e.target.value)}
                                        className="w-full h-14 border border-slate-100 rounded-2xl px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all   font-semibold"
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
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Batch Name</label>
                                <input
                                    type="text"
                                    value={batchName}
                                    onChange={(e) => setBatchName(e.target.value)}
                                    placeholder="e.g. CA Final Audit May 2026"
                                    className="w-full h-14 border border-slate-100 rounded-2xl px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all   font-semibold"
                                />
                                <div className="flex items-start gap-2 p-4 rounded-2xl bg-indigo-50 border border-indigo-100/50 mt-4">
                                     <Info size={16} weight="fill" className="text-indigo-400 mt-0.5 shrink-0" />
                                     <p className="text-[10px] font-bold text-indigo-700 leading-relaxed">
                                         {editingBatch ? "Students will see the updated name immediately. The join code remains the same." : "This will create a new batch and generate a unique join code for your students."}
                                     </p>
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={isSaving || !batchName.trim() || (isAdminView && !selectedOwnerId)}
                                className="w-full h-16 bg-slate-900 hover:bg-indigo-600 disabled:opacity-40 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-900/10 transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle size={18} weight="bold" />
                                )}
                                {isSaving ? "Saving..." : editingBatch ? "Save Changes" : "Create Batch"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Individual Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-100">
                        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                    <Plus size={22} weight="bold" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold   text-slate-900">Invite Student</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Personal accession invite</p>
                                </div>
                            </div>
                            <button onClick={() => setShowInviteModal(false)} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all">
                                <X size={20} weight="bold" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateInvite} className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                                <input required type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="e.g. Jane Doe" className="w-full h-14 border border-slate-100 rounded-2xl px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all   font-semibold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                                <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="student@example.com" className="w-full h-14 border border-slate-100 rounded-2xl px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all   font-semibold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CA Level</label>
                                    <input placeholder="e.g. Inter" type="text" value={inviteLevel} onChange={e => setInviteLevel(e.target.value)} className="w-full h-14 border border-slate-100 rounded-2xl px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all   font-semibold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subject</label>
                                    <input placeholder="e.g. Audit" type="text" value={inviteSubject} onChange={e => setInviteSubject(e.target.value)} className="w-full h-14 border border-slate-100 rounded-2xl px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all   font-semibold" />
                                </div>
                            </div>
                            <button type="submit" disabled={isInviting} className="w-full h-16 bg-slate-900 hover:bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-900/10 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50">
                                {isInviting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HandPointing size={20} weight="bold" />}
                                Generate Invite
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Upload Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-100">
                        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                    <UploadSimple size={22} weight="bold" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold   text-slate-900">Bulk Invite</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Quick enrollment sequence</p>
                                </div>
                            </div>
                            <button onClick={() => setShowBulkModal(false)} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all">
                                <X size={20} weight="bold" />
                            </button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CSV Content</label>
                                <p className="text-[9px] font-bold text-slate-400 mb-2 italic px-1">Format: Name, Email, Level, Subject (One per line)</p>
                                <textarea 
                                    value={csvContent} 
                                    onChange={e => setCsvContent(e.target.value)} 
                                    placeholder="Jane Doe, jane@example.com, Inter, Audit&#10;John Smith, john@example.com, Final, Law" 
                                    className="w-full h-44 border border-slate-100 rounded-2xl px-5 py-4 text-xs bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-mono whitespace-pre" 
                                />
                            </div>
                            <button onClick={handleBulkInvite} disabled={isInviting || !csvContent.trim()} className="w-full h-16 bg-slate-900 hover:bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-900/10 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50">
                                {isInviting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck size={20} weight="bold" />}
                                Create Invitations
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
