"use client";

import { cn } from "@/lib/utils";
import { DotsThreeVertical, MagnifyingGlass } from "@phosphor-icons/react";
import type { User } from "@prisma/client";
import { useState } from "react";

interface AdminDirectoryProps {
    initialUsers: User[];
}

export function AdminDirectory({ initialUsers }: AdminDirectoryProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredUsers = initialUsers.filter(user => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            user.fullName?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            user.registrationNumber?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="student-surface overflow-hidden rounded-[32px]">
            <div className="flex flex-col justify-between gap-6 border-b border-[var(--student-border)] p-10 sm:flex-row sm:items-center">
                <h3 className="font-outfit text-2xl font-black tracking-tighter text-[var(--student-text)]">System Directory</h3>
                <div className="relative">
                    <MagnifyingGlass size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--student-muted)]" weight="bold" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        className="w-full rounded-[20px] border border-[var(--student-border)] bg-[var(--student-panel-muted)] py-4 pl-14 pr-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-text)] transition-all placeholder:text-[var(--student-muted)]/55 focus:border-[var(--student-accent-soft-strong)] focus:bg-[var(--student-panel-solid)] focus:outline-none focus:ring-4 focus:ring-[var(--student-accent-soft)]/70 sm:w-96"
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
                                            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[var(--student-border)] bg-[var(--student-panel-solid)] text-sm font-black text-[var(--student-muted)] shadow-sm transition-all">
                                                {user.fullName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                                            </div>
                                            <div>
                                                <div className="font-outfit text-base font-black text-[var(--student-text)]">{user.fullName || "Unnamed User"}</div>
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
                                    <td className="px-8 py-6 font-outfit text-sm font-black text-[var(--student-muted-strong)]">{user.registrationNumber || "-"}</td>
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
                                    <td className="px-8 py-6 text-right">
                                        <button className="rounded-[14px] border border-transparent p-3 text-[var(--student-muted)] opacity-0 transition-all hover:border-[var(--student-border)] hover:bg-[var(--student-panel-solid)] hover:text-[var(--student-accent-strong)] group-hover:opacity-100">
                                            <DotsThreeVertical size={24} weight="bold" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
