"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    BookmarkSimple,
    Funnel,
    CaretDown,
    FilePdf,
    FileText,
    BookOpen,
    PenNib,
    DownloadSimple
} from "@phosphor-icons/react";

export function StudyMaterialDashboard() {
    const [activeLevel, setActiveLevel] = useState("CA Final");

    return (
        <section className="py-24 px-6 sm:px-12 bg-slate-50 border-t border-b border-gray-100">
            <div className="max-w-7xl mx-auto">
                {/* Top Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {["CA Final", "CA IPC / Inter", "CA Foundation"].map((level) => (
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
                        <h2 className="text-3xl font-bold text-gray-900 font-outfit mb-2">Study Material</h2>
                        <p className="text-gray-500 text-sm font-medium">Explore 5,000+ curated study materials specifically for {activeLevel} students</p>
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
                            <span className="opacity-70">Type:</span> All Types <CaretDown size={12} weight="bold" />
                        </button>
                    </div>
                    <button className="text-xs font-bold text-indigo-600 px-4 hover:underline">
                        Clear All
                    </button>
                </div>

                {/* Study Material Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[
                        {
                            title: "Consolidated Financial Statements",
                            desc: "Complete summary of AS-21, AS-23, and AS-27 with practical examples and edge cases.",
                            tag: "VERIFIED", tagColor: "bg-emerald-50 text-emerald-600",
                            icon: <FilePdf size={24} weight="fill" className="text-blue-500" />, iconBg: "bg-blue-50",
                            date: "Updated 2 days ago"
                        },
                        {
                            title: "Direct Tax: Transfer Pricing",
                            desc: "Simplified flowcharts for determination of ALP and safe harbor rules for CA Final.",
                            tag: "MUST READ", tagColor: "bg-amber-50 text-amber-600",
                            icon: <FileText size={24} weight="fill" className="text-indigo-500" />, iconBg: "bg-indigo-50",
                            date: "Oct 2023"
                        },
                        {
                            title: "GST: Input Tax Credit",
                            desc: "Section-wise analysis of eligibility, conditions and blocked credits under CGST Act.",
                            tag: "LEVEL: INTER", tagColor: "bg-gray-100 text-gray-600",
                            icon: <BookOpen size={24} weight="fill" className="text-indigo-500" />, iconBg: "bg-indigo-50",
                            date: "Updated Recently"
                        },
                        {
                            title: "Corporate Laws Amendment",
                            desc: "Detailed mapping of all recent amendments for the upcoming May 2024 exams.",
                            tag: "PREMIUM", tagColor: "bg-indigo-50 text-indigo-600",
                            icon: <PenNib size={24} weight="fill" className="text-indigo-500" />, iconBg: "bg-indigo-50",
                            date: "New Addition"
                        }
                    ].map((item, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-lg transition-all group flex flex-col h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.iconBg)}>
                                    {item.icon}
                                </div>
                                <span className={cn("text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm", item.tagColor)}>
                                    {item.tag}
                                </span>
                            </div>
                            <h4 className="font-bold text-gray-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
                                {item.title}
                            </h4>
                            <p className="text-xs text-gray-500 leading-relaxed mb-6 flex-grow">
                                {item.desc}
                            </p>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                    {item.date}
                                </span>
                                <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-700">
                                    Download PDF <DownloadSimple size={14} weight="bold" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
