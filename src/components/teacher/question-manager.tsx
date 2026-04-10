"use client";

import {
  parseQuestionRows,
  writeBulkUploadSession
} from "@/lib/question-bank-upload";
import { saveQuestionsToVault } from "@/actions/mcq-vault-actions";
import { cn } from "@/lib/utils";
import {
  CaretDown,
  Check,
  CloudArrowUp,
  DownloadSimple,
  Lightning,
  PencilSimple,
  Plus,
  SpinnerGap,
  Stack,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

export function QuestionManager() {
    const [draft, setDraft] = useState({ prompt: "", options: ["", "", "", ""], correct: [] as number[], subject: "", topic: "", difficulty: "Medium" });
    const [isPreparingUpload, setIsPreparingUpload] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSavingManual, setIsSavingManual] = useState(false);
    
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

    const handleManualSave = async () => {
        if (!draft.prompt.trim()) return alert("Prompt is required");
        if (draft.options.some(opt => !opt.trim())) return alert("All 4 options are required");
        if (draft.correct.length === 0) return alert("Select at least one correct answer");

        setIsSavingManual(true);
        const res = await saveQuestionsToVault([{
            prompt: draft.prompt,
            options: draft.options,
            correct: draft.correct,
            subject: draft.subject,
            topic: draft.topic,
            difficulty: draft.difficulty,
            explanation: "",
        }]);

        if (res.success) {
            setDraft({ prompt: "", options: ["", "", "", ""], correct: [], subject: "", topic: "", difficulty: "Medium" });
            // Redirect to question bank after adding
            router.push("/teacher/question-bank");
        } else {
            alert(res.message);
        }
        setIsSavingManual(false);
    };

    const toggleCorrect = (idx: number) => {
        setDraft(prev => {
            const newCorrect = prev.correct.includes(idx)
                ? prev.correct.filter(i => i !== idx)
                : [...prev.correct, idx];
            return { ...prev, correct: newCorrect };
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto pb-12   animate-in fade-in slide-in-from-bottom-4 duration-500">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleBulkUpload} />

            {/* Premium Header */}
            <div className="mb-10 relative">
                <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            Creation Wizard
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Add MCQs</h1>
                        <p className="text-slate-500 font-medium text-sm max-w-xl leading-relaxed">
                            Upload questions in bulk via Excel, or use the single question manual editor. Generated questions are saved to the Question Bank.
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 items-center">
                        <Link
                            href="/teacher/mcq-extract"
                            className="h-12 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 transition-all active:scale-95 flex items-center gap-2 px-5 shadow-sm"
                        >
                            <Lightning size={16} weight="fill" className="text-amber-500" /> AI Generator
                        </Link>
                        
                        <Link
                            href="/teacher/question-bank"
                            className="h-12 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95 flex items-center gap-2 px-5 shadow-sm"
                        >
                            <Stack size={16} weight="bold" /> View Bank
                        </Link>

                        <div ref={dropdownRef} className="relative">
                            <button
                                type="button"
                                disabled={isPreparingUpload}
                                onClick={() => setShowDropdown((s) => !s)}
                                className="h-12 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 px-6 shadow-md shadow-indigo-600/20"
                            >
                                <CloudArrowUp size={18} weight="bold" />
                                {isPreparingUpload ? "Processing..." : "Bulk Upload"}
                                <CaretDown size={12} weight="bold" className={cn("ml-1 transition-transform", showDropdown && "rotate-180")} />
                            </button>

                            {showDropdown && (
                                <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white border border-slate-100 shadow-xl p-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all text-left"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                                            <DownloadSimple size={18} weight="bold" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs text-slate-900">Download Template</p>
                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Use this Excel format</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleBulkUploadClick}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all text-left mt-1"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                                            <CloudArrowUp size={18} weight="bold" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs text-slate-900">Upload Data File</p>
                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Import your questions</p>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Manual Builder */}
            <div className="pt-8 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <PencilSimple size={16} weight="fill" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold tracking-tight text-slate-900">Manual Entry</h3>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">Add a single question to the bank</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2.5">
                        <label className="text-xs font-bold text-slate-700">Question Text</label>
                        <textarea
                            rows={4}
                            value={draft.prompt}
                            onChange={(e) => setDraft(prev => ({ ...prev, prompt: e.target.value }))}
                            placeholder="Enter your question here..."
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-medium resize-none shadow-sm"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700">Answer Options</label>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">Select Correct</span>
                        </div>
                        <div className="space-y-2.5">
                            {draft.options.map((opt, i) => (
                                <div key={i} className="flex gap-2">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                                const newOptions = [...draft.options];
                                                newOptions[i] = e.target.value;
                                                setDraft(prev => ({ ...prev, options: newOptions }));
                                            }}
                                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                            className="w-full h-11 bg-slate-50/50 border border-slate-200 rounded-xl px-4 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => toggleCorrect(i)}
                                        className={cn(
                                            "w-11 h-11 shrink-0 rounded-xl border-2 transition-all flex items-center justify-center active:scale-95 shadow-sm",
                                            draft.correct.includes(i)
                                                ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                                                : "bg-white border-slate-200 text-slate-300 hover:text-emerald-500 hover:border-emerald-200 hover:bg-emerald-50/50"
                                        )}
                                    >
                                        <Check size={18} weight={draft.correct.includes(i) ? "bold" : "regular"} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Difficulty</label>
                            <select 
                                value={draft.difficulty}
                                onChange={(e) => setDraft(prev => ({ ...prev, difficulty: e.target.value }))}
                                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 shadow-sm"
                            >
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subject Tag</label>
                            <input 
                                type="text"
                                value={draft.subject}
                                onChange={(e) => setDraft(prev => ({ ...prev, subject: e.target.value }))}
                                placeholder="e.g. Audit"
                                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-semibold text-slate-700 placeholder:text-slate-300 outline-none focus:border-indigo-400 shadow-sm"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleManualSave}
                        disabled={isSavingManual}
                        className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-indigo-600 shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isSavingManual ? <SpinnerGap size={18} className="animate-spin" /> : <Plus size={18} weight="bold" />}
                        {isSavingManual ? "Saving..." : "Save to Question Bank"}
                    </button>
                </div>
            </div>
        </div>
    );
}
