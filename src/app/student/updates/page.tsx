"use client";

import { getStudentFeed,joinBatch } from "@/actions/batch-actions";
import { getStudentProfile } from "@/actions/profile-actions";
import { cn } from "@/lib/utils";
import { Calendar,Plus,ShieldCheck,X } from "@phosphor-icons/react";
import { useCallback,useEffect,useRef,useState } from "react";

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

        // Fetch profile for daysToExam
        const profileRes = await getStudentProfile();
        if (profileRes.success && profileRes.data?.examTarget) {
            const userTarget = profileRes.data.examTarget;
            const months = { "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11 };
            const parts = userTarget.split(" ");
            if (parts.length >= 2) {
                const moPartRaw = parts[parts.length - 2].substring(0, 3).toLowerCase();
                const moKey = Object.keys(months).find(k => k.toLowerCase() === moPartRaw);
                const yrPart = parseInt(parts[parts.length - 1]);
                if (moKey && !isNaN(yrPart)) {
                    const targetDate = new Date(yrPart, months[moKey as keyof typeof months], 1);
                    const now = new Date();
                    const diffTime = targetDate.getTime() - now.getTime();
                    setDaysToExam(Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))));
                }
            }
        }

        // Mocking advanced data for UI redesign fidelity
        const mockUpdates: FeedItem[] = [
            {
                id: "u1",
                category: "STUDY MATERIAL",
                title: "Consolidated Financial Statements - Revision Chart v2.1",
                description: "Updated with the latest ICAI advisory on minority interest calculations.",
                createdAt: new Date(Date.now() - 86400000), // Yesterday
                isUnread: true,
                subject: "Financial Reporting",
                batchName: "FR Nov 24",
                teacherName: "CA Ramesh"
            },
            {
                id: "u2",
                category: "STATUTORY UPDATE",
                title: "MCA Notification on CSR Reporting Thresholds",
                description: "Essential reading for corporate governance modules. Effective immediately.",
                createdAt: new Date(Date.now() - 172800000), // 2 days ago
                isUnread: true,
                subject: "Financial Reporting",
                batchName: "FR Nov 24",
                teacherName: "CA Ramesh"
            },
            {
                id: "u3",
                category: "MOCK ASSESSMENT",
                title: "GST - Input Tax Credit Advanced Mock Paper",
                description: "3-hour practice focusing on recent tribunal judgments.",
                createdAt: new Date(),
                scheduledFor: "Apr 15",
                isUnread: true,
                subject: "Indirect Tax",
                batchName: "IDT May 25",
                teacherName: "CA Sahil"
            },
            {
                id: "u4",
                category: "ANNOUNCEMENT",
                title: "Live Doubt Clearing Session: Chapter 4",
                description: "Join us for a 2-hour intensive session covering all Chapter 4 topics, including complex case studies on director responsibilities.",
                createdAt: new Date(Date.now() - 3600000 * 5),
                isUnread: false,
                subject: "Corporate Laws",
                batchName: "Law Regular",
                teacherName: "CA Vivek"
            },
            {
                id: "u5",
                category: "STUDY MATERIAL",
                title: "Audit Standards - Quick Reference Guide",
                description: "A 5-page PDF summarizing all key SA standards for the upcoming exams, including the latest amendments to SA 700 series.",
                createdAt: new Date(Date.now() - 86400000 * 3),
                isUnread: true,
                subject: "Audit & Assurance",
                batchName: "Audit Fast",
                teacherName: "CA Anjali"
            },
            {
                id: "u6",
                category: "PRACTICE Q&A",
                title: "RTP/MTP Questions Set - Nov 2024",
                description: "Compilation of the most important questions from past 5 years RTPs and MTPs for comprehensive practice.",
                createdAt: new Date(Date.now() - 86400000 * 5),
                isUnread: false,
                subject: "Strategic Management",
                batchName: "SM Batch 1",
                teacherName: "CA Amit"
            },
            {
                id: "u7",
                category: "REGULATORY NEWS",
                title: "Update on SEBI LODR Regulations",
                description: "Key changes in Clause 49 and related disclosures that every CA Final student must know for the Corporate Law paper.",
                createdAt: new Date(Date.now() - 86400000 * 2),
                isUnread: true,
                subject: "Corporate Laws",
                batchName: "Law Regular",
                teacherName: "CA Vivek"
            }
        ];

        setFeedItems(mockUpdates);
        setIsAdminView(Boolean(res.data.isAdminView));
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

    const filterOptions = ["All Updates", "Financial Reporting", "Indirect Tax", "Corporate Laws", "Audit & Assurance", "Strategic Management"];

    const hasMore = visibleCount < feedItems.length;

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 font-outfit space-y-12">
            {/* Standardized Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4 px-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Academy Intelligence</span>
                    </div>
                    <h1 className="font-outfit tracking-tighter leading-tight text-3xl md:text-4xl font-black text-slate-900">
                        Academy <span className="text-indigo-600">Updates</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-base font-sans max-w-2xl leading-relaxed">
                        Focused news and regulatory changes for your curriculum.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0 mb-1">
                    {daysToExam > 0 && (
                        <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/5 hover:bg-slate-800 transition-all active:scale-95 shrink-0 pointer-events-none mr-2">
                            <Calendar size={18} weight="bold" className="text-indigo-400" />
                            Next Milestone: {daysToExam} Days
                        </div>
                    )}
                    <button className="flex items-center gap-2 px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-widest">
                        <span className="material-symbols-outlined text-lg">filter_alt</span>
                        Filter View
                    </button>
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-5 py-3.5 bg-indigo-600 border border-indigo-500 rounded-xl text-[10px] font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest"
                    >
                        <span className="material-symbols-outlined text-lg">done_all</span>
                        Mark All Read
                    </button>
                    {!isAdminView && (
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="flex items-center gap-2 px-5 py-3.5 bg-white border border-indigo-100 rounded-xl text-[10px] font-bold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-all active:scale-95 uppercase tracking-widest"
                        >
                            <Plus size={16} weight="bold" />
                            Join Batch
                        </button>
                    )}
                </div>
            </div>

            {/* Sub-nav filtering */}
            <nav className="flex items-center gap-3 mb-10 pb-2 overflow-x-auto no-scrollbar px-4">
                {filterOptions.map(sub => (
                    <button
                        key={sub}
                        onClick={() => setSelectedSubject(sub)}
                        className={cn(
                            "px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border shadow-sm",
                            selectedSubject === sub
                                ? "bg-indigo-600 border-indigo-500 text-white shadow-indigo-200"
                                : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
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

            {!isAdminView && showJoinModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50">
                            <div>
                                <h2 className="font-outfit tracking-tight">Join a Batch</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">Enter your batch code</p>
                            </div>
                            <button onClick={() => setShowJoinModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <X size={20} weight="bold" className="text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleJoin} className="p-8 pt-6 space-y-6">
                            <div className="space-y-4 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50/50 flex items-center justify-center mx-auto text-indigo-600 mb-2 border border-indigo-100/50 shadow-inner">
                                    <ShieldCheck size={32} weight="fill" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center opacity-70">Batch Code</label>
                                    <input
                                        type="text"
                                        value={joinCode}
                                        onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                                        placeholder="XXXXXX"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl text-center font-mono font-bold text-3xl tracking-widest text-indigo-500 focus:ring-4 focus:ring-indigo-100/20 focus:bg-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-200 shadow-inner uppercase"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[240px] mx-auto opacity-60">Enter the code provided by your educator to join their batch.</p>
                            </div>
                            {joinError && <div className="text-[10px] font-bold text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center gap-3 uppercase tracking-widest transition-all"><X size={16} weight="bold" /> {joinError}</div>}
                            {joinSuccess && <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3 uppercase tracking-widest transition-all"><ShieldCheck size={16} weight="fill" /> {joinSuccess}</div>}
                            <button
                                type="submit"
                                disabled={isJoining || !joinCode.trim()}
                                className="w-full h-14 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 hover:bg-slate-800 shadow-lg shadow-slate-900/10"
                            >
                                {isJoining ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Joining...
                                    </div>
                                ) : "Join Now"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
