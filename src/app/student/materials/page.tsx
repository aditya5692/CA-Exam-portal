"use client";

import { getStudentSharedMaterials } from "@/actions/educator-actions";
import { getStudentProfile } from "@/actions/profile-actions";
import { getSavedItems, toggleSavedItem } from "@/actions/student-actions";
import { deletePersonalMaterial, getMyVaultMaterials, uploadPersonalMaterial } from "@/actions/vault-actions";
import { StudentPageHeader } from "@/components/student/shared/page-header";
import { resolveStudentExamTarget } from "@/lib/student-level";
import { cn } from "@/lib/utils";
import { 
    Bookmark, 
    BookOpen, 
    Clock, 
    DownloadSimple, 
    FileText, 
    Flame, 
    Folder, 
    Lock, 
    ShieldCheck, 
    Star, 
    Trash, 
    LockOpen, 
    UploadSimple, 
    Users, 
    X,
} from "@phosphor-icons/react";
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
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500  ">
            <StudentPageHeader
                eyebrow={isAdminView ? "Admin protocol" : "Scholarly assets"}
                title={isAdminView ? "Materials" : "Study"}
                accent={isAdminView ? "Library" : "Notes"}
                description={isAdminView
                    ? "Manage student storage and shared educator resources from a central dashboard."
                    : "Access your personal study materials and resources shared by your educators."}
                daysToExam={isAdminView ? 0 : daysToExam}
            />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    {isAdminView && (
                        <div className="student-chip-accent inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest">
                            <ShieldCheck size={16} weight="bold" /> Admin
                        </div>
                    )}
                    <div className="flex rounded-xl border border-[var(--student-border)] bg-[var(--student-panel-muted)] p-1 shadow-sm">
                        <button
                            onClick={() => setActiveTab("MY_NOTES")}
                            className={cn(
                                "px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                                activeTab === "MY_NOTES" ? "bg-white text-[var(--student-accent-strong)] shadow-sm" : "text-[var(--student-muted)] hover:text-[var(--student-text)]"
                            )}
                        >
                            <Folder size={16} weight={activeTab === "MY_NOTES" ? "fill" : "bold"} /> 
                            {isAdminView ? "Students" : "Vault"}
                        </button>
                        <button
                            onClick={() => setActiveTab("EDUCATOR")}
                            className={cn(
                                "px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                                activeTab === "EDUCATOR" ? "bg-white text-[var(--student-accent-strong)] shadow-sm" : "text-[var(--student-muted)] hover:text-[var(--student-text)]"
                            )}
                        >
                            <LockOpen size={16} weight={activeTab === "EDUCATOR" ? "fill" : "bold"} /> 
                            {isAdminView ? "Faculty" : "Shared"}
                        </button>
                    </div>

                    {/* Compact Live Storage Widget */}
                    {activeTab === "MY_NOTES" && (
                        <div className="hidden sm:flex items-center gap-4 px-4 py-1.5 bg-white border border-[var(--student-border)] rounded-xl shadow-sm">
                            <div className="space-y-0.5">
                                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 opacity-60">Storage</div>
                                <div className="text-[10px] font-black text-slate-900">{formatBytes(storageUsed)} <span className="text-slate-400 font-bold">/ {formatBytes(storageLimit)}</span></div>
                            </div>
                            <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden">
                                <div 
                                    className={cn(
                                        "h-full transition-all duration-1000",
                                        usagePercent > 90 ? "bg-rose-500" : "bg-[var(--student-accent-strong)]"
                                    )}
                                    style={{ width: `${usagePercent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {!isAdminView && activeTab === "MY_NOTES" && (
                        <label className="student-button-primary cursor-pointer !rounded-xl px-6 py-2.5 flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-[var(--student-accent-soft-strong)]/10">
                            {isUploading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <UploadSimple size={18} weight="bold" />}
                            <span className="font-black text-[10px] uppercase tracking-widest">{isUploading ? "Syncing..." : "Upload Asset"}</span>
                            <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.png,.jpg,.jpeg" disabled={isUploading} />
                        </label>
                    )}
                </div>
            </div>

            {activeTab === "MY_NOTES" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {materials.length === 0 ? (
                            <div className="col-span-full py-16 text-center student-surface border-dashed rounded-2xl px-6">
                                <div className="w-16 h-16 rounded-2xl bg-[var(--student-panel-muted)] flex items-center justify-center mx-auto mb-6 shadow-inner border border-[var(--student-border)] text-[var(--student-muted)]">
                                    <BookOpen className="w-8 h-8 opacity-40" weight="bold" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Archive Empty</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{isAdminView ? "No files found." : "Upload your first note."}</p>
                            </div>
                        ) : (
                            materials.map((material) => (
                                <div key={material.id} className="group student-surface relative flex flex-col rounded-2xl p-5 transition-all duration-300 hover:border-[var(--student-accent-soft-strong)] hover:shadow-lg">
                                    {material.isTrending && (
                                        <div className="absolute top-4 right-4 z-10">
                                            <div className="bg-amber-500 text-white p-1.5 rounded-lg shadow-lg">
                                                <Flame size={12} weight="fill" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between gap-3 mb-6">
                                        <div className="w-12 h-12 flex items-center justify-center bg-[var(--student-panel-muted)] text-[var(--student-muted)] rounded-xl border border-[var(--student-border)] shadow-inner group-hover:bg-[var(--student-accent-soft)] group-hover:text-[var(--student-accent-strong)] transition-colors">
                                            <FileText className="w-6 h-6" weight="bold" />
                                        </div>
                                        <div className="flex gap-1.5 pointer-events-auto">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleSave(material.id, "MATERIAL");
                                                }}
                                                className={cn(
                                                    "rounded-lg p-2 transition-all active:scale-90 border",
                                                    savedIds.has(material.id) ? "student-button-primary text-white" : "bg-white border-slate-100 text-slate-400 hover:text-[var(--student-accent-strong)]"
                                                )}
                                            >
                                                <Bookmark size={14} weight={savedIds.has(material.id) ? "fill" : "bold"} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleDelete(material.id);
                                                }}
                                                className="rounded-lg bg-white p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all border border-slate-100 active:scale-90"
                                            >
                                                <Trash size={14} weight="bold" />
                                            </button>
                                        </div>
                                    </div>

                                    <button className="text-left w-full block group-hover:text-[var(--student-accent-strong)] transition-colors" onClick={() => setViewFileUrl(material.fileUrl)}>
                                        <div className="text-[9px] font-black text-[var(--student-accent-strong)] uppercase tracking-widest opacity-80 mb-1">{material.subType}</div>
                                        <h3 className="font-black text-slate-900 text-[15px] leading-tight line-clamp-2 min-h-[40px] tracking-tight mb-2 uppercase">
                                            {material.title}
                                        </h3>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{formatBytes(material.sizeInBytes)}</div>
                                    </button>

                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <DownloadSimple size={12} weight="bold" className="text-indigo-400" /> {material.downloads}
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <Star size={12} weight="fill" className="text-amber-400" /> {material.rating?.toFixed(1) || "5.0"}
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest">
                                            {new Date(material.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
                    <div className="bg-slate-950 p-8 rounded-2xl flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden border border-white/5">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--student-accent)] shrink-0">
                            <Lock size={24} weight="fill" />
                        </div>
                        <div className="flex-1 space-y-1 text-center sm:text-left relative z-10">
                            <h2 className="text-xl font-black text-white tracking-tight uppercase">Verified Educator Vault</h2>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest opacity-60">Sovereign Resources • System-Verified</p>
                        </div>
                    </div>

                    {(() => {
                        const educators = Array.from(new Set(sharedMaterials.map(m => m.uploadedBy?.fullName || "Expert")));
                        if (educators.length <= 1) return null;

                        return (
                            <div className="flex gap-2 overflow-x-auto pb-4 px-1 no-scrollbar">
                                <button
                                    onClick={() => setSelectedEducator("ALL")}
                                    className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", selectedEducator === "ALL" ? "student-button-primary text-white" : "bg-white text-slate-400 border border-slate-100 shadow-sm")}
                                >
                                    Global
                                </button>
                                {educators.map(ed => (
                                    <button
                                        key={ed}
                                        onClick={() => setSelectedEducator(ed)}
                                        className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", selectedEducator === ed ? "student-button-primary text-white" : "bg-white text-slate-400 border border-slate-100 shadow-sm")}
                                    >
                                        {ed.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sharedMaterials.filter(m => selectedEducator === "ALL" || (m.uploadedBy?.fullName || "Expert") === selectedEducator).length === 0 ? (
                            <div className="col-span-full py-16 text-center student-surface border-dashed rounded-2xl text-[10px] font-black text-slate-300 uppercase tracking-widest">Null Index</div>
                        ) : (
                            sharedMaterials
                                .filter(m => selectedEducator === "ALL" || (m.uploadedBy?.fullName || "Expert") === selectedEducator)
                                .map((material) => (
                                    <div key={material.id} className="group student-surface relative flex flex-col rounded-2xl p-5 transition-all duration-300 hover:border-indigo-200">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-12 h-12 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                                                {material.isProtected ? <Lock size={20} weight="fill" /> : <LockOpen size={20} weight="bold" />}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleSave(material.id, "MATERIAL");
                                                }}
                                                className={cn(
                                                    "rounded-lg p-2 transition-all border shadow-sm",
                                                    savedIds.has(material.id) ? "student-button-primary text-white" : "bg-white border-slate-100 text-slate-400 hover:text-indigo-600"
                                                )}
                                            >
                                                <Bookmark size={14} weight={savedIds.has(material.id) ? "fill" : "bold"} />
                                            </button>
                                        </div>

                                        <button className="text-left w-full block group-hover:text-indigo-600 transition-colors" onClick={() => setViewFileUrl(material.fileUrl)}>
                                            <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest opacity-80 mb-1">{material.subType}</div>
                                            <h3 className="font-black text-slate-900 text-[15px] leading-tight line-clamp-2 min-h-[40px] tracking-tight uppercase">
                                                {material.title}
                                            </h3>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Professor {material.uploadedBy?.fullName?.split(' ')[1] || "Faculty"}</div>
                                        </button>

                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    <DownloadSimple size={12} weight="bold" /> {material.downloads}
                                                </div>
                                                <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    <Star size={12} weight="fill" className="text-amber-400" /> {material.rating?.toFixed(1) || "5.0"}
                                                </div>
                                            </div>
                                            <div className="p-1 px-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                                                <ShieldCheck size={14} weight="bold" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            )}

            {viewFileUrl && (
                <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 lg:p-10 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-6xl h-full rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 border border-white/20">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg">
                                    <FileText size={20} weight="bold" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="font-black text-slate-900 tracking-tight text-base uppercase">Secure Asset Stream</h3>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">System Verified</p>
                                </div>
                            </div>
                            <button onClick={() => setViewFileUrl(null)} className="p-2.5 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-300 text-slate-300 active:scale-90">
                                <X size={20} weight="bold" />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-200/30 p-4 relative overflow-hidden" onContextMenu={(event) => event.preventDefault()}>
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] rotate-[-25deg] select-none">
                                <span className="text-[8rem] font-black text-slate-900 tracking-[0.2em]">FINANCLY</span>
                            </div>
                            
                            {viewFileUrl.endsWith(".pdf") ? (
                                <iframe src={`${viewFileUrl}#toolbar=0`} title="Secure Document Viewer" className="w-full h-full rounded-xl shadow-lg bg-white relative z-10 border border-white" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center relative z-10">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={viewFileUrl} alt="Document" className="max-w-full max-h-full object-contain rounded-xl shadow-lg" style={{ pointerEvents: "none" }} />
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-white border-t border-slate-50 flex justify-center">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                                <ShieldCheck size={14} weight="fill" className="text-emerald-400" /> Secure
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
