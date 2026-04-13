"use client";

import { bulkUploadMCQs } from "@/actions/bulk-upload-actions";
import { cn } from "@/lib/utils";
import {
    CloudArrowUp,
    FileText,
    CheckCircle,
    XCircle,
    ArrowLeft,
    DownloadSimple,
    Info,
    Stack,
    Lightning
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function BulkUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<{ success: number; failed: number; total: number } | null>(null);
    const [syncSubject, setSyncSubject] = useState("");
    const [syncTopic, setSyncTopic] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (selected.name.endsWith(".xlsx") || selected.name.endsWith(".csv")) {
                setFile(selected);
                setResult(null);
            } else {
                toast.error("Please upload an .xlsx or .csv file");
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        if (syncSubject) formData.append("subject", syncSubject);
        if (syncTopic) formData.append("topic", syncTopic);

        try {
            const res = await bulkUploadMCQs(formData);
            if (res.success && res.data) {
                setResult(res.data);
                toast.success("Upload protocol completed successfully.");
            } else {
                toast.error(res.message || "Bulk upload failed.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred during ingestion.");
        } finally {
            setIsUploading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = [
            ["Chapter Number", "Question", "Option A", "Option B", "Option C", "Option D", "Correct Answer", "Explanation", "Subject", "Difficulty"]
        ];
        const ws = XLSX.utils.aoa_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "MCQ_Template");
        XLSX.utils.book_append_sheet(wb, ws, "MCQ_Template");
        XLSX.utils.book_append_sheet(wb, ws, "MCQ_Template");
        XLSX.writeFile(wb, "Financly_MCQ_Template.xlsx");
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4 mb-10">
                <Link 
                    href="/teacher/question-bank" 
                    className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all"
                >
                    <ArrowLeft size={20} weight="bold" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bulk Ingestion</h1>
                    <p className="text-sm font-medium text-slate-500">Scale your question library with automated Excel/CSV processing.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Protocol Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 rounded-lg p-6 text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                                <Info size={20} weight="bold" />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-widest">Protocol Specs</h3>
                        </div>
                        <ul className="space-y-4">
                            {[
                                "Use the standard template format",
                                "Correct Option must be A, B, C, or D",
                                "Max 500 items per transaction",
                                "Difficulty labels: EASY, MEDIUM, HARD"
                            ].map((spec, i) => (
                                <li key={i} className="flex items-start gap-3 text-xs text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                    {spec}
                                </li>
                            ))}
                        </ul>
                        <button 
                            onClick={downloadTemplate}
                            className="w-full mt-8 h-12 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center justify-center gap-2"
                        >
                            <DownloadSimple size={18} weight="bold" />
                            Download Template
                        </button>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-6 border border-amber-100">
                        <div className="flex items-center gap-2 mb-2 text-amber-700">
                            <Lightning size={16} weight="fill" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Sync Intelligence</span>
                        </div>
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                            Categorize your entire file in one click by setting a global Subject or Topic in the "Sync & Link" section.
                        </p>
                    </div>
                </div>

                {/* Upload Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Sync & Link Card */}
                    {!result && (
                        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm border-l-4 border-l-indigo-500">
                            <div className="flex items-center gap-2 mb-4">
                                <Stack size={16} className="text-indigo-600" weight="bold" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Sync & Link (Global Categorization)</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Subject</label>
                                    <input 
                                        type="text" 
                                        value={syncSubject}
                                        onChange={(e) => setSyncSubject(e.target.value)}
                                        placeholder="e.g. Business Economics"
                                        className="w-full h-12 px-4 rounded-lg bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global Topic (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={syncTopic}
                                        onChange={(e) => setSyncTopic(e.target.value)}
                                        placeholder="e.g. Chapter 1"
                                        className="w-full h-12 px-4 rounded-lg bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium transition-all"
                                    />
                                </div>
                            </div>
                            <p className="mt-4 text-[10px] text-slate-400 italic font-medium">Note: Leave blank to use categories defined inside your spreadsheet.</p>
                        </div>
                    )}

                    <div className="bg-white rounded-lg border border-slate-200 p-8 md:p-12 shadow-sm text-center">
                        {!result ? (
                            <div className="space-y-8">
                                <div 
                                    className={cn(
                                        "border-4 border-dashed rounded-lg p-12 transition-all group flex flex-col items-center justify-center gap-6 cursor-pointer",
                                        file ? "border-indigo-500 bg-indigo-50/10" : "border-slate-100 bg-slate-50/50 hover:border-indigo-200 hover:bg-white"
                                    )}
                                    onClick={() => document.getElementById("file-input")?.click()}
                                >
                                    <input 
                                        id="file-input" 
                                        type="file" 
                                        className="hidden" 
                                        accept=".xlsx,.csv" 
                                        onChange={handleFileChange}
                                    />
                                    <div className={cn(
                                        "w-20 h-20 rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                                        file ? "bg-indigo-600 text-white" : "bg-white text-slate-300 border border-slate-100"
                                    )}>
                                        {file ? <FileText size={40} weight="fill" /> : <CloudArrowUp size={40} weight="bold" />}
                                    </div>
                                    <div>
                                        {file ? (
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-bold text-slate-900">{file.name}</h3>
                                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                                    {(file.size / 1024).toFixed(1)} KB · Ready for parsing
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-bold text-slate-700">Drop Spreadsheet Here</h3>
                                                <p className="text-sm text-slate-400">Drag & drop your .xlsx or .csv files to initiate ingestion.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={!file || isUploading}
                                    className="w-full h-16 rounded-lg bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 disabled:opacity-40 transition-all flex items-center justify-center gap-4 shadow-xl"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Executing Protocol...
                                        </>
                                    ) : (
                                        <>
                                            <CloudArrowUp size={24} weight="bold" />
                                            Start Bulk Ingestion
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-10 animate-in zoom-in-95 duration-500">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <CheckCircle size={48} weight="fill" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Ingestion Complete</h2>
                                        <p className="text-slate-500 text-sm font-medium">The vault has been updated with new assets.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: "Total Rows", value: result.total, color: "text-slate-900", icon: Stack },
                                        { label: "Success", value: result.success, color: "text-emerald-600", icon: CheckCircle },
                                        { label: "Failed", value: result.failed, color: "text-rose-600", icon: XCircle },
                                    ].map((stat, i) => (
                                        <div key={i} className="p-6 rounded-lg bg-slate-50 border border-slate-100 text-center space-y-1">
                                            <div className="flex justify-center mb-2">
                                                <stat.icon size={20} weight="bold" className={stat.color} />
                                            </div>
                                            <div className={cn("text-2xl font-black", stat.color)}>{stat.value}</div>
                                            <div className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => { setFile(null); setResult(null); }}
                                        className="flex-1 h-14 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all"
                                    >
                                        Upload More
                                    </button>
                                    <Link
                                        href="/teacher/question-bank"
                                        className="flex-1 h-14 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center hover:bg-slate-800 transition-all"
                                    >
                                        View In Vault
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
