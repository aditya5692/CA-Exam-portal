"use client";

import { useEffect, useMemo, useState } from "react";
import { createBatch, deleteBatch, getTeacherBatches, updateBatch } from "@/actions/batch-actions";
import { CalendarDays, Copy, PencilLine, Plus, ShieldCheck, Trash2, UserRound, Users, X } from "lucide-react";

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

        const loadedBatches = (res.batches ?? []) as Batch[];
        const nextTeachers = (res.availableTeachers ?? []) as EducatorOption[];
        setBatches(loadedBatches);
        setAvailableTeachers(nextTeachers);
        setIsAdminView(Boolean(res.isAdminView));
        setSelectedBatchId((current) => (loadedBatches.some((batch) => batch.id === current) ? current : loadedBatches[0]?.id ?? null));
        setSelectedOwnerId((current) => current || nextTeachers[0]?.id || "");
    };

    useEffect(() => {
        let active = true;

        (async () => {
            const res = await getTeacherBatches();
            if (!active || !res.success) {
                return;
            }

            const loadedBatches = (res.batches ?? []) as Batch[];
            const nextTeachers = (res.availableTeachers ?? []) as EducatorOption[];
            setBatches(loadedBatches);
            setAvailableTeachers(nextTeachers);
            setIsAdminView(Boolean(res.isAdminView));
            setSelectedBatchId((current) => (loadedBatches.some((batch) => batch.id === current) ? current : loadedBatches[0]?.id ?? null));
            setSelectedOwnerId((current) => current || nextTeachers[0]?.id || "");
        })();

        return () => {
            active = false;
        };
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
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {isAdminView ? "Academy Batches" : "My Batches"}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isAdminView
                            ? "Manage batches across all teachers from the same batch surface."
                            : "Create, manage, edit, and inspect linked students inside each batch."}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isAdminView && (
                        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                            <ShieldCheck className="w-4 h-4" /> Academy-wide admin view
                        </div>
                    )}
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Create Batch
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-700">
                            {isAdminView ? "Visible Batches" : "Your Batches"}
                            <span className="text-sm font-normal text-gray-400"> ({batches.length})</span>
                        </h2>
                    </div>
                    {batches.length === 0 ? (
                        <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            {isAdminView ? "No batches have been created yet." : "No batches yet. Create your first batch to get started."}
                        </div>
                    ) : (
                        batches.map((batch) => (
                            <div
                                key={batch.id}
                                onClick={() => setSelectedBatchId(batch.id)}
                                className={`cursor-pointer rounded-2xl border p-5 transition-all hover:shadow-md ${selectedBatch?.id === batch.id ? "border-emerald-300 bg-emerald-50/60 shadow-md" : "border-gray-200 bg-white"}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{batch.name}</h3>
                                        <div className="mt-2 inline-flex items-center gap-2 text-xs text-gray-500">
                                            <Users className="w-3.5 h-3.5" />
                                            {batch._count.enrollments} students linked
                                        </div>
                                        {isAdminView && (
                                            <p className="mt-2 text-xs text-gray-500">
                                                Teacher: {batch.teacher?.fullName || batch.teacher?.email || "Educator"}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                openEditModal(batch);
                                            }}
                                            className="rounded-lg bg-gray-100 p-2 text-gray-500 hover:bg-white hover:text-emerald-600"
                                            title="Edit batch"
                                        >
                                            <PencilLine className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                void handleDeleteBatch(batch.id);
                                            }}
                                            className="rounded-lg bg-gray-100 p-2 text-gray-500 hover:bg-white hover:text-rose-600"
                                            title="Delete batch"
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2">
                                    <code className="flex-1 font-mono text-sm font-bold tracking-wider text-emerald-700">{batch.uniqueJoinCode}</code>
                                    <button
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            copyCode(batch.uniqueJoinCode);
                                        }}
                                        className="text-gray-400 hover:text-emerald-600 transition-colors"
                                        title="Copy code"
                                    >
                                        <Copy className={`w-4 h-4 ${copiedCode === batch.uniqueJoinCode ? "text-emerald-500" : ""}`} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    {selectedBatch ? (
                        <div className="space-y-6">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedBatch.name}</h2>
                                    <p className="mt-1 text-sm text-gray-500">Detailed batch view with linked students and management info.</p>
                                    {isAdminView && (
                                        <p className="mt-2 text-sm text-gray-500">
                                            Owner: {selectedBatch.teacher?.fullName || selectedBatch.teacher?.email || "Educator"}
                                        </p>
                                    )}
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                                    <CalendarDays className="w-4 h-4" />
                                    Created {formatDate(selectedBatch.createdAt)}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Students linked</p>
                                    <p className="mt-3 text-3xl font-black text-gray-900">{selectedBatch._count.enrollments}</p>
                                </div>
                                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Updates posted</p>
                                    <p className="mt-3 text-3xl font-black text-gray-900">{selectedBatch._count.announcements}</p>
                                </div>
                                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Join code</p>
                                    <div className="mt-3 flex items-center gap-3">
                                        <code className="font-mono text-sm font-bold tracking-wider text-emerald-700">{selectedBatch.uniqueJoinCode}</code>
                                        <button
                                            onClick={() => copyCode(selectedBatch.uniqueJoinCode)}
                                            className="rounded-lg bg-white p-2 text-gray-400 hover:text-emerald-600"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5">
                                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                                    <h3 className="text-lg font-semibold text-gray-900">Linked students</h3>
                                    {selectedBatch.enrollments.length === 0 ? (
                                        <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
                                            No students have joined this batch yet.
                                        </div>
                                    ) : (
                                        <div className="mt-4 space-y-3">
                                            {selectedBatch.enrollments.map((enrollment) => (
                                                <div key={enrollment.id} className="rounded-xl border border-white bg-white px-4 py-4 shadow-sm">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                                                                <UserRound className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">{enrollment.student.fullName ?? "Unnamed student"}</p>
                                                                <p className="text-sm text-gray-500">{enrollment.student.email ?? "No email added"}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right text-xs text-gray-400">
                                                            <p>{enrollment.student.registrationNumber ?? "No registration no."}</p>
                                                            <p className="mt-1">Joined {formatDate(enrollment.joinedAt)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                                    <h3 className="text-lg font-semibold text-gray-900">Recent batch updates</h3>
                                    {selectedBatch.announcements.length === 0 ? (
                                        <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
                                            No updates posted for this batch yet. Use the Updates section to send one.
                                        </div>
                                    ) : (
                                        <div className="mt-4 space-y-3">
                                            {selectedBatch.announcements.map((announcement) => (
                                                <div key={announcement.id} className="rounded-xl border border-white bg-white px-4 py-4 shadow-sm">
                                                    <p className="text-sm leading-relaxed text-gray-800">{announcement.content}</p>
                                                    <p className="mt-3 text-xs text-gray-400">{formatDate(announcement.createdAt)}</p>
                                                    {isAdminView && (
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Posted by {announcement.teacher?.fullName || announcement.teacher?.email || "Educator"}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-20 text-center text-gray-400">
                            Select a batch to view its details.
                        </div>
                    )}
                </div>
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-bold text-lg">{editingBatch ? "Edit Batch" : "Create New Batch"}</h2>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveBatch} className="p-6 space-y-5">
                            {isAdminView && (
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Batch Owner</label>
                                    <select
                                        value={selectedOwnerId}
                                        onChange={(event) => setSelectedOwnerId(event.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">Select educator</option>
                                        {availableTeachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {(teacher.fullName || teacher.email || "Educator") + (teacher.role === "ADMIN" ? " (Admin)" : "")}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-2">The batch stays inside this educator's teacher workflow after you save it.</p>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Batch Name</label>
                                <input
                                    type="text"
                                    value={batchName}
                                    onChange={(event) => setBatchName(event.target.value)}
                                    placeholder="e.g. Taxation Nov 2026 Batch"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    {editingBatch ? "Update the visible batch name. Join code stays the same." : "A unique join code will be auto-generated for this batch."}
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving || !batchName.trim() || (isAdminView && !selectedOwnerId)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
                            >
                                {isSaving ? "Saving..." : editingBatch ? "Save Changes" : "Generate Batch and Code"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
