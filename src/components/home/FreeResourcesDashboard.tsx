"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    MagnifyingGlass,
    Funnel,
    DownloadSimple,
    Eye,
    Star,
    FilePdf,
    FileText,
    Video,
    Calendar,
    BookmarkSimple
} from "@phosphor-icons/react";
import { getPublicResources, incrementDownloadCount, type PublicResource } from "@/actions/resource-actions";
import { toggleSavedItem, getSavedItems } from "@/actions/student-actions";

const CATEGORIES = ["All", "CA Final", "CA Inter", "CA Foundation", "Case Studies", "Amendments"];
const CONTENT_TYPES = ["All", "PDF", "VIDEO", "RTP", "MTP", "PYQ"];

export function FreeResourcesDashboard({ daysToExam = 0 }: { daysToExam?: number }) {
    const [activeCategory, setActiveCategory] = useState("All");
    const [activeSecondary, setActiveSecondary] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [resources, setResources] = useState<PublicResource[]>([]);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    // Debounce search to avoid too many requests
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchResources = useCallback(async () => {
        setLoading(true);
        const res = await getPublicResources({
            category: activeCategory,
            subType: activeSecondary,
            search: debouncedSearch
        });
        if (res.success) {
            setResources(res.data || []);
        }
        setLoading(false);
    }, [activeCategory, activeSecondary, debouncedSearch]);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    useEffect(() => {
        const fetchSaves = async () => {
            const res = await getSavedItems();
            if (res.success && res.data) {
                const ids = new Set([
                    ...(res.data.materials || []).map((m) => m.id),
                    ...(res.data.exams || []).map((e) => e.id)
                ]);
                setSavedIds(ids);
            }
        };
        fetchSaves();
    }, []);

    const handleToggleSave = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const res = await toggleSavedItem(id, "MATERIAL");
        if (res.success && res.data) {
            setSavedIds(prev => {
                const next = new Set(prev);
                if (res.data!.saved) next.add(id);
                else next.delete(id);
                return next;
            });
        }
    };

    const handleDownload = async (id: string, url: string) => {
        await incrementDownloadCount(id);
        window.open(url, '_blank');
    };

    const getIcon = (subType: string) => {
        switch (subType) {
            case 'VIDEO': return { icon: <Video size={28} weight="fill" className="text-blue-500" />, bg: "bg-blue-50 text-blue-600" };
            case 'PYQ': return { icon: <FilePdf size={28} weight="fill" className="text-rose-500" />, bg: "bg-rose-50 text-rose-600" };
            case 'MTP':
            case 'RTP': return { icon: <FileText size={28} weight="fill" className="text-amber-500" />, bg: "bg-amber-50 text-amber-600" };
            default: return { icon: <FilePdf size={28} weight="fill" className="text-emerald-500" />, bg: "bg-emerald-50 text-emerald-600" };
        }
    };


    return (
        <div className="w-full space-y-10 pb-12 font-outfit">
            {/* Standardized Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Resource Library</span>
                    </div>
                    <h1 className="font-outfit tracking-tighter leading-tight text-2xl md:text-3xl font-black text-slate-900">
                        Study <span className="text-indigo-600">Materials</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm font-sans max-w-2xl leading-relaxed">
                        A curated repository of high-impact study materials, revision packs, and past papers optimized for academic success.
                    </p>
                </div>
                {daysToExam > 0 && (
                    <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/5 hover:bg-slate-800 transition-all active:scale-95 shrink-0 mb-1 pointer-events-none">
                        <Calendar size={18} weight="bold" className="text-indigo-400" />
                        Next Milestone: {daysToExam} Days
                    </div>
                )}
            </div>

            {/* Search and Filters Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="relative w-full md:w-[400px] group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-20">
                        <MagnifyingGlass size={22} weight="bold" className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search library..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-14 pr-8 py-4 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm"
                    />
                </div>
            </div>

            {/* Smart Filters Area */}
            <div className="space-y-4 px-1">
                <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                                activeCategory === cat
                                    ? "bg-slate-900 text-white shadow-lg border border-slate-900"
                                    : "bg-white text-slate-400 border border-slate-200 hover:border-slate-400 hover:text-slate-800 hover:shadow-sm"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-2 opacity-70">Quick Access:</span>
                    {CONTENT_TYPES.map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveSecondary(type)}
                            className={cn(
                                "px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                                activeSecondary === type
                                    ? "bg-indigo-50 border-indigo-200/50 text-indigo-600"
                                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Resource Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading resources...</p>
                    </div>
                ) : resources.map((res) => {
                    const { icon, bg } = getIcon(res.subType);
                    return (
                        <div key={res.id} className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full hover:-translate-y-1 shadow-slate-200/50">
                            <div className="flex items-start justify-between mb-8">
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110", bg.replace('50', '50/50'))}>
                                    {icon}
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-slate-100 px-3 py-1 rounded-lg bg-slate-50 shadow-sm">
                                        {res.category}
                                    </div>
                                    <button
                                        onClick={(e) => handleToggleSave(res.id, e)}
                                        className={cn(
                                            "p-2 rounded-lg transition-all duration-200 active:scale-95 border shadow-sm",
                                            savedIds.has(res.id) 
                                                ? "bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-600/10" 
                                                : "bg-white border-slate-100 text-slate-300 hover:text-indigo-500 hover:border-indigo-100 hover:bg-indigo-50/50"
                                        )}
                                    >
                                        <BookmarkSimple size={18} weight={savedIds.has(res.id) ? "fill" : "bold"} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold font-outfit text-slate-900 leading-snug mb-3 group-hover:text-indigo-500/80 transition-colors line-clamp-2 min-h-[52px]">
                                {res.title}
                            </h3>

                            {/* Minimal Author Info */}
                            <Link 
                                href={res.authorId ? `/educator/${res.authorId}` : "#"} 
                                className={cn(
                                    "flex items-center gap-2 mb-6 group/author",
                                    res.authorId ? "" : "pointer-events-none"
                                )}
                            >
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 text-[10px] font-bold border border-slate-100 uppercase group-hover/author:bg-white transition-colors">
                                    {(res.author || "A").charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-slate-700 group-hover/author:text-indigo-500/80 transition-colors uppercase tracking-tight">{res.author || "Faculty"}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/60 opacity-80">Syllabus Expert</span>
                                </div>
                            </Link>

                            <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-slate-400" title="Downloads">
                                        <DownloadSimple size={16} weight="bold" className="opacity-60" />
                                        <span className="text-[10px] font-bold text-slate-500">{res.downloads}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-amber-500/80" title="Rating">
                                        <Star size={16} weight="fill" />
                                        <span className="text-[10px] font-bold text-slate-500">{(res.rating || 4.5).toFixed(1)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDownload(res.id, res.fileUrl)}
                                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all duration-200 active:scale-95 flex items-center gap-2 border border-slate-900 shadow-lg shadow-slate-200/50"
                                >
                                    View <Eye size={16} weight="bold" />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {!loading && resources.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <Funnel size={48} className="mx-auto text-gray-200 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">No resources found</h3>
                        <p className="text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
                        <button
                            onClick={() => { setActiveCategory("All"); setActiveSecondary("All"); }}
                            className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
