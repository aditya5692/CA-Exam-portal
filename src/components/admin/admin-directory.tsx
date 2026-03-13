"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { MagnifyingGlass, DotsThreeVertical } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface AdminDirectoryProps {
    initialUsers: User[];
}

export function AdminDirectory({ initialUsers }: AdminDirectoryProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredUsers = initialUsers.filter(user => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (user.fullName?.toLowerCase().includes(term)) ||
            (user.email?.toLowerCase().includes(term)) ||
            (user.registrationNumber?.toLowerCase().includes(term))
        );
    });

    return (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">System Directory</h3>
                <div className="relative">
                    <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" weight="bold" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Find by name or email..."
                        className="pl-12 pr-6 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all w-80"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                            <th className="px-8 py-4">User Details</th>
                            <th className="px-8 py-4">Role</th>
                            <th className="px-8 py-4">Registration</th>
                            <th className="px-8 py-4">Status</th>
                            <th className="px-8 py-4">Joined</th>
                            <th className="px-8 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium text-sm">
                                    No users found matching &quot;{searchTerm}&quot;
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">
                                                {user.fullName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{user.fullName || 'Unnamed'}</div>
                                                <div className="text-xs text-slate-400 font-medium">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                            user.role === 'ADMIN' ? "bg-purple-50 text-purple-600" :
                                                user.role === 'TEACHER' ? "bg-indigo-50 text-indigo-600" :
                                                    "bg-blue-50 text-blue-600"
                                        )}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-slate-600">{user.registrationNumber || 'N/A'}</td>
                                    <td className="px-8 py-5">
                                        <div className={cn(
                                            "flex items-center gap-2 text-xs font-black uppercase tracking-widest",
                                            user.isBlocked ? "text-rose-500" : "text-emerald-500"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", user.isBlocked ? "bg-rose-500" : "bg-emerald-500")} />
                                            {user.isBlocked ? 'Suspended' : 'Active'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-slate-400">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100">
                                            <DotsThreeVertical size={20} weight="bold" />
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
