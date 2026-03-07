"use client";

import { useState, useEffect } from "react";
import { getMyVaultMaterials, uploadPersonalMaterial } from "@/actions/vault-actions";
import { getStudentSharedMaterials } from "@/actions/educator-actions";
import { Upload, FileText, Lock, Unlock, Folder as FolderIcon, X } from "lucide-react";

export default function StudentVaultPage() {
    const [activeTab, setActiveTab] = useState<"MY_NOTES" | "EDUCATOR">("MY_NOTES");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [materials, setMaterials] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sharedMaterials, setSharedMaterials] = useState<any[]>([]);
    const [storageUsed, setStorageUsed] = useState(0);
    const [storageLimit, setStorageLimit] = useState(52428800);
    const [isUploading, setIsUploading] = useState(false);
    const [viewFileUrl, setViewFileUrl] = useState<string | null>(null);

    const loadData = async () => {
        const vaultRes = await getMyVaultMaterials();
        if (vaultRes.success) {
            setMaterials(vaultRes.materials || []);
            setStorageUsed(vaultRes.storageUsed || 0);
            setStorageLimit(vaultRes.storageLimit || 52428800);
        }

        const sharedRes = await getStudentSharedMaterials();
        if (sharedRes.success) {
            setSharedMaterials(sharedRes.materials || []);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadData();
        }, 0);

        return () => window.clearTimeout(timer);
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const res = await uploadPersonalMaterial(formData);

        setIsUploading(false);
        if (res.success) {
            loadData();
            alert("Upload successful!");
        } else {
            alert(res.message || "Upload failed");
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const usagePercent = Math.min(100, (storageUsed / storageLimit) * 100);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Smart Study Vault
                    </h1>
                    <p className="text-gray-500 mt-1">Organize your notes and access premium educator materials.</p>
                </div>

                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab("MY_NOTES")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'MY_NOTES' ? 'bg-white dark:bg-zinc-700 shadow flex items-center gap-2' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2'}`}
                    >
                        <FolderIcon className="w-4 h-4" /> My Notes
                    </button>
                    <button
                        onClick={() => setActiveTab("EDUCATOR")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'EDUCATOR' ? 'bg-white dark:bg-zinc-700 shadow flex items-center gap-2' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2'}`}
                    >
                        <Lock className="w-4 h-4" /> Educator Materials
                    </button>
                </div>
            </div>

            {activeTab === "MY_NOTES" && (
                <div className="space-y-6">
                    {/* Quota Bar */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Storage Quota (Free Plan)</span>
                            <span className="text-sm font-bold text-blue-600">
                                {formatBytes(storageUsed)} / {formatBytes(storageLimit)}
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all duration-1000 ${usagePercent > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                                style={{ width: `${usagePercent}%` }}
                            />
                        </div>
                        {usagePercent > 80 && (
                            <p className="text-xs text-red-500 mt-2">You are nearing your storage limit. Upgrade to Pro for 1GB.</p>
                        )}
                    </div>

                    {/* Upload & List */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Recent Uploads</h2>
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                            {isUploading ? <span className="animate-spin text-xl">↻</span> : <Upload className="w-4 h-4" />}
                            {isUploading ? 'Uploading...' : 'Upload File'}
                            <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.png,.jpg,.jpeg" disabled={isUploading} />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {materials.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                                No personal notes uploaded yet.
                            </div>
                        ) : (
                            materials.map(mat => (
                                <div key={mat.id} className="group bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setViewFileUrl(mat.fileUrl)}>
                                    <div className="flex items-start justify-between">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded-full">
                                            {formatBytes(mat.sizeInBytes)}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold mt-4 line-clamp-1">{mat.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1">Uploaded {new Date(mat.createdAt).toLocaleDateString()}</p>
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
                            <Lock className="w-5 h-5" /> Secured Educator Hub
                        </h2>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-2">
                            These premium materials have been shared with you by your registered educators.
                            They do not count towards your simple personal storage quota.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sharedMaterials.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                                No educator materials shared with you yet.
                            </div>
                        ) : (
                            sharedMaterials.map(mat => (
                                <div key={mat.id} className="group bg-white dark:bg-zinc-900 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden" onClick={() => setViewFileUrl(mat.fileUrl)}>
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 transform rotate-45 translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg">
                                            {mat.isProtected ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mt-4 line-clamp-1 relative z-10">{mat.title}</h3>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 relative z-10 font-medium border-t border-indigo-50 pt-2 mt-3">
                                        By {mat.uploadedBy?.fullName || "Educator"}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Document Viewer Modal Overlay */}
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
                        <div className="flex-1 bg-gray-100 dark:bg-zinc-900 p-4 relative" onContextMenu={(e) => e.preventDefault()}>
                            {/* Simple DRM visual deterrence */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 rotate-[-30deg]">
                                <span className="text-6xl font-black text-black dark:text-white">STUDENT@EXAMPLE.COM</span>
                            </div>
                            {viewFileUrl.endsWith('.pdf') ? (
                                <iframe src={`${viewFileUrl}#toolbar=0`} title="Secure Document Viewer" className="w-full h-full rounded-lg shadow-sm bg-white" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={viewFileUrl} alt="Document" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" style={{ pointerEvents: 'none' }} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
