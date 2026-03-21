"use client";

import { useState, useEffect } from "react";
import { getTeacherMaterials, publishMaterial, getTeacherBatchesForMaterials } from "@/actions/educator-actions";
import { 
    Upload, 
    FilePdf, 
    Lock, 
    Users, 
    Pulse, 
    Link as LinkIcon, 
    ShieldCheck, 
    Folder as FolderIcon, 
    BookOpen, 
    Clock,
    Plus,
    CaretRight,
    Globe,
    CheckCircle,
    Info
} from "@phosphor-icons/react";
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
            const nextEducators = (matRes.data.availableEducators ?? []) as EducatorOption[];
            setMaterials((matRes.data.materials ?? []) as MaterialItem[]);
            setAvailableEducators(nextEducators);
            setIsAdminView(Boolean(matRes.data.isAdminView));
            setSelectedOwnerId((current) => current || nextEducators[0]?.id || "");
        }

        if (batchRes.success) {
            setBatches(batchRes.data);
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

    const heading = isAdminView ? "Academy Materials Hub" : "Teacher Resource Library";
    const subheading = isAdminView
        ? "Review every teacher-owned resource and manage content visibility for the entire academy."
        : "Securely share premium study materials and track student engagement across your batches.";

    return (
        <div className="space-y-6 pb-10 w-full max-w-[1280px] mx-auto font-outfit animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-[32px] bg-slate-900 p-10 text-white shadow-2xl group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none group-hover:bg-indigo-500/15 transition-all duration-1000" />
                <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-12 items-end">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                                <Plus size={24} weight="bold" className="text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Content Studio</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tighter mb-4">{heading}</h1>
                        <p className="text-slate-400 text-base font-medium leading-relaxed max-w-2xl">{subheading}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {[
                            { label: "Total Assets", value: materials.length, icon: FilePdf },
                            { label: "Unique Access", value: materials.reduce((s, m) => s + (m.accessedBy?.length ?? 0), 0), icon: Users },
                            { label: "Linked Batches", value: batches.length, icon: Globe }
                        ].map((stat) => (
                            <div key={stat.label} className="min-w-[130px] px-5 py-4 rounded-[20px] bg-white/5 border border-white/10 backdrop-blur-md text-center group/stat hover:bg-white/10 transition-all duration-500">
                                <div className="flex flex-col items-center gap-1.5">
                                    <stat.icon size={18} className="text-indigo-400/60 group-hover/stat:text-indigo-400 transition-colors" />
                                    <div className="text-2xl font-bold tracking-tight leading-none">{stat.value}</div>
                                    <div className="text-[8px] text-white/30 font-black uppercase tracking-widest group-hover/stat:text-white/50">{stat.label}</div>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8 pt-4">
                {/* Publish Form */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-100 shadow-sm p-6 rounded-[24px] h-fit space-y-6 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                        <Upload size={120} weight="bold" className="text-indigo-600" />
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <Upload size={24} weight="bold" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">New Content Distribution</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Share premium items with students</p>
                        </div>
                    </div>

                    <form onSubmit={handlePublish} className="space-y-6 relative z-10">
                        {/* Admin Owner Picker */}
                        {isAdminView && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Educator Owner</label>
                                <select value={selectedOwnerId} onChange={(e) => setSelectedOwnerId(e.target.value)}
                                    className="w-full h-14 border border-slate-100 rounded-2xl px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-sans font-semibold">
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
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Material Title</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                className="w-full h-14 border border-slate-100 rounded-2xl px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-sans font-semibold"
                                placeholder="e.g. CA Final Audit Revision Notes" />
                        </div>

                        {/* Distribution Toggles */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Target Audience</label>
                            <div className="flex p-1.5 rounded-2xl bg-slate-50 border border-slate-100 gap-1 mt-2">
                                <button type="button" onClick={() => setTargetMode("batch")}
                                    className={cn("flex-1 py-3 px-4 rounded-[14px] text-[10px] font-bold uppercase tracking-widest transition-all", targetMode === "batch" ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600")}>
                                    By Batch
                                </button>
                                <button type="button" onClick={() => setTargetMode("email")}
                                    className={cn("flex-1 py-3 px-4 rounded-[14px] text-[10px] font-bold uppercase tracking-widest transition-all", targetMode === "email" ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600")}>
                                    By Email
                                </button>
                            </div>
                        </div>

                        {/* Resource Protections */}
                        <div className={cn("p-5 rounded-2xl border transition-all cursor-pointer group/drm", isProtected ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-white")}>
                            <label className="flex items-start gap-4 cursor-pointer">
                                <input type="checkbox" checked={isProtected} onChange={(e) => setIsProtected(e.target.checked)}
                                    className="hidden" />
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isProtected ? "bg-white/10" : "bg-white border border-slate-100")}>
                                    <Lock size={20} weight={isProtected ? "fill" : "bold"} />
                                </div>
                                <div className="flex-1">
                                    <span className="block text-sm font-bold tracking-tight">DRM Protection</span>
                                    <span className={cn("block text-[10px] font-medium mt-0.5", isProtected ? "text-indigo-100" : "text-slate-400")}>
                                        Restrict downloading & printing. Forced in-app viewer.
                                    </span>
                                </div>
                                {isProtected && <CheckCircle size={20} weight="fill" className="text-white" />}
                            </label>
                        </div>

                        {/* Targets */}
                        <div className="space-y-4">
                            {targetMode === "batch" ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Batches</label>
                                        <span className="text-[10px] font-bold text-indigo-500">{selectedBatchIds.length} Selected</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto px-1 pt-1 pb-4 scrollbar-thin scrollbar-thumb-slate-200">
                                        {batches.map((b) => {
                                            const isSelected = selectedBatchIds.includes(b.id);
                                            return (
                                                <button key={b.id} type="button" onClick={() => toggleBatch(b.id)}
                                                    className={cn("rounded-2xl border p-4 text-left transition-all relative overflow-hidden group/btn",
                                                        isSelected ? "border-indigo-200 bg-indigo-50 shadow-sm" : "border-slate-100 bg-white hover:border-indigo-100")}>
                                                    <div className="flex items-center justify-between gap-4 relative z-10">
                                                        <div className="flex-1 min-w-0">
                                                            <p className={cn("font-bold text-sm tracking-tight", isSelected ? "text-indigo-900" : "text-slate-900")}>{b.name}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{b.studentCount} Students Linked</p>
                                                        </div>
                                                        {isSelected && <CheckCircle size={18} weight="fill" className="text-indigo-600 transition-all scale-110" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Student Emails</label>
                                    <textarea value={studentEmails} onChange={(e) => setStudentEmails(e.target.value)}
                                        className="w-full rounded-[24px] bg-slate-50/50 border border-slate-100 px-6 py-5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/20 transition-all font-sans font-medium leading-relaxed resize-none shadow-inner"
                                        placeholder="Enter emails separated by commas..." rows={4} />
                                </div>
                            )}
                        </div>

                        {/* File Target */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Attachment (PDF/Expert Content)</label>
                            <div className="relative group/upload">
                                <input type="file"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                    accept=".pdf,.png,.jpg" />
                                <div className={cn("w-full border-2 border-dashed rounded-[24px] p-6 text-center transition-all flex flex-col items-center gap-3",
                                    selectedFile ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-slate-50/50 border-slate-200 text-slate-400 group-hover/upload:bg-indigo-50 group-hover/upload:border-indigo-200 group-hover/upload:text-indigo-600")}>
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                        <FilePdf size={24} weight="bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold tracking-tight">{selectedFile ? selectedFile.name : "Select or Drop File to Encrypt"}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">PDF, JPG up to 50MB</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={isUploading || !selectedFile}
                            className="w-full h-16 bg-slate-900 hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-[24px] shadow-lg shadow-indigo-900/10 transition-all active:scale-95 flex items-center justify-center gap-3">
                            {isUploading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <LinkIcon size={18} weight="bold" />
                            )}
                            {isUploading ? "Encrypting Distribution..." : "Distribute to Students"}
                        </button>
                    </form>
                </div>

                {/* Distribution Activity */}
                <div className="space-y-8 flex flex-col">
                    <div className="bg-white/80 backdrop-blur-md p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 flex flex-col h-full">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-sm border border-slate-100/50">
                                    <Pulse size={24} weight="bold" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight tracking-tight">Access Control Center</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Manage existing distributions</p>
                                </div>
                            </div>
                            {isAdminView && (
                                <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-700">
                                    <ShieldCheck size={16} weight="bold" /> Academy Registry
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-4 max-h-[1000px] overflow-y-auto scrollbar-thin pr-2">
                            {materials.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-24 text-center space-y-6">
                                    <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200">
                                        <BookOpen size={48} weight="light" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-slate-900 tracking-tight uppercase tracking-widest text-xs">No Active Assets</h3>
                                        <p className="text-sm text-slate-400 max-w-xs leading-relaxed font-semibold">Your distribution history is currently empty. Use the content studio to publish your first resource.</p>
                                    </div>
                                </div>
                            ) : (
                                materials.map((material) => (
                                    <div key={material.id}
                                        className="bg-white/50 p-6 rounded-[28px] border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border group-hover:scale-105 transition-all duration-500", 
                                                material.isProtected ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-emerald-50 text-emerald-600 border-emerald-100")}>
                                                {material.isProtected ? <Lock size={24} weight="bold" /> : <FilePdf size={24} weight="bold" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors leading-tight">{material.title}</h3>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <Clock size={12} weight="bold" />
                                                        {new Date(material.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                    </div>
                                                    <span className="text-slate-200 opacity-50">•</span>
                                                    <div className={cn("text-[9px] font-black tracking-widest uppercase flex items-center gap-1 px-2 py-0.5 rounded-full",
                                                        material.isProtected ? "text-indigo-500 bg-indigo-50/50" : "text-emerald-500 bg-emerald-50/50")}>
                                                        {material.isProtected ? "DRM Locked" : "Public Download"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-2 text-slate-900">
                                                    <Users size={16} weight="bold" className="text-indigo-500" />
                                                    <span className="text-2xl font-bold tracking-tight">{material.accessedBy?.length ?? 0}</span>
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Student Access</span>
                                            </div>
                                            <button className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 transition-all active:scale-95 shadow-md shadow-slate-900/10">
                                                <CaretRight size={18} weight="bold" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-6 border-t border-slate-100 relative group/info">
                            <div className="flex items-start gap-4 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                                <Info size={20} weight="fill" className="text-indigo-600 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em] leading-none mb-1">Encrypted Content Registry</p>
                                    <p className="text-[11px] text-indigo-600/80 font-semibold leading-relaxed">
                                        All premium assets are encrypted at rest. Distribution access can be revoked at any time from the Manage library section.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
