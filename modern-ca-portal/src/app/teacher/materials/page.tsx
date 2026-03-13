"use client";

import { useState, useEffect } from "react";
import { getTeacherMaterials, publishMaterial, getTeacherBatchesForMaterials } from "@/actions/educator-actions";
import { Upload, FileText, Lock, Users, Activity, ExternalLink, ShieldCheck, Folder as FolderIcon, BookOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type EducatorOption = {
    id: string;
    fullName: string | null;
    email: string | null;
    role: string;
};

type MaterialAccess = {
    id: string;
    student: { id: string; fullName: string | null; email: string | null };
};

type MaterialItem = {
    id: string;
    title: string;
    createdAt: string | Date;
    isProtected: boolean;
    uploadedBy?: { id: string; fullName: string | null; email: string | null; role: string };
    accessedBy?: MaterialAccess[];
};

type BatchOption = { id: string; name: string; studentCount: number };

// ─────────────────────────────────────────────────────────────────────────────

export default function EducatorHubPage() {
    const [activeTab, setActiveTab] = useState<"PUBLISH">("PUBLISH");
    const [materials, setMaterials] = useState<MaterialItem[]>([]);
    const [availableEducators, setAvailableEducators] = useState<EducatorOption[]>([]);
    const [batches, setBatches] = useState<BatchOption[]>([]);
    const [isAdminView, setIsAdminView] = useState(false);
    const [selectedOwnerId, setSelectedOwnerId] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [targetMode, setTargetMode] = useState<"batch" | "email">("batch");
    const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
    const [studentEmails, setStudentEmails] = useState("");
    const [isProtected, setIsProtected] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const loadData = async () => {
        const [matRes, batchRes] = await Promise.all([
            getTeacherMaterials(),
            getTeacherBatchesForMaterials(),
        ]);

        if (matRes.success) {
            const nextEducators = (matRes.availableEducators ?? []) as EducatorOption[];
            setMaterials((matRes.materials ?? []) as MaterialItem[]);
            setAvailableEducators(nextEducators);
            setIsAdminView(Boolean(matRes.isAdminView));
            setSelectedOwnerId((current) => current || nextEducators[0]?.id || "");
        }

        if (batchRes.success) {
            setBatches(batchRes.batches);
        }
    };

    useEffect(() => { void loadData(); }, []);

    const toggleBatch = (id: string) => {
        setSelectedBatchIds((prev) =>
            prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
        );
    };

    const handlePublish = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedFile) { alert("Please select a file to distribute."); return; }
        if (targetMode === "batch" && selectedBatchIds.length === 0 && batches.length > 0) {
            alert("Select at least one batch to distribute to, or switch to email mode."); return;
        }
        if (isAdminView && !selectedOwnerId) { alert("Select the educator who should own this material."); return; }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("title", title || selectedFile.name);
        formData.append("isProtected", String(isProtected));
        if (isAdminView) formData.append("ownerId", selectedOwnerId);

        if (targetMode === "batch" && selectedBatchIds.length > 0) {
            formData.append("batchIds", selectedBatchIds.join(","));
        } else if (targetMode === "email" && studentEmails.trim()) {
            formData.append("studentEmails", studentEmails);
        }

        const res = await publishMaterial(formData);
        setIsUploading(false);

        if (res.success) {
            setTitle("");
            setStudentEmails("");
            setSelectedFile(null);
            setSelectedBatchIds([]);
            void loadData();
        } else {
            alert(res.message || "Failed to publish.");
        }
    };

    const heading = isAdminView ? "Academy Publishing Hub" : "Educator Publishing Hub";
    const subheading = isAdminView
        ? "Review every teacher-owned material and publish new distributions."
        : "Securely distribute premium materials directly to your students.";

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-black font-outfit tracking-tight mb-1">{heading}</h1>
                    <p className="text-white/40 text-sm font-medium">{subheading}</p>
                    <div className="flex items-center gap-4 mt-6">
                        <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                            <div className="text-2xl font-black font-outfit">{materials.length}</div>
                            <div className="text-[10px] text-white/40 font-bold uppercase mt-0.5">Materials</div>
                        </div>
                        <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                            <div className="text-2xl font-black font-outfit">
                                {materials.reduce((s, m) => s + (m.accessedBy?.length ?? 0), 0)}
                            </div>
                            <div className="text-[10px] text-white/40 font-bold uppercase mt-0.5">Grants</div>
                        </div>
                        <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                            <div className="text-2xl font-black font-outfit">{batches.length}</div>
                            <div className="text-[10px] text-white/40 font-bold uppercase mt-0.5">Batches</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs removed as Free Materials moved to sidebar */}

            {activeTab === "PUBLISH" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Publish form */}
                    <div className="lg:col-span-1 bg-white border border-gray-100 shadow-sm p-6 rounded-2xl h-fit space-y-5">
                        <h2 className="text-lg font-black text-gray-900 font-outfit flex items-center gap-2">
                            <Upload className="w-5 h-5 text-indigo-500" /> New Distribution
                        </h2>

                        <form onSubmit={handlePublish} className="space-y-4">
                            {/* Admin educator picker */}
                            {isAdminView && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Educator Owner</label>
                                    <select value={selectedOwnerId} onChange={(e) => setSelectedOwnerId(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                                        <option value="">Select educator</option>
                                        {availableEducators.map((educator) => (
                                            <option key={educator.id} value={educator.id}>
                                                {(educator.fullName || educator.email || "Educator") + (educator.role === "ADMIN" ? " (Admin)" : "")}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Title</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="e.g. Chapter 1 Final Revision" />
                            </div>

                            {/* Target mode toggle */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Distribute to</label>
                                <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-bold shadow-sm">
                                    <button type="button" onClick={() => setTargetMode("batch")}
                                        className={cn("flex-1 py-2.5 transition-all", targetMode === "batch" ? "bg-indigo-600 text-white" : "text-gray-500 bg-white hover:bg-gray-50")}>
                                        🏫 By Batch
                                    </button>
                                    <button type="button" onClick={() => setTargetMode("email")}
                                        className={cn("flex-1 py-2.5 transition-all", targetMode === "email" ? "bg-indigo-600 text-white" : "text-gray-500 bg-white hover:bg-gray-50")}>
                                        ✉️ By Email
                                    </button>
                                </div>
                            </div>

                            {/* Batch picker */}
                            {targetMode === "batch" && (
                                <div>
                                    {batches.length === 0 ? (
                                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700">
                                            You have no batches yet. <a href="/teacher/batches" className="underline font-bold">Create one first</a>, or switch to email mode.
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto rounded-xl border border-gray-200 p-3">
                                            {batches.map((b) => (
                                                <label key={b.id} className={cn("flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                                                    selectedBatchIds.includes(b.id) ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-transparent hover:border-gray-200")}>
                                                    <input type="checkbox" checked={selectedBatchIds.includes(b.id)} onChange={() => toggleBatch(b.id)}
                                                        className="w-4 h-4 rounded text-indigo-600" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-sm text-gray-900 truncate">{b.name}</div>
                                                        <div className="text-[10px] text-gray-400">{b.studentCount} students enrolled</div>
                                                    </div>
                                                    {selectedBatchIds.includes(b.id) && (
                                                        <span className="text-[10px] font-bold text-indigo-600">✓</span>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {selectedBatchIds.length > 0 && (
                                        <p className="text-[11px] text-indigo-600 font-bold mt-1.5">
                                            📢 All {batches.filter((b) => selectedBatchIds.includes(b.id)).reduce((s, b) => s + b.studentCount, 0)} students in {selectedBatchIds.length} batch{selectedBatchIds.length !== 1 ? "es" : ""} will get access
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Email fallback */}
                            {targetMode === "email" && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                                        Student Emails <span className="font-normal normal-case lowercase">(comma separated)</span>
                                    </label>
                                    <textarea value={studentEmails} onChange={(e) => setStudentEmails(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="student@example.com, another@test.com" rows={3} />
                                </div>
                            )}

                            {/* DRM */}
                            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" checked={isProtected} onChange={(e) => setIsProtected(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded text-indigo-600" />
                                    <div>
                                        <span className="block text-sm font-bold text-indigo-900">Enable DRM Protection</span>
                                        <span className="block text-xs text-indigo-600 mt-0.5">Prevent downloading. Students view in secure in-app viewer.</span>
                                    </div>
                                </label>
                            </div>

                            {/* File picker */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">File (PDF/Image)</label>
                                <input type="file"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                                    accept=".pdf,.png,.jpg" />
                            </div>

                            <button type="submit" disabled={isUploading || !selectedFile}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
                                {isUploading ? <span className="animate-spin text-xl">⟳</span> : <ExternalLink className="w-4 h-4" />}
                                {isUploading ? "Encrypting & Distributing..." : "Publish to Students"}
                            </button>
                        </form>
                    </div>

                    {/* Distribution activity */}
                    <div className="lg:col-span-2 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-900 font-outfit flex items-center gap-2">
                                <Activity className="w-5 h-5 text-gray-500" /> Distribution Activity
                            </h2>
                            {isAdminView && (
                                <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700">
                                    <ShieldCheck className="w-4 h-4" /> Academy-wide view
                                </div>
                            )}
                        </div>

                        {materials.length === 0 ? (
                            <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                                <div className="text-4xl mb-3">📭</div>
                                <div className="font-bold text-gray-600">No materials published yet</div>
                                <div className="text-sm mt-1">Upload your first material using the form on the left.</div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {materials.map((material) => (
                                    <div key={material.id}
                                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("p-3 rounded-xl", material.isProtected
                                                ? "bg-indigo-50 text-indigo-600" : "bg-green-50 text-green-600")}>
                                                {material.isProtected ? <Lock className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{material.title}</h3>
                                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                                                    <span>{new Date(material.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                                    <span className={material.isProtected ? "text-indigo-600 font-bold" : "text-green-600 font-bold"}>
                                                        {material.isProtected ? "🔒 DRM Protected" : "✅ Downloadable"}
                                                    </span>
                                                    {isAdminView && material.uploadedBy && (
                                                        <span>By: {material.uploadedBy.fullName || material.uploadedBy.email}</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 shrink-0">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <div className="text-right">
                                                <span className="block text-lg font-black font-outfit text-gray-900">{material.accessedBy?.length ?? 0}</span>
                                                <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Students</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
