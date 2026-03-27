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
        <div className="w-full space-y-10 pb-12">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-200 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Library Workspace</span>
                    </div>
                    <h1 className="font-outfit text-4xl font-bold text-slate-900 tracking-tight">
                        {mode === "TEACHER" ? "Library Management" : "Study Materials"}
                    </h1>
                    <p className="text-slate-500 font-medium text-base max-w-2xl leading-relaxed">
                        Access exam-calibrated resources, previous year papers, and revision packs tailored for the latest syllabus.
                    </p>
                </div>
                {daysToExam > 0 && (
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest shadow-lg">
                        <Calendar size={18} weight="bold" className="text-emerald-400" />
                        Attempt: {daysToExam} Days Left
                    </div>
                )}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="relative w-full md:w-[450px]">
                    <MagnifyingGlass size={20} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="SEARCH MATERIALS..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-sm font-bold placeholder:text-slate-300 focus:border-slate-900 outline-none transition-all uppercase tracking-widest"
                    />
                </div>

                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                    <button 
                        onClick={() => setViewMode("GRID")}
                        className={cn("p-2.5 rounded-lg transition-all", viewMode === "GRID" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                    >
                        <SquaresFour size={22} weight="bold" />
                    </button>
                    <button 
                        onClick={() => setViewMode("TABLE")}
                        className={cn("p-2.5 rounded-lg transition-all", viewMode === "TABLE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                    >
                        <List size={22} weight="bold" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Syllabus:</span>
                    {dynamicCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-5 py-2 rounded-lg text-xs font-bold transition-all border",
                                activeCategory === cat
                                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-900 hover:text-slate-900"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Type:</span>
                    {CONTENT_TYPES.map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveSecondary(type)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                activeSecondary === type
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                    : "bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-700"
                            )}
                        >
                            {type}
                        </button>
                    ))}
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
                    <div className="py-24 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <Funnel size={48} weight="bold" className="mx-auto text-slate-100 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 font-outfit">No Resources Detected</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Refine your filters or search query.</p>
                        <button
                            onClick={() => { setActiveCategory("All"); setActiveSecondary("All"); }}
                            className="mt-6 px-6 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg"
                        >
                            Reset Workspace
                        </button>
                    </div>
                ) : viewMode === "GRID" ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {resources.map((res) => {
                            const { icon, bg } = getIcon(res.subType);
                            const isSaved = canSave && visibleSavedIds.has(res.id);
                            return (
                                <div key={res.id} className="group relative flex flex-col h-full bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110", bg)}>
                                            {icon}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {saveState !== "hidden" && (
                                                <button
                                                    onClick={(e) => handleToggleSave(res.id, e)}
                                                    className={cn(
                                                        "w-10 h-10 rounded-xl transition-all border flex items-center justify-center",
                                                        isSaved
                                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                                                            : "bg-white border-slate-100 text-slate-300 hover:text-indigo-600 hover:border-slate-900"
                                                    )}
                                                >
                                                    <BookmarkSimple size={20} weight={isSaved ? "fill" : "bold"} />
                                                </button>
                                            )}
                                            {mode === "TEACHER" && (
                                                 <button
                                                    onClick={() => handleDelete(res.id)}
                                                    className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-rose-600 hover:border-rose-900 transition-all flex items-center justify-center"
                                                >
                                                    <Trash size={20} weight="bold" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-grow">
                                        <div className="mb-2">
                                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{res.category}</span>
                                        </div>
                                        <h3 className="text-lg font-bold font-outfit text-slate-900 leading-tight mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                            {res.title}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                                                {(res.author || "A").charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-slate-700 leading-none">{res.author || "Global Faculty"}</span>
                                                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">Verified Resource</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">{res.downloads}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Saves</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                                                    {(res.rating || 4.5).toFixed(1)} <Star size={12} weight="fill" className="text-amber-500" />
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Rating</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDownload(res.id, res.fileUrl)}
                                            className="h-10 px-6 bg-slate-900 text-white rounded-lg text-xs font-bold transition-all hover:bg-indigo-600 active:scale-95 flex items-center gap-2"
                                        >
                                            Access <Eye size={18} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Material</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Syllabus</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Format</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Saves</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {resources.map((res) => {
                                    const { icon } = getIcon(res.subType);
                                    return (
                                        <tr key={res.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-200">
                                                        {icon}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{res.title}</div>
                                                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">{res.author || "Global Faculty"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                {res.category}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                                                    {res.subType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm font-bold text-slate-900">
                                                {res.downloads.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleDownload(res.id, res.fileUrl)}
                                                        className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all"
                                                        title="View"
                                                    >
                                                        <Eye size={18} weight="bold" />
                                                    </button>
                                                    {mode === "TEACHER" && (
                                                        <button 
                                                            onClick={() => handleDelete(res.id)}
                                                            className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-900 transition-all"
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
