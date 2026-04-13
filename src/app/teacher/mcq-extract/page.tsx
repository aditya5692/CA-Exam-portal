"use client";

import { analyzePdfForMCQs,confirmAndImportMCQs,getMyDraftMCQs } from "@/actions/mcq-actions";
import { cn } from "@/lib/utils";
import {
  CaretLeft,
  CaretRight,
  CheckCircle,
  CloudArrowUp,
  CurrencyInr,
  FileText,
  IdentificationBadge,
  Lightning,
  Robot,
  SelectionBackground,
  ShieldCheck,
  Sparkle
} from "@phosphor-icons/react";
import { useCallback,useEffect,useState } from "react";

type EducatorOption = {
    id: string;
    fullName: string | null;
    email: string | null;
    role: string;
};

type DraftMCQ = {
    id: string;
    question: string;
    options: string;
    answer: string;
    teacher?: {
        id: string;
        fullName: string | null;
        email: string | null;
    };
};

export default function TeacherMCQExtractPage() {
    const [step, setStep] = useState<"upload" | "analyzing" | "preview" | "paid">("upload");
    const [drafts, setDrafts] = useState<DraftMCQ[]>([]);
    const [totalCost, setTotalCost] = useState(0);
    const [pricePerMCQ, setPricePerMCQ] = useState(5);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [availableEducators, setAvailableEducators] = useState<EducatorOption[]>([]);
    const [selectedOwnerId, setSelectedOwnerId] = useState("");
    const [isAdminView, setIsAdminView] = useState(false);

    const loadExistingDrafts = useCallback(async (ownerId?: string) => {
        const res = await getMyDraftMCQs(ownerId);
        if (!res.success) return;

        const nextEducators = (res.data?.availableEducators ?? []) as EducatorOption[];
        setAvailableEducators(nextEducators);
        setIsAdminView(Boolean(res.data?.isAdminView));

        if (res.data?.isAdminView && !ownerId && !selectedOwnerId && nextEducators[0]?.id) {
            setSelectedOwnerId(nextEducators[0].id);
            return;
        }

        const nextDrafts = (res.data?.drafts ?? []) as DraftMCQ[];
        setDrafts(nextDrafts);
        setTotalCost(res.data?.totalCost ?? 0);
        setPricePerMCQ(res.data?.pricePerMCQ ?? 5);
        setStep(nextDrafts.length > 0 ? "preview" : "upload");
    }, [selectedOwnerId]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadExistingDrafts(selectedOwnerId || undefined);
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, [loadExistingDrafts, selectedOwnerId]);

    const handleAnalyze = async () => {
        if (!selectedFile) return;
        if (isAdminView && !selectedOwnerId) {
            alert("Select the educator for this operation.");
            return;
        }

        setStep("analyzing");
        const formData = new FormData();
        formData.append("file", selectedFile);
        if (isAdminView) formData.append("ownerId", selectedOwnerId);

        const res = await analyzePdfForMCQs(formData);
        if (res.success) {
            await loadExistingDrafts(selectedOwnerId || undefined);
        } else {
            alert(res.message || "Protocol Failure.");
            setStep("upload");
        }
    };

    const handleMockPayAndImport = async () => {
        const res = await confirmAndImportMCQs(selectedOwnerId || undefined);
        if (res.success) {
            setStep("paid");
            setDrafts([]);
        } else {
            alert(res.message || "Import Protocol Error.");
        }
    };

    return (
        <div className="space-y-10 pb-20 w-full max-w-[1280px] mx-auto   animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Autonomous Extraction Engine</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter text-slate-900">AI MCQ Studio</h1>
                    <p className="text-slate-500 font-medium text-sm   max-w-2xl leading-relaxed">
                        Deploy neural-mapping to transcribe scanned papers into high-fidelity MCQs. Automated structure detection for CA/CMA curriculums.
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center">
                    {isAdminView && (
                        <div className="px-6 h-14 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm">
                            <ShieldCheck size={18} weight="bold" /> Academy-Wide Access
                        </div>
                    )}
                    <div className="px-6 h-14 rounded-lg bg-white border border-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-sm">
                        <CurrencyInr size={18} weight="bold" className="text-emerald-500" />
                        Registry Cost <span className="text-xl ml-1 text-slate-900">₹{pricePerMCQ}</span> <span className="text-[9px] text-slate-400">/item</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-10">
                {/* Protocol Progress & Controls */}
                <div className="space-y-8">
                    {/* Stepper */}
                    <div className="bg-white/80 backdrop-blur-md rounded-lg border border-slate-100 shadow-sm p-8 space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mission Protocol</h3>
                        <div className="space-y-4">
                            {[
                                { label: "Data Ingestion", status: step === "upload" || step === "analyzing" ? "active" : drafts.length > 0 || step === "paid" ? "done" : "idle", icon: CloudArrowUp },
                                { label: "Semantic Review", status: step === "preview" ? "active" : step === "paid" ? "done" : "idle", icon: SelectionBackground },
                                { label: "Vault Sync", status: step === "paid" ? "done" : "idle", icon: CheckCircle },
                            ].map((s, i) => (
                                <div key={i} className={cn(
                                    "flex items-center gap-4 p-5 rounded-lg transition-all duration-300 border",
                                    s.status === "active" ? "bg-indigo-50 border-indigo-100 text-indigo-900 shadow-sm scale-[1.02]" : 
                                    s.status === "done" ? "bg-emerald-50 border-emerald-100 text-emerald-900 opacity-80" : "bg-slate-50 border-transparent text-slate-400 opacity-50"
                                )}>
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                                        s.status === "active" ? "bg-indigo-600 text-white" : 
                                        s.status === "done" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"
                                    )}>
                                        <s.icon size={20} weight={s.status === "active" ? "bold" : "regular"} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black uppercase tracking-widest leading-none mb-1.5">{s.label}</p>
                                        <p className="text-[9px] font-bold opacity-60 uppercase">{s.status === "active" ? "Processing Phase" : s.status === "done" ? "Verified" : "Pending Queue"}</p>
                                    </div>
                                    {s.status === "done" && <CheckCircle size={20} weight="fill" className="text-emerald-500" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Admin Selector */}
                    {isAdminView && (
                        <div className="bg-slate-900 rounded-lg p-8 text-white relative overflow-hidden group shadow-2xl">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
                             <div className="flex items-center gap-4 mb-6">
                                 <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                                     <IdentificationBadge size={24} weight="bold" className="text-indigo-300" />
                                 </div>
                                 <div>
                                    <h3 className="font-bold text-lg tracking-tight">Segment Allocation</h3>
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Authorized Administrator Only</p>
                                 </div>
                             </div>
                             
                             <div className="space-y-4">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Target Educator Portfolio</label>
                                <select
                                    value={selectedOwnerId}
                                    onChange={(event) => setSelectedOwnerId(event.target.value)}
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-lg px-5 text-sm font-bold text-indigo-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:bg-white/10 transition-all"
                                >
                                    <option value="" className="bg-slate-800">Select Global Educator</option>
                                    {availableEducators.map((educator) => (
                                        <option key={educator.id} value={educator.id} className="bg-slate-800">
                                            {(educator.fullName || educator.email || "Educator") + (educator.role === "ADMIN" ? " (Admin)" : "")}
                                        </option>
                                    ))}
                                </select>
                             </div>
                        </div>
                    )}
                </div>

                {/* Primary Interaction Pane */}
                <div className="bg-white/80 backdrop-blur-md rounded-lg border border-slate-100 shadow-sm overflow-hidden flex flex-col p-8 md:p-10 min-h-[600px] relative">
                    
                    {/* Step 1: Upload / Analyzing */}
                    {(step === "upload" || step === "analyzing") && (
                        <div className="flex-1 flex flex-col space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                                <div className="w-14 h-14 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-900/10">
                                    <CloudArrowUp size={28} weight="bold" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold tracking-tighter text-slate-900 leading-none">Ingest Document</h2>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Max Load: 20MB per transaction</p>
                                </div>
                            </div>

                            <div 
                                className={cn(
                                    "flex-1 border-4 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center transition-all group relative cursor-pointer",
                                    selectedFile ? "border-amber-400 bg-amber-50/10" : "border-slate-100 bg-slate-50/50 hover:border-indigo-300 hover:bg-white"
                                )}
                                onClick={() => document.getElementById("mcq-file-input")?.click()}
                            >
                                <input id="mcq-file-input" type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
                                
                                <div className="relative">
                                     <div className={cn("absolute inset-0 blur-3xl rounded-full opacity-20", selectedFile ? "bg-amber-500" : "bg-indigo-500")}></div>
                                     <div className={cn("relative w-24 h-24 rounded-lg flex items-center justify-center mb-6 shadow-xl transition-all group-hover:scale-110", 
                                         selectedFile ? "bg-amber-500 text-white" : "bg-white text-slate-300 border border-slate-100"
                                     )}>
                                         {selectedFile ? <FileText size={44} weight="fill" /> : <CloudArrowUp size={44} weight="bold" />}
                                     </div>
                                </div>
                                
                                {selectedFile ? (
                                    <div className="space-y-3">
                                        <h3 className="text-xl font-bold text-slate-900 truncate max-w-sm mx-auto">{selectedFile.name}</h3>
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Protocol Pre-Verified</p>
                                        <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors pt-4">Replace Document</button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <h3 className="text-xl font-bold text-slate-400 group-hover:text-slate-900 transition-colors">Select Scan Module</h3>
                                        <p className="text-sm font-medium text-slate-400">Drag & Drop Scanned PDF, PNG or JPG files</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={!selectedFile || step === "analyzing" || (isAdminView && !selectedOwnerId)}
                                className="w-full h-20 rounded-lg bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-600 disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-4 relative overflow-hidden group shadow-xl shadow-slate-900/10"
                            >
                                {step === "analyzing" ? (
                                    <>
                                        <Lightning size={24} weight="bold" className="animate-bounce" />
                                        Mapping Neural Layers...
                                    </>
                                ) : (
                                    <>
                                        <Robot size={24} weight="bold" className="group-hover:scale-125 transition-transform" />
                                        Initiate Neural Extraction
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Preview & Pay */}
                    {step === "preview" && drafts.length > 0 && (
                        <div className="flex-1 flex flex-col space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                             <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-900/10">
                                        <Lightning size={28} weight="bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-bold tracking-tighter text-slate-900 leading-none">Extraction Summary</h2>
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Processing {drafts.length} Neural Matches</p>
                                    </div>
                                </div>
                                <button onClick={() => { setStep("upload"); setDrafts([]); }} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors flex items-center gap-1.5">
                                     <CaretLeft size={14} weight="bold" /> Discard
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: "Detected items", value: drafts.length, color: "text-indigo-600", bg: "bg-indigo-50" },
                                    { label: "Unit overhead", value: `₹${pricePerMCQ}`, color: "text-slate-900", bg: "bg-slate-50" },
                                    { label: "Sync protocol", value: `₹${totalCost}`, color: "text-emerald-600", bg: "bg-emerald-50" },
                                ].map((stat, i) => (
                                    <div key={i} className={cn("p-6 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-center group transition-all hover:shadow-md hover:-translate-y-1", stat.bg)}>
                                         <span className={cn("text-3xl font-black   mb-1", stat.color)}>{stat.value}</span>
                                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60">{stat.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 flex-1">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Logic Preview</h3>
                                <div className="space-y-4">
                                    {drafts.slice(0, 2).map((draft, index) => (
                                        <div key={draft.id} className="bg-slate-50/50 rounded-lg border border-slate-100 p-6 space-y-6 group hover:bg-white hover:shadow-md transition-all">
                                            <div className="flex items-start gap-4">
                                                 <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                     {(index + 1).toString().padStart(2, '0')}
                                                 </div>
                                                 <p className="font-bold text-slate-900 text-sm leading-relaxed pr-8">{draft.question}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 pl-14">
                                                {JSON.parse(draft.options).map((option: string, i: number) => (
                                                    <div key={i} className={cn(
                                                        "px-4 py-2.5 rounded-lg text-[11px] font-bold border flex items-center justify-between",
                                                        option === draft.answer ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-white border-slate-50 text-slate-400"
                                                    )}>
                                                        {vowelsToChar(i)}. {option}
                                                        {option === draft.answer && <CheckCircle size={14} weight="fill" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {drafts.length > 2 && (
                                        <div className="text-center py-4">
                                            <div className="px-6 py-2 rounded-full border border-dashed border-slate-200 inline-block text-[10px] font-black text-slate-300 uppercase tracking-widest">+ {drafts.length - 2} Items in Neural Pool</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-50 flex flex-col gap-4">
                                <button
                                    onClick={handleMockPayAndImport}
                                    className="w-full h-18 rounded-lg bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-600 shadow-xl shadow-slate-900/10 transition-all flex items-center justify-center gap-4 relative overflow-hidden group"
                                >
                                     <CurrencyInr size={20} weight="bold" className="group-hover:scale-125 transition-transform" />
                                     Sync {drafts.length} Items · Authorize ₹{totalCost}
                                     <Sparkle size={40} weight="fill" className="absolute -right-4 -top-4 opacity-5" />
                                </button>
                                <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-40">Razorpay Simulation Active · Encrypted Transaction</p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Success Screen */}
                    {step === "paid" && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-[40px] rounded-full animate-pulse" />
                                <div className="relative w-24 h-24 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center shadow-2xl">
                                    <Sparkle size={44} weight="fill" className="animate-bounce" />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 mb-2">
                                    <CheckCircle size={14} weight="bold" /> Transaction Confirmed
                                </div>
                                <h2 className="text-3xl font-bold tracking-tighter text-slate-900 leading-tight">Neural Sync Complete</h2>
                                <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md mx-auto">
                                    Items have been structured and indexed into the <span className="text-indigo-600 font-bold">Question Vault</span>.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full max-w-sm pt-4">
                                <button
                                    onClick={() => setStep("upload")}
                                    className="h-16 rounded-lg bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                     New Sync Pulse
                                </button>
                                <button
                                    onClick={() => (window.location.href = "/teacher/questions")}
                                    className="h-16 rounded-lg bg-white border border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-900 hover:border-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    View Vault <CaretRight size={18} weight="bold" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function vowelsToChar(i: number) {
    return String.fromCharCode(65 + i);
}
