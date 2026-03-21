"use client";

import { useEffect, useMemo, useState } from "react";
import { getTeacherUpdates, postAnnouncement } from "@/actions/batch-actions";
import { 
    Megaphone, 
    PaperPlaneRight, 
    ShieldCheck, 
    Users, 
    CheckCircle, 
    Bell,
    CaretRight,
    Sparkle
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type BatchTarget = {
    id: string;
    name: string;
    teacher?: {
        id: string;
        fullName: string | null;
        email: string | null;
    };
    _count: { enrollments: number };
};

type AnnouncementItem = {
    id: string;
    content: string;
    createdAt: string | Date;
    teacher?: {
        id: string;
        fullName: string | null;
        email: string | null;
    };
    batch: {
        id: string;
        name: string;
        teacher?: {
            id: string;
            fullName: string | null;
            email: string | null;
        };
    };
};

export default function TeacherUpdatesPage() {
    const [batches, setBatches] = useState<BatchTarget[]>([]);
    const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
    const [isAdminView, setIsAdminView] = useState(false);
    const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
    const [sendToAll, setSendToAll] = useState(false);
    const [content, setContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const load = async () => {
        const res = await getTeacherUpdates();
        if (!res.success) {
            return;
        }

        setBatches((res.data.batches ?? []) as BatchTarget[]);
        setAnnouncements((res.data.announcements ?? []) as AnnouncementItem[]);
        setIsAdminView(Boolean(res.data.isAdminView));
    };

    useEffect(() => {
        void load();
    }, []);

    const selectedBatchCount = useMemo(
        () => (sendToAll ? batches.length : selectedBatchIds.length),
        [batches.length, selectedBatchIds.length, sendToAll],
    );

    const toggleBatch = (batchId: string) => {
        setSelectedBatchIds((current) =>
            current.includes(batchId)
                ? current.filter((id) => id !== batchId)
                : [...current, batchId],
        );
    };

    const handlePost = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsPosting(true);
        setStatusMessage("");

        const formData = new FormData();
        formData.append("content", content);
        formData.append("sendToAll", String(sendToAll));
        selectedBatchIds.forEach((batchId) => formData.append("batchIds", batchId));

        const res = await postAnnouncement(formData);
        setIsPosting(false);

        if (res.success) {
            setContent("");
            setSelectedBatchIds([]);
            setSendToAll(false);
            setStatusMessage(`Posted successfully to ${res.data?.postedCount ?? 0} batch${res.data?.postedCount === 1 ? "" : "es"}.`);
            void load();
        } else {
            setStatusMessage(res.message || "Failed to post update.");
        }
    };

    const formatTime = (date: string | Date) => {
        const value = new Date(date);
        return value.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="space-y-6 pb-10 w-full max-w-[1280px] mx-auto font-outfit animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.2)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Communications Hub</span>
                    </div>
                    <h1 className="font-outfit tracking-tighter leading-tight text-2xl font-bold text-slate-900">
                        Updates & Announcements
                    </h1>
                    <p className="text-slate-500 font-medium text-base font-sans max-w-2xl leading-relaxed">
                        {isAdminView
                            ? "Post and review academy-wide announcements across all visible batches."
                            : "Broadcast targeted updates to specific batches or send a general announcement to all your students."}
                    </p>
                </div>
                {isAdminView && (
                    <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/20 shrink-0 mb-1">
                        <ShieldCheck size={18} weight="bold" /> Admin View Active
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8">
                {/* Create Update Form */}
                <form onSubmit={handlePost} className="bg-white/80 backdrop-blur-md border border-slate-100 p-6 rounded-[24px] shadow-sm space-y-6 h-fit relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                        <Megaphone size={120} weight="bold" className="text-indigo-600" />
                    </div>
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100/50">
                            <Megaphone size={24} weight="bold" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Post New Update</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Reach your students instantly</p>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        {/* Send to All Toggle */}
                        <label className={cn(
                            "flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer",
                            sendToAll ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-white"
                        )}>
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", sendToAll ? "bg-white/10" : "bg-white border border-slate-100")}>
                                <Sparkle size={20} weight={sendToAll ? "fill" : "bold"} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sm tracking-tight">General Broadcast</p>
                                <p className={cn("text-[10px] font-medium opacity-70", sendToAll ? "text-indigo-100" : "text-slate-400")}>
                                    {isAdminView ? "Target every batch in the academy" : "Target all of your active batches"}
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={sendToAll}
                                onChange={(e) => setSendToAll(e.target.checked)}
                                className="hidden"
                            />
                            {sendToAll && <CheckCircle size={20} weight="fill" className="text-white" />}
                        </label>

                        {/* Batch Selection */}
                        <div className={cn("space-y-3 transition-opacity duration-300", sendToAll ? "opacity-30 pointer-events-none" : "opacity-100")}>
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Target Batches</h3>
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{selectedBatchIds.length} Selected</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto px-1 pt-1 pb-4 scrollbar-thin scrollbar-thumb-slate-200">
                                {batches.map((batch) => {
                                    const isSelected = selectedBatchIds.includes(batch.id);
                                    return (
                                        <button
                                            key={batch.id}
                                            type="button"
                                            onClick={() => toggleBatch(batch.id)}
                                            className={cn(
                                                "rounded-2xl border p-4 text-left transition-all relative overflow-hidden group/btn",
                                                isSelected ? "border-indigo-200 bg-indigo-50 shadow-sm" : "border-slate-100 bg-white hover:border-indigo-100"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-4 relative z-10">
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("font-bold text-sm tracking-tight", isSelected ? "text-indigo-900" : "text-slate-900")}>{batch.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Users size={12} weight="bold" className="text-slate-400" />
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{batch._count.enrollments} Students</p>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center border transition-all",
                                                    isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-200"
                                                )}>
                                                    {isSelected && <CheckCircle size={16} weight="fill" />}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Content Input */}
                        <div className="space-y-3 relative z-10">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Announcement Message</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={6}
                                placeholder="Type your update here. Be clear and concise..."
                                className="w-full rounded-[24px] bg-slate-50/50 border border-slate-100 px-6 py-5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500/20 transition-all font-sans font-medium leading-relaxed resize-none shadow-inner"
                            />
                        </div>

                        {statusMessage && (
                            <div className={cn(
                                "rounded-xl px-5 py-4 text-[11px] font-bold text-center uppercase tracking-widest border transition-all animate-in fade-in zoom-in-95",
                                statusMessage.includes("success") ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                            )}>
                                {statusMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPosting || !content.trim() || (!sendToAll && selectedBatchIds.length === 0)}
                            className="w-full flex items-center justify-center gap-3 rounded-[20px] bg-slate-900 px-6 py-4.5 text-[10px] font-black text-white hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-slate-900 uppercase tracking-[0.2em] shadow-lg shadow-indigo-900/10 transition-all active:scale-95"
                        >
                            {isPosting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <PaperPlaneRight size={18} weight="bold" />
                            )}
                            {isPosting ? "Processing..." : "Broadcast Update"}
                        </button>
                    </div>
                </form>

                {/* History Section */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-6 rounded-[24px] shadow-sm space-y-6 flex flex-col">
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-sm border border-slate-100/50">
                                <Bell size={24} weight="bold" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Updates</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Review your broadcast history</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        {announcements.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                    <Bell size={40} weight="light" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Archive Empty</p>
                                    <p className="text-xs text-slate-300 font-medium">No announcements have been posted yet.</p>
                                </div>
                            </div>
                        ) : (
                            announcements.map((ann) => (
                                <div key={ann.id} className="rounded-[24px] bg-slate-50/50 border border-slate-100/50 p-6 transition-all hover:bg-white hover:shadow-md hover:border-indigo-100 group">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-lg bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                            <Users size={14} weight="bold" />
                                            {ann.batch.name}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            {formatTime(ann.createdAt)}
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed text-slate-600 font-sans group-hover:text-slate-900 transition-colors">
                                        {ann.content}
                                    </p>
                                    {isAdminView && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                                                {ann.teacher?.fullName?.charAt(0) || "E"}
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Posted By</p>
                                                <p className="text-[10px] font-bold text-slate-700 tracking-tight">{ann.teacher?.fullName || ann.teacher?.email || "Educator"}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    
                    {announcements.length > 0 && (
                        <button className="w-full py-4 mt-4 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 hover:text-slate-900 transition-all border border-slate-100 rounded-[16px] hover:bg-white shadow-sm active:scale-95 group flex items-center justify-center gap-2">
                            Load Older Updates <CaretRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
