"use client";

import { deletePYQ } from "@/actions/educator-actions";
import { getPublicResources } from "@/actions/resource-actions";
import { cn } from "@/lib/utils";
import type { PublicResource } from "@/types/resource";
import { DownloadSimple, FilePdf, Funnel, Globe, MagnifyingGlass, Plus, ShareNetwork, Trash, UserCircle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export default function AdminPYQManagement() {
    const [resources, setResources] = useState<PublicResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterProvider, setFilterProvider] = useState("All");

    async function refreshResources() {
        const res = await getPublicResources({});
        if (res.success) {
            setResources((res.data || []).filter((resource) => resource.subType === "PYQ"));
        }
        setLoading(false);
    }

    useEffect(() => {
        let active = true;

        const loadResources = async () => {
            const res = await getPublicResources({});
            if (!active) return;

            if (res.success) {
                setResources((res.data || []).filter((resource) => resource.subType === "PYQ"));
            }
            setLoading(false);
        };

        void loadResources();
        return () => {
            active = false;
        };
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm("ADMIN ACTION: Are you sure you want to permanently delete this resource from the platform?")) {
            setLoading(true);
            await deletePYQ(id);
            await refreshResources();
        }
    };

    const filteredResources = resources.filter(res => {
        const matchesSearch = res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            res.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesProvider = filterProvider === "All" || res.providerType === filterProvider;
        return matchesSearch && matchesProvider;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div className="space-y-2">
                    <h1 className="font-outfit text-4xl font-bold tracking-tight text-[var(--student-text)]">Platform Vault Control</h1>
                    <p className="font-sans font-medium text-[var(--student-muted)]">Manage all past year questions across teacher, ICAI, and platform sources.</p>
                </div>
                <div className="flex gap-4">
                    <button className="student-button-primary flex items-center gap-2 rounded-[18px] px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                        <Plus size={18} weight="bold" /> Add Official PYQ
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                {[
                    { label: "Total PYQs", value: resources.length, icon: FilePdf, bg: "bg-rose-50", color: "text-rose-600" },
                    { label: "Total Downloads", value: resources.reduce((s, r) => s + r.downloads, 0), icon: DownloadSimple, bg: "bg-[#e5f0e9]", color: "text-[var(--student-success)]" },
                    { label: "Total Shares", value: resources.reduce((s, r) => s + (r.shareCount || 0), 0), icon: ShareNetwork, bg: "bg-[var(--student-accent-soft)]", color: "text-[var(--student-accent-strong)]" },
                    { label: "Contributors", value: new Set(resources.map(r => r.authorId)).size, icon: UserCircle, bg: "bg-[var(--student-support-soft)]", color: "text-[var(--student-support)]" },
                ].map(stat => (
                    <div key={stat.label} className="student-surface flex items-center gap-6 rounded-[40px] p-10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(55,48,38,0.08)]">
                        <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] shadow-lg shadow-current/10", stat.bg, stat.color)}>
                            <stat.icon size={32} weight="bold" />
                        </div>
                        <div>
                            <div className="mb-1.5 font-sans text-[10px] font-black uppercase tracking-[0.25em] text-[var(--student-muted)] opacity-70">{stat.label}</div>
                            <div className="font-outfit text-3xl font-black leading-none tracking-tighter text-[var(--student-text)]">{stat.value.toLocaleString()}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="student-surface flex flex-col items-center justify-between gap-8 rounded-[40px] p-8 md:flex-row">
                <div className="relative w-full md:w-[480px]">
                    <MagnifyingGlass size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--student-muted)]" weight="bold" />
                    <input
                        type="text"
                        placeholder="Search system resources..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-[20px] border border-[var(--student-border)] bg-[var(--student-panel-muted)] py-4 pl-14 pr-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-text)] transition-all placeholder:text-[var(--student-muted)]/55 focus:border-[var(--student-accent-soft-strong)] focus:bg-[var(--student-panel-solid)] focus:outline-none focus:ring-4 focus:ring-[var(--student-accent-soft)]/70"
                    />
                </div>
                <div className="flex w-full items-center gap-4 md:w-auto">
                    <div className="student-button-secondary flex items-center gap-3 rounded-[16px] px-6 py-3 shadow-sm">
                        <Funnel size={18} className="text-[var(--student-muted)]" weight="bold" />
                        <select
                            value={filterProvider}
                            onChange={(e) => setFilterProvider(e.target.value)}
                            className="cursor-pointer bg-transparent pr-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--student-text)] outline-none"
                        >
                            <option value="All">All Providers</option>
                            <option value="ICAI">ICAI Official</option>
                            <option value="TEACHER">Teacher Uploads</option>
                            <option value="PLATFORM">Platform Standard</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="student-surface overflow-hidden rounded-[32px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--student-border)] bg-[var(--student-panel-muted)]/80 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--student-muted)]">
                                <th className="px-8 py-6">Source and Details</th>
                                <th className="px-8 py-6">Provider</th>
                                <th className="px-8 py-6 text-center">Engagement</th>
                                <th className="px-8 py-6">Last Update</th>
                                <th className="px-8 py-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--student-border)]/70">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="h-24 bg-[var(--student-panel-muted)]/20 px-8 py-10" />
                                    </tr>
                                ))
                            ) : filteredResources.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <Globe size={48} weight="duotone" className="mx-auto mb-6 text-[var(--student-muted)]/35" />
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--student-muted)]">No marketplace items match your criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredResources.map((res) => (
                                    <tr key={res.id} className="group transition-all duration-300 hover:bg-[var(--student-panel-muted)]/60">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-rose-100 bg-rose-50 text-rose-500 shadow-sm transition-transform group-hover:scale-105">
                                                    <FilePdf size={28} weight="fill" />
                                                </div>
                                                <div>
                                                    <div className="font-outfit text-base font-bold text-[var(--student-text)] line-clamp-1">{res.title}</div>
                                                    <div className="mt-1 font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--student-muted)]">By {res.author}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span
                                                className={cn(
                                                    "rounded-[12px] border px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em]",
                                                    res.providerType === "ICAI"
                                                        ? "bg-[var(--student-support-soft)] text-[var(--student-support)] border-[var(--student-support-soft-strong)]"
                                                        : res.providerType === "TEACHER"
                                                            ? "bg-[#e5f0e9] text-[var(--student-success)] border-[#cfe0d5]"
                                                            : "bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)] border-[var(--student-accent-soft-strong)]"
                                                )}
                                            >
                                                {res.providerType}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center gap-8">
                                                <div className="text-center">
                                                    <div className="font-outfit text-base font-bold text-[var(--student-text)]">{res.downloads.toLocaleString()}</div>
                                                    <div className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--student-muted)]">Downloads</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-outfit text-base font-bold text-[var(--student-text)]">{(res.shareCount || 0).toLocaleString()}</div>
                                                    <div className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--student-muted)]">Shares</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-sans text-[11px] font-bold uppercase tracking-wider text-[var(--student-muted)]">
                                            {res.date}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => handleDelete(res.id)}
                                                className="rounded-xl p-3 text-[var(--student-muted)] opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                            >
                                                <Trash size={20} weight="bold" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
