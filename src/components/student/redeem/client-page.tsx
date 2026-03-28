"use client";

import { useState } from "react";
import { CheckCircle, IdentificationBadge, WarningCircle } from "@phosphor-icons/react";
import { verifyAccessCode } from "@/actions/student-manager-actions";

interface ClaimedCode {
    id: string;
    subject?: string;
    teacher?: {
        fullName?: string;
        email?: string;
    };
}

function LinkedContexts({ claimedCodes }: { claimedCodes: ClaimedCode[] }) {
    if (claimedCodes.length === 0) return null;

    return (
        <div className="mt-16 pt-10 border-t border-[var(--student-border)]">
            <h3 className="text-xl font-bold font-outfit text-[var(--student-text)] tracking-tight mb-6">Your Linked Contexts</h3>
            <div className="grid gap-4 md:grid-cols-2">
                {claimedCodes.map((c: ClaimedCode) => (
                    <div key={c.id} className="p-5 rounded-2xl border border-[var(--student-border)] bg-[var(--student-surface)] flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)] flex items-center justify-center font-bold text-lg relative shrink-0">
                            {(c.teacher?.fullName || c.teacher?.email || "T").charAt(0).toUpperCase()}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--student-success)] rounded-full border-2 border-[var(--student-panel-muted)]" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-[var(--student-text)] tracking-tight">{c.teacher?.fullName || c.teacher?.email || "Educator"}</h4>
                            <p className="text-xs font-semibold text-[var(--student-muted)] line-clamp-1">{c.subject || "General CA Resources"}</p>
                            <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-[var(--student-success)] bg-[var(--student-success-soft)] px-2.5 py-1 rounded inline-flex items-center">
                                Verified Access
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function RedeemCodeClient({ claimedCodes = [] }: { claimedCodes?: any[] }) {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage("");
        setErrorMessage("");
        if (!code.trim()) return;

        setIsLoading(true);
        const res = await verifyAccessCode(code.trim());
        setIsLoading(false);

        if (res.success && res.data) {
            setSuccessMessage(res.message || "Code redeemed successfully!");
            setCode("");
            // Refresh to see the new batch
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        } else {
            setErrorMessage(res.message || "Failed to redeem code.");
        }
    };

    return (
        <div className="max-w-4xl max-w-2xl bg-[var(--student-panel-muted)] rounded-[32px] border border-[var(--student-border)] shadow-md p-10 mt-8 mx-auto">
            <div className="flex flex-col items-center text-center space-y-4 mb-10">
                <div className="w-16 h-16 rounded-[24px] bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)] flex items-center justify-center shadow-sm">
                    <IdentificationBadge size={32} weight="bold" />
                </div>
                <h2 className="text-3xl font-bold font-outfit text-[var(--student-text)] tracking-tight">Redeem Code</h2>
                <p className="text-[var(--student-muted)] max-w-sm leading-relaxed">
                    Enter the access payload provided by your educator to link your profile to the designated section.
                </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6 max-w-xl mx-auto">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--student-muted-strong)] mb-2 pl-2">
                        Access Code
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. BATCH-A1B2C3"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full h-14 bg-[var(--student-panel-solid)] border border-[var(--student-border)] rounded-2xl px-6 text-sm font-bold text-[var(--student-text)] placeholder:text-[var(--student-muted-light)] focus:outline-none focus:ring-4 focus:ring-[var(--student-accent-soft)] focus:border-[var(--student-accent)] transition-all uppercase tracking-widest"
                    />
                </div>

                {errorMessage && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100 text-orange-600">
                        <WarningCircle size={20} weight="bold" className="shrink-0" />
                        <span className="text-xs font-bold">{errorMessage}</span>
                    </div>
                )}

                {successMessage && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--student-success-soft)] border border-[var(--student-success-soft-strong)] text-[var(--student-success)]">
                        <CheckCircle size={20} weight="bold" className="shrink-0" />
                        <span className="text-xs font-bold">{successMessage}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || !code}
                    className="w-full h-14 student-button-primary disabled:opacity-50 flex items-center justify-center gap-3 rounded-[24px] shadow-lg active:scale-95 transition-all text-xs"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <IdentificationBadge size={18} weight="bold" />
                    )}
                    Verify Access payload
                </button>
            </form>

            <LinkedContexts claimedCodes={claimedCodes as ClaimedCode[]} />
        </div>
    );
}
