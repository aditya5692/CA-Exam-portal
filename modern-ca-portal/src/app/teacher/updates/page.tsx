"use client";

import { useEffect, useMemo, useState } from "react";
import { getTeacherUpdates, postAnnouncement } from "@/actions/batch-actions";
import { Bell, CheckCheck, Megaphone, Send, Users } from "lucide-react";

type BatchTarget = {
    id: string;
    name: string;
    _count: { enrollments: number };
};

type AnnouncementItem = {
    id: string;
    content: string;
    createdAt: string | Date;
    batch: {
        id: string;
        name: string;
    };
};

export default function TeacherUpdatesPage() {
    const [batches, setBatches] = useState<BatchTarget[]>([]);
    const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
    const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
    const [sendToAll, setSendToAll] = useState(false);
    const [content, setContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const load = async () => {
        const res = await getTeacherUpdates();
        if (res.success) {
            setBatches((res.batches ?? []) as BatchTarget[]);
            setAnnouncements((res.announcements ?? []) as AnnouncementItem[]);
        }
    };

    useEffect(() => {
        let active = true;

        (async () => {
            const res = await getTeacherUpdates();
            if (!active || !res.success) {
                return;
            }

            setBatches((res.batches ?? []) as BatchTarget[]);
            setAnnouncements((res.announcements ?? []) as AnnouncementItem[]);
        })();

        return () => {
            active = false;
        };
    }, []);

    const selectedBatchCount = useMemo(
        () => (sendToAll ? batches.length : selectedBatchIds.length),
        [batches.length, selectedBatchIds.length, sendToAll]
    );

    const toggleBatch = (batchId: string) => {
        setSelectedBatchIds((current) =>
            current.includes(batchId)
                ? current.filter((id) => id !== batchId)
                : [...current, batchId]
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
            setStatusMessage(`Posted successfully to ${res.postedCount} batch${res.postedCount === 1 ? "" : "es"}.`);
            load();
        } else {
            setStatusMessage(res.message || "Failed to post update.");
        }
    };

    const formatTime = (date: string | Date) => {
        const value = new Date(date);
        return value.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-sky-600 bg-clip-text text-transparent">
                        Updates
                    </h1>
                    <p className="text-gray-500 mt-1">Post targeted batch updates or send a general announcement to all your batches.</p>
                </div>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-3 text-sm text-indigo-700">
                    Posting target:
                    {" "}
                    <span className="font-bold">{sendToAll ? "All batches" : `${selectedBatchCount} selected`}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
                <form onSubmit={handlePost} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
                    <div className="flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-semibold">Create update</h2>
                    </div>

                    <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={sendToAll}
                            onChange={(event) => setSendToAll(event.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                            <p className="font-medium text-gray-900">General update</p>
                            <p className="text-sm text-gray-500">Send the same announcement to all of your batches.</p>
                        </div>
                    </label>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            <h3 className="text-sm font-semibold text-gray-900">Batch selection</h3>
                            {!sendToAll && (
                                <span className="text-xs text-gray-500">Multiple selection allowed</span>
                            )}
                        </div>
                        <div className={`grid grid-cols-1 gap-3 ${sendToAll ? "opacity-50 pointer-events-none" : ""}`}>
                            {batches.map((batch) => {
                                const isSelected = selectedBatchIds.includes(batch.id);
                                return (
                                    <button
                                        key={batch.id}
                                        type="button"
                                        onClick={() => toggleBatch(batch.id)}
                                        className={`rounded-xl border px-4 py-3 text-left transition-all ${isSelected ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-gray-50 hover:bg-white"}`}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{batch.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">{batch._count.enrollments} students linked</p>
                                            </div>
                                            {isSelected && <CheckCheck className="w-4 h-4 text-indigo-600" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">Announcement</label>
                        <textarea
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            rows={6}
                            placeholder="Type the update you want students to receive..."
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {statusMessage && (
                        <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                            {statusMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPosting || !content.trim() || (!sendToAll && selectedBatchIds.length === 0)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                        {isPosting ? "Posting..." : "Post update"}
                    </button>
                </form>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-semibold">Recent updates</h2>
                    </div>

                    {announcements.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center text-gray-500">
                            No updates posted yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {announcements.map((announcement) => (
                                <div key={announcement.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                                            <Users className="w-3.5 h-3.5" />
                                            {announcement.batch.name}
                                        </div>
                                        <span className="text-xs text-gray-400">{formatTime(announcement.createdAt)}</span>
                                    </div>
                                    <p className="mt-3 text-sm leading-relaxed text-gray-800">{announcement.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
