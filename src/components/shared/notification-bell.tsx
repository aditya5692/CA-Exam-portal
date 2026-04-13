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
                className="relative p-2 text-[var(--student-muted)] hover:text-[var(--student-text)] hover:bg-[var(--student-panel-muted)] transition-colors rounded-lg outline-none"
            >
                <Bell size={22} weight={unreadCount > 0 ? "fill" : "bold"} className={unreadCount > 0 ? "text-[var(--student-text)]" : ""} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[var(--student-support-strong)] rounded-full border-2 border-white shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--student-panel-solid)] rounded-lg shadow-xl border border-[var(--student-border)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-[var(--student-border)] flex items-center justify-between bg-[var(--student-panel-muted)]/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-[var(--student-text)] text-sm tracking-tight   uppercase">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-[var(--student-accent-soft-strong)] text-[var(--student-accent-strong)] text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">{unreadCount} New</span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAll} className="text-[10px] font-bold text-[var(--student-accent-strong)] hover:text-[var(--student-accent)] uppercase tracking-widest transition-colors active:scale-95">
                                Mark all read
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-[var(--student-border)]">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-[var(--student-muted)]">
                                <Bell size={32} weight="light" className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">You&apos;re all caught up!</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div key={notification.id} className={`flex gap-4 p-4 hover:bg-[var(--student-panel-muted)] transition-colors group ${!notification.isRead ? 'bg-[var(--student-accent-soft)]' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                                        notification.type === 'ALERT' ? 'bg-[var(--student-support-soft)] border-[var(--student-support-soft-strong)] text-[var(--student-support)]' :
                                        notification.type === 'UPDATE' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' :
                                        'bg-[var(--student-accent-soft)] border-[var(--student-accent-soft-strong)] text-[var(--student-accent)]'
                                    }`}>
                                        <Bell size={16} weight={notification.isRead ? "bold" : "fill"} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className={`text-sm tracking-tight truncate pr-4 ${!notification.isRead ? 'font-bold text-[var(--student-text)]' : 'font-medium text-[var(--student-muted-strong)]'}`}>
                                                {notification.title}
                                            </p>
                                        </div>
                                        <p className="text-xs text-[var(--student-muted)] line-clamp-2 leading-relaxed mb-2 pr-2">{notification.message}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] font-bold text-[var(--student-muted-light)] uppercase tracking-widest">
                                                {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                                            </span>
                                            {!notification.isRead && (
                                                <button onClick={(e) => handleMarkAsRead(notification.id, e)} className="text-[var(--student-muted-light)] hover:text-[var(--student-accent-strong)] transition-colors opacity-0 group-hover:opacity-100" title="Mark as read">
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
