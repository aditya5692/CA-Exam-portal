"use client";

import { deletePYQ } from "@/actions/educator-actions"; // Reusing delete for now
import { getPublicResources } from "@/actions/resource-actions";
import { cn } from "@/lib/utils";
import type { PublicResource } from "@/types/resource";
import {
  DownloadSimple,
  FilePdf,
  Funnel,
  Globe,
  MagnifyingGlass,
  Plus,
  ShareNetwork,
  Trash,
  UserCircle
} from "@phosphor-icons/react";
import { useEffect,useState } from "react";

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
            if (!active) {
                return;
            }

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
        if (confirm("ADMIN ACTION: Are you sure you want to PERMANENTLY delete this resource from the platform?")) {
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
            {/* Admin Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight font-outfit">Platform Vault Control</h1>
                    <p className="text-slate-500 font-medium font-sans">Manage all Past Year Questions across Teachers, ICAI, and Platform sources.</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-4 rounded-[18px] bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:bg-rose-600 transition-all duration-300 active:scale-95 flex items-center gap-2">
                        <Plus size={18} weight="bold" /> Add Official PYQ
                    </button>
                </div>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total PYQs", value: resources.length, icon: FilePdf, bg: "bg-rose-50", color: "text-rose-600" },
                    { label: "Total Downloads", value: resources.reduce((s, r) => s + r.downloads, 0), icon: DownloadSimple, bg: "bg-emerald-50", color: "text-emerald-600" },
                    { label: "Total Shares", value: resources.reduce((s, r) => s + (r.shareCount || 0), 0), icon: ShareNetwork, bg: "bg-blue-50", color: "text-blue-600" },
                    { label: "Contributors", value: new Set(resources.map(r => r.authorId)).size, icon: UserCircle, bg: "bg-purple-50", color: "text-purple-600" },
                ].map(stat => (
                    <div key={stat.label} className="p-10 rounded-[40px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-6 group hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-500">
                        <div className={cn("w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-lg shadow-current/10", stat.bg, stat.color)}>
                            <stat.icon size={32} weight="bold" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1.5 opacity-60 font-sans">{stat.label}</div>
                            <div className="text-3xl font-black text-slate-950 font-outfit tracking-tighter leading-none">{stat.value.toLocaleString()}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="relative w-full md:w-[480px]">
                    <MagnifyingGlass size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" weight="bold" />
                    <input
                        type="text"
                        placeholder="Search system resources..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-8 py-4 rounded-[20px] bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-100 transition-all font-sans text-slate-900 placeholder:text-slate-300"
                    />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-[16px] border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all shadow-sm">
                        <Funnel size={18} className="text-slate-400" weight="bold" />
                        <select 
                            value={filterProvider}
                            onChange={(e) => setFilterProvider(e.target.value)}
                            className="bg-transparent text-[10px] font-black text-slate-900 outline-none pr-4 uppercase tracking-[0.2em] cursor-pointer"
                        >
                            <option value="All">All Providers</option>
                            <option value="ICAI">ICAI Official</option>
                            <option value="TEACHER">Teacher Uploads</option>
                            <option value="PLATFORM">Platform Standard</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Global Resource Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-50">
                                <th className="px-8 py-6">Source & Details</th>
                                <th className="px-8 py-6">Provider</th>
                                <th className="px-8 py-6 text-center">Engagement</th>
                                <th className="px-8 py-6">Last Update</th>
                                <th className="px-8 py-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-10 h-24 bg-slate-50/10" />
                                    </tr>
                                ))
                            ) : filteredResources.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <Globe size={48} weight="duotone" className="mx-auto text-slate-100 mb-6" />
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">No marketplace items match your criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredResources.map((res) => (
                                    <tr key={res.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-[16px] bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 shadow-sm transition-transform group-hover:scale-105">
                                                    <FilePdf size={28} weight="fill" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 line-clamp-1 font-outfit text-base">{res.title}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1 font-sans">By {res.author}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-[12px] text-[10px] font-bold uppercase tracking-[0.15em] border backdrop-blur-sm",
                                                res.providerType === "ICAI" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                res.providerType === "TEACHER" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                "bg-indigo-50 text-indigo-600 border-indigo-100"
                                            )}>
                                                {res.providerType}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center gap-8">
                                                <div className="text-center">
                                                    <div className="text-base font-bold text-slate-900 font-outfit">{res.downloads.toLocaleString()}</div>
                                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Downloads</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-base font-bold text-slate-900 font-outfit">{(res.shareCount || 0).toLocaleString()}</div>
                                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Shares</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                                            {res.date}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button 
                                                onClick={() => handleDelete(res.id)}
                                                className="p-3 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
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
