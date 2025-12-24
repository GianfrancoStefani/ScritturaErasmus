"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, X } from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/app/actions/notifications";
import Link from "next/link";
import clsx from "clsx";
import { toast } from "sonner";

interface Notification {
    id: string;
    title: string;
    message: string;
    link?: string | null;
    read: boolean;
    type: string;
    createdAt: Date;
}

export function NotificationBell({ userId }: { userId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!userId) return;
        setLoading(true);
        const res = await getNotifications(userId);
        if (res.success && res.data) {
            setNotifications(res.data);
            setUnreadCount(res.data.filter((n: any) => !n.read).length);
        }
        setLoading(false);
    };

    // Poll every minute or fetch on open? 
    // For now, fetch on mount and when opening
    useEffect(() => {
        fetchNotifications();
    }, [userId]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleOpen = () => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    const handleMarkRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const res = await markNotificationRead(id);
        if (res.success) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const handleMarkAllRead = async () => {
        const res = await markAllNotificationsRead(userId);
        if (res.success) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            toast.success("All marked as read");
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button 
                onClick={handleOpen}
                className="relative p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-semibold text-sm text-slate-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllRead}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-[70vh] overflow-y-auto">
                        {loading && notifications.length === 0 && (
                            <div className="p-4 text-center text-slate-400 text-sm">Loading...</div>
                        )}
                        
                        {!loading && notifications.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                                <Bell size={24} className="opacity-20" />
                                No notifications
                            </div>
                        )}

                        {notifications.map(notification => (
                            <div 
                                key={notification.id}
                                className={clsx(
                                    "px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 relative group",
                                    !notification.read && "bg-indigo-50/30"
                                )}
                            >
                                <div className="flex gap-3">
                                    <div className={clsx(
                                        "w-2 h-2 mt-2 rounded-full flex-shrink-0",
                                        notification.type === 'SUCCESS' ? 'bg-green-500' :
                                        notification.type === 'WARNING' ? 'bg-amber-500' :
                                        notification.type === 'ERROR' ? 'bg-red-500' :
                                        'bg-indigo-500',
                                        notification.read && "bg-slate-300"
                                    )}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate pr-6">{notification.title}</p>
                                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notification.message}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                        
                                        {notification.link && (
                                            <Link href={notification.link} className="absolute inset-0 z-0" onClick={() => setIsOpen(false)} />
                                        )}
                                    </div>
                                    
                                    {!notification.read && (
                                        <button 
                                            onClick={(e) => handleMarkRead(notification.id, e)}
                                            className="absolute top-3 right-3 p-1 text-slate-300 hover:text-indigo-600 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Mark as read"
                                        >
                                            <Check size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
