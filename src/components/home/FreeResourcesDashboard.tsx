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
        <div className="w-full space-y-6 pb-12 font-outfit">
            
            {/* Slim Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {mode === "TEACHER" ? "Resource Inventory" : "Study Library"}
                    </h1>
                    <span className="text-slate-400 text-sm font-medium">({resources.length} items)</span>
                </div>
                {daysToExam > 0 && (
                     <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px] uppercase tracking-wider border border-blue-100">
                        <Calendar size={14} weight="bold" />
                        {daysToExam} Days to Attempt
                    </div>
                )}
            </div>

            {/* Compact Toolbar & Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                <div className="relative flex-grow">
                    <MagnifyingGlass size={16} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search materials..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium placeholder:text-slate-300 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex p-0.5 bg-slate-200/50 rounded-lg">
                        <button onClick={() => setViewMode("GRID")} className={cn("p-1.5 rounded-md transition-all", viewMode === "GRID" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}><SquaresFour size={18} weight="bold" /></button>
                        <button onClick={() => setViewMode("TABLE")} className={cn("p-1.5 rounded-md transition-all", viewMode === "TABLE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}><List size={18} weight="bold" /></button>
                    </div>
                    
                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                        {dynamicCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border whitespace-nowrap",
                                    activeCategory === cat ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                        {CONTENT_TYPES.map((type) => (
                            <button
                                key={type}
                                onClick={() => setActiveSecondary(type)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border whitespace-nowrap",
                                    activeSecondary === type ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
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
                    <div className="py-16 text-center bg-slate-50/50 rounded-xl border border-slate-100">
                        <Funnel size={32} weight="bold" className="mx-auto text-slate-300 mb-3" />
                        <h3 className="text-sm font-bold text-slate-900">No matches found</h3>
                        <p className="text-slate-400 text-xs mt-1">Adjust your search or filters.</p>
                        <button
                            onClick={() => { setActiveCategory("All"); setActiveSecondary("All"); }}
                            className="mt-4 px-4 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all"
                        >
                            Reset
                        </button>
                    </div>
                ) : viewMode === "GRID" ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {resources.map((res) => {
                            const { icon, bg } = getIcon(res.subType);
                            const isSaved = canSave && visibleSavedIds.has(res.id);
                            return (
                                <div key={res.id} className="group flex flex-col h-full bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bg)}>
                                            {icon}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {saveState !== "hidden" && (
                                                <button
                                                    onClick={(e) => handleToggleSave(res.id, e)}
                                                    className={cn(
                                                        "p-1.5 rounded-lg transition-all",
                                                        isSaved ? "text-blue-600" : "text-slate-300 hover:text-blue-600"
                                                    )}
                                                >
                                                    <BookmarkSimple size={18} weight={isSaved ? "fill" : "bold"} />
                                                </button>
                                            )}
                                            {mode === "TEACHER" && (
                                                <button onClick={() => handleDelete(res.id)} className="p-1.5 text-slate-300 hover:text-rose-600"><Trash size={18} weight="bold" /></button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">{res.category}</span>
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                                            {res.title}
                                        </h3>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-900 leading-none">{res.downloads}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Saves</span>
                                            </div>
                                            <div className="h-4 w-px bg-slate-100" />
                                            <div className="flex items-center gap-1">
                                                <Star size={10} weight="fill" className="text-amber-500" />
                                                <span className="text-xs font-bold text-slate-900">{(res.rating || 4.5).toFixed(1)}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDownload(res.id, res.fileUrl)}
                                            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-blue-600 transition-all flex items-center gap-1.5"
                                        >
                                            ACCESS <Eye size={14} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Material</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Syllabus</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Format</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Saves</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {resources.map((res) => {
                                    const { icon } = getIcon(res.subType);
                                    return (
                                        <tr key={res.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center text-blue-600">
                                                        {icon}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{res.title}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                                {res.category}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="text-slate-400 text-[9px] font-black uppercase">
                                                    {res.subType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-center text-xs font-bold text-slate-700">
                                                {res.downloads.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button onClick={() => handleDownload(res.id, res.fileUrl)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-all"><Eye size={16} weight="bold" /></button>
                                                    {mode === "TEACHER" && (
                                                        <button onClick={() => handleDelete(res.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash size={16} weight="bold" /></button>
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
