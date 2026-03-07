"use client";

import { useState, useEffect } from "react";
import { getTeacherMaterials, publishMaterial } from "@/actions/educator-actions";
import { Upload, FileText, Lock, Users, Activity, ExternalLink } from "lucide-react";

export default function EducatorHubPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [materials, setMaterials] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [studentEmails, setStudentEmails] = useState("");
    const [isProtected, setIsProtected] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const loadData = async () => {
        const res = await getTeacherMaterials();
        if (res.success) {
            setMaterials(res.materials || []);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return alert("Please select a file to distribute.");

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("title", title || selectedFile.name);
        formData.append("studentEmails", studentEmails);
        formData.append("isProtected", String(isProtected));

        const res = await publishMaterial(formData);

        setIsUploading(false);
        if (res.success) {
            alert("✨ Material published and distributed successfully!");
            setTitle("");
            setStudentEmails("");
            setSelectedFile(null);
            loadData();
        } else {
            alert(res.message || "Failed to publish");
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Educator Publishing Hub
                </h1>
                <p className="text-gray-500 mt-1">Securely distribute premium materials directly to your students' vaults.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Publish Form */}
                <div className="lg:col-span-1 border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-b from-white to-purple-50/30 dark:from-zinc-900 dark:to-purple-900/10 p-6 rounded-2xl shadow-sm h-fit">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                        <Upload className="w-5 h-5 text-indigo-500" /> New Distribution
                    </h2>

                    <form onSubmit={handlePublish} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Material Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
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
                                onChange={e => setStudentEmails(e.target.value)}
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
                                    onChange={e => setIsProtected(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="block text-sm font-medium text-indigo-900 dark:text-indigo-200">Enable DRM Protection</span>
                                    <span className="block text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                                        Prevents downloading & printing. Students must use the secure in-app viewer.
                                    </span>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Select File (PDF/Image)</label>
                            <input
                                type="file"
                                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-200 cursor-pointer"
                                accept=".pdf,.png,.jpg"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isUploading || !selectedFile}
                            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isUploading ? <span className="animate-spin text-xl">↻</span> : <ExternalLink className="w-4 h-4" />}
                            {isUploading ? 'Encrypting & Distributing...' : 'Publish to Students'}
                        </button>
                    </form>
                </div>

                {/* Tracking & Analytics */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-500" /> Distribution Activity
                    </h2>

                    <div className="grid grid-cols-1 gap-4">
                        {materials.length === 0 ? (
                            <div className="py-12 text-center text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                                You haven't published any materials yet.
                            </div>
                        ) : (
                            materials.map(mat => (
                                <div key={mat.id} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${mat.isProtected ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}>
                                            {mat.isProtected ? <Lock className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{mat.title}</h3>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                <span>{new Date(mat.createdAt).toLocaleDateString()}</span>
                                                •
                                                <span className={mat.isProtected ? 'text-indigo-600 dark:text-indigo-400' : 'text-green-600 dark:text-green-400'}>
                                                    {mat.isProtected ? 'DRM Protected' : 'Downloadable'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800/50 px-4 py-2 rounded-lg justify-between sm:justify-end border border-gray-100 dark:border-zinc-800">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <div className="text-right">
                                            <span className="block text-sm font-bold">{mat.accessedBy?.length || 0}</span>
                                            <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Accesses</span>
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
