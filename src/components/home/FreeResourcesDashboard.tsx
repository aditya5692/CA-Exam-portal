"use client";

import { getPublicResources, incrementDownloadCount } from "@/actions/resource-actions";
import { getSavedItems, toggleSavedItem } from "@/actions/student-actions";
import { deletePYQ } from "@/actions/educator-actions";
import { cn } from "@/lib/utils";
import type { PublicResource } from "@/types/resource";
import {
    ArrowUpRight,
    BookmarkSimple,
    Calendar,
    Eye,
    FilePdf,
    FileText,
    List,
    MagnifyingGlass,
    SquaresFour,
    Star,
    Trash,
    Upload,
    Video,
    X,
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
    initialSearch?: string;
    daysToExam?: number;
    saveState?: SaveState;
    loginHref?: string;
    showFeaturePrompt?: boolean;
    mode?: "STUDENT" | "TEACHER";
    defaultView?: ViewMode;
    currentUserId?: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; bg: string; accent: string }> = {
    VIDEO: { icon: <Video size={18} weight="fill" />, bg: "bg-blue-50", accent: "text-blue-600" },
    PYQ: { icon: <FilePdf size={18} weight="fill" />, bg: "bg-rose-50", accent: "text-rose-600" },
    MTP: { icon: <FileText size={18} weight="fill" />, bg: "bg-amber-50", accent: "text-amber-600" },
    RTP: { icon: <FileText size={18} weight="fill" />, bg: "bg-amber-50", accent: "text-amber-600" },
    DEFAULT: { icon: <FilePdf size={18} weight="fill" />, bg: "bg-emerald-50", accent: "text-emerald-600" },
};

function getTypeConfig(subType: string) {
    return TYPE_CONFIG[subType] ?? TYPE_CONFIG.DEFAULT;
}

