"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, CheckCircle } from "@phosphor-icons/react";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, type NotificationRecord } from "@/actions/notification-actions";

export function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const fetchNotifs = async () => {
            const res = await getUserNotifications();
            if (res.success && res.data) {
                setNotifications(res.data);
            }
        };
        void fetchNotifs();

        // Poll every 30s
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        await markNotificationAsRead(id);
    };

    const handleMarkAll = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        await markAllNotificationsAsRead();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors rounded-xl outline-none"
            >
                <Bell size={22} weight={unreadCount > 0 ? "fill" : "bold"} className={unreadCount > 0 ? "text-slate-700" : ""} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm tracking-tight font-outfit uppercase">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-indigo-100 text-indigo-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">{unreadCount} New</span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAll} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-colors active:scale-95">
                                Mark all read
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <Bell size={32} weight="light" className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div key={notification.id} className={`flex gap-4 p-4 hover:bg-slate-50 transition-colors group ${!notification.isRead ? 'bg-indigo-50/30' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                                        notification.type === 'ALERT' ? 'bg-rose-50 border-rose-100 text-rose-500' :
                                        notification.type === 'UPDATE' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' :
                                        'bg-indigo-50 border-indigo-100 text-indigo-500'
                                    }`}>
                                        <Bell size={16} weight={notification.isRead ? "bold" : "fill"} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className={`text-sm tracking-tight truncate pr-4 ${!notification.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                {notification.title}
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2 pr-2">{notification.message}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                                            </span>
                                            {!notification.isRead && (
                                                <button onClick={(e) => handleMarkAsRead(notification.id, e)} className="text-slate-300 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100" title="Mark as read">
                                                    <CheckCircle size={18} weight="fill" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
