import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    BookmarkSimple,
    Funnel,
    CaretDown,
    FilePdf,
    DownloadSimple
} from "@phosphor-icons/react";
import { getPublicResources, incrementDownloadCount } from "@/actions/resource-actions";

export function PastYearQuestionsDashboard() {
    const [activeLevel, setActiveLevel] = useState("CA Final");
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPYQs = async () => {
            setLoading(true);
            const data = await getPublicResources({
                category: activeLevel,
                subType: "PYQ"
            });
            setResources(data);
            setLoading(false);
        };
        fetchPYQs();
    }, [activeLevel]);

    const handleDownload = async (id: string, url: string) => {
        await incrementDownloadCount(id);
        window.open(url, '_blank');
    };

    return (
        <section className="py-24 px-6 sm:px-12 bg-slate-50 border-t border-b border-gray-100">
            <div className="max-w-7xl mx-auto">
                {/* Top Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {["CA Final", "CA Inter", "CA Foundation"].map((level) => (
                        <button
                            key={level}
                            onClick={() => setActiveLevel(level)}
                            className={cn(
                                "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                                activeLevel === level
                                    ? "bg-white text-indigo-600 shadow-sm border border-indigo-100"
                                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
                            )}
                        >
                            {level}
                        </button>
                    ))}
                </div>

                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 font-outfit mb-2">Past Year Questions</h2>
                        <p className="text-gray-500 text-sm font-medium">Browse officially solved past papers with detailed analysis for {activeLevel}</p>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 w-fit">
                        <BookmarkSimple size={18} weight="bold" /> My Saved items
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="bg-white border border-gray-100 p-3 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 px-3 text-gray-500 text-sm font-bold border-r border-gray-100 pr-4">
                            <Funnel size={16} weight="bold" /> Quick Filters
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors">
                            <span className="opacity-70">Level:</span> {activeLevel.replace("CA ", "")} <CaretDown size={12} weight="bold" />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold border border-gray-100 hover:bg-gray-100 transition-colors">
                            <span className="opacity-70">Subject:</span> All Subjects <CaretDown size={12} weight="bold" />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold border border-gray-100 hover:bg-gray-100 transition-colors">
                            <span className="opacity-70">Term:</span> All Terms <CaretDown size={12} weight="bold" />
                        </button>
                    </div>
                    <button className="text-xs font-bold text-indigo-600 px-4 hover:underline">
                        Clear All
                    </button>
                </div>

                {/* PYQ Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        <div className="col-span-full py-12 text-center text-gray-400">
                            <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
                            <p className="text-sm font-bold">Loading past papers...</p>
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-400">
                            <p className="text-sm font-bold">No past year questions found for this level.</p>
                        </div>
                    ) : (
                        resources.map((item, i) => (
                            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-lg transition-all group flex flex-col h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50")}>
                                        <FilePdf size={24} weight="fill" className="text-rose-500" />
                                    </div>
                                    <span className={cn("text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm bg-gray-100 text-gray-600")}>
                                        {item.category.replace("CA ", "")}
                                    </span>
                                </div>
                                <h4 className="font-bold text-gray-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
                                    {item.title}
                                </h4>
                                <p className="text-xs text-gray-500 leading-relaxed mb-6 flex-grow line-clamp-3">
                                    {item.description || "Comprehensive coverage and analysis of past examination papers."}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                        {item.downloads >= 1000 ? (item.downloads / 1000).toFixed(1) + 'k' : item.downloads} Downloads
                                    </span>
                                    <button
                                        onClick={() => handleDownload(item.id, item.fileUrl)}
                                        className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-700"
                                    >
                                        Download PDF <DownloadSimple size={14} weight="bold" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
