"use client";

import { 
    adminGetAllSubscriptions, 
    adminGrantPlan,
    adminUpdateSubscription
} from "@/actions/subscription-actions";
import { adminSearchUsers } from "@/actions/admin-actions";
import { cn } from "@/lib/utils";
import { 
    ChartLineUp, 
    DownloadSimple, 
    MagnifyingGlass, 
    UserPlus, 
    X, 
    CheckCircle, 
    Info, 
    ArrowClockwise,
    IdentificationBadge,
    Clock,
    SealCheck,
    Prohibit,
    Receipt
} from "@phosphor-icons/react";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TreasuryPortalProps {
    initialSubscriptions: any[];
}

export function TreasuryPortal({ initialSubscriptions }: TreasuryPortalProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState("");
    
    // Manual Grant States
    const [isGranting, setIsGranting] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [grantDuration, setGrantDuration] = useState(30);
    const [grantPlan, setGrantPlan] = useState("PRO");

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Filter Logic
    const filteredSubs = initialSubscriptions.filter(s => 
        (s.userFullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (s.userEmail?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (s.razorpayPaymentId?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    // Stats Calculation
    const totalRevenue = initialSubscriptions
        .filter(s => s.status === "ACTIVE")
        .reduce((acc, curr) => acc + (curr.amountPaise / 100), 0);
    
    const successRate = initialSubscriptions.length > 0 
        ? Math.round((initialSubscriptions.filter(s => s.status === "ACTIVE").length / initialSubscriptions.length) * 100)
        : 0;

    const activeCount = initialSubscriptions.filter(s => s.status === "ACTIVE").length;

    // User Search Hook
    useEffect(() => {
        if (userSearch.length < 2) {
            setSearchResults([]);
            return;
        }
        const delay = setTimeout(async () => {
            const res = await adminSearchUsers(userSearch);
            if (res.success && res.data) {
                setSearchResults(res.data);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [userSearch]);

    const handleGrantPlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        startTransition(async () => {
            const res = await adminGrantPlan({
                userId: selectedUser.id,
                plan: grantPlan,
                durationDays: grantDuration
            });
            if (res.success) {
                setSuccess(`Plan granted to ${selectedUser.fullName || selectedUser.email}`);
                setIsGranting(false);
                setSelectedUser(null);
                setUserSearch("");
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    const handleExportCsv = () => {
        const headers = ["ID", "Customer", "Email", "Plan", "Status", "Amount (INR)", "Payment ID", "Started At", "Expires At"];
        const rows = filteredSubs.map(s => [
            s.id,
            s.userFullName || "Unknown",
            s.userEmail || "Unknown",
            s.plan,
            s.status,
            (s.amountPaise / 100).toFixed(2),
            s.razorpayPaymentId || "MANUAL",
            new Date(s.startedAt).toLocaleDateString(),
            new Date(s.expiresAt).toLocaleDateString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(r => r.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Treasury_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSuccess("Ledger exported as CSV");
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* High-Density Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                    label="Gross Revenue" 
                    value={`₹${totalRevenue.toLocaleString()}`} 
                    sub="Total Active Volume" 
                    icon={ChartLineUp} 
                    trend="+12%" 
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
                <StatCard 
                    label="Active Licenses" 
                    value={activeCount.toString()} 
                    sub="Current Running Plans" 
                    icon={SealCheck} 
                    trend="Stable"
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
                <StatCard 
                    label="Verification Rate" 
                    value={`${successRate}%`} 
                    sub="Payment Success Index" 
                    icon={Receipt} 
                    trend="-2%"
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
                <div className="group relative overflow-hidden rounded-lg bg-slate-900 p-8 shadow-2xl transition-all hover:scale-[1.02]">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manual Operations</p>
                            <UserPlus size={24} weight="fill" className="text-white" />
                        </div>
                        <button 
                            onClick={() => setIsGranting(true)}
                            className="mt-6 w-full rounded-lg bg-white py-4 text-[10px] font-black uppercase tracking-widest text-slate-900 transition-all hover:bg-indigo-400 hover:text-white"
                        >
                            Provision New License
                        </button>
                    </div>
                    <div className="absolute -bottom-8 -right-8 h-32 w-32 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/40 transition-all" />
                </div>
            </div>

            {/* Transaction Ledger */}
            <div className="student-surface overflow-hidden rounded-lg border border-[var(--student-border)]">
                <div className="flex flex-col border-b border-[var(--student-border)] p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10 gap-6">
                    <div>
                        <h3 className="text-2xl font-black tracking-tight text-[var(--student-text)]">Revenue Ledger</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)] mt-1">Found {filteredSubs.length} transactions in registry</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <MagnifyingGlass size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--student-muted)]" weight="bold" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search customers..."
                                className="w-full rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-muted)] py-4 pl-14 pr-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-text)] transition-all placeholder:text-[var(--student-muted)] focus:border-[var(--student-accent-soft-strong)] focus:bg-white sm:w-80"
                            />
                        </div>
                        <button 
                            onClick={handleExportCsv}
                            className="flex h-12 items-center gap-3 rounded-lg bg-white border border-[var(--student-border)] px-6 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                        >
                            <DownloadSimple size={18} weight="bold" /> Export CSV
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[var(--student-panel-muted)]/30 border-b border-[var(--student-border)]">
                                <th className="p-6 text-left text-[9px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">Recipient</th>
                                <th className="p-6 text-left text-[9px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">Entitlement</th>
                                <th className="p-6 text-left text-[9px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">Status</th>
                                <th className="p-6 text-left text-[9px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">Amount</th>
                                <th className="p-6 text-left text-[9px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">Registry Key</th>
                                <th className="p-6 text-right text-[9px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--student-border)]">
                            {filteredSubs.map(s => (
                                <tr key={s.id} className="group hover:bg-[var(--student-panel-muted)]/20 transition-all">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900/5 text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                <IdentificationBadge size={20} weight="bold" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{s.userFullName || "System Ledger"}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{s.userEmail}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{s.plan}</span>
                                            <span className="text-[9px] font-bold text-slate-400 mt-0.5">Role: {s.role}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <StatusBadge status={s.status} />
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm font-black text-slate-900">₹{(s.amountPaise / 100).toLocaleString()}</p>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 font-mono">
                                            <span className="truncate max-w-[120px]">{s.razorpayPaymentId || "MANUAL_ENTRY"}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <AdminSubActions 
                                            subId={s.id} 
                                            currentStatus={s.status} 
                                            onUpdate={(st) => {
                                                startTransition(async () => {
                                                    const res = await adminUpdateSubscription(s.id, st as any);
                                                    if (res.success) {
                                                        setSuccess("Transaction adjusted");
                                                        router.refresh();
                                                    }
                                                });
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manual Grant Modal */}
            {isGranting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-xl rounded-lg bg-white p-10 shadow-2xl animate-in zoom-in-95">
                        <div className="mb-8 flex items-center justify-between">
                            <h3 className="  text-2xl font-black tracking-tight">Manual Provisioning</h3>
                            <button onClick={() => {setIsGranting(false); setSelectedUser(null);}} className="p-2"><X size={24} /></button>
                        </div>
                        
                        <div className="space-y-6">
                            {!selectedUser ? (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Discover Recipient</label>
                                    <div className="relative">
                                        <MagnifyingGlass size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            placeholder="Search name, email or phone..." 
                                            className="w-full rounded-lg border p-4 pl-14 text-sm font-bold" 
                                        />
                                    </div>
                                    
                                    <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-50 space-y-1">
                                        {searchResults.map(user => (
                                            <button 
                                                key={user.id}
                                                onClick={() => setSelectedUser(user)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all text-left"
                                            >
                                                <div>
                                                    <p className="text-[13px] font-black text-slate-900">{user.fullName || "Nameless User"}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">{user.email}</p>
                                                </div>
                                                <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">{user.role}</span>
                                            </button>
                                        ))}
                                        {userSearch.length >= 2 && searchResults.length === 0 && (
                                            <div className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No identity discovered.</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleGrantPlan} className="space-y-6">
                                    <div className="rounded-lg bg-slate-50 p-6 flex items-center justify-between border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                                                <IdentificationBadge size={24} weight="fill" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{selectedUser.fullName || "Target Identity"}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{selectedUser.email}</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setSelectedUser(null)} className="text-rose-500 text-[10px] font-black uppercase tracking-widest hover:underline">Change</button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entitlement Level</label>
                                            <select 
                                                value={grantPlan}
                                                onChange={(e) => setGrantPlan(e.target.value)}
                                                className="w-full rounded-lg border p-4 text-xs font-bold appearance-none bg-white"
                                            >
                                                <option value="PRO">Pro Plan</option>
                                                <option value="ENTERPRISE">Enterprise</option>
                                                <option value="TEACHER_PRO">Educator Pro</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duration (Days)</label>
                                            <input 
                                                type="number" 
                                                value={grantDuration}
                                                onChange={(e) => setGrantDuration(parseInt(e.target.value))}
                                                className="w-full rounded-lg border p-4 text-xs font-bold" 
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-amber-50 p-4 flex gap-3">
                                        <Info size={20} weight="fill" className="text-amber-500 shrink-0" />
                                        <p className="text-[10px] font-medium text-amber-900 leading-relaxed uppercase tracking-wider">
                                            Granting this plan will bypass payment gateways. Record will be marked as "GRANTED_BY_ADMIN" in the registry.
                                        </p>
                                    </div>

                                    <button disabled={isPending} type="submit" className="w-full rounded-lg bg-slate-900 py-5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] transition-all">
                                        {isPending ? "Injecting Entitlement..." : "Confirm Provisioning"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toasts */}
            {(error || success) && (
                <div className="fixed bottom-10 right-10 z-[100] flex flex-col gap-3">
                    {error && (
                        <div className="flex items-center gap-4 rounded-lg border border-rose-100 bg-rose-50 px-6 py-4 text-rose-600 shadow-xl backdrop-blur-md">
                            <Info size={20} weight="fill" />
                            <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                            <button onClick={() => setError(null)}><X size={16} weight="bold" /></button>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-4 rounded-lg border border-emerald-100 bg-emerald-50 px-6 py-4 text-emerald-600 shadow-xl backdrop-blur-md">
                            <CheckCircle size={20} weight="fill" />
                            <p className="text-[10px] font-black uppercase tracking-widest">{success}</p>
                            <button onClick={() => setSuccess(null)}><X size={16} weight="bold" /></button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, sub, icon: Icon, trend, color, bg }: any) {
    return (
        <div className="student-surface rounded-lg border border-[var(--student-border)] p-8 transition-all hover:shadow-xl group">
            <div className="mb-6 flex items-center justify-between">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg shadow-sm transition-all group-hover:scale-110", bg, color)}>
                    <Icon size={24} weight="bold" />
                </div>
                <span className={cn(
                    "rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-widest",
                    trend.startsWith("+") ? "bg-emerald-50 text-emerald-600" : trend === "Stable" ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                )}>
                    {trend}
                </span>
            </div>
            <div>
                <p className="  text-3xl font-black tracking-tight text-slate-900">{value}</p>
                <div className="mt-1 flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="text-[9px] font-bold text-slate-300">{sub}</p>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { label: string, color: string, bg: string, icon: any }> = {
        ACTIVE: { label: "Verified", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
        PENDING: { label: "Awaiting", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
        CANCELLED: { label: "Voided", color: "text-slate-400", bg: "bg-slate-50", icon: Prohibit },
        EXPIRED: { label: "Lapsed", color: "text-rose-600", bg: "bg-rose-50", icon: Prohibit },
    };

    const config = configs[status] || configs.CANCELLED;
    const Icon = config.icon;

    return (
        <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5", config.bg)}>
            <Icon size={14} weight="fill" className={config.color} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", config.color)}>{config.label}</span>
        </div>
    );
}

function AdminSubActions({ subId, currentStatus, onUpdate }: { subId: string, currentStatus: string, onUpdate: (s: string) => void }) {
    const [show, setShow] = useState(false);

    return (
        <div className="relative inline-block text-left">
            <button 
                onClick={() => setShow(!show)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-400 hover:text-slate-900 transition-all hover:shadow-md"
            >
                <ArrowClockwise size={18} weight="bold" className={cn(show && "rotate-180 transition-transform")} />
            </button>
            
            {show && (
                <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg bg-white p-2 shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                    {["ACTIVE", "CANCELLED", "EXPIRED"].map(s => (
                        <button 
                            key={s}
                            disabled={currentStatus === s}
                            onClick={() => {onUpdate(s); setShow(false);}}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                currentStatus === s ? "bg-slate-50 text-slate-300" : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                            )}
                        >
                            Mark As {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
