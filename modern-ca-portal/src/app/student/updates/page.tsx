"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getStudentFeed, joinBatch } from "@/actions/batch-actions";
import { Bell, Users, BookOpen, Plus, X, Clock, ShieldCheck } from "lucide-react";

type FeedItem = {
    id: string;
    content: string;
    createdAt: string | Date;
    batchName: string;
    teacherName: string;
};

type MyBatch = {
    id: string;
    name: string;
    teacherName: string;
};

export default function StudentUpdatesPage() {
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [myBatches, setMyBatches] = useState<MyBatch[]>([]);
    const [isAdminView, setIsAdminView] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState("");
    const [joinSuccess, setJoinSuccess] = useState("");
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadFeed = useCallback(async () => {
        const res = await getStudentFeed();
        if (!res.success) {
            return;
        }

        setFeedItems((res.feedItems ?? []) as FeedItem[]);
        setMyBatches((res.myBatches ?? []) as MyBatch[]);
        setIsAdminView(Boolean(res.isAdminView));
    }, []);

    useEffect(() => {
        void loadFeed();
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
            setJoinSuccess(`Successfully joined "${res.batchName}".`);
            setJoinCode("");
            void loadFeed();
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            closeTimerRef.current = setTimeout(() => {
                setShowJoinModal(false);
                setJoinSuccess("");
            }, 2000);
        } else {
            setJoinError(res.message || "Something went wrong.");
        }
    };

    const formatTime = (date: string | Date) => {
        const value = new Date(date);
        return value.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        {isAdminView ? "Academy Updates Feed" : "Updates Feed"}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isAdminView
                            ? "See the student-facing announcement stream across every batch from the same page students use."
                            : "Live announcements from all your enrolled teachers."}
                    </p>
                </div>
                {isAdminView ? (
                    <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 inline-flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> Academy-wide admin view
                    </div>
                ) : (
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-violet-500/20 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Join a Batch
                    </button>
                )}
            </div>

            {myBatches.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {myBatches.map((batch) => (
                        <div key={batch.id} className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-full text-sm font-medium border border-violet-100 dark:border-violet-800">
                            <BookOpen className="w-3.5 h-3.5" />
                            {batch.name}
                            <span className="text-violet-400 font-normal text-xs">- {batch.teacherName}</span>
                        </div>
                    ))}
                </div>
            )}

            {feedItems.length === 0 ? (
                <div className="py-16 text-center space-y-4 bg-gray-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700">
                    <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto">
                        <Bell className="w-8 h-8 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">No updates yet</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {isAdminView ? "No batch announcements exist yet across the academy." : "Join a batch using your course code to receive updates here."}
                        </p>
                    </div>
                    {!isAdminView && (
                        <button onClick={() => setShowJoinModal(true)} className="inline-flex items-center gap-2 text-violet-600 font-medium hover:underline text-sm">
                            <Plus className="w-4 h-4" /> Enter your batch code
                        </button>
                    )}
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute left-[22px] top-0 h-full w-0.5 bg-gradient-to-b from-violet-200 to-transparent dark:from-violet-800" />
                    <div className="space-y-6">
                        {feedItems.map((item) => (
                            <div key={item.id} className="flex gap-6 group">
                                <div className="relative mt-1 flex-shrink-0">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-200">
                                        <Bell className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                                    {item.batchName}
                                                </span>
                                                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                                    <Users className="w-3 h-3" /> {item.teacherName}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-gray-800 dark:text-gray-200 leading-relaxed">{item.content}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-400 text-xs whitespace-nowrap flex-shrink-0">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(item.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isAdminView && showJoinModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                            <h2 className="font-bold text-lg">Join a Teacher Batch</h2>
                            <button onClick={() => setShowJoinModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleJoin} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-2">Batch Join Code</label>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                                    placeholder="e.g. TAXATION-A1B2C3"
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-xl text-center font-mono font-bold text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">Enter the unique code your teacher shared when you enrolled in their course.</p>
                            </div>
                            {joinError && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{joinError}</p>}
                            {joinSuccess && <p className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">{joinSuccess}</p>}
                            <button
                                type="submit"
                                disabled={isJoining || !joinCode.trim()}
                                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
                            >
                                {isJoining ? "Validating..." : "Join Batch"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
