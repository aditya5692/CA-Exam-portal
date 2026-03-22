"use client";

import { cn } from "@/lib/utils";
import { Props } from "./types";

export function ExamHero({
    caLevelKey,
    onLevelChange
}: {
    caLevelKey: Props["caLevelKey"];
    caLevelLabel: Props["caLevelLabel"];
    onLevelChange: (level: string) => void;
}) {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-end mb-8">
            {/* Level Toggle - Premium Glass Implementation */}
            <div className="flex h-fit items-center rounded-xl border border-[var(--student-border)] bg-[rgba(255,253,249,0.92)] p-1.5 shadow-sm">
                <button
                    onClick={() => onLevelChange("foundation")}
                    className={cn(
                        "px-6 py-2 text-xs font-bold rounded-lg transition-all duration-200",
                        caLevelKey === "foundation" ? "student-tab-active" : "text-[var(--student-muted)] hover:bg-white/80 hover:text-[var(--student-text)]"
                    )}
                >
                    CA Foundation
                </button>
                <button
                    onClick={() => onLevelChange("ipc")}
                    className={cn(
                        "px-6 py-2 text-xs font-bold rounded-lg transition-all duration-200",
                        caLevelKey === "ipc" ? "student-tab-active" : "text-[var(--student-muted)] hover:bg-white/80 hover:text-[var(--student-text)]"
                    )}
                >
                    CA IPC
                </button>
                <button
                    onClick={() => onLevelChange("final")}
                    className={cn(
                        "px-6 py-2 text-xs font-bold rounded-lg transition-all duration-200",
                        caLevelKey === "final" ? "student-tab-active" : "text-[var(--student-muted)] hover:bg-white/80 hover:text-[var(--student-text)]"
                    )}
                >
                    CA Final
                </button>
            </div>
        </div>
    );
}
