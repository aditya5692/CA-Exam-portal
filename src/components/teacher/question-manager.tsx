"use client";

import {
  parseQuestionRows,
  Question,
  readStoredQuestionBank,
  writeBulkUploadSession
} from "@/lib/question-bank-upload";
import { cn } from "@/lib/utils";
import {
  CaretDown,
  Check,
  CloudArrowUp,
  DownloadSimple,
  FloppyDisk,
  Lightning,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Trash
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect,useRef,useState } from "react";
import * as XLSX from "xlsx";

const DEFAULT_QUESTIONS: Question[] = [
    { id: 1, prompt: "As per Ind AS 116, which of the following is included in the measurement of a right-of-use asset?", options: ["Initial direct costs incurred by the lessee", "Variable lease payments not included in lease liability", "General overheads of the lessor", "Costs incurred after lease commencement"], correct: [0] },
];

export function QuestionManager() {
    // Note: In Next.js this usually comes from next/navigation, but following previous pattern
    // if it was router from react-router-dom in this specific project context.
    // However, the previous viewed code used next/navigation.
    // I will stick to the previous imports seen in Step 184.
    
    const [questions] = useState<Question[]>(() => {
        const storedQuestions = readStoredQuestionBank();
        return storedQuestions.length > 0 ? storedQuestions : DEFAULT_QUESTIONS;
    });
    const [draft] = useState({ prompt: "", options: ["", "", "", ""], correct: [] });
    const [isPreparingUpload, setIsPreparingUpload] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleBulkUploadClick = () => {
        setShowDropdown(false);
        fileInputRef.current?.click();
    };

    const handleDownloadTemplate = () => {
        setShowDropdown(false);
        const wb = XLSX.utils.book_new();
        const wsData = [
            ["prompt", "optionA", "optionB", "optionC", "optionD", "correctAnswers", "subject", "topic", "difficulty", "examType", "explanation"],
            ["As per Ind AS 116, which of the following is included in the measurement of a right-of-use asset?", "Initial direct costs incurred by the lessee", "Variable lease payments not included in lease liability", "General overheads of the lessor", "Costs incurred after lease commencement", "A", "Financial Reporting", "Ind AS 116", "Medium", "GENERAL", "Initial direct costs form part of the ROU asset measurement under Ind AS 116."],
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws["!cols"] = [{ wch: 60 }, { wch: 35 }, { wch: 35 }, { wch: 35 }, { wch: 35 }, { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 55 }];
        XLSX.utils.book_append_sheet(wb, ws, "Questions");
        XLSX.writeFile(wb, "MCQ_Bulk_Upload_Template.xlsx");
    };

    const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsPreparingUpload(true);
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const firstSheet = workbook.SheetNames[0];
            if (!firstSheet) throw new Error("Workbook is empty");
            const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], { defval: "" });
            const report = parseQuestionRows(rows, file.name);
            writeBulkUploadSession(report);
            router.push("/teacher/questions/bulk-upload");
        } catch (error) {
            writeBulkUploadSession({
                fileName: file.name,
                importedCount: 0,
                skippedCount: 1,
                errors: [error instanceof Error ? error.message : "Unable to parse"],
                questions: [],
            });
            router.push("/teacher/questions/bulk-upload");
        } finally {
            event.target.value = "";
            setIsPreparingUpload(false);
        }
    };

    return (
        <div className="space-y-6 pb-10 w-full max-w-[1280px] mx-auto font-outfit animate-in fade-in slide-in-from-bottom-4 duration-700">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleBulkUpload} />

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Repository Management</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter text-slate-900">MCQ Vault</h1>
                    <p className="text-slate-500 font-medium text-sm font-sans max-w-2xl leading-relaxed">
                        Design and index high-fidelity assessment items. Populate your series via bulk ingestion or manual refinement.
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center">
                    <Link
                        href="/teacher/mcq-extract"
                        className="px-5 h-12 rounded-xl bg-white border border-slate-100 text-slate-500 font-black text-[9px] uppercase tracking-widest hover:text-slate-900 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                    >
                        <Lightning size={16} weight="bold" className="text-amber-500" /> AI MCQ Creator
                    </Link>

                    <div ref={dropdownRef} className="relative">
                        <button
                            type="button"
                            disabled={isPreparingUpload}
                            onClick={() => setShowDropdown((s) => !s)}
                            className="px-5 h-12 rounded-xl bg-white border border-slate-100 text-slate-500 font-black text-[9px] uppercase tracking-widest hover:text-slate-900 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                        >
                            <CloudArrowUp size={16} weight="bold" className="text-indigo-600" />
                            {isPreparingUpload ? "Ingesting..." : "Bulk Pipeline"}
                            <CaretDown size={10} weight="bold" className={cn("ml-1 transition-transform", showDropdown && "rotate-180")} />
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white border border-slate-100 shadow-2xl p-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all text-left relative group/opt"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <DownloadSimple size={18} weight="bold" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[11px] text-slate-900">Download Schema</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Excel Template</p>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBulkUploadClick}
                                    className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all text-left relative group/opt"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                        <CloudArrowUp size={18} weight="bold" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[11px] text-slate-900">Ingest Dataset</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Upload XLSX/CSV</p>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>

                    <button className="px-6 h-12 rounded-xl bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-3 shadow-lg shadow-indigo-900/10">
                        <Plus size={16} weight="bold" /> Manual Entry
                    </button>
                </div>
            </div>


            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8">
                {/* Question List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Inventory</h2>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">{questions.length} Items Indexed</p>
                        </div>
                        <div className="relative">
                             <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                             <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter vault..." className="pl-12 pr-6 h-12 rounded-xl bg-slate-50 border border-slate-100 text-[10px] uppercase font-black tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all w-60" />
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {questions.filter(q => q.prompt.toLowerCase().includes(searchQuery.toLowerCase())).map((q, i) => (
                            <div key={i} className="group bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 transition-all hover:shadow-md hover:border-indigo-100 relative">
                                <div className="absolute top-6 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 transition-all flex items-center justify-center"><PencilSimple size={18} weight="bold" /></button>
                                    <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-rose-100 transition-all flex items-center justify-center"><Trash size={18} weight="bold" /></button>
                                </div>
                                
                                <div className="flex gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 font-black text-sm shrink-0 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                        {(i + 1).toString().padStart(2, "0")}
                                    </div>
                                    
                                    <div className="space-y-6 flex-1">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-bold text-slate-900 leading-tight pr-24 font-outfit">{q.prompt}</h3>
                                            <div className="flex gap-3">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Repository
                                                </div>
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                                     Module: {q.type || "Practice"}
                                                </div>
                                                {q.subject && (
                                                     <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border border-slate-100">
                                                         {q.subject}
                                                     </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {q.options.map((opt, idx) => (
                                                <div key={idx} className={cn(
                                                    "p-4 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all",
                                                    q.correct.includes(idx)
                                                        ? "bg-indigo-50/50 border-indigo-200 text-indigo-900"
                                                        : "bg-slate-50/50 border-slate-100 text-slate-500 group-hover:bg-white"
                                                )}>
                                                    <div className="flex items-center gap-3">
                                                        <span className="opacity-40 uppercase">{String.fromCharCode(65 + idx)}.</span>
                                                        {opt}
                                                    </div>
                                                    {q.correct.includes(idx) && <Check size={16} weight="bold" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white/80 backdrop-blur-md rounded-[40px] border border-slate-100 shadow-sm p-10 sticky top-24">
                        <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                <Plus size={24} weight="bold" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight text-slate-900">Manual Refinement</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Edit current item or create new</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Challenge Prompt</label>
                                <textarea
                                    rows={5}
                                    placeholder="Type your question prompt..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-sans font-medium"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Option Variants</label>
                                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Mark Validity</span>
                                </div>
                                <div className="space-y-3">
                                    {draft.options.map((_, i) => (
                                        <div key={i} className="flex gap-3">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    placeholder={`Variant ${String.fromCharCode(65 + i)}`}
                                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm text-slate-900 focus:border-indigo-500/50 focus:bg-white outline-none transition-all font-sans font-medium"
                                                />
                                            </div>
                                            <button className="w-14 h-14 shrink-0 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200 transition-all active:scale-95 group/check">
                                                <Check size={22} weight="bold" className="group-hover:scale-110 transition-transform" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50">
                                <div className="flex items-center justify-between px-1 mb-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Classification</label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Difficulty</p>
                                        <select className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none">
                                            <option>Entry Level</option>
                                            <option>Intermediate</option>
                                            <option>Advanced</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Exam Type</p>
                                        <select className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none">
                                            <option>General</option>
                                            <option>Simulated</option>
                                            <option>Archive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full h-16 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 shadow-xl shadow-indigo-600/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4">
                                <FloppyDisk size={20} weight="bold" />
                                Save to Inventory
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
