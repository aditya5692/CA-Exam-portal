"use client";

import { 
    getAdminUserDetail, 
    saveAdminManagedFeatureAccess, 
    resetAdminManagedFeatureAccess,
    grantAdminManagedMaterialAccess,
    revokeAdminManagedMaterialAccess,
    updateAdminManagedUser,
    setAdminManagedUserBlock
} from "@/actions/admin-actions";
import { cn } from "@/lib/utils";
import { 
    X, 
    User as UserIcon, 
    ShieldCheck, 
    Key, 
    Prohibit, 
    CheckCircle, 
    CloudArrowUp,
    Info,
    Trash,
    FloppyDiskBack,
    ArrowCounterClockwise,
    Plus,
    Minus
} from "@phosphor-icons/react";
import { useEffect, useState, useTransition } from "react";
import { FEATURE_DEFINITIONS, type FeatureKey } from "@/lib/auth/feature-access-shared";

interface UserControlPanelProps {
    userId: string;
    onClose: () => void;
    onUpdate?: () => void;
}

export function UserControlPanel({ userId, onClose, onUpdate }: UserControlPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [data, setData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"profile" | "permissions" | "access">("profile");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        const res = await getAdminUserDetail(userId);
        if (res.success && res.data) {
            setData(res.data);
        } else {
            setError(res.message ?? "Failed to load details");
        }
        setLoading(false);
    };

    useEffect(() => {
        void loadData();
    }, [userId]);

    const handleFeatureToggle = async (key: FeatureKey, field: string, value: boolean) => {
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("featureKey", key);
        
        // Get existing override or defaults
        const existing = data.featureOverrides.find((o: any) => o.featureKey === key) || {};
        
        const payload = {
            isEnabled: field === "isEnabled" ? value : (existing.isEnabled ?? true),
            isRestricted: field === "isRestricted" ? value : (existing.isRestricted ?? false),
            canRead: field === "canRead" ? value : (existing.canRead ?? true),
            canCreate: field === "canCreate" ? value : (existing.canCreate ?? false),
            canUpdate: field === "canUpdate" ? value : (existing.canUpdate ?? false),
            canDelete: field === "canDelete" ? value : (existing.canDelete ?? false),
            canShare: field === "canShare" ? value : (existing.canShare ?? false),
        };

        Object.entries(payload).forEach(([k, v]) => formData.append(k, v.toString()));

        startTransition(async () => {
            const res = await saveAdminManagedFeatureAccess(formData);
            if (res.success) {
                setSuccess(`${key} permissions updated`);
                void loadData();
            } else {
                setError(res.message);
            }
        });
    };

    const handleResetPermissions = async (key: FeatureKey) => {
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("featureKey", key);

        startTransition(async () => {
            const res = await resetAdminManagedFeatureAccess(formData);
            if (res.success) {
                setSuccess(`${key} reset to defaults`);
                void loadData();
            } else {
                setError(res.message);
            }
        });
    };

    const handleGrantAccess = async (materialId: string) => {
        const formData = new FormData();
        formData.append("studentId", userId);
        formData.append("materialId", materialId);
        formData.append("accessType", "ADMIN_GRANTED");

        startTransition(async () => {
            const res = await grantAdminManagedMaterialAccess(formData);
            if (res.success) {
                setSuccess("Access granted");
                void loadData();
            } else {
                setError(res.message);
            }
        });
    };

    const handleRevokeAccess = async (materialId: string) => {
        const formData = new FormData();
        formData.append("studentId", userId);
        formData.append("materialId", materialId);

        startTransition(async () => {
            const res = await revokeAdminManagedMaterialAccess(formData);
            if (res.success) {
                setSuccess("Access revoked");
                void loadData();
            } else {
                setError(res.message);
            }
        });
    };

    if (loading) return (
        <div className="flex h-full items-center justify-center p-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--student-accent-soft)] border-t-[var(--student-accent-strong)]" />
        </div>
    );

    const user = data?.user;

    return (
        <div className="flex h-full flex-col bg-white">
            {/* Header */}
            <div className="student-surface-dark p-8 text-white">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/10 text-2xl font-black backdrop-blur-md">
                            {user.fullName?.[0] || user.email?.[0]?.toUpperCase()}
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-3xl font-bold tracking-tight">{user.fullName || "Unnamed"}</h2>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg bg-white/5 p-3 text-white/60 transition-all hover:bg-white/10 hover:text-white">
                        <X size={28} weight="bold" />
                    </button>
                </div>

                <div className="mt-10 flex gap-2">
                    {[
                        { id: "profile", label: "Identity", icon: UserIcon },
                        { id: "permissions", label: "Permissions", icon: ShieldCheck },
                        { id: "access", label: "Access Vault", icon: Key }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all",
                                activeTab === tab.id 
                                    ? "bg-white text-[var(--student-accent-strong)] shadow-lg" 
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <tab.icon size={18} weight="bold" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10">
                {activeTab === "profile" && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <section className="space-y-6">
                            <h4 className="flex items-center gap-3 text-lg font-black tracking-tight text-[var(--student-text)]">
                                <UserIcon size={24} weight="bold" className="text-[var(--student-accent-strong)]" />
                                Core Credentials
                            </h4>
                            <div className="grid grid-cols-2 gap-8">
                                <DetailField label="System Role" value={user.role} badge />
                                <DetailField label="Account Status" value={user.isBlocked ? "Suspended" : "Active"} badge />
                                <DetailField label="Plan Level" value={user.plan} />
                                <DetailField label="Registration #" value={user.registrationNumber || "Not Set"} />
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h4 className="flex items-center gap-3 text-lg font-black tracking-tight text-[var(--student-text)]">
                                <Prohibit size={24} weight="bold" className="text-amber-500" />
                                Governance Actions
                            </h4>
                            <div className="flex flex-wrap gap-4">
                                <ActionButton 
                                    label={user.isBlocked ? "Restore Access" : "Suspend User"} 
                                    icon={Prohibit} 
                                    color={user.isBlocked ? "success" : "warning"}
                                    onClick={() => {/* handle block toggle */}}
                                />
                                <ActionButton 
                                    label="Reset Password" 
                                    icon={Key} 
                                    color="neutral"
                                    onClick={() => {/* handle password reset */}}
                                />
                                <ActionButton 
                                    label="Delete Persona" 
                                    icon={Trash} 
                                    color="danger"
                                    onClick={() => {/* handle delete */}}
                                />
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === "permissions" && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-6 flex items-start gap-4">
                            <Info size={24} weight="fill" className="text-blue-500 shrink-0 mt-1" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-blue-900">Permission Overrides Active</p>
                                <p className="text-xs font-medium text-blue-700/70 leading-relaxed">
                                    Changes made here will override the default permissions for the user&apos;s role. 
                                    Use &quot;Reset&quot; to go back to system defaults.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {FEATURE_DEFINITIONS.filter(f => f.audience === user.role || user.role === "ADMIN").map(feature => {
                                const override = data.featureOverrides.find((o: any) => o.featureKey === feature.key);
                                return (
                                    <div key={feature.key} className="student-surface group relative overflow-hidden rounded-lg p-6 transition-all hover:bg-slate-50">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-slate-100 text-[var(--student-accent-strong)] shadow-sm">
                                                    <ShieldCheck size={20} weight="bold" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{feature.label}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{feature.key}</p>
                                                </div>
                                            </div>
                                            {override && (
                                                <button 
                                                    onClick={() => handleResetPermissions(feature.key)}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all"
                                                >
                                                    <ArrowCounterClockwise size={14} weight="bold" /> Reset
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-4">
                                            <PermissionToggle 
                                                label="Enabled" 
                                                active={override ? override.isEnabled : true} 
                                                onToggle={(v) => handleFeatureToggle(feature.key, "isEnabled", v)}
                                            />
                                            <PermissionToggle 
                                                label="Create" 
                                                active={override ? override.canCreate : feature.defaults.create} 
                                                onToggle={(v) => handleFeatureToggle(feature.key, "canCreate", v)}
                                            />
                                            <PermissionToggle 
                                                label="Update" 
                                                active={override ? override.canUpdate : feature.defaults.update} 
                                                onToggle={(v) => handleFeatureToggle(feature.key, "canUpdate", v)}
                                            />
                                            <PermissionToggle 
                                                label="Delete" 
                                                active={override ? override.canDelete : feature.defaults.delete} 
                                                onToggle={(v) => handleFeatureToggle(feature.key, "canDelete", v)}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === "access" && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <section className="space-y-6">
                            <h4 className="flex items-center gap-3 text-lg font-black tracking-tight text-[var(--student-text)]">
                                <CheckCircle size={24} weight="bold" className="text-emerald-500" />
                                Granted Access
                            </h4>
                            <div className="grid grid-cols-1 gap-4">
                                {data.materialAccess.length === 0 ? (
                                    <div className="p-8 text-center rounded-lg border-2 border-dashed border-slate-100 text-xs font-bold text-slate-300">
                                        No manual access rules defined for this user.
                                    </div>
                                ) : (
                                    data.materialAccess.map((acc: any) => (
                                        <div key={acc.id} className="flex items-center justify-between p-5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white text-emerald-500 shadow-sm border border-emerald-100">
                                                    <CloudArrowUp size={20} weight="bold" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{acc.material.title}</p>
                                                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">{acc.accessType}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleRevokeAccess(acc.materialId)}
                                                className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-all"
                                            >
                                                <Minus size={20} weight="bold" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h4 className="flex items-center gap-3 text-lg font-black tracking-tight text-[var(--student-text)]">
                                <Plus size={24} weight="bold" className="text-[var(--student-accent-strong)]" />
                                Available Materials
                            </h4>
                            <div className="grid grid-cols-1 gap-4">
                                {data.availableMaterials
                                    .filter((m: any) => !data.materialAccess.find((acc: any) => acc.materialId === m.id))
                                    .map((m: any) => (
                                        <div key={m.id} className="flex items-center justify-between p-5 rounded-lg bg-slate-50 border border-slate-100">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm border border-slate-100">
                                                    <CloudArrowUp size={20} weight="bold" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{m.title}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.category} · {m.subType}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleGrantAccess(m.id)}
                                                className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-all"
                                            >
                                                <Plus size={20} weight="bold" />
                                            </button>
                                        </div>
                                    ))
                                }
                            </div>
                        </section>
                    </div>
                )}
            </div>

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

function DetailField({ label, value, color, badge }: { label: string; value: string; color?: string, badge?: boolean }) {
    if (badge) {
        return (
            <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
                <StatusBadge value={value} />
            </div>
        );
    }
    return (
        <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
            <p className={cn("text-base font-bold tracking-tight", color || "text-slate-800")}>{value}</p>
        </div>
    );
}

function StatusBadge({ value }: { value: string }) {
    const v = value.toUpperCase();
    
    const configs: Record<string, { class: string, dot: string }> = {
        "ACTIVE": { class: "bg-emerald-50 text-emerald-600 border-emerald-100", dot: "bg-emerald-400" },
        "SUSPENDED": { class: "bg-rose-50 text-rose-600 border-rose-100", dot: "bg-rose-400" },
        "ADMIN": { class: "bg-indigo-50 text-indigo-600 border-indigo-100", dot: "bg-indigo-400" },
        "TEACHER": { class: "bg-amber-50 text-amber-600 border-amber-100", dot: "bg-amber-400" },
        "STUDENT": { class: "bg-blue-50 text-blue-600 border-blue-100", dot: "bg-blue-400" },
    };

    const config = configs[v] || { class: "bg-slate-50 text-slate-600 border-slate-100", dot: "bg-slate-400" };

    return (
        <div className={cn("badge-pill w-fit", config.class)}>
            <div className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
            {value}
        </div>
    );
}

function ActionButton({ label, icon: Icon, color, onClick }: any) {
    const variants = {
        warning: "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100",
        danger: "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100",
        success: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100",
        neutral: "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100",
    } as const;

    return (
        <button 
            onClick={onClick}
            className={cn(
                "flex items-center gap-2.5 rounded-lg border px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95",
                variants[color as keyof typeof variants]
            )}
        >
            <Icon size={18} weight="bold" />
            {label}
        </button>
    );
}

function PermissionToggle({ label, active, onToggle }: { label: string; active: boolean; onToggle: (v: boolean) => void }) {
    return (
        <button 
            onClick={() => onToggle(!active)}
            className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[9px] font-bold uppercase tracking-widest transition-all",
                active 
                    ? "bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm" 
                    : "bg-white text-slate-400 border-slate-100"
            )}
        >
            <div className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "bg-slate-200")} />
            {label}
        </button>
    );
}
