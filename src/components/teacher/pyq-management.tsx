"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
    FilePdf, 
    DownloadSimple, 
    ShareNetwork, 
    Trash, 
    PencilSimple,
    ChartBar,
    Plus,
    IdentificationBadge,
    CalendarCheck,
    SelectionBackground,
    CaretRight,
    CaretLeft,
    Sparkle,
    CloudArrowUp,
    ShieldCheck,
    Archive
} from "@phosphor-icons/react";
import { getTeacherResources, deletePYQ } from "@/actions/educator-actions";

type PYQResource = {
    id: string;
    title: string;
    category: string;
    subType: string;
    isPublic: boolean;
    createdAt: Date | string;
    downloads: number;
    shareCount?: number;
};

export default function TeacherPYQManagement() {
    const [resources, setResources] = useState<PYQResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const fetchResources = async () => {
        setLoading(true);
        const res = await getTeacherResources("PYQ");
        if (res.success) {
            setResources(res.data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        let mounted = true;
        const init = async () => {
            if (mounted) {
                await fetchResources();
            }
        };
        init();
        return () => { mounted = false; };
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this resource?")) {
            await deletePYQ(id);
            fetchResources();
        }
    };

    const stats = [
        { label: "Total Downloads", value: resources.reduce((sum, r) => sum + r.downloads, 0), icon: DownloadSimple, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Link Shares", value: resources.reduce((sum, r) => sum + (r.shareCount || 0), 0), icon: ShareNetwork, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Active Solutions", value: resources.length, icon: Archive, color: "text-emerald-600", bg: "bg-emerald-50" },
    ];

    return (
        <div className="space-y-6 pb-20 w-full max-w-[1280px] mx-auto font-outfit animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Resource Repository</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter text-slate-900">PYQ Archive</h1>
                    <p className="text-slate-500 font-medium text-sm font-sans max-w-2xl leading-relaxed">
                        Manage your repository of past year paper solutions and revision artifacts. Track engagement metrics and dissemination efficacy.
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center">
                    <button 
                         onClick={() => setIsUploadModalOpen(true)}
                         className="h-12 rounded-xl bg-slate-900 text-white font-black text-[9px] uppercase tracking-[0.2em] px-6 hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-xl shadow-slate-900/10 active:scale-95 group"
                    >
                         <CloudArrowUp size={20} weight="bold" className="group-hover:-translate-y-1 transition-transform" />
                         Publish Solution PDF
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {stats.map((stat, i) => (
                    <div key={i} className="p-6 rounded-[24px] bg-white border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-indigo-100/50 transition-all duration-300">
                         <div className="flex items-center justify-between mb-8">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 duration-500", stat.bg, stat.color)}>
                                <stat.icon size={28} weight="bold" />
                            </div>
                         </div>
                         
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tighter mb-1.5 group-hover:text-indigo-600 transition-colors font-outfit">{stat.value.toLocaleString()}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Cumulative Engagement</p>
                         </div>
                    </div>
                ))}
            </div>

            {/* Resource Table */}
            <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-slate-100 shadow-sm p-8 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Managed Index</h3>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Real-time Telemetry</span>
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-thin rounded-[32px] border border-slate-50">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[.2em]">Resource Bundle</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[.2em] text-center">Protocol</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[.2em] text-center">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[.2em] text-center">Division</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[.2em] text-center">Reach</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[.2em] text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-10 h-24 bg-slate-50/20" />
                                    </tr>
                                ))
                            ) : resources.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="w-20 h-20 rounded-[32px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200">
                                                <Archive size={40} weight="light" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Registry Empty · No Solutions Detected</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                resources.map((res) => (
                                    <tr key={res.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 shadow-sm group-hover:bg-rose-500 group-hover:text-white transition-all duration-500">
                                                    <FilePdf size={24} weight="fill" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-slate-900 line-clamp-1 tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{res.title}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Indexed: {new Date(res.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider shadow-sm">
                                                {res.subType || "PYQ"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                                res.isPublic ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", res.isPublic ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                                                {res.isPublic ? "Deployed" : "In Draft"}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="px-3 py-1 bg-slate-50 border border-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                {res.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col gap-1 items-center">
                                                <span className="text-sm font-bold text-slate-900 tracking-tight">{res.downloads.toLocaleString()}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Downloads</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <button className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
                                                    <PencilSimple size={20} weight="bold" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(res.id)}
                                                    className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                                >
                                                    <Trash size={20} weight="bold" />
                                                </button>
                                            </div>
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
