"use client";

import { cn } from "@/lib/utils";
import { Props } from "./types";

export function ExamHero({
    caLevelKey,
    caLevelLabel,
    onLevelChange
}: {
    caLevelKey: Props["caLevelKey"];
    caLevelLabel: Props["caLevelLabel"];
    onLevelChange: (level: string) => void;
}) {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-end mb-8">
            {/* Level Toggle - Premium Glass Implementation */}
            <div className="flex items-center p-1.5 bg-white rounded-xl shadow-sm border border-slate-100 h-fit">
                <button
                    onClick={() => onLevelChange("foundation")}
                    className={cn(
                        "px-6 py-2 text-xs font-bold rounded-lg transition-all duration-200",
                        caLevelKey === "foundation" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    CA Foundation
                </button>
                <button
                    onClick={() => onLevelChange("ipc")}
                    className={cn(
                        "px-6 py-2 text-xs font-bold rounded-lg transition-all duration-200",
                        caLevelKey === "ipc" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    CA IPC
                </button>
                <button
                    onClick={() => onLevelChange("final")}
                    className={cn(
                        "px-6 py-2 text-xs font-bold rounded-lg transition-all duration-200",
                        caLevelKey === "final" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    CA Final
                </button>
            </div>
        </div>
    );
}
