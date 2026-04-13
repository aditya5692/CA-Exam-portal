"use client";

import {
    adminGetAllSubscriptions,
    adminGrantPlan,
    adminUpdateSubscription,
} from "@/actions/subscription-actions";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

type Subscription = {
    id: string;
    userId: string;
    userFullName: string | null;
    userEmail: string | null;
    plan: string;
    role: string;
    status: string;
    amountPaise: number;
    razorpayPaymentId: string | null;
    startedAt: string;
    expiresAt: string;
    createdAt: string;
    grantedByAdminId: string | null;
};

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    EXPIRED: "bg-amber-50 text-amber-700 border-amber-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
    PENDING: "bg-slate-50 text-slate-700 border-slate-200",
};

function fmt(isoStr: string) {
    return new Date(isoStr).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
    });
}

function fmtAmount(paise: number) {
    return paise === 0 ? "Admin Grant" : `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function SubscriptionManager() {
    const [subs, setSubs] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showGrantModal, setShowGrantModal] = useState(false);
    const [grantForm, setGrantForm] = useState({ userId: "", plan: "PRO", durationDays: 365 });
    const [grantStatus, setGrantStatus] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        const res = await adminGetAllSubscriptions();
        if (res.success && res.data) setSubs(res.data);
        setLoading(false);
    }, []);

    useEffect(() => { void load(); }, [load]);

    // Derived state for filtered list
    const filtered = useMemo(() => {
        return statusFilter === "ALL" ? subs : subs.filter(s => s.status === statusFilter);
    }, [subs, statusFilter]);

    const handleCancel = async (id: string) => {
        setActionLoading(id);
        await adminUpdateSubscription(id, "CANCELLED");
        await load();
        setActionLoading(null);
    };

    const handleGrant = async () => {
        setGrantStatus("Granting...");
        const res = await adminGrantPlan(grantForm);
        if (res.success) {
            setGrantStatus("Plan granted successfully!");
            await load();
            setTimeout(() => { setShowGrantModal(false); setGrantStatus(""); }, 1500);
        } else {
            setGrantStatus(res.message ?? "Failed.");
        }
    };

    // Stats
    const totalActive = subs.filter(s => s.status === "ACTIVE").length;
    const totalRevenue = subs.filter(s => s.razorpayPaymentId).reduce((acc, s) => acc + s.amountPaise, 0);

    const expiringIn30 = useMemo(() => {
        // eslint-disable-next-line react-hooks/purity
        const now = Date.now();
        return subs.filter(s => {
            if (s.status !== "ACTIVE") return false;
            const diff = new Date(s.expiresAt).getTime() - now;
            return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
        }).length;
    }, [subs]);

    return (
        <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "Active Subscribers", value: totalActive, color: "text-emerald-600" },
                    { label: "Total Revenue (Razorpay)", value: `₹${(totalRevenue / 100).toLocaleString("en-IN")}`, color: "text-indigo-600" },
                    { label: "Expiring in 30 Days", value: expiringIn30, color: "text-amber-600" },
                ].map(stat => (
                    <div key={stat.label} className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters + Grant Button */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {["ALL", "ACTIVE", "EXPIRED", "CANCELLED"].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                                statusFilter === s
                                    ? "bg-slate-900 text-white"
                                    : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowGrantModal(true)}
                    className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                >
                    + Manual Grant
                </button>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-slate-100 bg-white shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="flex items-center justify-center py-16 text-slate-400 text-sm">No subscriptions found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    {["Student", "Plan", "Status", "Amount", "Payment ID", "Started", "Expires", "Actions"].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map(sub => (
                                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-800">{sub.userFullName ?? "—"}</p>
                                            <p className="text-xs text-slate-400">{sub.userEmail ?? sub.userId.slice(0, 12)}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg border text-[11px] font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
                                                {sub.plan}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-lg border text-[11px] font-bold", STATUS_COLORS[sub.status] ?? "bg-slate-50 text-slate-600 border-slate-200")}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-700">{fmtAmount(sub.amountPaise)}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                                            {sub.razorpayPaymentId ? sub.razorpayPaymentId.slice(0, 14) + "…" : sub.grantedByAdminId ? "Admin" : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{fmt(sub.startedAt)}</td>
                                        <td className="px-4 py-3 text-xs">
                                            <span className={new Date(sub.expiresAt) < new Date() ? "text-red-600 font-bold" : "text-slate-600"}>
                                                {fmt(sub.expiresAt)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {sub.status === "ACTIVE" && (
                                                <button
                                                    onClick={() => handleCancel(sub.id)}
                                                    disabled={actionLoading === sub.id}
                                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === sub.id ? "..." : "Cancel"}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Manual Grant Modal */}
            {showGrantModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-black text-slate-900">Manual Plan Grant</h3>
                        <p className="text-sm text-slate-500">Grant a paid plan to a user without requiring payment.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">User ID</label>
                                <input
                                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder="cuid... or paste user ID"
                                    value={grantForm.userId}
                                    onChange={e => setGrantForm(p => ({ ...p, userId: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Plan</label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium focus:outline-none appearance-none"
                                    value={grantForm.plan}
                                    onChange={e => setGrantForm(p => ({ ...p, plan: e.target.value }))}
                                >
                                    <option value="PRO">PRO</option>
                                    <option value="BASIC">BASIC</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Duration (Days)</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    value={grantForm.durationDays}
                                    onChange={e => setGrantForm(p => ({ ...p, durationDays: Number(e.target.value) }))}
                                />
                            </div>
                        </div>

                        {grantStatus && (
                            <p className={`text-sm font-bold ${grantStatus.includes("success") ? "text-emerald-600" : "text-red-600"}`}>
                                {grantStatus}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleGrant}
                                className="flex-1 py-3 rounded-lg bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all"
                            >
                                Grant Plan
                            </button>
                            <button
                                onClick={() => { setShowGrantModal(false); setGrantStatus(""); }}
                                className="flex-1 py-3 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
