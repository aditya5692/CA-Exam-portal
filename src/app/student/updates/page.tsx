"use client";

import { getStudentFeed,joinBatch } from "@/actions/batch-actions";
import { getStudentProfile } from "@/actions/profile-actions";
import { StudentPageHeader } from "@/components/student/shared/page-header";
import { resolveStudentExamTarget } from "@/lib/student-level";
import { cn } from "@/lib/utils";
import { Plus,ShieldCheck,X } from "@phosphor-icons/react";
import { useCallback,useEffect,useRef,useState } from "react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Page Component ─────────────────────────────────────────────────────────────

export default function StudentUpdatesPage() {
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [isAdminView, setIsAdminView] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState("All Updates");
    const [visibleCount, setVisibleCount] = useState(6);
    const [daysToExam, setDaysToExam] = useState(0);
    const router = useRouter();

    // Join Batch State
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState("");
    const [joinSuccess, setJoinSuccess] = useState("");
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadFeed = useCallback(async () => {
        const res = await getStudentFeed();
        if (!res.success) return;

        // Fetch profile for daysToExam and batch status
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

    const handleJoin = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsJoining(true);
        setJoinError("");
        setJoinSuccess("");
        const formData = new FormData();
        formData.append("code", joinCode);
        const res = await joinBatch(formData);
        setIsJoining(false);
        if (res.success) {
            setJoinSuccess(`Successfully joined "${res.data.batchName}".`);
            setJoinCode("");
            loadFeed();
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            closeTimerRef.current = setTimeout(() => {
                setShowJoinModal(false);
                setJoinSuccess("");
            }, 2000);
        } else {
            setJoinError(res.message || "Something went wrong.");
        }
    };

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

    // Grouping logic with pagination
    const displayedItems = feedItems.slice(0, visibleCount);
    const groupedUpdates = displayedItems.reduce((acc, item) => {
        if (!acc[item.subject]) acc[item.subject] = [];
        acc[item.subject].push(item);
        return acc;
    }, {} as Record<string, FeedItem[]>);

    const dynamicFilterOptions = ["All Updates", ...Array.from(new Set(feedItems.map(item => item.subject)))];

    const hasMore = visibleCount < feedItems.length;

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 font-outfit space-y-12">
            <StudentPageHeader
                className="px-4"
                eyebrow="Academy intelligence"
                title="Academy"
                accent="Updates"
                description="Focused news and regulatory changes for your curriculum."
                aside={
                    <div className="mb-1 flex flex-wrap items-center gap-3">
                        {daysToExam > 0 && (
                            <div className="student-chip inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-semibold">
                                <span className="h-2 w-2 rounded-full bg-[var(--student-support)]" />
                                Next milestone in {daysToExam} days
                            </div>
                        )}
                        <button className="student-button-secondary flex items-center gap-2 rounded-xl px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95">
                            <span className="material-symbols-outlined text-lg">filter_alt</span>
                            Filter View
                        </button>
                        <button
                            onClick={markAllAsRead}
                            className="student-button-primary flex items-center gap-2 rounded-xl px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-lg">done_all</span>
                            Mark All Read
                        </button>
                        {!isAdminView && (
                            <button
                                onClick={() => router.push("/student/redeem")}
                                className="student-chip-accent flex items-center gap-2 rounded-xl px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                            >
                                <Plus size={16} weight="bold" />
                                Redeem batch code
                            </button>
                        )}
                    </div>
                }
            />

            {/* Sub-nav filtering */}
            <nav className="flex items-center gap-3 mb-10 overflow-x-auto px-4 pb-2 no-scrollbar">
                {dynamicFilterOptions.map(sub => (
                    <button
                        key={sub}
                        onClick={() => setSelectedSubject(sub)}
                        className={cn(
                            "rounded-full border px-5 py-2 text-xs font-bold whitespace-nowrap transition-all shadow-sm",
                            selectedSubject === sub
                                ? "student-tab-active"
                                : "bg-white border-[var(--student-border)] text-[var(--student-muted)] hover:border-[var(--student-border-strong)]"
                        )}
                    >
                        {sub}
                    </button>
                ))}
            </nav>

            {/* Updates Container with Scroll Capability if needed */}
            <div className="space-y-12 px-2 max-h-[2000px] overflow-visible">
                {Object.entries(groupedUpdates)
                    .filter(([sub]) => selectedSubject === "All Updates" || selectedSubject === sub)
                    .map(([subject, items]) => {
                        const unreadCount = items.filter(i => i.isUnread).length;
                        const subjectSettings = {
                            "Financial Reporting": { color: "indigo", icon: "play_circle" },
                            "Indirect Tax": { color: "purple", icon: "book" },
                            "Corporate Laws": { color: "blue", icon: "article" },
                            "Audit & Assurance": { color: "emerald", icon: "security_update_good" },
                            "Strategic Management": { color: "orange", icon: "trending_up" }
                        }[subject] || { color: "slate", icon: "notifications" };

                        return (
                            <section key={subject} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                {/* Subject Card Header */}
                                <div className="p-5 flex items-center justify-between border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-lg flex items-center justify-center text-white shadow-lg",
                                            subjectSettings.color === "indigo" ? "bg-indigo-600 shadow-indigo-100" :
                                                subjectSettings.color === "purple" ? "bg-purple-600 shadow-purple-100" :
                                                    subjectSettings.color === "blue" ? "bg-blue-600 shadow-blue-100" :
                                                        "bg-emerald-600 shadow-emerald-100"
                                        )}>
                                            <span className="material-symbols-outlined">{subjectSettings.icon}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{subject}</h2>
                                            {unreadCount > 0 && (
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                    subjectSettings.color === "indigo" ? "bg-indigo-50 text-indigo-600" : "bg-purple-50 text-purple-600"
                                                )}>
                                                    {unreadCount} New
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => markSubjectAsRead(subject)}
                                        className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline active:scale-95 transition-all"
                                    >
                                        Mark Read
                                    </button>
                                </div>

                                {/* Updates List */}
                                <div className="divide-y divide-slate-50">
                                    {items.map(item => (
                                        <div key={item.id} className="p-6 flex gap-6 group/item hover:bg-slate-50/30 transition-colors">
                                            {/* Unread Indicator dot */}
                                            <div className="pt-2">
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full",
                                                    item.isUnread ? "bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" : "bg-slate-200"
                                                )} />
                                            </div>

                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span>
                                                    <span className="text-[11px] font-medium text-slate-400">
                                                        {item.scheduledFor ? `Scheduled: ${item.scheduledFor}` : formatRelativeDate(item.createdAt)}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 font-outfit leading-tight group-hover/item:text-indigo-600 transition-colors">
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>

                                            {/* Action Icons as per screenshot */}
                                            <div className="flex items-center gap-5 pt-1 self-start">
                                                <button className="text-slate-300 hover:text-indigo-600 transition-colors active:scale-90">
                                                    <span className="material-symbols-outlined text-[20px]">bookmark</span>
                                                </button>
                                                <button className="text-slate-300 hover:text-indigo-600 transition-colors active:scale-90">
                                                    <span className="material-symbols-outlined text-[24px]">
                                                        {item.category === "MOCK ASSESSMENT" ? "calendar_today" : "download"}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
            </div>

            {/* Older Updates Dropdown Button */}
            {hasMore && (
                <div className="mt-16 flex justify-center">
                    <button
                        onClick={() => setVisibleCount(p => p + 6)}
                        className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm hover:border-slate-300 hover:text-slate-600 transition-all active:scale-95 group"
                    >
                        Older Updates
                        <span className="material-symbols-outlined transition-transform group-hover:translate-y-0.5">expand_more</span>
                    </button>
                </div>
            )}


        </div>
    );
}
