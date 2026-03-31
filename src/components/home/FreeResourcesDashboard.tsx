"use client";

import { getPublicResources, incrementDownloadCount } from "@/actions/resource-actions";
import { getSavedItems, toggleSavedItem } from "@/actions/student-actions";
import { deletePYQ } from "@/actions/educator-actions";
import { cn } from "@/lib/utils";
import type { PublicResource } from "@/types/resource";
import {
    BookmarkSimple,
    Calendar,
    Eye,
    FilePdf,
    FileText,
    Funnel,
    MagnifyingGlass,
    Star,
    Video,
    List,
    SquaresFour,
    Trash
} from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const CONTENT_TYPES = ["All", "PDF", "VIDEO", "RTP", "MTP", "PYQ"];
const EMPTY_SAVED_IDS = new Set<string>();

type ViewMode = "GRID" | "TABLE";
type SaveState = "enabled" | "login" | "hidden";

interface Props {
    initialCategory?: string;
    initialSubType?: string;
    initialSearch?: string;
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
    initialSearch = "",
    daysToExam = 0,
    saveState = "hidden",
    loginHref = "/auth/login",
    mode = "STUDENT",
    defaultView = "GRID"
}: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [activeSecondary, setActiveSecondary] = useState(initialSubType);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
    const [resources, setResources] = useState<PublicResource[]>([]);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

    const handleSecondaryChange = (type: string) => {
        setActiveSecondary(type);
        if (type === "PYQ") setViewMode("TABLE");
    };

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
        void fetchResources();
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
            case 'VIDEO': return { icon: <Video size={24} weight="bold" className="text-blue-600" />, bg: "bg-blue-50" };
            case 'PYQ': return { icon: <FilePdf size={24} weight="bold" className="text-rose-600" />, bg: "bg-rose-50" };
            case 'MTP':
            case 'RTP': return { icon: <FileText size={24} weight="bold" className="text-amber-600" />, bg: "bg-amber-50" };
            default: return { icon: <FilePdf size={24} weight="bold" className="text-emerald-600" />, bg: "bg-emerald-50" };
        }
    };

    return (
        <div className="w-full space-y-8 pb-20">
            
            {/* Slim Header - High Clarity */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-8">
                <div className="space-y-1">
                    <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                        {mode === "TEACHER" ? "Resource Inventory" : "Study Library"}
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Over {resources.length} verified CA practice assets.</p>
                </div>
                {daysToExam > 0 && (
                     <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-[11px] uppercase tracking-wider border border-blue-100 shadow-sm">
                        <Calendar size={16} weight="bold" />
                        Next Attempt: {daysToExam} Days Remaining
                    </div>
                )}
            </div>

            {/* Compact Toolbar & Filters - Brand Aligned */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-6 glass-surface p-3 rounded-2xl border-slate-200 shadow-sm">
                <div className="relative flex-grow">
                    <MagnifyingGlass size={18} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search for subjects, topics, or papers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-0 outline-none transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex p-0.5 bg-slate-200/50 rounded-lg">
                        <button onClick={() => setViewMode("GRID")} className={cn("p-1.5 rounded-md transition-all", viewMode === "GRID" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}><SquaresFour size={18} weight="bold" /></button>
                        <button onClick={() => setViewMode("TABLE")} className={cn("p-1.5 rounded-md transition-all", viewMode === "TABLE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}><List size={18} weight="bold" /></button>
                    </div>
                    
                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide no-scrollbar">
                        {dynamicCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-extrabold transition-all border whitespace-nowrap uppercase tracking-widest",
                                    activeCategory === cat 
                                        ? "bg-slate-950 text-white border-slate-950 shadow-md translate-y-[-1px]" 
                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide no-scrollbar">
                        {CONTENT_TYPES.map((type) => (
                            <button
                                key={type}
                                onClick={() => handleSecondaryChange(type)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-extrabold transition-all border whitespace-nowrap uppercase tracking-widest",
                                    activeSecondary === type 
                                        ? "bg-blue-600 text-white border-blue-600 shadow-md translate-y-[-1px]" 
                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="py-24 text-center">
                        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-slate-900 border-t-transparent rounded-full"></div>
                        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Updating Library Registry...</p>
                    </div>
                ) : resources.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300">
                            <FilePdf size={40} weight="thin" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">No resources found</h3>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">
                                Our high-integrity database hasn't archived any matches for this filter yet. Try a different category.
                            </p>
                        </div>
                        <button 
                            onClick={() => { setActiveCategory("All"); setActiveSecondary("All"); }}
                            className="px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-blue-600 transition-all"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : viewMode === "GRID" ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {resources.map((res) => {
                            const { icon, bg } = getIcon(res.subType);
                            const isSaved = canSave && visibleSavedIds.has(res.id);
                            return (
                                <div key={res.id} className="premium-card group flex flex-col h-full border-slate-200">
                                    <div className="p-4 flex-grow space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", bg)}>
                                                {icon}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {saveState !== "hidden" && (
                                                    <button
                                                        onClick={(e) => handleToggleSave(res.id, e)}
                                                        className={cn(
                                                            "size-8 rounded-lg flex items-center justify-center transition-all",
                                                            isSaved ? "bg-blue-50 text-blue-600" : "text-slate-300 hover:text-blue-600 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <BookmarkSimple size={18} weight={isSaved ? "fill" : "bold"} />
                                                    </button>
                                                )}
                                                {mode === "TEACHER" && (
                                                    <button onClick={() => handleDelete(res.id)} className="size-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50"><Trash size={18} weight="bold" /></button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-[0.15em]">{res.category}</span>
                                            <h3 className="text-sm font-bold text-slate-950 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem]">
                                                {res.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="p-4 pt-0 flex flex-col gap-3">
                                        <div className="flex items-center justify-between py-2 border-y border-slate-100">
                                            <div className="flex items-center gap-1">
                                                <Eye size={12} weight="bold" className="text-slate-400" />
                                                <span className="text-[10px] font-extrabold text-slate-900">{res.downloads.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Star size={12} weight="fill" className="text-amber-500" />
                                                <span className="text-[10px] font-extrabold text-slate-900">{(res.rating || 4.5).toFixed(1)}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDownload(res.id, res.fileUrl)}
                                            className="group/btn flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-slate-900 text-white text-xs font-bold transition-all hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/10 active:scale-95"
                                        >
                                            Access Material
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-5 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Material & Subject</th>
                                    <th className="px-6 py-5 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Syllabus Level</th>
                                    <th className="px-6 py-5 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest text-center">Format</th>
                                    <th className="px-6 py-5 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest text-center">Engagement</th>
                                    <th className="px-6 py-5 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {resources.map((res) => {
                                    const { icon } = getIcon(res.subType);
                                    return (
                                        <tr key={res.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 transition-transform group-hover:scale-110">
                                                        {icon}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-950 group-hover:text-blue-600 transition-colors leading-tight">{res.title}</div>
                                                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">Ref: {res.id.slice(0, 8)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">
                                                    {res.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-tighter">
                                                    {res.subType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-extrabold text-slate-900">{res.downloads.toLocaleString()}</span>
                                                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest leading-none mt-1">Access</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleDownload(res.id, res.fileUrl)} 
                                                        className="size-9 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-600 hover:shadow-md transition-all"
                                                    >
                                                        <Eye size={18} weight="bold" />
                                                    </button>
                                                    {mode === "TEACHER" && (
                                                        <button onClick={() => handleDelete(res.id)} className="size-9 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-300 hover:text-rose-600 hover:border-rose-600 hover:shadow-md transition-all"><Trash size={18} weight="bold" /></button>
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
