"use client";

import { getPublicResources, incrementDownloadCount } from "@/actions/resource-actions";
import { getSavedItems, toggleSavedItem } from "@/actions/student-actions";
import { deletePYQ } from "@/actions/educator-actions";
import { cn } from "@/lib/utils";
import type { PublicResource } from "@/types/resource";
import {
  BookmarkSimple,
  Calendar,
  DownloadSimple,
  Eye,
  FilePdf,
  FileText,
  Funnel,
  MagnifyingGlass,
  Star,
  Video,
  List,
  SquaresFour,
  Trash,
  PencilSimple
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const CONTENT_TYPES = ["All", "PDF", "VIDEO", "RTP", "MTP", "PYQ"];
const EMPTY_SAVED_IDS = new Set<string>();

type ViewMode = "GRID" | "TABLE";
type SaveState = "enabled" | "login" | "hidden";

interface Props {
    initialCategory?: string;
    initialSubType?: string;
    daysToExam?: number;
    saveState?: SaveState;
    loginHref?: string;
    showFeaturePrompt?: boolean;
    mode?: "STUDENT" | "TEACHER";
    defaultView?: ViewMode;
}

export function FreeResourcesDashboard({
    initialCategory = "All",
    initialSubType = "All",
    daysToExam = 0,
    saveState = "hidden",
    loginHref = "/auth/login",
    showFeaturePrompt = false,
    mode = "STUDENT",
    defaultView = "GRID"
}: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [activeSecondary, setActiveSecondary] = useState(initialSubType);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [resources, setResources] = useState<PublicResource[]>([]);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

    // Auto-switch to table for PYQs if not specified otherwise
    useEffect(() => {
        if (activeSecondary === "PYQ") {
            setViewMode("TABLE");
        }
    }, [activeSecondary]);

    const canSave = saveState === "enabled";
    const visibleSavedIds = canSave ? savedIds : EMPTY_SAVED_IDS;

    const dynamicCategories = ["All", initialCategory !== "All" ? initialCategory : "CA Final", "Case Studies", "Amendments"].filter((x, i, a) => a.indexOf(x) === i);

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
        const timer = window.setTimeout(() => {
            void fetchResources();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [fetchResources]);

    useEffect(() => {
        if (!canSave) return;
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
        void fetchSaves();
    }, [canSave]);

    const handleToggleSave = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (saveState === "login") {
            router.push(`${loginHref}?next=${encodeURIComponent(pathname)}`);
            return;
        }
        if (!canSave) return;
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

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this resource?")) {
            const res = await deletePYQ(id);
            if (res.success) {
                void fetchResources();
            }
        }
    };

    const getIcon = (subType: string) => {
        switch (subType) {
            case 'VIDEO': return { icon: <Video size={24} weight="fill" className="text-blue-500" />, bg: "bg-blue-50 text-blue-600" };
            case 'PYQ': return { icon: <FilePdf size={24} weight="fill" className="text-rose-500" />, bg: "bg-rose-50 text-rose-600" };
            case 'MTP':
            case 'RTP': return { icon: <FileText size={24} weight="fill" className="text-amber-500" />, bg: "bg-amber-50 text-amber-600" };
            default: return { icon: <FilePdf size={24} weight="fill" className="text-emerald-500" />, bg: "bg-emerald-50 text-emerald-600" };
        }
    };

    return (
        <div className="w-full space-y-10 pb-12 font-outfit">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Resource Library</span>
                    </div>
                    <h1 className="font-outfit tracking-tighter leading-tight text-2xl md:text-3xl font-black text-slate-900">
                        {mode === "TEACHER" ? "Management" : "Study"} <span className="text-indigo-600">Materials</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm font-sans max-w-2xl leading-relaxed">
                        A unified repository of study materials, revision packs, and past papers optimized for academic success.
                    </p>
                </div>
                {daysToExam > 0 && (
                    <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/5 hover:bg-slate-800 transition-all active:scale-95 shrink-0 mb-1 pointer-events-none">
                        <Calendar size={18} weight="bold" className="text-indigo-400" />
                        Next Milestone: {daysToExam} Days
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 p-2 rounded-2xl border border-slate-100/50 backdrop-blur-sm">
                <div className="relative w-full md:w-[400px] group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-20">
                        <MagnifyingGlass size={22} weight="bold" className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search library..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-14 pr-8 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl self-end md:self-auto">
                    <button 
                        onClick={() => setViewMode("GRID")}
                        className={cn("p-2 rounded-lg transition-all", viewMode === "GRID" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                    >
                        <SquaresFour size={20} weight="bold" />
                    </button>
                    <button 
                        onClick={() => setViewMode("TABLE")}
                        className={cn("p-2 rounded-lg transition-all", viewMode === "TABLE" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                    >
                        <List size={20} weight="bold" />
                    </button>
                </div>
            </div>

            {/* Filters Area */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-2 opacity-70">Syllabus:</span>
                    {dynamicCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                                activeCategory === cat
                                    ? "bg-slate-900 text-white shadow-lg border border-slate-900"
                                    : "bg-white text-slate-400 border border-slate-200 hover:border-slate-400 hover:text-slate-800 shadow-sm"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-2 opacity-70">Resource Type:</span>
                    {CONTENT_TYPES.map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveSecondary(type)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                                activeSecondary === type
                                    ? "bg-indigo-50 border-indigo-200/50 text-indigo-600 shadow-sm"
                                    : "bg-white/50 border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-white hover:border-slate-300"
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* List/Grid Container */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing Library...</p>
                    </div>
                ) : resources.length === 0 ? (
                    <div className="py-24 text-center bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
                        <Funnel size={48} weight="light" className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 font-outfit uppercase tracking-tight">No resources detected</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Try broadening your search or switching categories.</p>
                        <button
                            onClick={() => { setActiveCategory("All"); setActiveSecondary("All"); }}
                            className="mt-6 px-6 py-2.5 bg-white border border-slate-200 text-indigo-600 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                        >
                            Reset Registry
                        </button>
                    </div>
                ) : viewMode === "GRID" ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {resources.map((res) => {
                            const { icon, bg } = getIcon(res.subType);
                            const isSaved = canSave && visibleSavedIds.has(res.id);
                            return (
                                <div key={res.id} className="group relative bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100/50 transition-all duration-500 flex flex-col h-full hover:-translate-y-1">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm", bg.replace('50', '50/50'))}>
                                            {icon}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 border border-slate-100 px-3 py-1.5 rounded-xl bg-slate-50 shadow-sm">
                                                {res.category}
                                            </div>
                                            <div className="flex gap-2">
                                                {saveState !== "hidden" && (
                                                    <button
                                                        onClick={(e) => handleToggleSave(res.id, e)}
                                                        className={cn(
                                                            "w-10 h-10 rounded-xl transition-all duration-300 flex items-center justify-center border shadow-sm",
                                                            isSaved
                                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200"
                                                                : "bg-white border-slate-100 text-slate-300 hover:text-indigo-600 hover:border-indigo-100"
                                                        )}
                                                    >
                                                        <BookmarkSimple size={20} weight={isSaved ? "fill" : "bold"} />
                                                    </button>
                                                )}
                                                {mode === "TEACHER" && (
                                                     <button
                                                        onClick={() => handleDelete(res.id)}
                                                        className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-rose-600 hover:border-rose-100 transition-all flex items-center justify-center shadow-sm"
                                                    >
                                                        <Trash size={20} weight="bold" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold font-outfit text-slate-900 leading-snug mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[56px]">
                                        {res.title}
                                    </h3>

                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                                            {(res.author || "A").charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{res.author || "Faculty"}</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Syllabus Expert</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 leading-none">{res.downloads}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Saves</span>
                                            </div>
                                            <div className="h-4 w-[1px] bg-slate-100" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 leading-none">{(res.rating || 4.5).toFixed(1)}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 font-sans flex items-center gap-1">
                                                    Rating <Star size={10} weight="fill" className="text-amber-500" />
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDownload(res.id, res.fileUrl)}
                                            className="h-11 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-indigo-600 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            Access <Eye size={18} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Material Bundle</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center text-indigo-600">Metric</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {resources.map((res) => {
                                    const { icon } = getIcon(res.subType);
                                    return (
                                        <tr key={res.id} className="group hover:bg-slate-50/30 transition-all">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shadow-sm group-hover:bg-white transition-all">
                                                        {icon}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 uppercase tracking-tight">{res.title}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{res.author || "Global Faculty"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                {res.category}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-widest">
                                                    {res.subType}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="text-sm font-bold text-slate-900 tracking-tighter">{res.downloads.toLocaleString()}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleDownload(res.id, res.fileUrl)}
                                                        className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 shadow-sm transition-all"
                                                        title="View"
                                                    >
                                                        <Eye size={18} weight="bold" />
                                                    </button>
                                                    {mode === "TEACHER" && (
                                                        <button 
                                                            onClick={() => handleDelete(res.id)}
                                                            className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100 shadow-sm transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash size={18} weight="bold" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
