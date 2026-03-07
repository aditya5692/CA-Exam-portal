"use client";

import { useState, useEffect } from "react";
import { analyzePdfForMCQs, getMyDraftMCQs, confirmAndImportMCQs } from "@/actions/mcq-actions";
import { Upload, Sparkles, CheckCircle, IndianRupee, Brain, FileText } from "lucide-react";

type DraftMCQ = {
    id: string;
    question: string;
    options: string;
    answer: string;
};

export default function TeacherMCQExtractPage() {
    const [step, setStep] = useState<"upload" | "analyzing" | "preview" | "paid">("upload");
    const [drafts, setDrafts] = useState<DraftMCQ[]>([]);
    const [totalCost, setTotalCost] = useState(0);
    const [pricePerMCQ, setPricePerMCQ] = useState(5);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        async function loadExistingDrafts() {
            const res = await getMyDraftMCQs();
            if (res.success && Array.isArray(res.drafts) && res.drafts.length > 0) {
                setDrafts(res.drafts as unknown as DraftMCQ[]);
                setTotalCost(res.totalCost ?? 0);
                setPricePerMCQ(res.pricePerMCQ ?? 5);
                setStep("preview");
            }
        }
        loadExistingDrafts();
    }, []);

    const handleAnalyze = async () => {
        if (!selectedFile) return;
        setStep("analyzing");
        const fd = new FormData();
        fd.append("file", selectedFile);
        const res = await analyzePdfForMCQs(fd);
        if (res.success && res.questions && res.count !== undefined) {
            const mappedDrafts: DraftMCQ[] = res.questions.map(q => ({
                id: String(Math.random()),
                question: q.question,
                options: q.options,
                answer: q.answer
            }));
            setDrafts(mappedDrafts);
            setTotalCost(res.totalCost ?? 0);
            setPricePerMCQ(res.pricePerMCQ ?? 5);
            setStep("preview");
        } else {
            alert(res.message || "Analysis failed.");
            setStep("upload");
        }
    };

    const handleMockPayAndImport = async () => {
        const res = await confirmAndImportMCQs();
        if (res.success) {
            setStep("paid");
            setDrafts([]);
        } else {
            alert(res.message);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-xl">
                        <Brain className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                        AI MCQ Extractor
                    </h1>
                </div>
                <p className="text-gray-500 ml-[52px]">Upload a scanned PDF or image. Our AI will extract structured MCQs at <strong>₹{pricePerMCQ} per question</strong>.</p>
            </div>

            {/* Progress steps */}
            <div className="flex items-center gap-0">
                {["Upload & Analyze", "Review & Pay", "Import to Bank"].map((label, i) => {
                    const steps = ["upload", "analyzing", "preview", "paid"];
                    const currentIdx = steps.indexOf(step);
                    const done = currentIdx > i + 1;
                    const active = currentIdx === i + 1 || (i === 0 && currentIdx <= 1);
                    return (
                        <div key={label} className="flex items-center flex-1">
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${done ? "text-emerald-600" : active ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20" : "text-gray-400"}`}>
                                {done ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${active ? "bg-amber-500 text-white" : "bg-gray-200 dark:bg-zinc-700 text-gray-500"}`}>{i + 1}</span>}
                                {label}
                            </div>
                            {i < 2 && <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700 mx-2" />}
                        </div>
                    );
                })}
            </div>

            {/* Step: Upload */}
            {(step === "upload" || step === "analyzing") && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 space-y-6">
                    <div
                        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${selectedFile ? "border-amber-400 bg-amber-50/50 dark:bg-amber-900/10" : "border-gray-200 dark:border-zinc-700 hover:border-amber-300"}`}
                        onClick={() => document.getElementById("mcq-file-input")?.click()}
                        style={{ cursor: "pointer" }}
                    >
                        <input id="mcq-file-input" type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                        {selectedFile ? (
                            <div className="space-y-2">
                                <FileText className="w-12 h-12 text-amber-500 mx-auto" />
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedFile.name}</p>
                                <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Upload className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto" />
                                <p className="font-semibold text-gray-700 dark:text-gray-300">Drop your scanned PDF or Image here</p>
                                <p className="text-sm text-gray-400">PDF, PNG, JPG up to 20MB</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!selectedFile || step === "analyzing"}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-base"
                    >
                        {step === "analyzing" ? (
                            <><span className="animate-spin text-xl">✦</span> AI is analysing your document...</>
                        ) : (
                            <><Sparkles className="w-5 h-5" /> Extract MCQs with AI</>
                        )}
                    </button>
                </div>
            )}

            {/* Step: Preview & Pay */}
            {step === "preview" && drafts.length > 0 && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6">
                        <h2 className="font-bold text-lg text-amber-900 dark:text-amber-200 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-500" /> AI Extraction Complete!
                        </h2>
                        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4">
                                <span className="block text-3xl font-black text-amber-600">{drafts.length}</span>
                                <span className="block text-xs text-gray-500 uppercase tracking-wide mt-1">MCQs Found</span>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4">
                                <span className="block text-3xl font-black text-gray-800 dark:text-gray-200">₹{pricePerMCQ}</span>
                                <span className="block text-xs text-gray-500 uppercase tracking-wide mt-1">Per Question</span>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4">
                                <span className="block text-3xl font-black text-emerald-600">₹{totalCost}</span>
                                <span className="block text-xs text-gray-500 uppercase tracking-wide mt-1">Total Cost</span>
                            </div>
                        </div>
                    </div>

                    {/* MCQ Preview list */}
                    <div className="space-y-3">
                        {drafts.slice(0, 3).map((q, i) => (
                            <div key={q.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
                                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Q{i + 1}. {q.question}</p>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    {JSON.parse(q.options).map((opt: string, j: number) => (
                                        <div key={j} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${opt === q.answer ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" : "bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-400"}`}>
                                            {String.fromCharCode(65 + j)}. {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {drafts.length > 3 && (
                            <p className="text-center text-sm text-gray-400">+{drafts.length - 3} more questions hidden in preview</p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => { setStep("upload"); setDrafts([]); }} className="flex-1 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 font-medium py-3 rounded-xl transition-all">
                            Cancel
                        </button>
                        <button
                            onClick={handleMockPayAndImport}
                            className="flex-2 flex-grow-[2] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <IndianRupee className="w-4 h-4" /> Pay ₹{totalCost} & Import to Question Bank
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-400">(Razorpay integration placeholder — clicking Pay will simulate a confirmed payment for now)</p>
                </div>
            )}

            {/* Step: Success */}
            {step === "paid" && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-12 text-center space-y-4">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
                    <h2 className="text-2xl font-bold">MCQs Imported Successfully!</h2>
                    <p className="text-gray-500">Your questions have been added to your Question Bank and are ready to be used in test series.</p>
                    <button onClick={() => setStep("upload")} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-3 rounded-xl transition-all">
                        Extract More MCQs
                    </button>
                </div>
            )}
        </div>
    );
}
