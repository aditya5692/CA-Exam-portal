"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Trash,
    PencilSimple,
    FloppyDisk,
    CloudArrowUp,
    Check
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
    const [questions] = useState<Question[]>(() => {
        const storedQuestions = readStoredQuestionBank();
        return storedQuestions.length > 0 ? storedQuestions : DEFAULT_QUESTIONS;
    });
    const [draft] = useState({ prompt: "", options: ["", "", "", ""], correct: [] });
    const [isPreparingUpload, setIsPreparingUpload] = useState(false);

    const handleBulkUploadClick = () => {
        fileInputRef.current?.click();
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
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/teacher/mcq-extract"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <CloudArrowUp size={20} /> AI MCQ Upload
                    </Link>
                    <button
                        type="button"
                        onClick={handleBulkUploadClick}
                        disabled={isPreparingUpload}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-60"
                    >
                        <CloudArrowUp size={20} /> {isPreparingUpload ? "Preparing upload..." : "Bulk Upload (in excel)"}
                    </button>
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
