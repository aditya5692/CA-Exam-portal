"use client";

import { deleteAdminManagedUser, setAdminManagedUserBlock, updateAdminManagedUser } from "@/actions/admin-actions";
import { cn } from "@/lib/utils";
import { 
    DotsThreeVertical, 
    MagnifyingGlass, 
    PencilSimple, 
    Prohibit, 
    Trash, 
    X,
    CheckCircle,
    Info,
    ShieldCheck
} from "@phosphor-icons/react";
import type { User } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UserControlPanel } from "./user-control-panel";

interface AdminDirectoryProps {
    initialUsers: User[];
}

export function AdminDirectory({ initialUsers }: AdminDirectoryProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    
    // Modal states
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [blockingUser, setBlockingUser] = useState<{ user: User; status: boolean } | null>(null);
    const [managingUser, setManagingUser] = useState<User | null>(null);
    
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const filteredUsers = initialUsers.filter(user => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            user.fullName?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            user.registrationNumber?.toLowerCase().includes(term)
        );
    });

    const handleDelete = async (userId: string) => {
        const formData = new FormData();
        formData.append("userId", userId);
        
        startTransition(async () => {
            const res = await deleteAdminManagedUser(formData);
            if (res.success) {
                setSuccess("User deleted successfully");
                setDeletingUser(null);
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    const handleBlock = async (userId: string, isBlocked: boolean) => {
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("isBlocked", isBlocked.toString());
        formData.append("blockedReason", isBlocked ? "Suspended by Administrator" : "");
        
        startTransition(async () => {
            const res = await setAdminManagedUserBlock(formData);
            if (res.success) {
                setSuccess(isBlocked ? "User suspended" : "User unsuspended");
                setBlockingUser(null);
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        startTransition(async () => {
            const res = await updateAdminManagedUser(formData);
            if (res.success) {
                setSuccess("User updated successfully");
                setEditingUser(null);
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    return (
        <div className="student-surface overflow-hidden rounded-lg">
            <div className="flex flex-col justify-between gap-6 border-b border-[var(--student-border)] p-10 sm:flex-row sm:items-center">
                <h3 className="text-2xl font-bold tracking-tight text-slate-900">System Directory</h3>
                <div className="relative">
                    <MagnifyingGlass size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--student-muted)]" weight="bold" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        className="w-full rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-muted)] py-4 pl-14 pr-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-text)] transition-all placeholder:text-[var(--student-muted)]/55 focus:border-[var(--student-accent-soft-strong)] focus:bg-[var(--student-panel-solid)] focus:outline-none focus:ring-4 focus:ring-[var(--student-accent-soft)]/70 sm:w-96"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-[var(--student-border)] bg-[var(--student-panel-muted)]/80 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-muted)]">
                            <th className="px-8 py-4">User Details</th>
                            <th className="px-8 py-4">Role</th>
                            <th className="px-8 py-4">Registration</th>
                            <th className="px-8 py-4">Status</th>
                            <th className="px-8 py-4">Joined</th>
                            <th className="px-8 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--student-border)]/70">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-12 text-center text-sm font-medium text-[var(--student-muted)]">
                                    No users found matching &quot;{searchTerm}&quot;
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="group transition-all duration-300 hover:bg-[var(--student-panel-muted)]/70">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-solid)] text-sm font-black text-[var(--student-muted)] shadow-sm transition-all">
                                                {user.fullName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-slate-900">{user.fullName || "Unnamed User"}</div>
                                                <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)] opacity-80">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span
                                            className={cn(
                                                "rounded-full border px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm",
                                                user.role === "ADMIN"
                                                    ? "bg-[var(--student-support-soft)] text-[var(--student-support)] border-[var(--student-support-soft-strong)]"
                                                    : user.role === "TEACHER"
                                                        ? "bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)] border-[var(--student-accent-soft-strong)]"
                                                        : "bg-[#e5f0e9] text-[var(--student-success)] border-[#cfe0d5]"
                                            )}
                                        >
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6   text-sm font-black text-[var(--student-muted-strong)]">{user.registrationNumber || "-"}</td>
                                    <td className="px-8 py-6">
                                        <div
                                            className={cn(
                                                "inline-flex items-center gap-2.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] shadow-sm",
                                                user.isBlocked
                                                    ? "bg-rose-50 text-rose-500 border-rose-100"
                                                    : "bg-[#e5f0e9] text-[var(--student-success)] border-[#cfe0d5]"
                                            )}
                                        >
                                            <div className={cn("h-1.5 w-1.5 rounded-full", user.isBlocked ? "bg-rose-500 animate-pulse" : "bg-[var(--student-success)]")} />
                                            {user.isBlocked ? "Suspended" : "Active"}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-xs font-black uppercase tracking-widest text-[var(--student-muted)]">
                                        {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </td>
                                    <td className="px-8 py-6 text-right relative">
                                        <button 
                                            onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                                            className={cn(
                                                "rounded-lg border border-transparent p-3 text-[var(--student-muted)] transition-all hover:border-[var(--student-border)] hover:bg-[var(--student-panel-solid)] hover:text-[var(--student-accent-strong)]",
                                                activeMenu === user.id ? "border-[var(--student-border)] bg-[var(--student-panel-solid)] text-[var(--student-accent-strong)] opacity-100" : "opacity-0 group-hover:opacity-100"
                                            )}
                                        >
                                            <DotsThreeVertical size={24} weight="bold" />
                                        </button>

                                        {activeMenu === user.id && (
                                            <div className="absolute right-20 top-6 z-50 w-56 rounded-lg border border-[var(--student-border)] bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                                                <button 
                                                    onClick={() => { setEditingUser(user); setActiveMenu(null); }}
                                                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--student-text)] transition-all hover:bg-[var(--student-panel-muted)]"
                                                >
                                                    <PencilSimple size={18} weight="bold" /> Edit Profile
                                                </button>
                                                <button 
                                                    onClick={() => { setBlockingUser({ user, status: !user.isBlocked }); setActiveMenu(null); }}
                                                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--student-text)] transition-all hover:bg-[var(--student-panel-muted)]"
                                                >
                                                    <Prohibit size={18} weight="bold" className={user.isBlocked ? "text-emerald-500" : "text-amber-500"} /> 
                                                    {user.isBlocked ? "Revoke Suspension" : "Suspend User"}
                                                </button>
                                                <div className="my-1 border-t border-[var(--student-border)]" />
                                                <button 
                                                    onClick={() => { setManagingUser(user); setActiveMenu(null); }}
                                                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--student-accent-strong)] transition-all hover:bg-[var(--student-accent-soft)]"
                                                >
                                                    <ShieldCheck size={18} weight="bold" /> Manage Governance
                                                </button>
                                                <div className="my-1 border-t border-[var(--student-border)]" />
                                                <button 
                                                    onClick={() => { setDeletingUser(user); setActiveMenu(null); }}
                                                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-rose-500 transition-all hover:bg-rose-50"
                                                >
                                                    <Trash size={18} weight="bold" /> Permanent Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Error/Success Toasts (Simplified) */}
            {(error || success) && (
                <div className="fixed bottom-10 right-10 z-[100] flex animate-in slide-in-from-right-full flex-col gap-3">
                    {error && (
                        <div className="flex items-center gap-4 rounded-lg border border-rose-100 bg-rose-50 px-6 py-4 text-rose-600 shadow-lg">
                            <Info size={20} weight="fill" />
                            <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
                            <button onClick={() => setError(null)}><X size={16} weight="bold" /></button>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-4 rounded-lg border border-emerald-100 bg-emerald-50 px-6 py-4 text-emerald-600 shadow-lg">
                            <CheckCircle size={20} weight="fill" />
                            <p className="text-xs font-bold uppercase tracking-wider">{success}</p>
                            <button onClick={() => setSuccess(null)}><X size={16} weight="bold" /></button>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--student-ink)]/40 p-6 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-xl rounded-lg border border-[var(--student-border)] bg-white p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="mb-8 flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="  text-2xl font-black tracking-tight text-[var(--student-text)]">Edit Platform Member</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">Configuration for {editingUser.email}</p>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="rounded-lg border border-[var(--student-border)] p-3 text-[var(--student-muted)] transition-all hover:bg-[var(--student-panel-muted)]">
                                <X size={24} weight="bold" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            <input type="hidden" name="userId" value={editingUser.id} />
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">Full Identity</label>
                                    <input 
                                        name="fullName" 
                                        defaultValue={editingUser.fullName || ""} 
                                        className="w-full rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-muted)] px-5 py-4 text-xs font-bold text-[var(--student-text)] outline-none focus:border-[var(--student-accent-soft-strong)] focus:bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">System Role</label>
                                    <select 
                                        name="role" 
                                        defaultValue={editingUser.role}
                                        className="w-full rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-muted)] px-5 py-4 text-xs font-bold text-[var(--student-text)] outline-none focus:border-[var(--student-accent-soft-strong)] focus:bg-white"
                                    >
                                        <option value="STUDENT">STUDENT</option>
                                        <option value="TEACHER">TEACHER</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">Registration #</label>
                                    <input 
                                        name="registrationNumber" 
                                        defaultValue={editingUser.registrationNumber || ""} 
                                        className="w-full rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-muted)] px-5 py-4 text-xs font-bold text-[var(--student-text)] outline-none focus:border-[var(--student-accent-soft-strong)] focus:bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)]">Department / level</label>
                                    <input 
                                        name="department" 
                                        defaultValue={editingUser.department || ""} 
                                        className="w-full rounded-lg border border-[var(--student-border)] bg-[var(--student-panel-muted)] px-5 py-4 text-xs font-bold text-[var(--student-text)] outline-none focus:border-[var(--student-accent-soft-strong)] focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="pt-6">
                                <button 
                                    disabled={isPending}
                                    type="submit" 
                                    className="w-full rounded-lg bg-[var(--student-accent-strong)] py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl shadow-[var(--student-accent-strong)]/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                                >
                                    {isPending ? "Syncing Platform..." : "Update Credentials"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deletingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/20 p-6 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md rounded-lg border border-rose-100 bg-white p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="mb-8 flex flex-col items-center text-center">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                                <Trash size={40} weight="fill" />
                            </div>
                            <h3 className="mb-2   text-2xl font-black tracking-tight text-slate-900">Irreversible Action</h3>
                            <p className="text-sm font-medium leading-relaxed text-slate-500">
                                You are about to permanently delete <strong>{deletingUser.fullName || deletingUser.email}</strong>. This will erase all their exam attempts, resources, and analytic history.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setDeletingUser(null)}
                                className="flex-1 rounded-lg border border-[var(--student-border)] bg-white py-4 text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)] transition-all hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleDelete(deletingUser.id)}
                                disabled={isPending}
                                className="flex-1 rounded-lg bg-rose-500 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-600 active:scale-95 disabled:opacity-50"
                            >
                                {isPending ? "Erasing..." : "Delete User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Block Modal */}
            {blockingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/10 p-6 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md rounded-lg border border-amber-100 bg-white p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="mb-8 flex flex-col items-center text-center">
                            <div className={cn(
                                "mb-6 flex h-20 w-20 items-center justify-center rounded-lg",
                                blockingUser.status ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-500"
                            )}>
                                <Prohibit size={40} weight="fill" />
                            </div>
                            <h3 className="mb-2   text-2xl font-black tracking-tight text-slate-900">
                                {blockingUser.status ? "Suspend Membership" : "Restore Membership"}
                            </h3>
                            <p className="text-sm font-medium leading-relaxed text-slate-500">
                                {blockingUser.status 
                                    ? `This will prevent ${blockingUser.user.email} from accessing any platform features until further review.`
                                    : `This will restore full platform access for ${blockingUser.user.email}.`
                                }
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setBlockingUser(null)}
                                className="flex-1 rounded-lg border border-[var(--student-border)] bg-white py-4 text-[10px] font-black uppercase tracking-widest text-[var(--student-muted)] transition-all hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleBlock(blockingUser.user.id, blockingUser.status)}
                                disabled={isPending}
                                className={cn(
                                    "flex-1 rounded-lg py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 disabled:opacity-50",
                                    blockingUser.status ? "bg-amber-500 shadow-amber-500/20 hover:bg-amber-600" : "bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600"
                                )}
                            >
                                {isPending ? "Updating..." : blockingUser.status ? "Suspend Access" : "Restore Access"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Governance Panel (Drawer) */}
            {managingUser && (
                <div className="fixed inset-0 z-[60] flex justify-end bg-[var(--student-ink)]/20 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="h-full w-full max-w-2xl border-l border-[var(--student-border)] bg-white shadow-2xl animate-in slide-in-from-right duration-500 ease-out">
                        <UserControlPanel 
                            userId={managingUser.id} 
                            onClose={() => setManagingUser(null)} 
                            onUpdate={() => router.refresh()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
