"use client";

import {
    adminGetAllSubscriptions,
    adminGrantPlan,
    adminUpdateSubscription,
} from "@/actions/subscription-actions";
import { cn } from "@/lib/utils";
import { 
    DownloadSimple, 
    Faders, 
    IdentificationBadge, 
    MagnifyingGlass, 
    Plus, 
    Users, 
    CurrencyInr,
    Clock,
    X,
    IdentificationCard
} from "@phosphor-icons/react";
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
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await adminGetAllSubscriptions();
        if (res.success && res.data) setSubs(res.data);
        setLoading(false);
    }, []);

    useEffect(() => { void load(); }, [load]);

    // Derived state for filtered list
    const filtered = useMemo(() => {
        return subs.filter(s => {
            const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
            const matchesSearch = (s.userFullName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                                (s.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                                s.razorpayPaymentId?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [subs, statusFilter, searchQuery]);

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
            {/* Hero Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Revenue & Membership</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
                        Subscriber Intelligence
                    </h1>
                </div>
                
                <p className="hidden xl:block text-slate-400 font-medium text-xs max-w-sm text-right leading-relaxed opacity-80">
                    Monitor institutional growth, track subscription lifecycles, and manage manual access grants.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Active Subscribers", value: totalActive, color: "text-emerald-600", icon: Users, bg: "bg-emerald-50/50" },
                    { label: "Lifetime Revenue", value: `₹${(totalRevenue / 100).toLocaleString("en-IN")}`, color: "text-indigo-600", icon: CurrencyInr, bg: "bg-indigo-50/50" },
                    { label: "Retention Risk", value: expiringIn30, color: "text-amber-600", icon: Clock, bg: "bg-amber-50/50" },
                ].map(stat => (
                    <div key={stat.label} className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center border border-current/10`}>
                                <stat.icon size={20} weight="bold" />
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Live Metrics</span>
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">{stat.label}</p>
                        <p className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Search / Filter Row */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="relative flex-1">
                    <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} weight="bold" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Identify specific subscribers by name, email or payment ID..."
                        className="w-full h-12 bg-white border border-slate-200/60 rounded-xl pl-11 pr-4 text-[13px] font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all shadow-sm" />
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "h-12 px-6 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-sm",
                            showFilters ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        )}
                    >
                        <Faders size={18} weight="bold" /> 
                        {showFilters ? "Hide Filters" : "Access Filters"}
                    </button>
                    <button 
                        onClick={() => setShowGrantModal(true)}
                        className="h-12 px-6 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 active:scale-95"
                    >
                        <Plus size={18} weight="bold" /> Manual Grant
                    </button>
                </div>
            </div>

            {/* Filter Suite Bar (Conditional) */}
            {showFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-2 animate-in slide-in-from-top-4 duration-300 p-1 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 px-4 py-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Status Scope:</span>
                    {["ALL", "ACTIVE", "EXPIRED", "CANCELLED"].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                                statusFilter === s ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                    <div className="ml-auto">
                        <button className="h-9 px-4 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:border-slate-400 hover:text-slate-900 transition-all flex items-center gap-2">
                            <DownloadSimple size={14} weight="bold" /> Export Report
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-24 text-slate-400 text-[11px] font-bold uppercase tracking-widest animate-pulse">Synchronizing records...</div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-5">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100 shadow-sm">
                            <IdentificationBadge size={40} weight="light" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">No matching subscriptions</p>
                            <p className="text-[10px] font-semibold text-slate-400 leading-relaxed italic">Adjust your filters to retrieve specific billing and access data.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#FBFCFD] border-b border-slate-100">
                                    {["Subscriber Identity", "Plan Level", "Current Status", "Paise/Amount", "Credential/Payment", "Enlisted", "Expirations", "Command"].map(h => (
                                        <th key={h} className="px-6 py-5 text-[10px] font-black text-[#6B7280] uppercase tracking-[0.2em]">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map(sub => (
                                    <tr key={sub.id} className="group hover:bg-[#F8FAFC] transition-all duration-200 border-b border-slate-50/50 last:border-0">
                                        <td className="px-6 py-5">
                                            <p className="font-semibold text-slate-800">{sub.userFullName ?? "—"}</p>
                                            <p className="text-xs text-slate-400">{sub.userEmail ?? sub.userId.slice(0, 12)}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg border text-[11px] font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
                                                {sub.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
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
                                        <td className="px-6 py-5">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100 space-y-7 animate-in zoom-in-95 duration-200">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 mb-1">
                                <IdentificationCard size={18} weight="bold" className="text-indigo-500" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Governance Action</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Manual Plan Grant</h3>
                            <p className="text-sm text-slate-500 font-medium">Provision institutional access datasets manually to bypass billing logic.</p>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">User Identifier (CUID/Email)</label>
                                <input
                                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/30 px-4 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 focus:bg-white transition-all"
                                    placeholder="Paste reference ID or email address"
                                    value={grantForm.userId}
                                    onChange={e => setGrantForm(p => ({ ...p, userId: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Access Level</label>
                                    <select
                                        className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/30 px-4 text-sm font-bold focus:outline-none appearance-none cursor-pointer focus:bg-white transition-all"
                                        value={grantForm.plan}
                                        onChange={e => setGrantForm(p => ({ ...p, plan: e.target.value }))}
                                    >
                                        <option value="PRO">PRO ENTRANCE</option>
                                        <option value="BASIC">BASIC TIER</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Validity (Days)</label>
                                    <input
                                        type="number"
                                        className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/30 px-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 focus:bg-white transition-all"
                                        value={grantForm.durationDays}
                                        onChange={e => setGrantForm(p => ({ ...p, durationDays: Number(e.target.value) }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {grantStatus && (
                            <div className={cn("p-4 rounded-xl border text-xs font-bold animate-in slide-in-from-bottom-2", 
                                grantStatus.includes("success") ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600")}>
                                {grantStatus}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={handleGrant}
                                className="h-12 rounded-xl bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                            >
                                Provision Access
                            </button>
                            <button
                                onClick={() => { setShowGrantModal(false); setGrantStatus(""); }}
                                className="h-12 rounded-xl bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-widest border border-slate-100 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