export function FreeResourcesDashboard({
    initialCategory = "All",
    initialSubType = "All",
    initialSearch = "",
    daysToExam = 0,
    saveState = "hidden",
    loginHref = "/auth/login",
    mode = "STUDENT",
    defaultView = "GRID",
    currentUserId,
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

    const canSave = saveState === "enabled";
    const visibleSaved = canSave ? savedIds : EMPTY_SAVED_IDS;
    const isTeacher = mode === "TEACHER";

    const dynamicCategories = ["All", initialCategory !== "All" ? initialCategory : "CA Final", "Case Studies"]
        .filter((x, i, a) => a.indexOf(x) === i);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const fetchResources = useCallback(async () => {
        setLoading(true);
        const res = await getPublicResources({ category: activeCategory, subType: activeSecondary, search: debouncedSearch });
        if (res.success) setResources(res.data || []);
        setLoading(false);
    }, [activeCategory, activeSecondary, debouncedSearch]);

    useEffect(() => { void fetchResources(); }, [fetchResources]);

    useEffect(() => {
        if (!canSave) return;
        const load = async () => {
            const res = await getSavedItems();
            if (res.success && res.data) {
                setSavedIds(new Set([
                    ...(res.data.materials || []).map(m => m.id),
                    ...(res.data.exams || []).map(e => e.id),
                ]));
            }
        };
        void load();
    }, [canSave]);

    const handleSecondaryChange = (type: string) => {
        setActiveSecondary(type);
    };

    const handleToggleSave = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (saveState === "login") { router.push(`${loginHref}?next=${encodeURIComponent(pathname)}`); return; }
        if (!canSave) return;
        const res = await toggleSavedItem(id, "MATERIAL");
        if (res.success && res.data) {
            setSavedIds(prev => { const n = new Set(prev); res.data!.saved ? n.add(id) : n.delete(id); return n; });
        }
    };

    const handleDownload = async (id: string, url: string) => {
        await incrementDownloadCount(id);
        window.open(url, "_blank");
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this material permanently?")) {
            const res = await deletePYQ(id);
            if (res.success) void fetchResources();
        }
    };

    const resetFilters = () => { setActiveCategory("All"); setActiveSecondary("All"); setSearchQuery(""); };

    /* ─────────────────────────────────────────────────────────────────────── */

    return (
        <div className="w-full space-y-6 pb-16  ">

            {/* ══ INPUT zone: header + search + filters ══════════════════════ */}
            <div className="">

                {/* Top bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            {isTeacher ? "Inventory Management" : "Study Library"}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                            {isTeacher ? "Study Materials" : "Study Library"}
                        </h2>
                        <p className="text-sm text-slate-400 font-medium">
                            {loading ? "Loading…" : `${resources.length} verified CA study materials`}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {daysToExam > 0 && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-100 shadow-sm">
                                <Calendar size={14} weight="bold" />
                                {daysToExam} days to exam
                            </div>
                        )}
                        {isTeacher && (
                            <Link
                                href="/teacher/free-resources/materials"
                                className="h-10 px-4 rounded-lg bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2"
                            >
                                <Upload size={14} weight="bold" /> Upload Material
                            </Link>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="py-4 border-b border-slate-100">
                    <div className="relative group max-w-xl">
                        <MagnifyingGlass size={16} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search subjects, topics, or papers…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                                <X size={14} weight="bold" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter pills */}
                <div className="py-3 flex items-center gap-3 flex-wrap">
                    {/* Category */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Level</span>
                        {dynamicCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap",
                                    activeCategory === cat
                                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="h-5 w-px bg-slate-200 hidden sm:block" />

                    {/* Content type */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Type</span>
                        {CONTENT_TYPES.map(type => (
                            <button
                                key={type}
                                onClick={() => handleSecondaryChange(type)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap",
                                    activeSecondary === type
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {(activeCategory !== "All" || activeSecondary !== "All" || searchQuery) && (
                        <button
                            onClick={resetFilters}
                            className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 font-semibold transition-colors"
                        >
                            <X size={12} weight="bold" /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* ══ PROCESS + OUTPUT zone ══════════════════════════════════════ */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="py-24 text-center space-y-4">
                        <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Fetching resources…</p>
                    </div>

                ) : resources.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
                        <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
                            <FilePdf size={36} weight="duotone" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">No resources found</h3>
                            <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto font-medium">
                                No matches for the current filters. Try resetting.
                            </p>
                        </div>
                        <button
                            onClick={resetFilters}
                            className="px-6 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-indigo-600 transition-all shadow-sm"
                        >
                            Reset Filters
                        </button>
                    </div>

                ) : (
                    /* ── List / Table view ─────────────────────────────────── */
                    <div className="overflow-hidden mt-4">

                        {/* List header */}
                        <div className="grid grid-cols-[1fr_120px_80px_80px_100px] items-center px-5 py-3 bg-slate-50 border border-slate-100 rounded-lg-t-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-0">
                            <span>Material</span>
                            <span>Level</span>
                            <span className="text-center">Format</span>
                            <span className="text-center">Views</span>
                            <span className="text-right">Action</span>
                        </div>

                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg-b-2xl overflow-hidden bg-white">
                            {resources.map(res => {
                                const cfg = getTypeConfig(res.subType);
                                const isSaved = canSave && visibleSaved.has(res.id);
                                const canDelete = isTeacher && (!res.authorId || res.authorId === currentUserId);

                                return (
                                    <div
                                        key={res.id}
                                        className="grid grid-cols-[1fr_120px_80px_80px_100px] items-center px-5 py-3.5 group hover:bg-slate-50 transition-colors duration-200"
                                    >
                                        {/* Title */}
                                        <div className="flex items-center gap-3 min-w-0 pr-4">
                                            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-slate-100", cfg.bg, cfg.accent)}>
                                                {cfg.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors truncate leading-tight">
                                                    {res.title}
                                                </p>
                                                <p className={cn("text-[10px] font-bold mt-0.5", cfg.accent)}>{res.subType}</p>
                                            </div>
                                        </div>

                                        {/* Level */}
                                        <div>
                                            <span className="inline-flex px-2 py-1 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 truncate max-w-[110px]">
                                                {res.category}
                                            </span>
                                        </div>

                                        {/* Format */}
                                        <div className="text-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{res.subType}</span>
                                        </div>

                                        {/* Views */}
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1 text-slate-900">
                                                <span className="text-sm font-black leading-none">{res.downloads.toLocaleString()}</span>
                                                <ArrowUpRight size={12} className="text-emerald-500" weight="bold" />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-end gap-1.5">
                                            {saveState !== "hidden" && (
                                                <button
                                                    onClick={e => handleToggleSave(res.id, e)}
                                                    className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all border", isSaved ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-white text-slate-300 border-slate-200 hover:text-indigo-500")}
                                                >
                                                    <BookmarkSimple size={14} weight={isSaved ? "fill" : "bold"} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDownload(res.id, res.fileUrl)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all"
                                                title="View"
                                            >
                                                <Eye size={14} weight="bold" />
                                            </button>
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(res.id)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-300 hover:text-rose-500 hover:border-rose-200 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash size={14} weight="bold" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
