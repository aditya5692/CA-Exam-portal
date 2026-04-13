"use client";

import { cn } from "@/lib/utils";
import {
    BookmarkSimple,
    BookOpen,
    CaretDown,
    DownloadSimple,
    FilePdf,
    FileText,
    Funnel,
    PenNib
} from "@phosphor-icons/react";
import { useState } from "react";

export function StudyMaterialDashboard() {
    const [activeLevel, setActiveLevel] = useState("CA Final");

    return (
        <section className="py-12 px-6 sm:px-12 bg-slate-50 border-t border-b border-gray-100  ">
            <div className="max-w-7xl mx-auto">
                {/* Top Tabs */}
                <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-hide">
                    {["CA Final", "CA IPC / Inter", "CA Foundation"].map((level) => (
                        <button
                            key={level}
                            onClick={() => setActiveLevel(level)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                                activeLevel === level
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "bg-white text-slate-500 hover:text-slate-900 border border-slate-200"
                            )}
                        >
                            {level}
                        </button>
                    ))}
                </div>

                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Study Materials</h2>
                        <p className="text-slate-400 text-xs font-medium">Over 5,000+ curated items for {activeLevel}</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all w-fit">
                        <BookmarkSimple size={14} weight="bold" /> Saved Items
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="bg-white border border-slate-200 p-2 rounded-lg flex flex-wrap items-center gap-2 mb-8 shadow-sm">
                    <div className="flex items-center gap-1.5 px-2 text-slate-400 text-[10px] font-bold border-r border-slate-100 pr-3">
                        <Funnel size={14} weight="bold" /> FILTERS
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100">
                        LEVEL: {activeLevel.replace("CA ", "")} <CaretDown size={10} weight="bold" />
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-100">
                        SUBJECT: ALL <CaretDown size={10} weight="bold" />
                    </button>
                    <button className="text-[10px] font-bold text-slate-400 px-2 hover:text-slate-900 ml-auto">
                        Clear
                    </button>
                </div>

                {/* Study Material Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[
                        {
                            title: "Consolidated Financial Statements",
                            tag: "VERIFIED", tagColor: "bg-emerald-50 text-emerald-600",
                            icon: <FilePdf size={18} weight="fill" className="text-blue-500" />, iconBg: "bg-blue-50",
                            date: "Updated 2d ago"
                        },
                        {
                            title: "Direct Tax: Transfer Pricing",
                            tag: "MUST READ", tagColor: "bg-amber-50 text-amber-600",
                            icon: <FileText size={18} weight="fill" className="text-blue-500" />, iconBg: "bg-blue-50",
                            date: "Oct 2023"
                        },
                        {
                            title: "GST: Input Tax Credit",
                            tag: "INTER", tagColor: "bg-slate-100 text-slate-600",
                            icon: <BookOpen size={18} weight="fill" className="text-blue-500" />, iconBg: "bg-blue-50",
                            date: "Recently"
                        },
                        {
                            title: "Corporate Laws Amendment",
                            tag: "PREMIUM", tagColor: "bg-blue-50 text-blue-600",
                            icon: <PenNib size={18} weight="fill" className="text-blue-500" />, iconBg: "bg-blue-50",
                            date: "New"
                        }
                    ].map((item, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-400 transition-all group flex flex-col h-full">
                            <div className="flex items-start justify-between mb-3">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.iconBg)}>
                                    {item.icon}
                                </div>
                                <span className={cn("text-[7px] font-bold tracking-widest px-1.5 py-0.5 rounded-sm border", item.tagColor)}>
                                    {item.tag}
                                </span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-xs leading-snug mb-3 group-hover:text-blue-600 transition-colors flex-grow">
                                {item.title}
                            </h4>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                <span className="text-[9px] text-slate-400 font-medium">
                                    {item.date}
                                </span>
                                <button className="text-[10px] font-bold text-slate-900 flex items-center gap-1 hover:text-blue-600">
                                    GET PDF <DownloadSimple size={12} weight="bold" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
