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
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter font-outfit">System Directory</h3>
                <div className="relative">
                    <MagnifyingGlass size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" weight="bold" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        className="pl-14 pr-8 py-4 rounded-[20px] bg-slate-50 border border-slate-100 text-[10px] uppercase tracking-[0.2em] font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-100 transition-all w-full sm:w-96 font-sans text-slate-900 placeholder:text-slate-300"
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
                                <tr key={user.id} className="group hover:bg-indigo-50/20 transition-all duration-300">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-[16px] bg-white border border-slate-100 flex items-center justify-center text-slate-400 font-black text-sm shadow-sm group-hover:border-indigo-100 transition-all">
                                                {user.fullName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 font-outfit text-base">{user.fullName || 'Unnamed User'}</div>
                                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 opacity-70">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm",
                                            user.role === 'ADMIN' ? "bg-purple-50 text-purple-600 border-purple-100" :
                                                user.role === 'TEACHER' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                                    "bg-blue-50 text-blue-600 border-blue-100"
                                        )}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-black text-slate-600 font-outfit">{user.registrationNumber || '—'}</td>
                                    <td className="px-8 py-6">
                                        <div className={cn(
                                            "inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.15em] shadow-sm",
                                            user.isBlocked ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-emerald-50 text-emerald-500 border-emerald-100"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", user.isBlocked ? "bg-rose-500 animate-pulse" : "bg-emerald-500")} />
                                            {user.isBlocked ? 'Suspended' : 'Active'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">
                                        {new Date(user.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-3 rounded-[14px] text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-indigo-50">
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
