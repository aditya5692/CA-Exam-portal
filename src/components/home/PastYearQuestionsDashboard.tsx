"use client";

import { getPublicResources,trackPYQAction } from "@/actions/resource-actions";
import { cn } from "@/lib/utils";
import type { PublicResource } from "@/types/resource";
import { useEffect,useState } from "react";

export function PastYearQuestionsDashboard({ 
    headerContent 
}: { 
    headerContent?: React.ReactNode;
}) {
    const activeLevel = "CA Final";
    const [resources, setResources] = useState<PublicResource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getPublicResources({
                category: activeLevel,
                subType: "PYQ"
            });
            if (data.success) {
                setResources(data.data || []);
            }
            setLoading(false);
        };
        fetchData();
    }, [activeLevel]);

    const handleDownload = async (id: string, url: string) => {
        await trackPYQAction(id, "DOWNLOAD");
        window.open(url, '_blank');
    };

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedQuickFilter, setSelectedQuickFilter] = useState("All Levels");
    const quickFilters = ["All Levels", "CA Final", "CA Inter", "2024"];

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "Live": return "text-emerald-600 before:bg-emerald-600";
            case "Not Live": return "text-slate-400 before:bg-slate-300";
            default: return "text-slate-500 before:bg-slate-400";
        }
    };

    const filteredResources = resources.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.author.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = selectedQuickFilter === "All Levels" || 
                            (selectedQuickFilter === "2024" ? new Date(item.createdAt).getFullYear() === 2024 : item.category === selectedQuickFilter);
        return matchesSearch && matchesLevel;
    });

    return (
        <div className="space-y-8 pb-12">
            {/* Integrated Header and Search Context */}
            <div className="flex flex-col gap-8">
                {headerContent}
                
                {/* Search and Main Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">search</span>
                        <input
                            type="text"
                            placeholder="Search by Subject or Topic..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95 shrink-0">
                        <span className="material-symbols-outlined text-xl">filter_list</span>
                        Filter
                    </button>
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Quick Filters:</span>
                    {quickFilters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setSelectedQuickFilter(filter)}
                            className={cn(
                                "px-5 py-2 rounded-full text-xs font-bold transition-all border shadow-sm active:scale-95",
                                selectedQuickFilter === filter
                                    ? "bg-slate-950 border-slate-950 text-white shadow-md shadow-slate-200"
                                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                            )}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/30">
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Title</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attempt</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Size</th>
                                <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-6"><div className="h-10 bg-slate-50 rounded-lg w-full" /></td>
                                    </tr>
                                ))
                            ) : filteredResources.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                                                <span className="material-symbols-outlined text-3xl text-slate-300">description</span>
                                            </div>
                                            <h3 className="text-base font-bold text-slate-900 font-outfit uppercase tracking-tight">No materials found</h3>
                                            <p className="text-sm text-slate-400 font-medium mt-1">Try adjusting your filters or search query.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredResources.map((item) => {
                                    // Mock data for table columns since actual API might not have them
                                    const session = item.createdAt ? new Date(item.createdAt).getFullYear() >= 2024 ? "MAY 2024" : "NOV 2023" : "MAY 2024";
                                    const status = "Live";
                                    const size = "2.4 MB"; // Mock size

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0 border border-rose-100/50 group-hover:bg-rose-500 group-hover:text-white transition-all">
                                                        <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                                                    </div>
                                                    <span className="font-bold text-slate-900 text-sm font-outfit truncate max-w-[300px]">{item.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-3 py-1 rounded bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider border border-indigo-100/50">
                                                    {session}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-3 py-1 rounded bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border border-slate-100">
                                                    {item.subType || "PYQ"}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-medium text-slate-500">{item.category || "CA Final"}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={cn(
                                                    "flex items-center gap-2 text-xs font-bold before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full",
                                                    getStatusStyles(status)
                                                )}>
                                                    {status}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-medium text-slate-400">{size}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleDownload(item.id, item.fileUrl)}
                                                        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-90"
                                                        title="View Material"
                                                    >
                                                        <span className="material-symbols-outlined text-2xl">visibility</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDownload(item.id, item.fileUrl)}
                                                        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all active:scale-90"
                                                        title="Download"
                                                    >
                                                        <span className="material-symbols-outlined text-2xl">download</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer / Pagination Info */}
                <div className="px-8 py-5 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Showing 1 to {filteredResources.length} of 24 materials
                    </span>
                    <div className="flex items-center gap-2">
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 transition-all disabled:opacity-30" disabled>
                            <span className="material-symbols-outlined text-xl">chevron_left</span>
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-200">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 text-xs font-bold hover:bg-slate-200 transition-all">2</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 text-xs font-bold hover:bg-slate-200 transition-all">3</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 transition-all">
                            <span className="material-symbols-outlined text-xl">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
