"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTeacherBatchOptions, publishExamFromQuestions } from "@/actions/publish-exam-actions";
import {
    clearBulkUploadSession,
    readBulkUploadSession,
    TEMPLATE_COLUMNS,
    type UploadReport,
    type Question,
} from "@/lib/question-bank-upload";
import { saveQuestionsToVault } from "@/actions/mcq-vault-actions";
import { SharedPageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import type { BatchOption } from "@/types/publish-exam";
import { ArrowLeft, CaretRight, CheckCircle, CloudArrowUp, Database, FileArrowUp, Globe, Info, Rocket, Sparkle, SpinnerGap, TerminalWindow, Users, WarningCircle, Selection, ListNumbers, Shuffle, Plus } from "@phosphor-icons/react";

type Stage = "processing" | "ready";
type AudienceMode = "all" | "batch";

const CA_LEVELS = [
    { value: "foundation", label: "CA Foundation" },
    { value: "ipc", label: "CA Intermediate (IPC)" },
    { value: "final", label: "CA Final" },
] as const;

import { CA_FINAL_CONTENT, CA_FOUNDATION_CONTENT, CA_INTER_CONTENT } from "@/lib/constants/chapters";

export function QuestionBulkUploadReview() {
    const router = useRouter();
    const [report, setReport] = useState<UploadReport | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [stage, setStage] = useState<Stage>("processing");
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    // Publish form state
    const [audienceMode, setAudienceMode] = useState<AudienceMode>("all");
    const [caLevel, setCaLevel] = useState<"foundation" | "ipc" | "final">("final");
    const [subject, setSubject] = useState("");
    const [seriesTitle, setSeriesTitle] = useState("");
    const [duration, setDuration] = useState(40);
    const [examType, setExamType] = useState("GENERAL");
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [batches, setBatches] = useState<BatchOption[]>([]);
    const [batchesLoaded, setBatchesLoaded] = useState(false);

    // Visibility state
    const [visibleToNonBatch, setVisibleToNonBatch] = useState(false);
    const [visibleToOtherBatches, setVisibleToOtherBatches] = useState(false);

    // Breakdown state
    const [breakIntoTests, setBreakIntoTests] = useState(false);
    const [breakdownMode, setBreakdownMode] = useState<"RANDOM" | "FIFO">("FIFO");
    const [questionsPerTest, setQuestionsPerTest] = useState(15);

    const [publishResult, setPublishResult] = useState<{ success: boolean; examTitles?: string[]; targetLabel?: string } | null>(null);

    // Get available subjects based on selected CA level
    const getAvailableSubjects = useCallback(() => {
        if (caLevel === "foundation") return CA_FOUNDATION_CONTENT.subjects;
        if (caLevel === "ipc") return CA_INTER_CONTENT.subjects;
        return CA_FINAL_CONTENT.subjects;
    }, [caLevel]);

    const availableSubjects = useMemo(() => getAvailableSubjects(), [getAvailableSubjects]);

    // Reset subject when CA level changes if the current subject is not in the new level
    useEffect(() => {
        const subs = getAvailableSubjects();
        if (subject && !subs.some(s => s.name === subject)) {
            setSubject("");
        }
    }, [caLevel, subject, getAvailableSubjects]);

    useEffect(() => {
        const data = readBulkUploadSession();
        if (!data) {
            setIsLoaded(true);
            return;
        }

        setReport(data);
        setIsLoaded(true);

        const base = data.fileName.replace(/\.(xlsx?|csv)$/i, "").replace(/[-_]+/g, " ").trim();
        if (base) setSeriesTitle(base);

        const timer = window.setTimeout(() => setStage("ready"), 1200);
        return () => window.clearTimeout(timer);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (stage !== "ready" || batchesLoaded) return;
        setBatchesLoaded(true);
        getTeacherBatchOptions().then((res) => {
            if (res.success) setBatches(res.data);
        });
    }, [stage, batchesLoaded]);

    const handleSaveToBank = async () => {
        if (!report || report.questions.length === 0) return;
        setIsSaving(true);
        try {
            const questionsToSave = report.questions.map((q: Question) => ({
                prompt: q.prompt,
                options: q.options,
                correct: q.correct,
                subject: q.subject || subject, // Use selected subject as fallback
                topic: q.topic,
                difficulty: q.difficulty,
                explanation: q.explanation,
            }));

            const res = await saveQuestionsToVault(questionsToSave);
            if (res.success) {
                clearBulkUploadSession();
                router.push("/teacher/question-bank");
            } else {
                alert(`Failed to archive: ${res.message}`);
            }
        } catch (error) {
            console.error("Archive to vault error:", error);
            alert("An unexpected error occurred while archiving.");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!report || report.questions.length === 0) return;
        if (!seriesTitle.trim()) { alert("Please enter a title for this test series."); return; }
        if (!subject.trim()) { alert("Please select a subject."); return; }
        if (audienceMode === "batch" && !selectedBatchId) { alert("Please select a batch."); return; }

        // Find the dbMatch for the selected subject display name
        const selectedSubObj = availableSubjects.find(s => s.name === subject);
        const subjectToPublish = selectedSubObj ? selectedSubObj.dbMatch : subject;

        setIsPublishing(true);
        try {
            const res = await publishExamFromQuestions({
                title: seriesTitle.trim(),
                caLevel,
                subject: subjectToPublish,
                durationMinutes: duration,
                examType,
                target: audienceMode === "batch"
                    ? { kind: "batch", batchId: selectedBatchId }
                    : { kind: "all" },
                visibleToNonBatch,
                visibleToOtherBatches,
                questions: report.questions.map((q: Question) => ({
                    prompt: q.prompt,
                    options: q.options,
                    correct: q.correct,
                    subject: q.subject || subjectToPublish,
                    topic: q.topic,
                    difficulty: q.difficulty,
                })),
                breakdown: {
                    enabled: breakIntoTests,
                    mode: breakdownMode,
                    questionsPerTest: questionsPerTest,
                }
            });

            if (res.success) {
                setPublishResult({ success: true, examTitles: res.data.examTitles, targetLabel: res.data.targetLabel });
                clearBulkUploadSession();
            } else {
                setPublishResult({ success: false });
                alert(`Publish failed: ${res.message}`);
            }
        } finally {
            setIsPublishing(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <SpinnerGap size={32} className="animate-spin text-slate-300" />
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-6 animate-in fade-in duration-700">
                <div className="w-20 h-20 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                    <Info size={40} weight="light" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">Session Expired or Missing</h2>
                    <p className="text-slate-500 font-medium text-sm max-w-xs mx-auto">We couldn&apos;t find your uploaded data modules. Please return to the vault and re-initialize the ingestion pipeline.</p>
                </div>
                <Link href="/teacher/question-bank" className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95">
                    Return to MCQ Vault
                </Link>
            </div>
        );
    }

    if (publishResult?.success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] animate-in fade-in zoom-in-95 duration-700 text-center space-y-8 max-w-2xl mx-auto  ">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-[40px] rounded-full animate-pulse" />
                    <div className="relative w-24 h-24 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center shadow-2xl">
                        <Rocket size={44} weight="fill" className="animate-bounce" />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 mb-2">
                        <CheckCircle size={14} weight="bold" /> Deployment Successful
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter text-slate-900 leading-tight">
                        {publishResult.examTitles && publishResult.examTitles.length > 1
                            ? `${publishResult.examTitles.length} MCQ Series Published!`
                            : "MCQ Series Published!"}
                    </h2>
                    <div className="text-slate-500 font-medium text-lg leading-relaxed max-w-md mx-auto space-y-2">
                        {publishResult.examTitles && publishResult.examTitles.length > 1 ? (
                            <div className="max-h-32 overflow-y-auto scrollbar-thin px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                                {publishResult.examTitles.map((t, idx) => (
                                    <p key={idx} className="text-indigo-600 font-bold text-sm text-left">
                                        • {t}
                                    </p>
                                ))}
                            </div>
                        ) : (
                            <p>
                                <span className="text-indigo-600 font-bold">&quot;{publishResult.examTitles?.[0]}&quot;</span>
                            </p>
                        )}
                        <p className="text-base text-slate-400">
                            Now live and accessible by <span className="text-slate-900 font-bold">{publishResult.targetLabel}</span>.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full pt-4">
                    <Link
                        href="/teacher/test-series"
                        className="h-16 rounded-lg bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10 hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        View Registry <CaretRight size={18} weight="bold" />
                    </Link>
                    <Link
                        href="/teacher/question-bank"
                        className="h-16 rounded-lg bg-white border border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-900 hover:border-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        Return to Vault
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10 w-full max-w-[1280px] mx-auto   animate-in fade-in slide-in-from-bottom-4 duration-700">
            <SharedPageHeader
                eyebrow="Library > Question Vault > Review"
                title="Stage Post-Ingestion"
                description="Verify your uploaded questions and publish them to your students. You can archive them to the vault only or deploy them as a live test series."
                aside={
                    <Link
                        href="/teacher/question-bank"
                        className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-lg bg-white border border-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 hover:border-slate-200 transition-all active:scale-95 shadow-sm"
                    >
                        <ArrowLeft size={18} weight="bold" /> Abandon Session
                    </Link>
                }
            />

            <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-8">
                {/* ── Left Side: Analysis Reprot ──────────────────────────── */}
                <div className="space-y-6">
                    <div className="bg-white/80 backdrop-blur-md rounded-lg border border-slate-100 shadow-sm p-8 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 transition-all">
                                {stage === "processing"
                                    ? <SpinnerGap size={28} className="animate-spin" />
                                    : <FileArrowUp size={28} weight="bold" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 truncate max-w-[280px]">{report.fileName}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                    {stage === "processing" ? "Analyzing file..." : "Questions Ready"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-lg bg-slate-50/50 border border-slate-100 p-6">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">MAPPED SCHEMA</p>
                                <div className="flex flex-wrap gap-2">
                                    {TEMPLATE_COLUMNS.map((col) => (
                                        <div key={col} className="px-3 py-1.5 rounded-lg bg-white border border-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                            {col}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-6">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">Valid MCQs</p>
                                    <div className="text-3xl font-bold text-emerald-700 tracking-tight">{report.importedCount}</div>
                                </div>
                                <div className={cn(
                                    "rounded-lg border p-6 transition-all",
                                    report.skippedCount > 0 ? "border-amber-100 bg-amber-50/50" : "border-slate-100 bg-slate-50/30"
                                )}>
                                    <p className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-2", report.skippedCount > 0 ? "text-amber-600" : "text-slate-400")}>Skipped Rows</p>
                                    <div className={cn("text-3xl font-bold tracking-tight  ", report.skippedCount > 0 ? "text-amber-600" : "text-slate-300")}>{report.skippedCount}</div>
                                </div>
                            </div>

                            {report.errors.length > 0 && (
                                <div className="rounded-lg border border-rose-100 bg-rose-50/30 p-6">
                                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                        <WarningCircle size={14} weight="fill" /> Formatting Issues Detected
                                    </p>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                                        {report.errors.map((err: string, i: number) => (
                                            <div key={i} className="text-[11px] font-medium text-rose-600 bg-white border border-rose-100/50 px-3 py-2 rounded-lg flex items-start gap-2">
                                                <span className="opacity-40 font-black shrink-0">{i + 1}</span>
                                                {err}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleSaveToBank}
                                disabled={isSaving || report.questions.length === 0}
                                className="w-full h-14 rounded-lg bg-white border border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center gap-3 disabled:opacity-40 shadow-sm"
                            >
                                {isSaving ? <SpinnerGap size={18} className="animate-spin" /> : <Database size={18} weight="bold" />}
                                {isSaving ? "Archiving..." : "Archive to Vault Only"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Right Side: Deploy Panel ───────────────────────────── */}
                <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden flex flex-col p-8   relative">
                    {stage === "processing" ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-500">
                                <TerminalWindow size={40} weight="light" className="animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Analysis Engine</h3>
                                <p className="text-sm font-bold text-slate-400 max-w-xs leading-relaxed animate-pulse">Checking your questions for any formatting issues...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
                                <div className="w-14 h-14 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10">
                                    <Rocket size={28} weight="bold" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">Initialize Deployment</h2>
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Targeting: Student MCQ Studio</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                                {/* Series title */}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Series Title</label>
                                    <input
                                        type="text"
                                        value={seriesTitle}
                                        onChange={(e) => setSeriesTitle(e.target.value)}
                                        placeholder="e.g. Corporate Law — Final Mock 01"
                                        className="w-full h-14 border border-slate-100 rounded-lg px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all   font-semibold placeholder:text-slate-300"
                                    />
                                </div>

                                {/* CA Level */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">CA Level</label>
                                    <select
                                        value={caLevel}
                                        onChange={(e) => setCaLevel(e.target.value as typeof caLevel)}
                                        className="w-full h-14 border border-slate-100 rounded-lg px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all   font-semibold"
                                    >
                                        {CA_LEVELS.map((l) => (
                                            <option key={l.value} value={l.value}>{l.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subject */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Subject</label>
                                    <select
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full h-14 border border-slate-100 rounded-lg px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all   font-semibold"
                                    >
                                        <option value="" disabled>Select Subject</option>
                                        {availableSubjects.map((s) => (
                                            <option key={s.name} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Exam Type */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Exam Category</label>
                                    <select
                                        value={examType}
                                        onChange={(e) => setExamType(e.target.value)}
                                        className="w-full h-14 border border-slate-100 rounded-lg px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all   font-semibold"
                                    >
                                        <option value="GENERAL">General Practice</option>
                                        <option value="RPT">RPT (Revision Test Paper)</option>
                                        <option value="MTP">MTP (Mock Test Paper)</option>
                                        <option value="PYQ">Past Year Questions (PYQ)</option>
                                    </select>
                                </div>

                                {/* Duration */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex justify-between">
                                        Time (Per Series) <span>{duration} Mins</span>
                                    </label>
                                    <div className="px-1">
                                        <input
                                            type="range"
                                            min={10}
                                            max={180}
                                            step={5}
                                            value={duration}
                                            onChange={(e) => setDuration(Number(e.target.value))}
                                            className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[8px] text-slate-300 font-black uppercase mt-2 tracking-widest px-0.5">
                                            <span>10m</span><span>90m</span><span>180m</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Series Breakdown */}
                                <div className="md:col-span-2 space-y-6 pt-4 border-t border-slate-50">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Split into multiple tests</label>
                                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-1">Automatically break a large file into smaller tests</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setBreakIntoTests(!breakIntoTests)}
                                            className={cn(
                                                "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                                                breakIntoTests ? "bg-indigo-600" : "bg-slate-200"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                                                breakIntoTests ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>

                                    {breakIntoTests && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex justify-between">
                                                    Questions per test <span>{questionsPerTest} MCQs</span>
                                                </label>
                                                <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-lg px-4 h-14">
                                                    <ListNumbers size={20} className="text-slate-400" />
                                                    <input
                                                        type="number"
                                                        value={questionsPerTest}
                                                        onChange={(e) => setQuestionsPerTest(Math.max(1, Number(e.target.value)))}
                                                        className="bg-transparent border-none outline-none text-sm font-bold w-full"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Question Order</label>
                                                <div className="flex p-1 bg-slate-50 border border-slate-100 rounded-lg h-14">
                                                    <button
                                                        type="button"
                                                        onClick={() => setBreakdownMode("FIFO")}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-center gap-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                            breakdownMode === "FIFO" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                        )}
                                                    >
                                                        <Selection size={14} weight="bold" /> Sequential
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setBreakdownMode("RANDOM")}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-center gap-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                            breakdownMode === "RANDOM" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                        )}
                                                    >
                                                        <Shuffle size={14} weight="bold" /> Random
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Audience Mode */}
                                <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-50">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Who can access?</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setAudienceMode("all")}
                                            className={cn(
                                                "p-6 rounded-lg border-2 transition-all flex flex-col gap-3 group/btn relative overflow-hidden",
                                                audienceMode === "all" ? "border-indigo-600 bg-indigo-50 text-indigo-900" : "border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <Globe size={24} weight={audienceMode === "all" ? "fill" : "bold"} />
                                            <div>
                                                <p className="font-bold text-sm tracking-tight leading-none">All Students</p>
                                                <p className="text-[10px] font-bold mt-1.5 opacity-60 uppercase tracking-widest">Available to everyone in this level</p>
                                            </div>
                                            {audienceMode === "all" && <Sparkle size={40} weight="fill" className="absolute -right-4 -top-4 opacity-10" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAudienceMode("batch")}
                                            className={cn(
                                                "p-6 rounded-lg border-2 transition-all flex flex-col gap-3 group/btn relative overflow-hidden",
                                                audienceMode === "batch" ? "border-indigo-600 bg-indigo-50 text-indigo-900" : "border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <Users size={24} weight={audienceMode === "batch" ? "fill" : "bold"} />
                                            <div>
                                                <p className="font-bold text-sm tracking-tight leading-none">Specific Batch</p>
                                                <p className="text-[10px] font-bold mt-1.5 opacity-60 uppercase tracking-widest">Only for students in a selected batch</p>
                                            </div>
                                            {audienceMode === "batch" && <Sparkle size={40} weight="fill" className="absolute -right-4 -top-4 opacity-10" />}
                                        </button>
                                    </div>

                                    {/* Additional visibility controls */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                        <label className={cn(
                                            "flex items-center gap-3 px-5 py-4 rounded-lg border transition-all cursor-pointer",
                                            visibleToNonBatch ? "bg-white border-indigo-600 shadow-md ring-4 ring-indigo-500/5" : "bg-white border-slate-100 hover:border-indigo-200"
                                        )}>
                                            <input 
                                                type="checkbox" 
                                                checked={visibleToNonBatch}
                                                onChange={(e) => setVisibleToNonBatch(e.target.checked)}
                                                className="w-4 h-4 rounded border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                                            />
                                            <div>
                                                <p className="font-bold text-slate-900 text-xs">Visible to Non-Batch</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Show to students without batches</p>
                                            </div>
                                        </label>

                                        <label className={cn(
                                            "flex items-center gap-3 px-5 py-4 rounded-lg border transition-all cursor-pointer",
                                            visibleToOtherBatches ? "bg-white border-indigo-600 shadow-md ring-4 ring-indigo-500/5" : "bg-white border-slate-100 hover:border-indigo-200"
                                        )}>
                                            <input 
                                                type="checkbox" 
                                                checked={visibleToOtherBatches}
                                                onChange={(e) => setVisibleToOtherBatches(e.target.checked)}
                                                className="w-4 h-4 rounded border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                                            />
                                            <div>
                                                <p className="font-bold text-slate-900 text-xs">Visible to Other Batches</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Allow access from other batches</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Batch selector */}
                                {audienceMode === "batch" && (
                                    <div className="md:col-span-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {batches.length === 0 ? (
                                            <div className="p-8 rounded-lg bg-amber-50/50 border border-amber-100 text-center space-y-2">
                                                <Info size={24} weight="fill" className="text-amber-500 mx-auto" />
                                                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest leading-relaxed">No Segments identified in the cloud registry.</p>
                                                <Link href="/teacher/batches" className="inline-block text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline pt-2">Initialize Segments Here</Link>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {batches.map((b) => (
                                                    <label
                                                        key={b.id}
                                                        className={cn(
                                                            "flex items-center gap-3 px-5 py-4 rounded-lg border transition-all cursor-pointer group/bi",
                                                            selectedBatchId === b.id ? "bg-white border-indigo-600 shadow-md ring-4 ring-indigo-500/5" : "bg-white border-slate-100 hover:border-indigo-200"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                                            selectedBatchId === b.id ? "border-indigo-600" : "border-slate-300"
                                                        )}>
                                                            {selectedBatchId === b.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                                                            <input type="radio" value={b.id} checked={selectedBatchId === b.id} onChange={() => setSelectedBatchId(b.id)} className="hidden" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-slate-900 text-xs truncate leading-none mb-1">{b.name}</p>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{b.studentCount} Cadets</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="pt-6">
                                <button
                                    type="button"
                                    onClick={handlePublish}
                                    disabled={
                                        isPublishing ||
                                        report.questions.length === 0 ||
                                        (audienceMode === "batch" && batches.length === 0)
                                    }
                                    className="w-full h-16 bg-slate-900 hover:bg-indigo-600 disabled:opacity-40 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-lg shadow-lg shadow-indigo-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group"
                                >
                                    {isPublishing ? (
                                        <SpinnerGap size={20} className="animate-spin" />
                                    ) : (
                                        <CloudArrowUp size={20} weight="bold" className="group-hover:scale-110 transition-transform" />
                                    )}
                                    {isPublishing ? "Publishing Series..." : `Publish ${report.importedCount} Questions`}
                                </button>
                                <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4 opacity-50">Secure Exam Publishing Protocol</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
