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
    Info,
    Stack,
    CaretRight,
    Sparkle,
    TerminalWindow
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
    const [examType, setExamType] = useState("GENERAL");
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [batches, setBatches] = useState<BatchOption[]>([]);
    const [batchesLoaded, setBatchesLoaded] = useState(false);
    const [publishResult, setPublishResult] = useState<{ success: boolean; examTitle?: string; targetLabel?: string } | null>(null);

    useEffect(() => {
        if (!report) {
            router.replace("/teacher/questions");
            return;
        }
        const base = report.fileName.replace(/\.(xlsx?|csv)$/i, "").replace(/[-_]+/g, " ").trim();
        if (base) setSeriesTitle(base);

        const timer = window.setTimeout(() => setStage("ready"), 1200);
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (stage !== "ready" || batchesLoaded) return;
        setBatchesLoaded(true);
        getTeacherBatchOptions().then((res) => {
            if (res.success) setBatches(res.data);
        });
    }, [stage, batchesLoaded]);

    const handleSaveToBank = () => {
        if (!report || report.questions.length === 0) return;
        setIsSaving(true);
        const existing = readStoredQuestionBank();
        writeStoredQuestionBank([...report.questions, ...existing]);
        clearBulkUploadSession();
        router.push("/teacher/questions");
    };

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
                examType,
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
                setPublishResult({ success: true, examTitle: res.data.examTitle, targetLabel: res.data.targetLabel });
                clearBulkUploadSession();
            } else {
                setPublishResult({ success: false });
                alert(`Publish failed: ${res.message}`);
            }
        } finally {
            setIsPublishing(false);
        }
    };

    if (!report) return null;

    if (publishResult?.success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] animate-in fade-in zoom-in-95 duration-700 text-center space-y-8 max-w-2xl mx-auto font-outfit">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-[40px] rounded-full animate-pulse" />
                    <div className="relative w-24 h-24 rounded-[32px] bg-slate-900 text-emerald-400 flex items-center justify-center shadow-2xl">
                        <Rocket size={44} weight="fill" className="animate-bounce" />
                    </div>
                </div>
                
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 mb-2">
                        <CheckCircle size={14} weight="bold" /> Deployment Successful
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter text-slate-900 leading-tight">MCQ Series Published!</h2>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md mx-auto">
                        <span className="text-indigo-600 font-bold">"{publishResult.examTitle}"</span>
                         {" "}is now live and accessible by{" "}
                        <span className="text-slate-900 font-bold">{publishResult.targetLabel}</span>.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full pt-4">
                    <Link
                        href="/teacher/test-series"
                        className="h-16 rounded-[24px] bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10 hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                         View Registry <CaretRight size={18} weight="bold" />
                    </Link>
                    <Link
                        href="/teacher/questions"
                        className="h-16 rounded-[24px] bg-white border border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-900 hover:border-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        Return to Vault
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10 w-full max-w-[1280px] mx-auto font-outfit animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Validation Protocol</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter text-slate-900">Review & Deploy</h1>
                    <p className="text-slate-500 font-medium text-sm font-sans max-w-2xl leading-relaxed">
                        Verify the integrity of your bulk question upload. You can archive these in your <strong>MCQ Vault</strong> or deploy them as a live assessment series.
                    </p>
                </div>
                <Link
                    href="/teacher/questions"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-[20px] bg-white border border-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 hover:border-slate-200 transition-all active:scale-95 shadow-sm"
                >
                    <ArrowLeft size={18} weight="bold" /> Abandon Session
                </Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-8">
                {/* ── Left Side: Analysis Reprot ──────────────────────────── */}
                <div className="space-y-6">
                    <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 transition-all">
                                {stage === "processing"
                                    ? <SpinnerGap size={28} className="animate-spin" />
                                    : <FileArrowUp size={28} weight="bold" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 truncate max-w-[280px]">{report.fileName}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                    {stage === "processing" ? "Analyzing data packets..." : "Validation Checksum Passed"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-[24px] bg-slate-50/50 border border-slate-100 p-6">
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
                                <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/50 p-6">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">Valid MCQs</p>
                                    <div className="text-3xl font-bold text-emerald-700 tracking-tight">{report.importedCount}</div>
                                </div>
                                <div className={cn(
                                    "rounded-[24px] border p-6 transition-all",
                                    report.skippedCount > 0 ? "border-amber-100 bg-amber-50/50" : "border-slate-100 bg-slate-50/30"
                                )}>
                                    <p className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-2", report.skippedCount > 0 ? "text-amber-600" : "text-slate-400")}>Skipped Rows</p>
                                    <div className={cn("text-3xl font-bold tracking-tight font-outfit", report.skippedCount > 0 ? "text-amber-600" : "text-slate-300")}>{report.skippedCount}</div>
                                </div>
                            </div>

                            {report.errors.length > 0 && (
                                <div className="rounded-[24px] border border-rose-100 bg-rose-50/30 p-6">
                                     <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                         <WarningCircle size={14} weight="fill" /> Syntax Conflicts Detected
                                     </p>
                                     <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                                        {report.errors.map((err, i) => (
                                            <div key={i} className="text-[11px] font-medium text-rose-600 bg-white border border-rose-100/50 px-3 py-2 rounded-xl flex items-start gap-2">
                                                <span className="opacity-40 font-black shrink-0">{i+1}</span>
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
                                className="w-full h-14 rounded-2xl bg-white border border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center gap-3 disabled:opacity-40 shadow-sm"
                            >
                                {isSaving ? <SpinnerGap size={18} className="animate-spin" /> : <Database size={18} weight="bold" />}
                                {isSaving ? "Archiving..." : "Archive to Vault Only"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Right Side: Deploy Panel ───────────────────────────── */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col p-8 font-outfit relative">
                    {stage === "processing" ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 rounded-[28px] bg-slate-50 flex items-center justify-center text-indigo-500">
                                <TerminalWindow size={40} weight="light" className="animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Analysis Engine</h3>
                                <p className="text-sm font-bold text-slate-400 max-w-xs leading-relaxed animate-pulse">Running semantic validation and mapping Excel indices to schema...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
                                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10">
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Engagement Identity</label>
                                    <input
                                        type="text"
                                        value={seriesTitle}
                                        onChange={(e) => setSeriesTitle(e.target.value)}
                                        placeholder="e.g. Corporate Law — Final Mock 01"
                                        className="w-full h-14 border border-slate-100 rounded-2xl px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-sans font-semibold placeholder:text-slate-300"
                                    />
                                </div>

                                {/* CA Level */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Phase Tier</label>
                                    <select
                                        value={caLevel}
                                        onChange={(e) => setCaLevel(e.target.value as typeof caLevel)}
                                        className="w-full h-14 border border-slate-100 rounded-2xl px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-sans font-semibold"
                                    >
                                        {CA_LEVELS.map((l) => (
                                            <option key={l.value} value={l.value}>{l.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subject */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Domain Classification</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="e.g. Advanced Auditing"
                                        className="w-full h-14 border border-slate-100 rounded-2xl px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-sans font-semibold placeholder:text-slate-300"
                                    />
                                </div>
                                
                                {/* Exam Type */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Module Format</label>
                                    <select 
                                        value={examType} 
                                        onChange={(e) => setExamType(e.target.value)}
                                        className="w-full h-14 border border-slate-100 rounded-2xl px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-sans font-semibold"
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
                                        Time Allocated <span>{duration} Mins</span>
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

                                {/* Audience Mode */}
                                <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-50">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Access Perimeter</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setAudienceMode("all")}
                                            className={cn(
                                                "p-6 rounded-[28px] border-2 transition-all flex flex-col gap-3 group/btn relative overflow-hidden",
                                                audienceMode === "all" ? "border-indigo-600 bg-indigo-50 text-indigo-900" : "border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <Globe size={24} weight={audienceMode === "all" ? "fill" : "bold"} />
                                            <div>
                                                <p className="font-bold text-sm tracking-tight leading-none">Global Broadcast</p>
                                                <p className="text-[10px] font-bold mt-1.5 opacity-60 uppercase tracking-widest">Entire Level Access</p>
                                            </div>
                                            {audienceMode === "all" && <Sparkle size={40} weight="fill" className="absolute -right-4 -top-4 opacity-10" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAudienceMode("batch")}
                                            className={cn(
                                                "p-6 rounded-[28px] border-2 transition-all flex flex-col gap-3 group/btn relative overflow-hidden",
                                                audienceMode === "batch" ? "border-indigo-600 bg-indigo-50 text-indigo-900" : "border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <Users size={24} weight={audienceMode === "batch" ? "fill" : "bold"} />
                                            <div>
                                                <p className="font-bold text-sm tracking-tight leading-none">Segment Pulse</p>
                                                <p className="text-[10px] font-bold mt-1.5 opacity-60 uppercase tracking-widest">Isolated Batch Only</p>
                                            </div>
                                            {audienceMode === "batch" && <Sparkle size={40} weight="fill" className="absolute -right-4 -top-4 opacity-10" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Batch selector */}
                                {audienceMode === "batch" && (
                                    <div className="md:col-span-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {batches.length === 0 ? (
                                            <div className="p-8 rounded-[28px] bg-amber-50/50 border border-amber-100 text-center space-y-2">
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
                                                            "flex items-center gap-3 px-5 py-4 rounded-[20px] border transition-all cursor-pointer group/bi",
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
                                    className="w-full h-16 bg-slate-900 hover:bg-indigo-600 disabled:opacity-40 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-[24px] shadow-lg shadow-indigo-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group"
                                >
                                    {isPublishing ? (
                                        <SpinnerGap size={20} className="animate-spin" />
                                    ) : (
                                        <CloudArrowUp size={20} weight="bold" className="group-hover:scale-110 transition-transform" />
                                    )}
                                    {isPublishing ? "Synchronizing Datastores..." : `Deploy ${report.importedCount} Item Series`}
                                </button>
                                <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4 opacity-50">Authorized Assessment Deployment Protocol</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
