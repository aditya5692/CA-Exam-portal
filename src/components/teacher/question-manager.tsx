"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Trash,
    PencilSimple,
    FloppyDisk,
    CloudArrowUp,
    Check,
    CaretDown,
    DownloadSimple,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import {
    parseQuestionRows,
    Question,
    readStoredQuestionBank,
    TEMPLATE_COLUMNS,
    writeBulkUploadSession,
} from "@/lib/question-bank-upload";

const DEFAULT_QUESTIONS: Question[] = [
    { id: 1, prompt: "What is the capital of France?", options: ["Paris", "London", "Berlin", "Rome"], correct: [0] },
];

export function QuestionManager() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [questions] = useState<Question[]>(() => {
        const storedQuestions = readStoredQuestionBank();
        return storedQuestions.length > 0 ? storedQuestions : DEFAULT_QUESTIONS;
    });
    const [draft] = useState({ prompt: "", options: ["", "", "", ""], correct: [] });
    const [isPreparingUpload, setIsPreparingUpload] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Close dropdown when clicking outside
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

    // Build and download the MCQ template Excel file
    const handleDownloadTemplate = () => {
        setShowDropdown(false);
        const wb = XLSX.utils.book_new();

        // ── Sheet 1: Questions template ──────────────────────────────
        const wsData = [
            // Header row
            ["prompt", "optionA", "optionB", "optionC", "optionD", "correctAnswers", "subject", "topic", "difficulty", "explanation"],
            // Sample rows
            [
                "As per Ind AS 116, which of the following is included in the measurement of a right-of-use asset?",
                "Initial direct costs incurred by the lessee",
                "Variable lease payments not included in lease liability",
                "General overheads of the lessor",
                "Costs incurred after lease commencement",
                "A",
                "Financial Reporting",
                "Ind AS 116",
                "Medium",
                "Initial direct costs form part of the ROU asset measurement under Ind AS 116.",
            ],
            [
                "Under IFRS 15, revenue from contracts with customers shall be recognised when:",
                "Cash is received from the customer",
                "Invoice is raised",
                "Performance obligation is satisfied",
                "Contract is signed",
                "C",
                "Financial Reporting",
                "IFRS 15",
                "Easy",
                "Revenue is recognised upon satisfaction of the performance obligation per IFRS 15.",
            ],
            [
                "Which of the following requires mandatory disclosure as a contingent liability under AS 29?",
                "A possible obligation dependent on a future event",
                "A confirmed obligation with a reliable estimate",
                "An obligation already settled",
                "An obligation with nil probability",
                "A",
                "Financial Reporting",
                "AS 29",
                "Hard",
                "Contingent liabilities are disclosed but not recognised unless outflow is probable (AS 29).",
            ],
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Column widths
        ws["!cols"] = [
            { wch: 60 }, { wch: 35 }, { wch: 35 }, { wch: 35 }, { wch: 35 },
            { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 55 },
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Questions");

        // ── Sheet 2: Instructions ─────────────────────────────────────
        const instructions = [
            ["📋 INSTRUCTIONS — MCQ Bulk Upload Format"],
            [""],
            ["Column", "Required?", "Description"],
            ["prompt", "✅ Required", "The full question text"],
            ["optionA", "✅ Required", "Option A text"],
            ["optionB", "✅ Required", "Option B text"],
            ["optionC", "✅ Required", "Option C text"],
            ["optionD", "✅ Required", "Option D text"],
            ["correctAnswers", "✅ Required", "Correct option(s): use A, B, C or D. Multiple answers: A,C"],
            ["subject", "Optional", "e.g. Financial Reporting, SFM, Auditing"],
            ["topic", "Optional", "e.g. Ind AS 116, IFRS 15"],
            ["difficulty", "Optional", "Easy / Medium / Hard"],
            ["explanation", "Optional", "Explanation shown after the student answers"],
            [""],
            ["⚠️ NOTES"],
            ["• Do not delete or rename the column headers"],
            ["• Each row = 1 MCQ question"],
            ["• correctAnswers accepts: A / B / C / D or 1 / 2 / 3 / 4 or combinations like A,C"],
            ["• Rows with missing required fields will be skipped and reported as errors"],
            ["• The first row in 'Questions' sheet must be the header row — do not add extra rows above it"],
        ];

        const wsInstr = XLSX.utils.aoa_to_sheet(instructions);
        wsInstr["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 70 }];
        XLSX.utils.book_append_sheet(wb, wsInstr, "Instructions");

        // Trigger download
        XLSX.writeFile(wb, "MCQ_Bulk_Upload_Template.xlsx");
    };

    const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setIsPreparingUpload(true);

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const firstSheet = workbook.SheetNames[0];

            if (!firstSheet) {
                throw new Error("The uploaded workbook does not contain any sheets.");
            }

            const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], {
                defval: "",
            });

            const report = parseQuestionRows(rows, file.name);
            writeBulkUploadSession(report);
            router.push("/teacher/questions/bulk-upload");
        } catch (error) {
            writeBulkUploadSession({
                fileName: file.name,
                importedCount: 0,
                skippedCount: 1,
                errors: [error instanceof Error ? error.message : "Unable to parse the uploaded file."],
                questions: [],
            });
            router.push("/teacher/questions/bulk-upload");
        } finally {
            event.target.value = "";
            setIsPreparingUpload(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleBulkUpload}
            />

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-outfit tracking-tight">Question Bank</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your exam repository and create new challenges.</p>
                    <p className="text-xs text-gray-400 mt-3">
                        Excel format:
                        {" "}
                        {TEMPLATE_COLUMNS.join(", ")}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <Link
                        href="/teacher/mcq-extract"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <CloudArrowUp size={20} /> AI MCQ Upload
                    </Link>

                    {/* ── Bulk Upload dropdown ──────────────────────── */}
                    <div ref={dropdownRef} className="relative">
                        <button
                            type="button"
                            disabled={isPreparingUpload}
                            onClick={() => setShowDropdown((s) => !s)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 hover:border-indigo-300 transition-all active:scale-95 disabled:opacity-60 shadow-sm"
                        >
                            <CloudArrowUp size={18} />
                            {isPreparingUpload ? "Preparing…" : "Bulk Upload"}
                            <CaretDown size={13} weight="bold" className={cn("transition-transform duration-150", showDropdown && "rotate-180")} />
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-gray-200/60 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                {/* Download Format */}
                                <button
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-indigo-50 transition-colors text-left group border-b border-gray-50"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors mt-0.5">
                                        <DownloadSimple size={16} weight="bold" className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-gray-900">Download Format</div>
                                        <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">Get the Excel template with sample MCQs &amp; instructions</div>
                                    </div>
                                </button>

                                {/* Upload Excel */}
                                <button
                                    type="button"
                                    onClick={handleBulkUploadClick}
                                    className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-indigo-50 transition-colors text-left group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors mt-0.5">
                                        <CloudArrowUp size={16} weight="bold" className="text-indigo-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-gray-900">Upload Excel</div>
                                        <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">Upload your filled .xlsx / .xls / .csv file</div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>

                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95">
                        <Plus size={20} weight="bold" /> New Question
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
                <div className="space-y-4">
                    {questions.map((q, i) => (
                        <div key={q.id} className="p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] group hover:shadow-md hover:border-indigo-500/30 transition-all relative">
                            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><PencilSimple size={18} /></button>
                                <button className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"><Trash size={18} /></button>
                            </div>

                            <div className="flex items-start gap-4">
                                <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                                    {i + 1}
                                </span>
                                <div className="space-y-4 flex-1">
                                    <h3 className="text-gray-900 font-semibold leading-relaxed pr-20">{q.prompt}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {q.options.map((opt, idx) => (
                                            <div key={idx} className={cn(
                                                "p-3 rounded-xl border text-sm transition-all flex items-center justify-between font-medium",
                                                q.correct.includes(idx)
                                                    ? "border-emerald-500/30 bg-emerald-50 text-emerald-600"
                                                    : "border-gray-50 bg-gray-50 text-gray-500"
                                            )}>
                                                {opt}
                                                {q.correct.includes(idx) && <Check size={16} weight="bold" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sticky top-24 h-fit">
                    <h3 className="text-lg font-bold text-gray-900 font-outfit mb-6">Manual MCQ Editor</h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Question Prompt</label>
                            <textarea
                                rows={4}
                                placeholder="Type your question here..."
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500/30 transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between">
                                Options <span>Select Correct</span>
                            </label>
                            {draft.options.map((_, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder={`Option ${i + 1}`}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 text-sm text-gray-900 focus:border-indigo-500/50 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    <button className="w-10 h-10 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 hover:border-emerald-100 transition-all active:scale-95">
                                        <Check size={20} weight="bold" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                                <FloppyDisk size={20} weight="bold" /> Save Question
                            </button>
                            <button className="px-6 py-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 font-bold text-sm hover:bg-white hover:text-gray-600 transition-all active:scale-95">
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
