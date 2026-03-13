"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    ArrowLeft,
    CheckCircle,
    CloudArrowUp,
    Database,
    FileArrowUp,
    Globe,
    Rocket,
    SpinnerGap,
    Users,
    WarningCircle,
} from "@phosphor-icons/react";
import {
    clearBulkUploadSession,
    readBulkUploadSession,
    readStoredQuestionBank,
    TEMPLATE_COLUMNS,
    writeStoredQuestionBank,
} from "@/lib/question-bank-upload";
import {
    type BatchOption,
    getTeacherBatchOptions,
    publishExamFromQuestions,
} from "@/actions/publish-exam-actions";
import { cn } from "@/lib/utils";

type Stage = "processing" | "ready";

type AudienceMode = "all" | "batch";

const CA_LEVELS = [
    { value: "foundation", label: "CA Foundation" },
    { value: "ipc", label: "CA Intermediate (IPC)" },
    { value: "final", label: "CA Final" },
] as const;

export function QuestionBulkUploadReview() {
    const router = useRouter();
    const [stage, setStage] = useState<Stage>("processing");
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const report = readBulkUploadSession();

    // Publish form state
    const [audienceMode, setAudienceMode] = useState<AudienceMode>("all");
    const [caLevel, setCaLevel] = useState<"foundation" | "ipc" | "final">("final");
    const [subject, setSubject] = useState("");
    const [seriesTitle, setSeriesTitle] = useState("");
    const [duration, setDuration] = useState(40);
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [batches, setBatches] = useState<BatchOption[]>([]);
    const [batchesLoaded, setBatchesLoaded] = useState(false);
    const [publishResult, setPublishResult] = useState<{ success: boolean; examTitle?: string; targetLabel?: string } | null>(null);

    useEffect(() => {
        if (!report) {
            router.replace("/teacher/questions");
            return;
        }
        // Try to pre-fill title from fileName
        const base = report.fileName.replace(/\.(xlsx?|csv)$/i, "").replace(/[-_]+/g, " ").trim();
        if (base) setSeriesTitle(base);

        const timer = window.setTimeout(() => setStage("ready"), 1200);
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load teacher's batches once the form is shown
    useEffect(() => {
        if (stage !== "ready" || batchesLoaded) return;
        setBatchesLoaded(true);
        getTeacherBatchOptions().then((res) => {
            if (res.success) setBatches(res.batches);
        });
    }, [stage, batchesLoaded]);

    // ── Save to localStorage question bank only ─────────────────────────────
    const handleSaveToBank = () => {
        if (!report || report.questions.length === 0) return;
        setIsSaving(true);
        const existing = readStoredQuestionBank();
        writeStoredQuestionBank([...report.questions, ...existing]);
        clearBulkUploadSession();
        router.push("/teacher/questions");
    };

    // ── Publish as live MCQ Series ──────────────────────────────────────────
    const handlePublish = async () => {
        if (!report || report.questions.length === 0) return;
        if (!seriesTitle.trim()) { alert("Please enter a series title."); return; }
        if (!subject.trim()) { alert("Please enter the subject."); return; }
        if (audienceMode === "batch" && !selectedBatchId) { alert("Please select a batch."); return; }

        setIsPublishing(true);
        try {
            const res = await publishExamFromQuestions({
                title: seriesTitle.trim(),
                caLevel,
                subject: subject.trim(),
                durationMinutes: duration,
                target: audienceMode === "batch"
                    ? { kind: "batch", batchId: selectedBatchId }
                    : { kind: "all" },
                questions: report.questions.map((q) => ({
                    prompt: q.prompt,
                    options: q.options,
                    correct: q.correct,
                })),
            });

            if (res.success) {
                setPublishResult({ success: true, examTitle: res.examTitle, targetLabel: res.targetLabel });
                clearBulkUploadSession();
            } else {
                setPublishResult({ success: false });
                alert(`Publish failed: ${res.error}`);
            }
        } finally {
            setIsPublishing(false);
        }
    };

    if (!report) return null;

    // ── Success screen ──────────────────────────────────────────────────────
    if (publishResult?.success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[420px] animate-in fade-in duration-500 text-center space-y-6 max-w-lg mx-auto">
                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <Rocket size={36} weight="fill" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900">MCQ Series Published!</h2>
                    <p className="text-gray-500 mt-2">
                        <span className="font-semibold text-gray-800">{publishResult.examTitle}</span>
                        {" "}is now live for{" "}
                        <span className="font-semibold text-indigo-600">{publishResult.targetLabel}</span>.
                        Students can find it in their MCQ Practice Hub.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/teacher/test-series"
                        className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                    >
                        View in Test Series
                    </Link>
                    <Link
                        href="/teacher/questions"
                        className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
                    >
                        Back to Question Bank
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">
                        Question Bank / Bulk Upload
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900 font-outfit tracking-tight">
                        Review &amp; Publish
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Review your uploaded MCQs, then save them to the question bank or publish directly as a live MCQ series.
                    </p>
                </div>
                <Link
                    href="/teacher/questions"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all self-start"
                >
                    <ArrowLeft size={18} /> Back to Question Bank
                </Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.92fr_1.08fr] gap-6">
                {/* ── Left: Upload summary ──────────────────────────────── */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            {stage === "processing"
                                ? <SpinnerGap size={24} className="animate-spin" />
                                : <FileArrowUp size={24} weight="fill" />}
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
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                                Expected format
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {TEMPLATE_COLUMNS.map((col) => (
                                    <span
                                        key={col}
                                        className="rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
                                    >
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                                    Valid MCQs
                                </p>
                                <p className="mt-2 text-3xl font-black text-emerald-700">
                                    {report.importedCount}
                                </p>
                            </div>
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
                                    Skipped rows
                                </p>
                                <p className="mt-2 text-3xl font-black text-amber-700">
                                    {report.skippedCount}
                                </p>
                            </div>
                        </div>

                        {report.errors.length > 0 && (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {report.errors.slice(0, 8).map((err) => (
                                    <div
                                        key={err}
                                        className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900"
                                    >
                                        <WarningCircle size={14} weight="fill" className="mt-0.5 shrink-0 text-amber-500" />
                                        {err}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Save to question bank only */}
                        <button
                            type="button"
                            onClick={handleSaveToBank}
                            disabled={isSaving || report.questions.length === 0}
                            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                            <Database size={18} />
                            {isSaving ? "Saving…" : "Save to Question Bank only"}
                        </button>
                    </div>
                </div>

                {/* ── Right: Publish panel ──────────────────────────────── */}
                <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    {stage === "processing" ? (
                        <div className="min-h-[420px] flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <SpinnerGap size={28} className="animate-spin" />
                            </div>
                            <h2 className="mt-6 text-2xl font-bold text-gray-900">
                                Validating Excel file…
                            </h2>
                            <p className="mt-2 max-w-sm text-sm text-gray-500">
                                Checking structure, mapping options, and validating answers.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                                    <Rocket size={20} weight="fill" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">
                                        Publish as MCQ Series
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Live on student MCQ Practice Hub immediately after publish
                                    </p>
                                </div>
                                <div className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                    <CheckCircle size={14} weight="fill" /> Ready
                                </div>
                            </div>

                            {/* Series title */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Series Title
                                </label>
                                <input
                                    type="text"
                                    value={seriesTitle}
                                    onChange={(e) => setSeriesTitle(e.target.value)}
                                    placeholder="e.g. Financial Reporting — Full Chapter"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                                />
                            </div>

                            {/* CA Level + Subject */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        CA Level
                                    </label>
                                    <select
                                        value={caLevel}
                                        onChange={(e) => setCaLevel(e.target.value as typeof caLevel)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                                    >
                                        {CA_LEVELS.map((l) => (
                                            <option key={l.value} value={l.value}>{l.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="e.g. Financial Reporting"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Duration — {duration} minutes
                                </label>
                                <input
                                    type="range"
                                    min={10}
                                    max={120}
                                    step={5}
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    className="w-full accent-indigo-600"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                                    <span>10 min</span><span>60 min</span><span>120 min</span>
                                </div>
                            </div>

                            {/* ── Audience ─────────────────────────────────────── */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Who can attempt this series?
                                </label>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setAudienceMode("all")}
                                        className={cn(
                                            "flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left",
                                            audienceMode === "all"
                                                ? "border-indigo-500 bg-indigo-50"
                                                : "border-gray-200 bg-white hover:border-gray-300"
                                        )}
                                    >
                                        <Globe size={22} weight="bold" className={audienceMode === "all" ? "text-indigo-600" : "text-gray-400"} />
                                        <div>
                                            <div className={cn("font-bold text-sm", audienceMode === "all" ? "text-indigo-700" : "text-gray-700")}>
                                                All Students
                                            </div>
                                            <div className="text-[11px] text-gray-400 mt-0.5">
                                                Any student in {CA_LEVELS.find(l => l.value === caLevel)?.label} can attempt
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAudienceMode("batch")}
                                        className={cn(
                                            "flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left",
                                            audienceMode === "batch"
                                                ? "border-indigo-500 bg-indigo-50"
                                                : "border-gray-200 bg-white hover:border-gray-300"
                                        )}
                                    >
                                        <Users size={22} weight="bold" className={audienceMode === "batch" ? "text-indigo-600" : "text-gray-400"} />
                                        <div>
                                            <div className={cn("font-bold text-sm", audienceMode === "batch" ? "text-indigo-700" : "text-gray-700")}>
                                                Specific Batch
                                            </div>
                                            <div className="text-[11px] text-gray-400 mt-0.5">
                                                Only students in one batch
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                {/* Batch picker — shown only when mode is "batch" */}
                                {audienceMode === "batch" && (
                                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-3">
                                        {batches.length === 0 ? (
                                            /* ── No batches exist yet ──────────────────────── */
                                            <div className="text-center py-4 space-y-2">
                                                <p className="text-sm font-semibold text-amber-700">
                                                    ⚠️ You have no batches yet
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Create a batch in{" "}
                                                    <Link href="/teacher/batches" className="text-indigo-600 underline font-semibold">
                                                        My Batches
                                                    </Link>
                                                    {" "}first, or switch to <strong>All Students</strong> above to publish immediately.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setAudienceMode("all")}
                                                    className="mt-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                                                >
                                                    Switch to All Students
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Select Batch
                                                </label>
                                                <div className="space-y-2">
                                                    {batches.map((b) => (
                                                        <label
                                                            key={b.id}
                                                            className={cn(
                                                                "flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all",
                                                                selectedBatchId === b.id
                                                                    ? "border-indigo-500 bg-white"
                                                                    : "border-gray-200 bg-white hover:border-indigo-200"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="radio"
                                                                    name="batchId"
                                                                    value={b.id}
                                                                    checked={selectedBatchId === b.id}
                                                                    onChange={() => setSelectedBatchId(b.id)}
                                                                    className="accent-indigo-600"
                                                                />
                                                                <span className="font-semibold text-sm text-gray-900">{b.name}</span>
                                                            </div>
                                                            <span className="text-xs text-gray-400 font-medium">
                                                                {b.studentCount} student{b.studentCount !== 1 ? "s" : ""}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Publish button */}
                            <button
                                type="button"
                                onClick={handlePublish}
                                disabled={
                                    isPublishing ||
                                    report.questions.length === 0 ||
                                    (audienceMode === "batch" && batches.length === 0)
                                }
                                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-[0.98]"
                            >
                                {isPublishing
                                    ? <><SpinnerGap size={18} className="animate-spin" /> Publishing…</>
                                    : <><CloudArrowUp size={18} weight="bold" /> Publish {report.importedCount} MCQs as Live Series</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
