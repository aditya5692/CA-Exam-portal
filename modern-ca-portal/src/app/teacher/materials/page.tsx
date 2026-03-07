"use client";

import { useState, useEffect } from "react";
import { getTeacherMaterials, publishMaterial } from "@/actions/educator-actions";
import { Upload, FileText, Lock, Users, Activity, ExternalLink, ShieldCheck } from "lucide-react";

type EducatorOption = {
    id: string;
    fullName: string | null;
    email: string | null;
    role: string;
};

type MaterialAccess = {
    id: string;
    student: {
        id: string;
        fullName: string | null;
        email: string | null;
    };
};

type MaterialItem = {
    id: string;
    title: string;
    createdAt: string | Date;
    isProtected: boolean;
    uploadedBy?: {
        id: string;
        fullName: string | null;
        email: string | null;
        role: string;
    };
    accessedBy?: MaterialAccess[];
};

export default function EducatorHubPage() {
    const [materials, setMaterials] = useState<MaterialItem[]>([]);
    const [availableEducators, setAvailableEducators] = useState<EducatorOption[]>([]);
    const [isAdminView, setIsAdminView] = useState(false);
    const [selectedOwnerId, setSelectedOwnerId] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const [title, setTitle] = useState("");
    const [studentEmails, setStudentEmails] = useState("");
    const [isProtected, setIsProtected] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const loadData = async () => {
        const res = await getTeacherMaterials();
        if (!res.success) {
            return;
        }

        const nextEducators = (res.availableEducators ?? []) as EducatorOption[];
        setMaterials((res.materials ?? []) as MaterialItem[]);
        setAvailableEducators(nextEducators);
        setIsAdminView(Boolean(res.isAdminView));
        setSelectedOwnerId((current) => current || nextEducators[0]?.id || "");
    };

    useEffect(() => {
        void loadData();
    }, []);

    const handlePublish = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedFile) {
            alert("Please select a file to distribute.");
            return;
        }

        if (isAdminView && !selectedOwnerId) {
            alert("Select the educator who should own this material.");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("title", title || selectedFile.name);
        formData.append("studentEmails", studentEmails);
        formData.append("isProtected", String(isProtected));
        if (isAdminView) {
            formData.append("ownerId", selectedOwnerId);
        }

        const res = await publishMaterial(formData);

        setIsUploading(false);
        if (res.success) {
            alert("Material published successfully.");
            setTitle("");
            setStudentEmails("");
            setSelectedFile(null);
            void loadData();
        } else {
            alert(res.message || "Failed to publish.");
        }
    };

    const heading = isAdminView ? "Academy Publishing Hub" : "Educator Publishing Hub";
    const subheading = isAdminView
        ? "Review every teacher-owned material and publish new distributions into the correct educator account."
        : "Securely distribute premium materials directly to your students' vaults.";

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {heading}
                </h1>
                <p className="text-gray-500 mt-1">{subheading}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-b from-white to-purple-50/30 dark:from-zinc-900 dark:to-purple-900/10 p-6 rounded-2xl shadow-sm h-fit">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                        <Upload className="w-5 h-5 text-indigo-500" /> New Distribution
                    </h2>

                    <form onSubmit={handlePublish} className="space-y-4">
                        {isAdminView && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Educator Owner</label>
                                <select
                                    value={selectedOwnerId}
                                    onChange={(event) => setSelectedOwnerId(event.target.value)}
                                    className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg p-2.5 text-sm"
                                >
                                    <option value="">Select educator</option>
                                    {availableEducators.map((educator) => (
                                        <option key={educator.id} value={educator.id}>
                                            {(educator.fullName || educator.email || "Educator") + (educator.role === "ADMIN" ? " (Admin)" : "")}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">New materials will be stored under this educator and reflected in their teacher workflow.</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">Material Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg p-2.5 text-sm"
                                placeholder="e.g. Chapter 1 Final Revision"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 flex items-center justify-between">
                                Target Students (Emails)
                                <span className="text-[10px] text-gray-500 font-normal">Comma separated</span>
                            </label>
                            <textarea
                                value={studentEmails}
                                onChange={(event) => setStudentEmails(event.target.value)}
                                className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg p-2.5 text-sm"
                                placeholder="student@example.com, another@test.com"
                                rows={3}
                            />
                        </div>

                        <div className="border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isProtected}
                                    onChange={(event) => setIsProtected(event.target.checked)}
                                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="block text-sm font-medium text-indigo-900 dark:text-indigo-200">Enable DRM Protection</span>
                                    <span className="block text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                                        Prevent downloading and printing. Students must use the secure in-app viewer.
                                    </span>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Select File (PDF/Image)</label>
                            <input
                                type="file"
                                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-200 cursor-pointer"
                                accept=".pdf,.png,.jpg"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isUploading || !selectedFile}
                            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isUploading ? <span className="animate-spin text-xl">o</span> : <ExternalLink className="w-4 h-4" />}
                            {isUploading ? "Encrypting and Distributing..." : "Publish to Students"}
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-gray-500" /> Distribution Activity
                        </h2>
                        {isAdminView && (
                            <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700">
                                <ShieldCheck className="w-4 h-4" /> Academy-wide admin view
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {materials.length === 0 ? (
                            <div className="py-12 text-center text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                                {isAdminView ? "No teacher-published materials found yet." : "You have not published any materials yet."}
                            </div>
                        ) : (
                            materials.map((material) => (
                                <div key={material.id} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${material.isProtected ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "bg-green-50 dark:bg-green-900/20 text-green-600"}`}>
                                            {material.isProtected ? <Lock className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{material.title}</h3>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                                                <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                                                <span className={material.isProtected ? "text-indigo-600 dark:text-indigo-400" : "text-green-600 dark:text-green-400"}>
                                                    {material.isProtected ? "DRM Protected" : "Downloadable"}
                                                </span>
                                            </p>
                                            {isAdminView && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Owner: {material.uploadedBy?.fullName || material.uploadedBy?.email || "Educator"}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800/50 px-4 py-2 rounded-lg justify-between sm:justify-end border border-gray-100 dark:border-zinc-800">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <div className="text-right">
                                            <span className="block text-sm font-bold">{material.accessedBy?.length || 0}</span>
                                            <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Students</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
