"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, Database, FileArrowUp, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import {
    clearBulkUploadSession,
    readBulkUploadSession,
    readStoredQuestionBank,
    TEMPLATE_COLUMNS,
    writeStoredQuestionBank,
} from "@/lib/question-bank-upload";

type Stage = "processing" | "ready";

export function QuestionBulkUploadReview() {
    const router = useRouter();
    const [stage, setStage] = useState<Stage>("processing");
    const [isSaving, setIsSaving] = useState(false);
    const report = readBulkUploadSession();

    useEffect(() => {
        if (!report) {
            router.replace("/teacher/questions");
            return;
        }

        const timer = window.setTimeout(() => {
            setStage("ready");
        }, 1200);

        return () => window.clearTimeout(timer);
    }, [report, router]);

    const handleSave = () => {
        if (!report || report.questions.length === 0) {
            return;
        }

        setIsSaving(true);

        const existingQuestions = readStoredQuestionBank();
        writeStoredQuestionBank([...report.questions, ...existingQuestions]);
        clearBulkUploadSession();
        router.push("/teacher/questions");
    };

    if (!report) {
        return null;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">Question Bank / Bulk Upload</p>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900 font-outfit tracking-tight">Excel bulk upload review</h1>
                    <p className="text-sm text-gray-500 mt-2">Processing happens here after file selection. Review the result, then save valid MCQs into the question bank.</p>
                </div>
                <Link
                    href="/teacher/questions"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all"
                >
                    <ArrowLeft size={18} /> Back to Question Bank
                </Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.92fr_1.08fr] gap-6">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            {stage === "processing" ? <SpinnerGap size={24} className="animate-spin" /> : <FileArrowUp size={24} weight="fill" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {stage === "processing" ? "Processing uploaded Excel" : "Upload processed"}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">{report.fileName}</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="rounded-xl bg-gray-50 px-4 py-4">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Expected format</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {TEMPLATE_COLUMNS.map((column) => (
                                    <span key={column} className="rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">
                                        {column}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Valid MCQs</p>
                                <p className="mt-2 text-3xl font-black text-emerald-700">{report.importedCount}</p>
                            </div>
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Skipped rows</p>
                                <p className="mt-2 text-3xl font-black text-amber-700">{report.skippedCount}</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-4 text-sm text-indigo-900">
                            Final destination:
                            {" "}
                            <span className="font-bold">MCQ Question Bank</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    {stage === "processing" ? (
                        <div className="min-h-[420px] flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <SpinnerGap size={28} className="animate-spin" />
                            </div>
                            <h2 className="mt-6 text-2xl font-bold text-gray-900">Uploading and validating Excel file</h2>
                            <p className="mt-2 max-w-lg text-sm text-gray-500">
                                We are checking the sheet structure, mapping options, validating correct answers, and preparing import results for your MCQ Question Bank.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Import results</h2>
                                    <p className="text-sm text-gray-500 mt-1">Review the validation output below before saving the valid records.</p>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                                    <CheckCircle size={18} weight="fill" /> Ready to review
                                </div>
                            </div>

                            {report.errors.length > 0 ? (
                                <div className="space-y-3">
                                    {report.errors.slice(0, 8).map((error) => (
                                        <div key={error} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                            <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-amber-600" />
                                            <span>{error}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-800">
                                    No validation errors found. All uploaded rows are ready for import.
                                </div>
                            )}

                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Save destination</h3>
                                        <p className="text-sm text-gray-500 mt-1">Add all valid rows to the MCQ Question Bank directory.</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-indigo-600 flex items-center justify-center">
                                        <Database size={24} weight="fill" />
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={isSaving || report.questions.length === 0}
                                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-60"
                                    >
                                        <Database size={18} weight="bold" />
                                        {isSaving ? "Saving..." : "Save to MCQ Question Bank"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            clearBulkUploadSession();
                                            router.push("/teacher/questions");
                                        }}
                                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
                                    >
                                        Choose another file
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
