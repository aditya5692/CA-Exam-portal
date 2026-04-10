"use client";

import { getStudentFeed, joinBatch } from "@/actions/batch-actions";
import { getStudentProfile } from "@/actions/profile-actions";
import { StudentPageHeader } from "@/components/student/shared/page-header";
import { resolveStudentExamTarget } from "@/lib/student-level";
import { cn } from "@/lib/utils";
import { 
    Plus, 
    ShieldCheck, 
    X, 
    Funnel, 
    CheckSquareOffset, 
    Bookmark, 
    DownloadSimple, 
    CaretDown,
    BookOpen,
    Article,
    Trophy,
    TrendUp,
    Bell,
    CalendarCheck,
    ArrowRight
} from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type UpdateCategory = "STUDY MATERIAL" | "STATUTORY UPDATE" | "MOCK ASSESSMENT" | "ANNOUNCEMENT" | "PRACTICE Q&A" | "REGULATORY NEWS";

type FeedItem = {
    id: string;
    category: UpdateCategory;
    title: string;
    description: string;
    createdAt: string | Date;
    scheduledFor?: string;
    isUnread?: boolean;
    subject: string;
    batchName: string;
    teacherName: string;
    link?: string;
};

export default function StudentUpdatesPage() {
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [isAdminView, setIsAdminView] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All Updates");
    const [visibleCount, setVisibleCount] = useState(6);
    const [daysToExam, setDaysToExam] = useState(0);
    const router = useRouter();

    const loadFeed = useCallback(async () => {
        const res = await getStudentFeed();
        if (!res.success) return;

        const profileRes = await getStudentProfile();
        if (profileRes.success && profileRes.data) {
            setDaysToExam(resolveStudentExamTarget(profileRes.data).daysToExam);
        }

        const inferSubject = (batchName: string) => {
            const lower = batchName.toLowerCase();
            if (lower.includes("fr") || lower.includes("financial")) return "Financial Reporting";
            if (lower.includes("tax") || lower.includes("idt") || lower.includes("gst")) return "Indirect Tax";
            if (lower.includes("law")) return "Corporate Laws";
            if (lower.includes("audit")) return "Audit & Assurance";
            if (lower.includes("sm") || lower.includes("strategic")) return "Strategic Management";
            return "General Updates";
        };

        const mappedUpdates: FeedItem[] = (res.data?.feedItems || []).map(item => {
            const lines = item.content.split('\n');
            const title = lines[0].length > 60 ? lines[0].substring(0, 57) + "..." : lines[0];
            const description = lines.length > 1 ? lines.slice(1).join('\n') : item.content;

            return {
                id: item.id,
                category: "ANNOUNCEMENT",
                title: title,
                description: description,
                createdAt: item.createdAt,
                isUnread: true,
                subject: inferSubject(item.batchName),
                batchName: item.batchName,
                teacherName: item.teacherName
            };
        });

        setFeedItems(mappedUpdates);
        setIsAdminView(Boolean(res.data?.isAdminView));
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadFeed();
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, [loadFeed]);

    const markAllAsRead = () => {
        setFeedItems(prev => prev.map(item => ({ ...item, isUnread: false })));
    };

    const markSubjectAsRead = (subject: string) => {
        setFeedItems(prev => prev.map(item => item.subject === subject ? { ...item, isUnread: false } : item));
    };

    const formatRelativeDate = (date: string | Date) => {
        const d = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const displayedItems = feedItems.slice(0, visibleCount);
    const groupedUpdates = displayedItems.reduce((acc, item) => {
        if (!acc[item.subject]) acc[item.subject] = [];
        acc[item.subject].push(item);
        return acc;
    }, {} as Record<string, FeedItem[]>);

    const categoryTabs = ["All Updates", ...Array.from(new Set(feedItems.map(item => item.subject)))];
    const hasMore = visibleCount < feedItems.length;

    return (
        <div className="max-w-[1400px] mx-auto pb-20   space-y-12">
            <StudentPageHeader
                className="px-4"
                eyebrow="Academy intelligence"
                title="Academy Updates"
                description="Focused news and regulatory changes for your curriculum."
                daysToExam={daysToExam}
                aside={
                    <div className="flex flex-wrap items-center gap-3">
                        <button className="student-button-secondary flex items-center gap-2 rounded-xl px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm">
                            <Funnel size={18} weight="bold" />
                            Global Filter
                        </button>
                        <button
                            onClick={markAllAsRead}
                            className="student-button-primary flex items-center gap-2 rounded-xl px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[var(--student-accent-soft-strong)]/10"
                        >
                            <CheckSquareOffset size={18} weight="bold" />
                            Mark All Read
                        </button>
                        {!isAdminView && (
                            <button
                                onClick={() => router.push("/student/redeem")}
                                className="student-chip-accent flex items-center gap-2 rounded-xl px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                            >
                                <Plus size={18} weight="bold" />
                                Redeem batch
                            </button>
                        )}
                    </div>
                }
            />

            <nav className="flex items-center gap-3 mb-10 overflow-x-auto px-4 pb-2 no-scrollbar">
                {categoryTabs.map(sub => (
                    <button
                        key={sub}
                        onClick={() => setSelectedCategory(sub)}
                        className={cn(
                            "rounded-xl border px-6 py-2.5 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm",
                            selectedCategory === sub
                                ? "bg-[var(--student-accent-strong)] text-white border-[var(--student-accent-strong)]"
                                : "bg-white border-[var(--student-border)] text-[var(--student-muted)] hover:border-[var(--student-accent-soft-strong)] hover:text-[var(--student-accent-strong)]"
                        )}
                    >
                        {sub}
                    </button>
                ))}
            </nav>

            <div className="space-y-10 px-4">
                {Object.entries(groupedUpdates)
                    .filter(([sub]) => selectedCategory === "All Updates" || selectedCategory === sub)
                    .map(([subject, items]) => {
                        const unreadCount = items.filter(i => i.isUnread).length;
                        const subjectSettings = {
                            "Financial Reporting": { color: "indigo", icon: <TrendUp size={20} weight="bold" /> },
                            "Indirect Tax": { color: "purple", icon: <BookOpen size={20} weight="bold" /> },
                            "Corporate Laws": { color: "blue", icon: <Article size={20} weight="bold" /> },
                            "Audit & Assurance": { color: "emerald", icon: <ShieldCheck size={20} weight="bold" /> },
                            "Strategic Management": { color: "orange", icon: <Trophy size={20} weight="bold" /> }
                        }[subject] || { color: "slate", icon: <Bell size={20} weight="bold" /> };

                        return (
                            <section key={subject} className="student-surface group overflow-hidden rounded-2xl border-[var(--student-border)] shadow-sm transition-all hover:shadow-lg">
                                <div className="p-6 flex items-center justify-between border-b border-[var(--student-border)] transition-colors hover:bg-[var(--student-panel-muted)]">
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-xl",
                                            subjectSettings.color === "indigo" ? "bg-indigo-600 shadow-indigo-100" :
                                                subjectSettings.color === "purple" ? "bg-purple-600 shadow-purple-100" :
                                                    subjectSettings.color === "blue" ? "bg-blue-600 shadow-blue-100" :
                                                        "bg-emerald-600 shadow-emerald-100"
                                        )}>
                                            {subjectSettings.icon}
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">{subject}</h2>
                                                {unreadCount > 0 && (
                                                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--student-accent-soft)] text-[var(--student-accent-strong)] text-[10px] font-black uppercase tracking-widest">
                                                        {unreadCount} New
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-60">System Synchronized Channel</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => markSubjectAsRead(subject)}
                                        className="text-[10px] font-black text-slate-400 hover:text-[var(--student-accent-strong)] uppercase tracking-widest transition-all px-4 py-2 hover:bg-white rounded-lg border border-transparent hover:border-[var(--student-border)]"
                                    >
                                        Mark Index Read
                                    </button>
                                </div>

                                <div className="divide-y divide-[var(--student-border)]">
                                    {items.map(item => (
                                        <div key={item.id} className="p-8 flex gap-8 group/item transition-all hover:bg-[var(--student-panel-muted)]/40 relative">
                                            <div className="pt-3 shrink-0">
                                                <div className={cn(
                                                    "h-2.5 w-2.5 rounded-full",
                                                    item.isUnread ? "bg-[var(--student-accent-strong)] shadow-[0_0_12px_rgba(var(--student-accent-rgb),0.5)]" : "bg-slate-200"
                                                )} />
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-[var(--student-accent-strong)] uppercase tracking-widest">{item.category}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{item.teacherName}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                        {item.scheduledFor ? `Scheduled: ${item.scheduledFor}` : formatRelativeDate(item.createdAt)}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900   leading-tight group-hover/item:text-[var(--student-accent-strong)] transition-colors">
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-4xl">
                                                    {item.description}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-3 pt-1 shrink-0">
                                                <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-[var(--student-border)] text-slate-400 hover:text-[var(--student-accent-strong)] hover:border-[var(--student-accent-soft-strong)] transition-all shadow-sm active:scale-90">
                                                    <Bookmark size={20} weight="bold" />
                                                </button>
                                                <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-[var(--student-border)] text-slate-400 hover:text-[var(--student-accent-strong)] hover:border-[var(--student-accent-soft-strong)] transition-all shadow-sm active:scale-90">
                                                    {item.category === "MOCK ASSESSMENT" ? <CalendarCheck size={20} weight="bold" /> : <DownloadSimple size={20} weight="bold" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
            </div>

            {hasMore && (
                <div className="mt-16 flex justify-center">
                    <button
                        onClick={() => setVisibleCount(p => p + 6)}
                        className="flex items-center gap-3 px-10 py-4 bg-white border border-[var(--student-border)] rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm hover:border-slate-400 hover:text-slate-900 transition-all active:scale-95 group"
                    >
                        Load Older Feed Index
                        <CaretDown size={18} weight="bold" className="transition-transform group-hover:translate-y-1" />
                    </button>
                </div>
            )}
        </div>
    );
}
