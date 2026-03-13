import { useState, useEffect } from "react";
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
    ShareNetwork,
    Fire,
    CheckCircle
} from "@phosphor-icons/react";
import { getPublicResources, incrementDownloadCount } from "@/actions/resource-actions";

const CATEGORIES = ["All", "CA Final", "CA Inter", "CA Foundation", "Case Studies", "Amendments"];
const CONTENT_TYPES = ["All", "PDF", "VIDEO", "RTP", "MTP", "PYQ"];

export function FreeResourcesDashboard() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [activeSecondary, setActiveSecondary] = useState("All");
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResources = async () => {
            setLoading(true);
            const data = await getPublicResources({
                category: activeCategory,
                subType: activeSecondary
            });
            setResources(data);
            setLoading(false);
        };
        fetchResources();
    }, [activeCategory, activeSecondary]);

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
        <div className="w-full space-y-8 pb-12">
            {/* Clean Professional Header */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-2">
                        <CheckCircle size={14} weight="bold" className="text-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Free Open Access Library</span>
                    </div>
                    <h1 className="text-3xl font-bold font-outfit text-gray-900 leading-tight">
                        Explore curated study materials from top educators.
                    </h1>
                    <p className="text-gray-500 font-medium max-w-xl">
                        Browse our extensive collection of verified study notes, tracking charts, and masterclasses—all available for free download.
                    </p>
                </div>

                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MagnifyingGlass size={20} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search resources..."
                        className="block w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-inner"
                    />
                </div>
            </div>

            {/* Smart Filters Area */}
            <div className="space-y-4 px-2">
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 pr-4 border-r border-gray-200 whitespace-nowrap">
                        <Funnel size={16} /> Filter Path
                    </span>
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                                activeCategory === cat
                                    ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20"
                                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-2">Resource Type:</span>
                    {["All", ...CONTENT_TYPES].map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveSecondary(type)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border",
                                activeSecondary === type
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                    : "bg-transparent border-transparent text-gray-500 hover:bg-gray-100"
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Resource Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
                        <p className="text-gray-500 font-medium">Fetching dynamic resources...</p>
                    </div>
                ) : resources.map((res) => {
                    const { icon, bg } = getIcon(res.subType);
                    return (
                        <div key={res.id} className="group relative bg-white rounded-3xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col h-full overflow-hidden">
                            <div className="flex flex-col h-full relative z-10">
                                <div className="flex items-start justify-between mb-6">
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110", bg, "border-black/5")}>
                                        {icon}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {res.isTrending && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                                <Fire size={12} weight="fill" /> Trending
                                            </div>
                                        )}
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            {res.category}
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-black font-outfit text-gray-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                    {res.title}
                                </h3>

                                {/* Author Credibility Pill - Now Clickable */}
                                <Link href={`/educator/${res.authorId}`} className="flex items-center gap-2 mb-6 mt-1 group-hover:bg-gray-50 p-2 -ml-2 rounded-xl transition-colors border border-transparent hover:border-gray-200">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-800 to-gray-600 flex items-center justify-center text-white text-xs font-bold shadow-inner uppercase">
                                        {res.author.charAt(0)}
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">{res.author}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-0.5 mt-1">
                                            <CheckCircle size={12} weight="fill" /> {res.specialty}
                                        </span>
                                    </div>
                                </Link>

                                <div className="mt-auto pt-5 border-t border-gray-100/80 flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-gray-400">
                                        <div className="flex items-center gap-1.5" title="Downloads">
                                            <DownloadSimple size={14} weight="bold" />
                                            <span className="text-[10px] font-bold">{res.downloads >= 1000 ? (res.downloads / 1000).toFixed(1) + 'k' : res.downloads}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5" title="Rating">
                                            <Star size={14} weight="fill" className="text-amber-400" />
                                            <span className="text-[10px] font-bold text-gray-600">{res.rating.toFixed(1)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 transition-colors">
                                            <ShareNetwork size={14} weight="bold" />
                                        </button>
                                        <button
                                            onClick={() => handleDownload(res.id, res.fileUrl)}
                                            className="px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-gray-900/20 active:scale-95 flex items-center gap-2"
                                        >
                                            Access <Eye size={14} weight="bold" />
                                        </button>
                                    </div>
                                </div>
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
