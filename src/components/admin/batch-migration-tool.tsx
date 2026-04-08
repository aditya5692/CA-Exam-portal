"use client";

import { MagicWand, WarningCircle } from "@phosphor-icons/react";
import { useState } from "react";

export function BatchMigrationTool({ batchId, nextAttemptStr }: { batchId: string, nextAttemptStr: string }) {
    const [isMigrating, setIsMigrating] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleMigration = async () => {
        setIsMigrating(true);
        try {
            // Simulated migration call
            // await fetch(`/api/admin/batches/${batchId}/migrate`, { method: "POST" });
            await new Promise(r => setTimeout(r, 1500));
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 3000);
        } catch (error) {
            console.error("Migration failed", error);
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <div className="rounded-2xl border border-[var(--student-border)] bg-[var(--student-panel)] p-6 shadow-sm flex items-center justify-between">
            <div className="flex gap-4 items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">
                    <MagicWand size={24} weight="fill" />
                </div>
                <div>
                    <h3 className="font-outfit text-lg font-bold text-[var(--student-text)]">Attempt Migration</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--student-muted-strong)] opacity-70 flex items-center gap-1 mt-0.5">
                        <WarningCircle size={14} weight="bold" className="text-amber-500" />
                        Migrate to {nextAttemptStr} MasterBatch
                    </p>
                </div>
            </div>

            <button
                onClick={handleMigration}
                disabled={isMigrating || isSuccess}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md transition-all hover:bg-indigo-700 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
                {isMigrating ? "Migrating..." : isSuccess ? "Done" : "1-Click Migrate"}
            </button>
        </div>
    );
}
