"use client";

import { getStudentSharedMaterials } from "@/actions/educator-actions";
import { getStudentProfile } from "@/actions/profile-actions";
import { getSavedItems, toggleSavedItem } from "@/actions/student-actions";
import { deletePersonalMaterial, getMyVaultMaterials, uploadPersonalMaterial } from "@/actions/vault-actions";
import { StudentPageHeader } from "@/components/student/shared/page-header";
import { resolveStudentExamTarget } from "@/lib/student-level";
import { cn } from "@/lib/utils";
import { Bookmark, BookOpen, Clock, Download, FileText, Flame, Folder as FolderIcon, Lock, ShieldCheck, Star, Trash2, Unlock, Upload, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

type VaultMaterial = {
    id: string;
    title: string;
    description?: string;
    fileUrl: string;
    sizeInBytes: number;
    createdAt: string | Date;
    subType: string;
    downloads: number;
    rating: number;
    isTrending: boolean;
    uploadedBy?: {
        id: string;
        fullName: string | null;
        email: string | null;
    };
};

type SharedMaterial = {
    id: string;
    title: string;
    description?: string;
    fileUrl: string;
    isProtected: boolean;
    subType: string;
    downloads: number;
    rating: number;
    isTrending: boolean;
    uploadedBy?: {
        fullName: string | null;
        email: string | null;
    };
    accessedBy?: Array<{
        id: string;
        student: {
            id: string;
            fullName: string | null;
            email: string | null;
        };
    }>;
};

export default function StudentVaultPage() {
    const [activeTab, setActiveTab] = useState<"MY_NOTES" | "EDUCATOR">("MY_NOTES");
    const [materials, setMaterials] = useState<VaultMaterial[]>([]);
    const [sharedMaterials, setSharedMaterials] = useState<SharedMaterial[]>([]);
    const [selectedEducator, setSelectedEducator] = useState<string>("ALL");
    const [storageUsed, setStorageUsed] = useState(0);
    const [storageLimit, setStorageLimit] = useState(52428800);
    const [managedStudentsCount, setManagedStudentsCount] = useState(1);
    const [isAdminView, setIsAdminView] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [viewFileUrl, setViewFileUrl] = useState<string | null>(null);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [daysToExam, setDaysToExam] = useState(0);

    const loadData = async () => {
        const vaultRes = await getMyVaultMaterials();
        if (vaultRes.success && vaultRes.data) {
            setMaterials((vaultRes.data.materials ?? []) as VaultMaterial[]);
            setStorageUsed(vaultRes.data.storageUsed || 0);
            setStorageLimit(vaultRes.data.storageLimit || 52428800);
            setManagedStudentsCount(vaultRes.data.managedStudentsCount || 1);
            setIsAdminView(Boolean(vaultRes.data.isAdminView));
        }

        const sharedRes = await getStudentSharedMaterials();
        if (sharedRes.success && sharedRes.data) {
            const sd = sharedRes.data;
            setSharedMaterials((sd.materials ?? []) as SharedMaterial[]);
            setIsAdminView((current) => current || Boolean(sd.isAdminView));
        }

        const profileRes = await getStudentProfile();
        if (profileRes.success && profileRes.data) {
            setDaysToExam(resolveStudentExamTarget(profileRes.data).daysToExam);
        }

        const savedRes = await getSavedItems();
        if (savedRes.success && savedRes.data) {
            const ids = new Set([
                ...(savedRes.data.materials || []).map((material) => material.id),
                ...(savedRes.data.exams || []).map((exam) => exam.id)
            ]);
            setSavedIds(ids);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadData();
        }, 0);

        return () => window.clearTimeout(timer);
    }, []);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const res = await uploadPersonalMaterial(formData);

        setIsUploading(false);
        if (res.success) {
            await loadData();
            alert("Upload successful.");
        } else {
            alert(res.message || "Upload failed.");
        }
    };

    const handleDelete = async (materialId: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this material?");
        if (!confirmed) {
            return;
        }

        const res = await deletePersonalMaterial(materialId);
        if (res.success) {
            await loadData();
        } else {
            alert(res.message || "Delete failed.");
        }
    };

    const handleToggleSave = async (id: string, type: "MATERIAL" | "EXAM") => {
        const res = await toggleSavedItem(id, type);
        if (res.success && res.data) {
            setSavedIds(prev => {
                const next = new Set(prev);
                if (res.data!.saved) next.add(id);
                else next.delete(id);
                return next;
            });
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const units = ["Bytes", "KB", "MB", "GB"];
        const index = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${parseFloat((bytes / Math.pow(1024, index)).toFixed(2))} ${units[index]}`;
    };

    const usagePercent = storageLimit > 0 ? Math.min(100, (storageUsed / storageLimit) * 100) : 0;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 font-outfit">
            <StudentPageHeader
                eyebrow={isAdminView ? "Admin protocol" : "Scholarly assets"}
                title={isAdminView ? "Materials" : "Study"}
                accent={isAdminView ? "Library" : "Notes"}
                description={isAdminView
                    ? "Manage student storage and shared educator resources from a central dashboard."
                    : "Access your personal study materials and resources shared by your educators."}
                daysToExam={isAdminView ? 0 : daysToExam}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                    {isAdminView && (
                        <div className="student-chip-accent inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest">
                            <ShieldCheck size={18} /> Admin View
                        </div>
                    )}
                    <div className="flex rounded-xl border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-1.5 shadow-inner">
                        <button
                            onClick={() => setActiveTab("MY_NOTES")}
                            className={cn(
                                "px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200 flex items-center gap-2",
                                activeTab === "MY_NOTES" ? "student-tab-active" : "text-[var(--student-muted)] hover:text-[var(--student-text)]"
                            )}
                        >
                            <FolderIcon size={16} /> {isAdminView ? "Student Files" : "Personal Notes"}
                        </button>
                        <button
                            onClick={() => setActiveTab("EDUCATOR")}
                            className={cn(
                                "px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200 flex items-center gap-2",
                                activeTab === "EDUCATOR" ? "student-tab-active" : "text-[var(--student-muted)] hover:text-[var(--student-text)]"
                            )}
                        >
                            <Lock size={16} /> {isAdminView ? "Shared Resources" : "Educator Files"}
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === "MY_NOTES" && (
                <div className="space-y-6">
                    <div className="student-surface rounded-2xl p-8">
                        <div className="flex justify-between items-end mb-5 gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)] opacity-80">{isAdminView ? `Total Student Storage (${managedStudentsCount})` : "Personal Storage"}</span>
                                <p className="font-outfit text-3xl font-bold tracking-tight text-[var(--student-text)]">
                                    {formatBytes(storageUsed)} <span className="ml-2 font-sans text-[10px] font-bold uppercase tracking-widest text-[var(--student-muted)] opacity-70">Used</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="student-chip-accent rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest">
                                    Limit: {formatBytes(storageLimit)}
                                </span>
                            </div>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--student-panel-muted)] shadow-inner">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${usagePercent > 90 ? "bg-rose-500" : "bg-[var(--student-accent)]"}`}
                                style={{ width: `${usagePercent}%` }}
                            />
                        </div>
                        {!isAdminView && usagePercent > 80 && (
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-4 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Storage limit almost reached. Upgrade to Pro for more space.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-950 font-outfit tracking-tight">{isAdminView ? "Document Index" : "Materials"}</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">Manage your study files</p>
                        </div>
                        {!isAdminView && (
                            <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-slate-900/10 border border-slate-900">
                                {isUploading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Upload size={18} />}
                                {isUploading ? "Uploading..." : "Upload File"}
                                <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.png,.jpg,.jpeg" disabled={isUploading} />
                            </label>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {materials.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <BookOpen className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 font-outfit tracking-tight uppercase">Empty</h3>
                                <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto mt-2 opacity-70">
                                    {isAdminView ? "No files have been added yet." : "Upload your first study material to get started."}
                                </p>
                            </div>
                        ) : (
                            materials.map((material) => (
                                <div key={material.id} className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col h-full">
                                    {material.isTrending && (
                                        <div className="absolute top-4 left-4 z-10">
                                            <span className="bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                                <Flame className="w-3.5 h-3.5 fill-current" /> Trending
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between gap-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl border border-slate-100 shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-500/80 transition-all duration-300">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-widest bg-indigo-50/50 px-2.5 py-1 rounded-full border border-indigo-100/50">{material.subType}</span>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 ml-1 opacity-70">
                                                    {formatBytes(material.sizeInBytes)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleSave(material.id, "MATERIAL");
                                                }}
                                                className={cn(
                                                    "rounded-xl p-2.5 transition-all active:scale-95 border",
                                                    savedIds.has(material.id)
                                                        ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-900/10"
                                                        : "bg-slate-50 border-slate-100 text-slate-400 hover:text-indigo-500 hover:bg-white hover:border-indigo-100"
                                                )}
                                                title={savedIds.has(material.id) ? "Saved" : "Save for later"}
                                            >
                                                <Bookmark className={cn("w-4 h-4", savedIds.has(material.id) && "fill-current")} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleDelete(material.id);
                                                }}
                                                className="rounded-xl bg-slate-50 p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-slate-100 hover:border-rose-100 active:scale-95"
                                                title="Delete asset"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <button className="text-left w-full block group-hover:text-indigo-500/80 transition-colors" onClick={() => setViewFileUrl(material.fileUrl)}>
                                        <h3 className="font-bold text-slate-900 text-base leading-tight line-clamp-2 min-h-[44px] font-outfit tracking-tight">
                                            {material.title}
                                        </h3>
                                        {material.description && (
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 line-clamp-1 opacity-60">{material.description}</p>
                                        )}
                                    </button>

                                    <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <Download className="w-3.5 h-3.5 text-indigo-500" /> {material.downloads > 1000 ? (material.downloads / 1000).toFixed(1) + 'k' : material.downloads}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <Star className="w-3.5 h-3.5 text-amber-500 fill-current" /> {material.rating?.toFixed(1) || "5.0"}
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                            {new Date(material.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === "EDUCATOR" && (
                <div className="space-y-6">
                    <div className="bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 shrink-0">
                            <Lock size={28} />
                        </div>
                        <div className="flex-1 space-y-2 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-white font-outfit tracking-tight">
                                {isAdminView ? "Educator Materials" : "Educator Resources"}
                            </h2>
                            <p className="text-slate-400 font-medium max-w-2xl leading-relaxed text-sm opacity-80 mt-1">
                                {isAdminView
                                    ? "These and high-value materials are managed directly by educators."
                                    : "Premium resources shared by your faculty. These do not count towards your personal storage limit."}
                            </p>
                        </div>
                    </div>

                    {(() => {
                        const educators = Array.from(new Set(sharedMaterials.map(m => m.uploadedBy?.fullName || "Expert")));
                        if (educators.length <= 1) return null;

                        return (
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                <button
                                    onClick={() => setSelectedEducator("ALL")}
                                    className={cn("px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all", selectedEducator === "ALL" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100")}
                                >
                                    All Educators
                                </button>
                                {educators.map(ed => (
                                    <button
                                        key={ed}
                                        onClick={() => setSelectedEducator(ed)}
                                        className={cn("px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all", selectedEducator === ed ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100")}
                                    >
                                        {ed}
                                    </button>
                                ))}
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sharedMaterials.filter(m => selectedEducator === "ALL" || (m.uploadedBy?.fullName || "Expert") === selectedEducator).length === 0 ? (
                            <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                                {isAdminView ? "No educator materials have been distributed yet." : "No educator materials shared with you yet."}
                            </div>
                        ) : (
                            sharedMaterials
                                .filter(m => selectedEducator === "ALL" || (m.uploadedBy?.fullName || "Expert") === selectedEducator)
                                .map((material) => (
                                    <div key={material.id} className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
                                        {material.isTrending && (
                                            <div className="absolute top-4 left-4 z-10">
                                                <span className="bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                                    <Flame className="w-3.5 h-3.5 fill-current" /> Trending
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-start justify-between relative z-10 mb-6 gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500/80 rounded-xl">
                                                    {material.isProtected ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-widest">{material.subType}</span>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">Study Material</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleSave(material.id, "MATERIAL");
                                                    }}
                                                    className={cn(
                                                        "rounded-xl p-2.5 transition-all shadow-sm border active:scale-95",
                                                        savedIds.has(material.id)
                                                            ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-900/10"
                                                            : "bg-white border-slate-100 text-slate-400 hover:text-indigo-500 hover:border-indigo-100"
                                                    )}
                                                    title={savedIds.has(material.id) ? "Saved" : "Save for later"}
                                                >
                                                    <Bookmark className={cn("w-4 h-4", savedIds.has(material.id) && "fill-current")} />
                                                </button>
                                                {isAdminView && (
                                                    <div className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-500/80">
                                                        <Users className="w-3 h-3" /> {material.accessedBy?.length || 0}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button className="text-left w-full block group-hover:text-indigo-500/80 transition-colors" onClick={() => setViewFileUrl(material.fileUrl)}>
                                            <h3 className="font-bold text-slate-900 text-base leading-tight line-clamp-2 min-h-[44px] font-outfit tracking-tight">
                                                {material.title}
                                            </h3>
                                            {material.description && (
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 line-clamp-2 min-h-[32px] opacity-60">{material.description}</p>
                                            )}
                                        </button>

                                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <Download className="w-3.5 h-3.5 text-indigo-400" /> {material.downloads > 1000 ? (material.downloads / 1000).toFixed(1) + 'k' : material.downloads}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" /> {material.rating?.toFixed(1) || "5.0"}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50/50 px-2 py-0.5 rounded-full border border-indigo-100/50">
                                                By {material.uploadedBy?.fullName?.split(' ')[1] || "Expert"}
                                            </span>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            )}

            {viewFileUrl && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold flex items-center gap-2 text-slate-800 font-outfit tracking-tight">
                                <FileText size={18} className="text-indigo-600" /> Document Viewer
                            </h3>
                            <button onClick={() => setViewFileUrl(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-900">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-100 p-4 relative" onContextMenu={(event) => event.preventDefault()}>
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] rotate-[-30deg]">
                                <span className="text-6xl font-bold text-slate-950 uppercase tracking-widest">FINANCLY</span>
                            </div>
                            {viewFileUrl.endsWith(".pdf") ? (
                                <iframe src={`${viewFileUrl}#toolbar=0`} title="Secure Document Viewer" className="w-full h-full rounded-lg shadow-sm bg-white" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={viewFileUrl} alt="Document" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" style={{ pointerEvents: "none" }} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
