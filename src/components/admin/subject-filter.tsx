"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { CaretDown, Funnel } from "@phosphor-icons/react";

interface Subject {
    id: string;
    name: string;
}

export function SubjectFilter({ subjects }: { subjects: Subject[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeSubjectId = searchParams.get("subjectId") || "";
    const [isOpen, setIsOpen] = useState(false);

    const activeSubject = subjects.find(s => s.id === activeSubjectId);

    const handleSelect = useCallback(
        (id: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (id) {
                params.set("subjectId", id);
            } else {
                params.delete("subjectId");
            }
            router.push(`${pathname}?${params.toString()}`);
            setIsOpen(false);
        },
        [pathname, router, searchParams]
    );

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-lg border border-[var(--student-border)] bg-[var(--student-panel)]/90 px-3 py-2 text-xs font-bold text-[var(--student-text)] shadow-sm transition-all hover:bg-white active:scale-95"
            >
                <Funnel size={14} className="text-[var(--student-muted)]" />
                <span className="max-w-[120px] truncate">{activeSubject ? activeSubject.name : "All Subjects"}</span>
                <CaretDown size={12} className="text-[var(--student-muted)]" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-lg border border-[var(--student-border)] bg-white p-2 shadow-xl">
                        <button
                            onClick={() => handleSelect("")}
                            className={`w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors ${
                                activeSubjectId === "" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            All Subjects
                        </button>
                        {subjects.map((subject) => (
                            <button
                                key={subject.id}
                                onClick={() => handleSelect(subject.id)}
                                className={`w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors ${
                                    activeSubjectId === subject.id ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <span className="truncate block">{subject.name}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
