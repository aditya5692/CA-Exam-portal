"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { getTeacherStudents, removeStudentFromBatch, getStudentPerformanceSummary } from "@/actions/batch-actions";
import {
    ArrowRight, CaretDown, CaretUp, MagnifyingGlass, User, X, ChartLineUp, Trash, ShieldCheck,
    DotsThreeVertical, MagnifyingGlassPlus, GraduationCap, IdentificationBadge, Buildings, 
    CalendarCheck, UserCircleCheck, IdentificationCard, IdentificationCard as UserID, Target, Sparkle,
    Users
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type StudentDirectoryRow = {
    id: string;
    name: string;
    email: string;
    registrationNumber: string;
    department: string;
    batchNames: string[];
    batchIds: string[];
    batchCodes: string[];
    batchOwners: string[];
    attemptDue: string;
    status: string;
    joinedAt: string | Date;
};

type SortKey = "name" | "registrationNumber" | "department" | "batch" | "attemptDue" | "status" | "joinedAt";

type PerformanceData = {
    student: { fullName: string | null; email: string | null; examTarget: string | null; createdAt: Date };
    profile: {
        level: number; totalXP: number; streak: number;
        totalAttempts: number; totalCorrect: number; avgAccuracy: number;
    } | null;
    recentAttempts: { id: string; title: string; category: string; score: number; totalMarks: number; accuracy: number; date: string }[];
    subjectAccuracy: { subject: string; accuracy: number }[];
};

const FILTERABLE_COLUMNS: Array<{ key: keyof Omit<StudentDirectoryRow, "id" | "batchNames" | "batchCodes" | "batchOwners"> | "batch"; label: string; icon: any }> = [
    { key: "name", label: "Cadet Identity", icon: GraduationCap },
    { key: "registrationNumber", label: "Registry ID", icon: UserID },
    { key: "department", label: "Division", icon: Buildings },
    { key: "batch", label: "Cohort Segment", icon: Target },
    { key: "attemptDue", label: "Cycle Phase", icon: CalendarCheck },
    { key: "status", label: "Vitals", icon: HeartbeatIcon },
    { key: "joinedAt", label: "Enlistment", icon: Sparkle },
];

function HeartbeatIcon(props: any) {
    return <UserCircleCheck {...props} />;
}

// ── Performance slide-out panel ────────────────────────────────────────────────

function PerformancePanel({ studentId, studentName, onClose }: { studentId: string; studentName: string; onClose: () => void }) {
    const [data, setData] = useState<PerformanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            const res = await getStudentPerformanceSummary(studentId);
            setLoading(false);
            if (res.success && res.data) {
                setData(res.data as PerformanceData);
            } else {
                setError(res.message ?? "Failed to load performance.");
            }
        })();
    }, [studentId]);

    return (
        <div className="fixed inset-0 z-[100] flex justify-end font-outfit">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-500 overflow-hidden">
                <div className="bg-slate-900 p-10 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none transition-all duration-1000" />
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                                 <ChartLineUp size={20} weight="bold" className="text-indigo-400" />
                             </div>
                             <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Student Intelligence</div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md border border-white/10 flex items-center justify-center group active:scale-95">
                            <X size={18} weight="bold" className="group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <h2 className="text-3xl font-bold tracking-tighter">{studentName}</h2>
                        <div className="flex flex-wrap gap-2">
                            {data?.student.examTarget && (
                                <span className="px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                                    Target: {data.student.examTarget}
                                </span>
                            )}
                            <span className="px-4 py-1.5 rounded-full bg-white/5 text-slate-400 text-[9px] font-black uppercase tracking-widest border border-white/5">
                                Active Tenure: {data ? new Date(data.student.createdAt).toLocaleDateString() : '...'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-thin">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Datastreams...</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="p-6 rounded-[24px] bg-rose-50 border border-rose-100 text-sm text-rose-600 font-bold flex items-center gap-4">
                             <Trash size={24} weight="fill" />
                             {error}
                        </div>
                    )}
                    
                    {!loading && data && (
                        <>
                            {/* Stats */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Engagement Vitals</h3>
                                {data.profile ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: "Elite Level", value: data.profile.level, icon: Sparkle, color: "text-amber-500", bg: "bg-amber-50" },
                                            { label: "Experience Points", value: data.profile.totalXP, icon: Target, color: "text-indigo-600", bg: "bg-indigo-50" },
                                            { label: "Cohort Accuracy", value: `${data.profile.avgAccuracy}%`, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
                                            { label: "Active Momentum", value: `${data.profile.streak} Days`, icon: ChartLineUp, color: "text-rose-600", bg: "bg-rose-50" },
                                        ].map((m) => (
                                            <div key={m.label} className="p-6 rounded-[28px] bg-white border border-slate-100 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md group">
                                                <div className={cn("w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110", m.bg, m.color)}>
                                                    <m.icon size={20} weight="bold" />
                                                </div>
                                                <div className="text-2xl font-bold font-outfit text-slate-900 tracking-tight">{m.value}</div>
                                                <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 opacity-70">{m.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-300 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                                        <IdentificationBadge size={48} weight="light" className="mb-4 opacity-50" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No Interaction History Detected</p>
                                    </div>
                                )}
                            </div>

                            {/* Subject accuracy */}
                            {data.subjectAccuracy.length > 0 && (
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Domain Proficiency</h3>
                                    <div className="space-y-6">
                                        {data.subjectAccuracy.slice(0, 5).map((s) => {
                                            const colorClass = s.accuracy >= 75 ? "bg-emerald-500" : s.accuracy >= 55 ? "bg-amber-500" : "bg-rose-500";
                                            const textClass = s.accuracy >= 75 ? "text-emerald-600" : s.accuracy >= 55 ? "text-amber-600" : "text-rose-600";
                                            return (
                                                <div key={s.subject} className="space-y-3">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide truncate max-w-[240px]">{s.subject}</span>
                                                        <span className={cn("text-xs font-black", textClass)}>{s.accuracy}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                                                        <div className={cn("h-full rounded-full transition-all duration-1000", colorClass)} style={{ width: `${s.accuracy}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Recent attempts */}
                            {data.recentAttempts.length > 0 && (
                                <div className="space-y-6 pb-10">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Recent Mission Logs</h3>
                                    <div className="space-y-3">
                                        {data.recentAttempts.slice(0, 5).map((a) => {
                                            const colorClass = a.accuracy >= 75 ? "text-emerald-600 border-emerald-100 bg-emerald-50/30" : a.accuracy >= 55 ? "text-amber-600 border-amber-100 bg-amber-50/30" : "text-rose-600 border-rose-100 bg-rose-50/30";
                                            return (
                                                <div key={a.id} className="flex items-center gap-4 p-5 rounded-[24px] bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-sm transition-all group">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold text-slate-900 truncate tracking-tight">{a.title}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{a.date} · {a.category}</div>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <div className={cn("text-lg font-black font-outfit px-3 py-1 rounded-xl border-2", colorClass)}>{a.accuracy}%</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Remove confirm modal ───────────────────────────────────────────────────────

function RemoveModal({
    student, batches, onConfirm, onClose, saving
}: {
    student: { id: string; name: string; batchNames: string[]; batchCodes: string[] };
    batches: { id: string; name: string; code: string }[];
    onConfirm: (batchId: string) => void;
    onClose: () => void;
    saving: boolean;
}) {
    const [batchId, setBatchId] = useState(batches[0]?.id ?? "");

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center font-outfit">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 animate-in fade-in zoom-in-95 duration-300 border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                     <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                         <Trash size={28} weight="bold" />
                     </div>
                     <div>
                        <h3 className="font-bold text-slate-900 text-2xl tracking-tighter">De-enroll Cadet</h3>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-0.5">Segment Removal Sequence</p>
                     </div>
                </div>

                <p className="text-slate-500 font-medium text-base mb-8 leading-relaxed">
                    You are about to remove <strong>{student.name}</strong> from the selected segment. This action will revoke access to segment-specific materials.
                </p>

                {batches.length > 1 ? (
                    <div className="mb-8 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Target Segment</label>
                        <select value={batchId} onChange={(e) => setBatchId(e.target.value)}
                            className="w-full h-14 border border-slate-100 rounded-2xl px-5 py-3 text-sm bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-sans font-semibold">
                            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                ) : (
                    <div className="mb-8 p-6 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 flex justify-between items-center group">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Segment</span>
                        <span className="text-indigo-600">{batches[0]?.name}</span>
                    </div>
                )}

                <div className="flex gap-4">
                    <button onClick={onClose}
                        className="flex-1 h-14 rounded-2xl border border-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">
                        Abort Sequence
                    </button>
                    <button onClick={() => onConfirm(batchId)} disabled={saving || !batchId}
                        className="flex-1 h-14 rounded-2xl bg-slate-900 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-slate-900/10 hover:shadow-rose-900/20">
                        {saving ? "Processing..." : "Confirm Removal"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function StudentManager() {
    const [students, setStudents] = useState<StudentDirectoryRow[]>([]);
    const [isAdminView, setIsAdminView] = useState(false);
    const [globalQuery, setGlobalQuery] = useState("");
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [performanceStudent, setPerformanceStudent] = useState<{ id: string; name: string } | null>(null);
    const [removeStudent, setRemoveStudent] = useState<StudentDirectoryRow | null>(null);
    const [removeSaving, setRemoveSaving] = useState(false);
    const [toast, setToast] = useState("");

    const reload = useCallback(async () => {
        const res = await getTeacherStudents();
        if (!res.success) return;
        setStudents((res.data.students ?? []) as StudentDirectoryRow[]);
        setIsAdminView(Boolean(res.data.isAdminView));
    }, []);

    useEffect(() => {
        let mounted = true;
        const fetchStudents = async () => {
            const res = await getTeacherStudents();
            if (mounted && res.success) {
                setStudents((res.data.students ?? []) as StudentDirectoryRow[]);
                setIsAdminView(Boolean(res.data.isAdminView));
            }
        };
        fetchStudents();
        return () => { mounted = false; };
    }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    };

    const handleRemove = async (batchId: string) => {
        if (!removeStudent) return;
        setRemoveSaving(true);
        const res = await removeStudentFromBatch(removeStudent.id, batchId);
        setRemoveSaving(false);
        setRemoveStudent(null);
        if (res.success) {
            showToast(`De-enrolled ${removeStudent.name} from ${res.data?.batchName ?? "segment"}.`);
            void reload();
        } else {
            showToast(res.message ?? "Protocol failed.");
        }
    };

    const updateFilter = (key: string, value: string) => {
        setColumnFilters((curr) => ({ ...curr, [key]: value }));
    };

    const visibleStudents = useMemo(() => {
        const q = globalQuery.trim().toLowerCase();
        const filtered = students.filter((s) => {
            const matchesGlobal = !q || [s.name, s.email, s.registrationNumber, s.department, s.batchNames.join(" "), s.batchCodes.join(" ")].some((v) => v.toLowerCase().includes(q));
            if (!matchesGlobal) return false;
            return FILTERABLE_COLUMNS.every(({ key }) => {
                const fv = (columnFilters[key] ?? "").trim().toLowerCase();
                if (!fv) return true;
                const val = key === "batch" ? `${s.batchNames.join(" ")} ${s.batchCodes.join(" ")}` : key === "joinedAt" ? new Date(s.joinedAt).toLocaleDateString("en-IN") : String(s[key as keyof StudentDirectoryRow] ?? "");
                return val.toLowerCase().includes(fv);
            });
        });
        return [...filtered].sort((a, b) => {
            const lv = sortKey === "batch" ? a.batchNames.join(", ") : sortKey === "joinedAt" ? new Date(a.joinedAt).getTime() : String(a[sortKey] ?? "");
            const rv = sortKey === "batch" ? b.batchNames.join(", ") : sortKey === "joinedAt" ? new Date(b.joinedAt).getTime() : String(b[sortKey] ?? "");
            if (typeof lv === "number" && typeof rv === "number") return sortDirection === "asc" ? lv - rv : rv - lv;
            return sortDirection === "asc" ? String(lv).localeCompare(String(rv)) : String(rv).localeCompare(String(lv));
        });
    }, [columnFilters, globalQuery, sortDirection, sortKey, students]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) { setSortDirection((d) => d === "asc" ? "desc" : "asc"); return; }
        setSortKey(key); setSortDirection("asc");
    };

    const formatDate = (v: string | Date) => new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    return (
        <div className="space-y-6 pb-20 w-full max-w-[1280px] mx-auto font-outfit animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Toast */}
            {toast && (
                <div className="fixed bottom-10 right-10 z-[120] px-8 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500 border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                         <ShieldCheck size={20} weight="bold" className="text-emerald-400" />
                         {toast}
                    </div>
                </div>
            )}

            {/* Performance panel */}
            {performanceStudent && (
                <PerformancePanel
                    studentId={performanceStudent.id}
                    studentName={performanceStudent.name}
                    onClose={() => setPerformanceStudent(null)}
                />
            )}

            {/* Remove modal */}
            {removeStudent && (
                <RemoveModal
                    student={removeStudent}
                    batches={removeStudent.batchNames.map((name, i) => ({
                        id: removeStudent.batchIds[i] ?? removeStudent.batchCodes[i],
                        name,
                        code: removeStudent.batchCodes[i],
                    }))}
                    onConfirm={handleRemove}
                    onClose={() => setRemoveStudent(null)}
                    saving={removeSaving}
                />
            )}

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Fleet Operations</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter text-slate-900">
                        {isAdminView ? "Academy Cadet Registry" : "Student Directory"}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm font-sans max-w-2xl leading-relaxed">
                        {isAdminView ? "Consolidated intelligence across all instructional segments." : "High-fidelity management of your indexed cohort and performance tracking."}
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center">
                    {isAdminView && (
                        <div className="px-6 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm">
                            <ShieldCheck size={18} weight="bold" /> Admin Oversight Active
                        </div>
                    )}
                    <div className="px-5 h-12 rounded-xl bg-white border border-slate-100 text-slate-500 font-black text-[9px] uppercase tracking-widest flex items-center gap-3 shadow-sm">
                        <Users size={16} weight="bold" className="text-indigo-600" />
                        Segment Size <span className="text-lg ml-1 text-slate-900">{students.length}</span>
                    </div>

                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-slate-100 shadow-sm p-8 overflow-hidden">
                {/* Search / Filter Controls */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
                    <div className="relative w-full xl:w-[28rem]">
                        <MagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} weight="bold" />
                        <input type="text" value={globalQuery} onChange={(e) => setGlobalQuery(e.target.value)}
                            placeholder="Global Search..."
                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-6 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-sans font-semibold" />
                    </div>

                    
                    <button className="px-8 h-14 rounded-2xl bg-white border border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all flex items-center gap-3">
                        <DotsThreeVertical size={20} weight="bold" /> Export Protocol
                    </button>
                </div>

                <div className="overflow-x-auto scrollbar-thin rounded-[32px] border border-slate-100">
                    <table className="min-w-full text-left border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr>
                                {FILTERABLE_COLUMNS.map((col) => {
                                    const sk = col.key === "batch" ? "batch" : col.key as SortKey;
                                    const isSorted = sortKey === sk;
                                    const Icon = col.icon;
                                    return (
                                        <th key={col.key} className="p-6 min-w-[180px]">
                                            <button type="button" onClick={() => handleSort(sk)}
                                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors mb-3">
                                                <Icon size={14} weight="bold" className="opacity-60" />
                                                {col.label}
                                                {isSorted && (sortDirection === "asc" ? <CaretUp size={12} weight="bold" className="ml-1" /> : <CaretDown size={12} weight="bold" className="ml-1" />)}
                                            </button>
                                            <input type="text" value={columnFilters[col.key] ?? ""} onChange={(e) => updateFilter(col.key, e.target.value)}
                                                placeholder={`Filter ${col.label}...`}
                                                className="w-full h-10 rounded-xl border border-slate-100 bg-white/50 px-4 text-[11px] font-bold text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all shadow-sm" />
                                        </th>
                                    );
                                })}
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {visibleStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={FILTERABLE_COLUMNS.length + 1} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <MagnifyingGlassPlus size={48} weight="light" className="text-slate-200" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No Cadets Found in Current Registry</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                visibleStudents.map((student) => (
                                    <tr key={student.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[11px] shrink-0 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                                                    {student.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-900 text-sm truncate tracking-tight group-hover:text-indigo-600 transition-colors">{student.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">{student.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                             <div className="text-sm font-bold text-slate-700 font-sans tracking-tight">{student.registrationNumber}</div>
                                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">ID Token</div>
                                        </td>
                                        <td className="p-6">
                                            <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest inline-block">
                                                {student.department}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="space-y-2">
                                                {student.batchNames.map((batchName, idx) => (
                                                    <div key={`${student.id}-${idx}`} className="p-2.5 rounded-xl bg-white border border-slate-100 text-[10px] font-bold text-slate-700 shadow-sm flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                            {batchName}
                                                        </div>
                                                        <div className="pl-3.5 flex items-center justify-between">
                                                            <span className="text-slate-400 font-black uppercase tracking-widest text-[8px]">{student.batchCodes[idx] ?? "N/A"}</span>
                                                            {isAdminView && (
                                                                <span className="text-indigo-400 text-[8px] uppercase tracking-widest font-black">@ {student.batchOwners[idx] ?? "Educator"}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold text-slate-900 tracking-tight">{student.attemptDue}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Phase</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border inline-flex items-center gap-2 shadow-sm",
                                                student.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100")}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", student.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="text-xs font-bold text-slate-500 whitespace-nowrap">{formatDate(student.joinedAt)}</div>
                                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Registry Log</div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => setPerformanceStudent({ id: student.id, name: student.name })}
                                                    className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                                    title="Intelligence Report">
                                                    <ChartLineUp size={20} weight="bold" />
                                                </button>
                                                {student.batchNames.length > 0 && (
                                                    <button onClick={() => setRemoveStudent(student)}
                                                        className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                                        title="De-enroll Protocol">
                                                        <Trash size={20} weight="bold" />
                                                    </button>
                                                )}
                                                <button onClick={() => setPerformanceStudent({ id: student.id, name: student.name })}
                                                    className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm"
                                                    title="Full Registry Entry">
                                                    <ArrowRight size={20} weight="bold" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
