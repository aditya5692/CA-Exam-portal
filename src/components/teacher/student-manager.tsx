"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { getTeacherStudents, removeStudentFromBatch, getStudentPerformanceSummary } from "@/actions/batch-actions";
import {
    ArrowRight, CaretDown, CaretUp, MagnifyingGlass, User, X, ChartLineUp, Trash,
} from "@phosphor-icons/react";
import { ShieldCheck } from "lucide-react";
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

const FILTERABLE_COLUMNS: Array<{ key: keyof Omit<StudentDirectoryRow, "id" | "batchNames" | "batchCodes" | "batchOwners"> | "batch"; label: string }> = [
    { key: "name", label: "Student" },
    { key: "registrationNumber", label: "Registration" },
    { key: "department", label: "Department" },
    { key: "batch", label: "Batch Enrolled" },
    { key: "attemptDue", label: "Attempt Due" },
    { key: "status", label: "Status" },
    { key: "joinedAt", label: "Joined" },
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
            if (res.success) {
                setData(res as unknown as PerformanceData);
            } else {
                setError(res.message ?? "Failed to load performance.");
            }
        })();
    }, [studentId]);

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            {/* Panel */}
            <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-4 duration-300 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Performance</div>
                        <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                            <X size={16} />
                        </button>
                    </div>
                    <h2 className="text-xl font-black font-outfit">{studentName}</h2>
                    {data?.student.examTarget && (
                        <span className="mt-2 inline-block px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                            {data.student.examTarget}
                        </span>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {loading && (
                        <div className="flex items-center justify-center py-16 text-gray-400">
                            <div className="animate-spin text-3xl">⟳</div>
                        </div>
                    )}
                    {error && (
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 font-medium">{error}</div>
                    )}
                    {!loading && data && (
                        <>
                            {/* Stats */}
                            {data.profile ? (
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: "Level", value: data.profile.level },
                                        { label: "Total XP", value: `⚡${data.profile.totalXP}` },
                                        { label: "Streak", value: `🔥${data.profile.streak}d` },
                                        { label: "Attempts", value: data.profile.totalAttempts },
                                        { label: "Correct", value: data.profile.totalCorrect },
                                        { label: "Accuracy", value: `${data.profile.avgAccuracy}%` },
                                    ].map((m) => (
                                        <div key={m.label} className="text-center p-3 rounded-2xl bg-gray-50 border border-gray-100">
                                            <div className="text-lg font-black font-outfit text-gray-900">{m.value}</div>
                                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{m.label}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <div className="text-3xl mb-2">📭</div>
                                    No attempts recorded yet
                                </div>
                            )}

                            {/* Subject accuracy */}
                            {data.subjectAccuracy.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Subject Accuracy</h3>
                                    <div className="space-y-2.5">
                                        {data.subjectAccuracy.slice(0, 5).map((s) => {
                                            const color = s.accuracy >= 75 ? "#22c55e" : s.accuracy >= 55 ? "#f59e0b" : "#ef4444";
                                            const textColor = s.accuracy >= 75 ? "text-green-600" : s.accuracy >= 55 ? "text-amber-600" : "text-rose-600";
                                            return (
                                                <div key={s.subject} className="flex items-center gap-3">
                                                    <span className="text-xs font-medium text-gray-700 w-28 shrink-0 truncate">{s.subject}</span>
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: `${s.accuracy}%`, backgroundColor: color }} />
                                                    </div>
                                                    <span className={cn("w-9 text-right text-xs font-black", textColor)}>{s.accuracy}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Recent attempts */}
                            {data.recentAttempts.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Recent Attempts</h3>
                                    <div className="space-y-2">
                                        {data.recentAttempts.slice(0, 5).map((a) => {
                                            const col = a.accuracy >= 75 ? "text-green-600" : a.accuracy >= 55 ? "text-amber-600" : "text-rose-600";
                                            return (
                                                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-bold text-gray-900 truncate">{a.title}</div>
                                                        <div className="text-[10px] text-gray-400">{a.date}</div>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <div className={cn("text-sm font-black", col)}>{a.accuracy}%</div>
                                                        <div className="text-[10px] text-gray-400">{a.score}/{a.totalMarks}</div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="font-black text-gray-900 text-lg mb-1">Remove from Batch</h3>
                <p className="text-sm text-gray-500 mb-5">
                    Remove <strong>{student.name}</strong> from a batch. The student account is NOT deleted.
                </p>
                {batches.length > 1 ? (
                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select batch to remove from</label>
                        <select value={batchId} onChange={(e) => setBatchId(e.target.value)}
                            className="mt-1.5 w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                ) : (
                    <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold text-gray-700">
                        Batch: {batches[0]?.name}
                    </div>
                )}
                <div className="flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">
                        Cancel
                    </button>
                    <button onClick={() => onConfirm(batchId)} disabled={saving || !batchId}
                        className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm disabled:opacity-50 transition-all active:scale-95">
                        {saving ? "Removing..." : "Remove"}
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
        setStudents((res.students ?? []) as StudentDirectoryRow[]);
        setIsAdminView(Boolean(res.isAdminView));
    }, []);

    useEffect(() => { void reload(); }, [reload]);

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
            showToast(`Removed ${removeStudent.name} from ${res.batchName}.`);
            void reload();
        } else {
            showToast(res.message ?? "Failed to remove.");
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-300">
                    {toast}
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

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 font-outfit tracking-tight">
                        {isAdminView ? "Academy Student Directory" : "Student Directory"}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {isAdminView ? "All students across all teacher batches." : "Built from your batch enrollments, with per-column filtering."}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isAdminView && (
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-700 inline-flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Academy-wide admin view
                        </div>
                    )}
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                        Total: <span className="font-black">{students.length}</span>
                    </div>
                </div>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                {/* Search */}
                <div className="mb-8">
                    <div className="relative w-full xl:w-[28rem]">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" value={globalQuery} onChange={(e) => setGlobalQuery(e.target.value)}
                            placeholder="Search by name, email, batch or teacher..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500/30 transition-all" />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="min-w-full text-left">
                        <thead className="bg-gray-50/60 align-top">
                            <tr className="border-b border-gray-100">
                                {FILTERABLE_COLUMNS.map((col) => {
                                    const sk = col.key === "batch" ? "batch" : col.key as SortKey;
                                    const isSorted = sortKey === sk;
                                    return (
                                        <th key={col.key} className="p-4 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                            <button type="button" onClick={() => handleSort(sk)}
                                                className="flex items-center gap-2 text-left transition-colors hover:text-gray-600">
                                                {col.label}
                                                {isSorted && sortDirection === "asc" && <CaretUp size={12} weight="bold" className="text-indigo-600" />}
                                                {isSorted && sortDirection === "desc" && <CaretDown size={12} weight="bold" className="text-indigo-600" />}
                                            </button>
                                            <input type="text" value={columnFilters[col.key] ?? ""} onChange={(e) => updateFilter(col.key, e.target.value)}
                                                placeholder={`Filter...`}
                                                className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-medium normal-case tracking-normal text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10" />
                                        </th>
                                    );
                                })}
                                <th className="p-4 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {visibleStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={FILTERABLE_COLUMNS.length + 1} className="px-6 py-14 text-center text-sm text-gray-500">
                                        No students matched the current filters.
                                    </td>
                                </tr>
                            ) : (
                                visibleStudents.map((student) => (
                                    <tr key={student.id} className="group hover:bg-indigo-50/30 transition-all">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                                    <User size={18} weight="bold" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{student.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-medium">{student.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-700">{student.registrationNumber}</td>
                                        <td className="p-4 text-sm text-gray-600">{student.department}</td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                {student.batchNames.map((batchName, idx) => (
                                                    <div key={`${student.id}-${batchName}-${idx}`} className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                                                        <span className="font-semibold">{batchName}</span>
                                                        <span className="text-gray-400"> · {student.batchCodes[idx] ?? ""}</span>
                                                        {isAdminView && (
                                                            <div className="text-[10px] text-gray-500 mt-0.5">Teacher: {student.batchOwners[idx] ?? "Educator"}</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                                                {student.attemptDue}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                                                student.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-gray-600 border-gray-200")}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs font-medium text-gray-500">{formatDate(student.joinedAt)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                {/* Performance */}
                                                <button onClick={() => setPerformanceStudent({ id: student.id, name: student.name })}
                                                    className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-500 hover:bg-indigo-100 transition-all"
                                                    title="View Performance">
                                                    <ChartLineUp size={16} weight="bold" />
                                                </button>
                                                {/* Remove from batch */}
                                                {student.batchNames.length > 0 && (
                                                    <button onClick={() => setRemoveStudent(student)}
                                                        className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-100 transition-all"
                                                        title="Remove from batch">
                                                        <Trash size={16} weight="bold" />
                                                    </button>
                                                )}
                                                {/* History */}
                                                <button onClick={() => setPerformanceStudent({ id: student.id, name: student.name })}
                                                    className="p-2 rounded-lg bg-gray-50 border border-transparent hover:border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-white transition-all"
                                                    title="Full profile">
                                                    <ArrowRight size={16} weight="bold" />
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
