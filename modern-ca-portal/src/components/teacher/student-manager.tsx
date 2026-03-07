"use client";

import { useEffect, useMemo, useState } from "react";
import { getTeacherStudents } from "@/actions/batch-actions";
import {
    ArrowRight,
    CaretDown,
    CaretUp,
    MagnifyingGlass,
    User
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type StudentDirectoryRow = {
    id: string;
    name: string;
    email: string;
    registrationNumber: string;
    department: string;
    batchNames: string[];
    batchCodes: string[];
    attemptDue: string;
    status: string;
    joinedAt: string | Date;
};

type SortKey = "name" | "registrationNumber" | "department" | "batch" | "attemptDue" | "status" | "joinedAt";

const FILTERABLE_COLUMNS: Array<{ key: keyof Omit<StudentDirectoryRow, "id" | "batchNames" | "batchCodes"> | "batch"; label: string }> = [
    { key: "name", label: "Student" },
    { key: "registrationNumber", label: "Registration" },
    { key: "department", label: "Department" },
    { key: "batch", label: "Batch Enrolled" },
    { key: "attemptDue", label: "Attempt Due" },
    { key: "status", label: "Status" },
    { key: "joinedAt", label: "Joined" },
];

export function StudentManager() {
    const [students, setStudents] = useState<StudentDirectoryRow[]>([]);
    const [globalQuery, setGlobalQuery] = useState("");
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    useEffect(() => {
        let active = true;

        (async () => {
            const res = await getTeacherStudents();
            if (!active || !res.success) {
                return;
            }

            setStudents((res.students ?? []) as StudentDirectoryRow[]);
        })();

        return () => {
            active = false;
        };
    }, []);

    const updateFilter = (key: string, value: string) => {
        setColumnFilters((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const visibleStudents = useMemo(() => {
        const normalizedQuery = globalQuery.trim().toLowerCase();

        const filtered = students.filter((student) => {
            const matchesGlobal = normalizedQuery.length === 0 || [
                student.name,
                student.email,
                student.registrationNumber,
                student.department,
                student.batchNames.join(" "),
                student.batchCodes.join(" "),
                student.status,
            ].some((value) => value.toLowerCase().includes(normalizedQuery));

            if (!matchesGlobal) {
                return false;
            }

            return FILTERABLE_COLUMNS.every(({ key }) => {
                const filterValue = (columnFilters[key] ?? "").trim().toLowerCase();
                if (!filterValue) {
                    return true;
                }

                const fieldValue = key === "batch"
                    ? `${student.batchNames.join(" ")} ${student.batchCodes.join(" ")}`
                    : key === "joinedAt"
                        ? new Date(student.joinedAt).toLocaleDateString("en-IN")
                        : String(student[key as keyof StudentDirectoryRow] ?? "");

                return fieldValue.toLowerCase().includes(filterValue);
            });
        });

        const sorted = [...filtered].sort((left, right) => {
            const leftValue = sortKey === "batch"
                ? left.batchNames.join(", ")
                : sortKey === "joinedAt"
                    ? new Date(left.joinedAt).getTime()
                    : String(left[sortKey] ?? "");
            const rightValue = sortKey === "batch"
                ? right.batchNames.join(", ")
                : sortKey === "joinedAt"
                    ? new Date(right.joinedAt).getTime()
                    : String(right[sortKey] ?? "");

            if (typeof leftValue === "number" && typeof rightValue === "number") {
                return sortDirection === "asc" ? leftValue - rightValue : rightValue - leftValue;
            }

            const compare = String(leftValue).localeCompare(String(rightValue), undefined, { sensitivity: "base" });
            return sortDirection === "asc" ? compare : -compare;
        });

        return sorted;
    }, [columnFilters, globalQuery, sortDirection, sortKey, students]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection((current) => current === "asc" ? "desc" : "asc");
            return;
        }

        setSortKey(key);
        setSortDirection("asc");
    };

    const formatDate = (value: string | Date) =>
        new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-outfit tracking-tight">Student Directory</h1>
                    <p className="text-gray-500 text-sm mt-1">Real student directory built from your batch enrollments, with per-column filtering.</p>
                </div>
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                    Total enrolled students:
                    {" "}
                    <span className="font-bold">{students.length}</span>
                </div>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="mb-8">
                    <div className="relative w-full xl:w-[28rem]">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={globalQuery}
                            onChange={(event) => setGlobalQuery(event.target.value)}
                            placeholder="Search by name, email, registration no, batch or code..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500/30 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-100">
                    <table className="min-w-full text-left">
                        <thead className="bg-gray-50/60 align-top">
                            <tr className="border-b border-gray-100">
                                {FILTERABLE_COLUMNS.map((column) => {
                                    const sortableKey = column.key === "batch" ? "batch" : column.key as SortKey;
                                    const isSorted = sortKey === sortableKey;

                                    return (
                                        <th key={column.key} className="p-4 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                            <button
                                                type="button"
                                                onClick={() => handleSort(sortableKey)}
                                                className="flex items-center gap-2 text-left transition-colors hover:text-gray-600"
                                            >
                                                {column.label}
                                                {isSorted && sortDirection === "asc" && <CaretUp size={12} weight="bold" className="text-indigo-600" />}
                                                {isSorted && sortDirection === "desc" && <CaretDown size={12} weight="bold" className="text-indigo-600" />}
                                            </button>
                                            <input
                                                type="text"
                                                value={columnFilters[column.key] ?? ""}
                                                onChange={(event) => updateFilter(column.key, event.target.value)}
                                                placeholder={`Filter ${column.label.toLowerCase()}...`}
                                                className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-medium normal-case tracking-normal text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                            />
                                        </th>
                                    );
                                })}
                                <th className="p-4 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                    Action
                                </th>
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
                                                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
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
                                                {student.batchNames.map((batchName, index) => (
                                                    <div key={`${student.id}-${batchName}`} className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                                                        <span className="font-semibold">{batchName}</span>
                                                        <span className="text-gray-400"> · {student.batchCodes[index] ?? ""}</span>
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
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                                                student.status === "Active"
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    : "bg-gray-50 text-gray-600 border-gray-200"
                                            )}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs font-medium text-gray-500">{formatDate(student.joinedAt)}</td>
                                        <td className="p-4">
                                            <button className="p-2 rounded-lg bg-gray-50 border border-transparent hover:border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-white transition-all">
                                                <ArrowRight size={18} weight="bold" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                    <p className="text-xs text-gray-400 font-bold">
                        Showing {visibleStudents.length} of {students.length} enrolled students
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setGlobalQuery("");
                            setColumnFilters({});
                        }}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-100 text-gray-500 text-xs font-bold hover:bg-gray-50 hover:text-gray-700 transition-all uppercase tracking-widest active:scale-95"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>
        </div>
    );
}
