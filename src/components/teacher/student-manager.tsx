"use client";

import { getStudentPerformanceSummary, getTeacherStudents, removeStudentFromBatch } from "@/actions/batch-actions";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Buildings,
  CalendarCheck,
  CaretDown, CaretUp,
  ChartLineUp,
  DotsThreeVertical,
  GraduationCap, IdentificationBadge,
  MagnifyingGlass,
  MagnifyingGlassPlus,
  ShieldCheck,
  Sparkle,
  Target,
  Trash,
  UserCircleCheck,
  IdentificationCard as UserID,
  Users,
  X,
  Phone,
  EnvelopeSimple,
  Clock,
  ArrowUpRight
} from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ComponentProps, type ComponentType } from "react";

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

type FilterColumnIcon = ComponentType<ComponentProps<typeof GraduationCap>>;

const FILTERABLE_COLUMNS: Array<{ key: keyof Omit<StudentDirectoryRow, "id" | "batchNames" | "batchCodes" | "batchOwners"> | "batch"; label: string; icon: FilterColumnIcon }> = [
    { key: "name", label: "Cadet Identity", icon: GraduationCap },
    { key: "registrationNumber", label: "Registry ID", icon: UserID },
    { key: "department", label: "Division", icon: Buildings },
    { key: "batch", label: "Cohort Segment", icon: Target },
    { key: "attemptDue", label: "Cycle Phase", icon: CalendarCheck },
    { key: "status", label: "Vitals", icon: UserCircleCheck },
    { key: "joinedAt", label: "Enlistment", icon: Sparkle },
];

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
        <div className="fixed inset-0 z-[100] flex justify-end font-lexend">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-500 overflow-hidden">
                <div className="bg-slate-900 p-6 md:p-10 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/20 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                                 <ChartLineUp size={18} weight="bold" className="text-indigo-400" />
                             </div>
                             <div className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">Intelligence Node</div>
                        </div>
                        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md border border-white/10 flex items-center justify-center group active:scale-95">
                            <X size={16} weight="bold" className="group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{studentName}</h2>
                        <div className="flex flex-wrap gap-2 text-xs">
                            {data?.student.examTarget && (
                                <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold border border-amber-500/20 uppercase tracking-widest text-[9px]">
                                    Target: {data.student.examTarget}
                                </span>
                            )}
                            <span className="px-3 py-1 rounded-lg bg-white/5 text-slate-400 font-bold border border-white/5 uppercase tracking-widest text-[9px]">
                                Enlisted: {data ? new Date(data.student.createdAt).toLocaleDateString() : '...'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 scrollbar-thin">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hydrating Intelligence...</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100 text-sm text-rose-600 font-bold flex items-center gap-4">
                             <X size={20} weight="bold" />
                             {error}
                        </div>
                    )}
                    
                    {!loading && data && (
                        <>
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Engagement Matrix</h3>
                                {data.profile ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: "Elite Level", value: data.profile.level, icon: Sparkle, color: "text-amber-500", bg: "bg-amber-50" },
                                            { label: "Total XP", value: data.profile.totalXP, icon: Target, color: "text-indigo-600", bg: "bg-indigo-50" },
                                            { label: "Accuracy", value: `${data.profile.avgAccuracy}%`, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
                                            { label: "Momentum", value: `${data.profile.streak}D`, icon: ChartLineUp, color: "text-rose-600", bg: "bg-rose-50" },
                                        ].map((m) => (
                                            <div key={m.label} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                                <div className={cn("w-9 h-9 rounded-xl mb-3 flex items-center justify-center group-hover:scale-110", m.bg, m.color)}>
                                                    <m.icon size={18} weight="bold" />
                                                </div>
                                                <div className="text-xl font-bold text-slate-900 mb-0.5">{m.value}</div>
                                                <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest opacity-70">{m.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <IdentificationBadge size={40} weight="light" className="text-slate-300 mb-3" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zero Datapoints Detected</p>
                                    </div>
                                )}
                            </div>

                            {data.subjectAccuracy.length > 0 && (
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Domain Proficiency</h3>
                                    <div className="space-y-5">
                                        {data.subjectAccuracy.slice(0, 5).map((s) => (
                                            <div key={s.subject} className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{s.subject}</span>
                                                    <span className="text-[10px] font-black text-indigo-600">{s.accuracy}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${s.accuracy}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {data.recentAttempts.length > 0 && (
                                <div className="space-y-6 pb-10">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Recent Missions</h3>
                                    <div className="space-y-3">
                                        {data.recentAttempts.slice(0, 5).map((a) => (
                                            <div key={a.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/30 transition-all">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-slate-900 truncate">{a.title}</div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{a.date} · {a.category}</div>
                                                </div>
                                                <div className="text-sm font-black text-indigo-600">{a.accuracy}%</div>
                                            </div>
                                        ))}
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center font-lexend p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-[32px] border border-slate-100 shadow-2xl p-8 md:p-10 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                         <Trash size={24} weight="bold" />
                     </div>
                     <div>
                        <h3 className="font-bold text-slate-900 text-xl tracking-tight">De-enroll Protocol</h3>
                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mt-0.5">Registry Cleanup Sequence</p>
                     </div>
                </div>

                <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
                    Removing <strong>{student.name}</strong> will revoke their access to segment resources and materials immediately.
                </p>

                {batches.length > 1 ? (
                    <div className="mb-8 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Target Segment</label>
                        <select value={batchId} onChange={(e) => setBatchId(e.target.value)}
                            className="w-full h-12 border border-slate-100 rounded-xl px-4 text-sm bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-bold text-slate-700">
                            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                ) : (
                    <div className="mb-8 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Segment</span>
                        <span className="text-indigo-600">{batches[0]?.name}</span>
                    </div>
                )}

                <div className="flex gap-4">
                    <button onClick={onClose}
                        className="flex-1 h-12 rounded-xl border border-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">
                        Abort
                    </button>
                    <button onClick={() => onConfirm(batchId)} disabled={saving}
                        className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-50 transition-all active:scale-95">
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
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const reload = useCallback(async () => {
        const res = await getTeacherStudents();
        if (!res.success) return;
        setStudents((res.data.students ?? []) as StudentDirectoryRow[]);
        setIsAdminView(Boolean(res.data.isAdminView));
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

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
            showToast(`Subscriber de-enrolled.`);
            void reload();
        } else {
            showToast(res.message ?? "Update failure.");
        }
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
        <div className="space-y-6 pb-20 w-full max-w-[1400px] mx-auto font-lexend animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-6">
            {toast && (
                <div className="fixed bottom-10 right-10 z-[120] px-6 py-3 rounded-xl bg-slate-900 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl animate-in slide-in-from-right-8">
                    <div className="flex items-center gap-3">
                         <ShieldCheck size={18} weight="bold" className="text-emerald-400" />
                         {toast}
                    </div>
                </div>
            )}

            {performanceStudent && (
                <PerformancePanel
                    studentId={performanceStudent.id}
                    studentName={performanceStudent.name}
                    onClose={() => setPerformanceStudent(null)}
                />
            )}

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

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Registry Operations</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {isAdminView ? "Cadet Command Center" : "Student Registry"}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm max-w-2xl leading-relaxed opacity-80">
                        High-density management of indexed cohort intelligence and performance metrics.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2.5 rounded-xl bg-white border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3 shadow-sm transition-all hover:border-indigo-100">
                        <Users size={16} weight="bold" className="text-indigo-600" />
                        <span className="opacity-60">Cohort Volume</span> 
                        <span className="text-sm font-bold text-slate-900 ml-1">{students.length}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-[28px] border border-slate-100 shadow-sm p-5 md:p-6 lg:p-8">
                {/* Search / Filter Row */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
                    <div className="relative flex-1">
                        <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} weight="bold" />
                        <input type="text" value={globalQuery} onChange={(e) => setGlobalQuery(e.target.value)}
                            placeholder="Global Intelligence Search..."
                            className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/30 transition-all font-lexend" />
                    </div>
                    <button className="h-11 px-6 rounded-xl bg-white border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-all shadow-sm active:scale-95 flex items-center gap-2">
                        <DotsThreeVertical size={18} weight="bold" /> Export Feed
                    </button>
                </div>

                {/* TABLE VIEW (Desktop Large) */}
                <div className="hidden lg:block overflow-x-auto scrollbar-thin border border-slate-100 rounded-2xl">
                    <table className="min-w-full text-left border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr>
                                {FILTERABLE_COLUMNS.map((col) => {
                                    const sk = col.key === "batch" ? "batch" : col.key as SortKey;
                                    const isSorted = sortKey === sk;
                                    const Icon = col.icon;
                                    return (
                                        <th key={col.key} className="p-4 min-w-[160px] border-b border-slate-100">
                                            <button type="button" onClick={() => handleSort(sk)}
                                                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 hover:text-indigo-600 transition-colors mb-2 ml-1">
                                                <Icon size={12} weight="bold" className="opacity-50" />
                                                {col.label}
                                                {isSorted && (sortDirection === "asc" ? <ArrowRight size={10} className="-rotate-90 ml-1" /> : <ArrowRight size={10} className="rotate-90 ml-1" />)}
                                            </button>
                                            <input type="text" value={columnFilters[col.key] ?? ""} onChange={(e) => {
                                                const v = e.target.value;
                                                setColumnFilters(curr => ({ ...curr, [col.key]: v }));
                                            }}
                                                placeholder={`Filter ${col.label}...`}
                                                className="w-full h-9 rounded-lg border border-slate-50 bg-white px-3 text-[10px] font-bold text-slate-600 placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/5 focus:border-indigo-500/20 outline-none transition-all" />
                                        </th>
                                    );
                                })}
                                <th className="p-4 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 border-b border-slate-100">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {visibleStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={FILTERABLE_COLUMNS.length + 1} className="py-20 text-center">
                                        <IdentificationBadge size={32} weight="light" className="text-slate-200 mx-auto mb-3" />
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No matching registry entries</p>
                                    </td>
                                </tr>
                            ) : (
                                visibleStudents.map((student) => (
                                    <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors duration-300">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px] border border-indigo-100 transition-all group-hover:bg-indigo-600 group-hover:text-white">
                                                    {student.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-900 text-xs truncate tracking-tight">{student.name}</div>
                                                    <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest opacity-60 truncate">{student.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                             <div className="text-xs font-bold text-slate-700">{student.registrationNumber}</div>
                                             <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Registry ID</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                {student.department}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {student.batchNames.map((name, i) => (
                                                    <span key={i} className="px-2 py-1 rounded-md bg-indigo-50/50 text-[9px] font-bold text-indigo-600 border border-indigo-100 whitespace-nowrap">
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs font-bold text-slate-900">{student.attemptDue}</td>
                                        <td className="p-4">
                                            <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5",
                                                student.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100")}>
                                                <div className={cn("w-1 h-1 rounded-full", student.status === "Active" ? "bg-emerald-500" : "bg-slate-300")} />
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-[10px] font-bold text-slate-400">{formatDate(student.joinedAt)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => setPerformanceStudent({ id: student.id, name: student.name })}
                                                    className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center border border-indigo-100 shadow-sm" title="Performance">
                                                    <ChartLineUp size={16} weight="bold" />
                                                </button>
                                                <button onClick={() => setRemoveStudent(student)}
                                                    className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center border border-rose-100 shadow-sm" title="Revoke">
                                                    <Trash size={16} weight="bold" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* CARD VIEW (Mobile/Tablet Adaptive) */}
                <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleStudents.length === 0 ? (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-300">
                             <MagnifyingGlassPlus size={40} weight="light" className="mb-3" />
                             <span className="text-[10px] font-black uppercase tracking-widest">No Datasets Matched</span>
                        </div>
                    ) : (
                        visibleStudents.map((student) => (
                            <div key={student.id} className="student-surface rounded-2xl p-5 md:p-6 space-y-5 transition-all hover:border-indigo-100 hover:shadow-lg">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0 border border-indigo-50">
                                            {student.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-900 text-sm truncate tracking-tight">{student.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold truncate opacity-80">{student.email}</p>
                                        </div>
                                    </div>
                                    <span className={cn("shrink-0 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-dashed",
                                        student.status === "Active" ? "border-emerald-500/20 text-emerald-600 bg-emerald-50" : "border-slate-500/20 text-slate-400 bg-slate-50")}>
                                        {student.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <IdentificationBadge size={12} weight="bold" /> ID Registry
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-700 truncate">{student.registrationNumber}</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Buildings size={12} weight="bold" /> Division
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-700 truncate">{student.department}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    {student.batchNames.map((name, i) => (
                                        <span key={i} className="px-2 py-1 rounded-lg bg-indigo-50 text-[9px] font-bold text-indigo-600 border border-indigo-100">
                                            {name}
                                        </span>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} weight="bold" className="text-slate-300" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enlisted: {formatDate(student.joinedAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setPerformanceStudent({ id: student.id, name: student.name })}
                                            className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                            <ChartLineUp size={20} weight="bold" />
                                        </button>
                                        <button onClick={() => setRemoveStudent(student)}
                                            className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-rose-500 flex items-center justify-center hover:bg-rose-50 hover:border-rose-100 transition-all">
                                            <Trash size={20} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
