"use client";

import { useState, useEffect } from "react";
import { deletePersonalMaterial, getMyVaultMaterials, uploadPersonalMaterial } from "@/actions/vault-actions";
import { getStudentSharedMaterials } from "@/actions/educator-actions";
import { Upload, FileText, Lock, Unlock, Folder as FolderIcon, X, ShieldCheck, Trash2, Users, BookOpen, Clock } from "lucide-react";

type VaultMaterial = {
    id: string;
    title: string;
    fileUrl: string;
    sizeInBytes: number;
    createdAt: string | Date;
    uploadedBy?: {
        id: string;
        fullName: string | null;
        email: string | null;
    };
};

type SharedMaterial = {
    id: string;
    title: string;
    fileUrl: string;
    isProtected: boolean;
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
    const [storageUsed, setStorageUsed] = useState(0);
    const [storageLimit, setStorageLimit] = useState(52428800);
    const [managedStudentsCount, setManagedStudentsCount] = useState(1);
    const [isAdminView, setIsAdminView] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [viewFileUrl, setViewFileUrl] = useState<string | null>(null);

    const loadData = async () => {
        const vaultRes = await getMyVaultMaterials();
        if (vaultRes.success) {
            setMaterials((vaultRes.materials ?? []) as VaultMaterial[]);
            setStorageUsed(vaultRes.storageUsed || 0);
            setStorageLimit(vaultRes.storageLimit || 52428800);
            setManagedStudentsCount(vaultRes.managedStudentsCount || 1);
            setIsAdminView(Boolean(vaultRes.isAdminView));
        }

        const sharedRes = await getStudentSharedMaterials();
        if (sharedRes.success) {
            setSharedMaterials((sharedRes.materials ?? []) as SharedMaterial[]);
            setIsAdminView((current) => current || Boolean(sharedRes.isAdminView));
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
        const confirmed = window.confirm("Delete this note from the vault?");
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

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const units = ["Bytes", "KB", "MB", "GB"];
        const index = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${parseFloat((bytes / Math.pow(1024, index)).toFixed(2))} ${units[index]}`;
    };

    const usagePercent = storageLimit > 0 ? Math.min(100, (storageUsed / storageLimit) * 100) : 0;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {isAdminView ? "Academy Study Vault" : "Smart Study Vault"}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isAdminView
                            ? "Monitor student-owned notes and distributed educator materials from the same student vault surface."
                            : "Organize your notes and access premium educator materials."}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {isAdminView && (
                        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700 inline-flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Academy-wide admin view
                        </div>
                    )}
                    <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab("MY_NOTES")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "MY_NOTES" ? "bg-white dark:bg-zinc-700 shadow flex items-center gap-2" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2"}`}
                        >
                            <FolderIcon className="w-4 h-4" /> {isAdminView ? "Student Notes" : "My Notes"}
                        </button>
                        <button
                            onClick={() => setActiveTab("EDUCATOR")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "EDUCATOR" ? "bg-white dark:bg-zinc-700 shadow flex items-center gap-2" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2"}`}
                        >
                            <Lock className="w-4 h-4" /> Educator Materials
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === "MY_NOTES" && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex justify-between items-center mb-2 gap-4">
                            <span className="text-sm font-medium">{isAdminView ? `Managed Student Storage (${managedStudentsCount})` : "Storage Quota (Free Plan)"}</span>
                            <span className="text-sm font-bold text-blue-600">
                                {formatBytes(storageUsed)} / {formatBytes(storageLimit)}
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all duration-1000 ${usagePercent > 90 ? "bg-red-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"}`}
                                style={{ width: `${usagePercent}%` }}
                            />
                        </div>
                        {!isAdminView && usagePercent > 80 && (
                            <p className="text-xs text-red-500 mt-2">You are nearing your storage limit. Upgrade to Pro for 1GB.</p>
                        )}
                    </div>

                    <div className="flex justify-between items-center gap-4">
                        <h2 className="text-xl font-semibold">{isAdminView ? "Recent Student Notes" : "Recent Uploads"}</h2>
                        {!isAdminView && (
                            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                                {isUploading ? <span className="animate-spin text-xl">o</span> : <Upload className="w-4 h-4" />}
                                {isUploading ? "Uploading..." : "Upload File"}
                                <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.png,.jpg,.jpeg" disabled={isUploading} />
                            </label>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {materials.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                                {isAdminView ? "No student notes have been uploaded yet." : "No personal notes uploaded yet."}
                            </div>
                        ) : (
                            materials.map((material) => (
                                <div key={material.id} className="group bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                    <div className="flex items-start justify-between gap-3">
                                        <button className="text-left flex-1" onClick={() => setViewFileUrl(material.fileUrl)}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded-full">
                                                    {formatBytes(material.sizeInBytes)}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold mt-4 line-clamp-1">{material.title}</h3>
                                            <p className="text-xs text-gray-500 mt-1">Uploaded {new Date(material.createdAt).toLocaleDateString()}</p>
                                            {isAdminView && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Student: {material.uploadedBy?.fullName || material.uploadedBy?.email || "Student"}
                                                </p>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void handleDelete(material.id)}
                                            className="rounded-lg bg-gray-100 p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            title="Delete material"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === "EDUCATOR" && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50 p-6 rounded-xl">
                        <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                            <Lock className="w-5 h-5" /> {isAdminView ? "Distributed Educator Materials" : "Secured Educator Hub"}
                        </h2>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-2">
                            {isAdminView
                                ? "Review the material library teachers have distributed to students across the academy."
                                : "These premium materials have been shared with you by your registered educators. They do not count towards your personal storage quota."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sharedMaterials.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                                {isAdminView ? "No educator materials have been distributed yet." : "No educator materials shared with you yet."}
                            </div>
                        ) : (
                            sharedMaterials.map((material) => (
                                <div key={material.id} className="group bg-white dark:bg-zinc-900 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden" onClick={() => setViewFileUrl(material.fileUrl)}>
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 transform rotate-45 translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg">
                                            {material.isProtected ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                                        </div>
                                        {isAdminView && (
                                            <div className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-indigo-700">
                                                <Users className="w-3 h-3" /> {material.accessedBy?.length || 0}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mt-4 line-clamp-1 relative z-10">{material.title}</h3>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 relative z-10 font-medium border-t border-indigo-50 pt-2 mt-3">
                                        By {material.uploadedBy?.fullName || material.uploadedBy?.email || "Educator"}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {viewFileUrl && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Lock className="w-4 h-4 text-indigo-500" /> Secure Document Viewer
                            </h3>
                            <button onClick={() => setViewFileUrl(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-zinc-900 p-4 relative" onContextMenu={(event) => event.preventDefault()}>
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 rotate-[-30deg]">
                                <span className="text-6xl font-black text-black dark:text-white">MODERN-CA-PORTAL</span>
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
