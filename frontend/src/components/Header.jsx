import React, { useState, useEffect } from 'react';
import { Search, Bell, Monitor, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const Header = () => {
    const { toggleTheme, theme } = useTheme();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll for notifications every 30s
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('http://localhost:5000/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.isRead).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications");
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Update local state
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-16 bg-surface border-b border-border flex items-center justify-between px-8 fixed top-0 w-[calc(100%-16rem)] ml-64 z-20 transition-colors"
        >
            <div className="text-lg font-bold text-text-main">
                Dashboard Overview
            </div>

            <div className="flex items-center gap-4">
                {/* NOTIFICATION BELL */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-text-muted hover:bg-surface-hover rounded-full relative transition-colors"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-3 border-b border-border bg-surface-hover flex justify-between items-center">
                                <h3 className="font-bold text-sm text-text-main">Notifications</h3>
                                <button onClick={fetchNotifications} size={15} className="text-xs text-primary hover:text-primary-hover">Refresh</button>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-text-muted text-sm">No notifications</div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n._id}
                                            onClick={() => !n.isRead && markAsRead(n._id)}
                                            className={`p-4 border-b border-surface-hover cursor-pointer hover:bg-surface-hover transition-colors ${!n.isRead ? 'bg-primary-light/10' : ''}`}
                                        >
                                            <p className="text-sm text-text-main mb-1">{n.message}</p>
                                            <div className="flex justify-between items-center text-xs text-text-muted">
                                                <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                                                {!n.isRead && <span className="text-primary font-bold">New</span>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={toggleTheme}
                    className="p-2 text-text-muted hover:bg-surface-hover rounded-full transition-colors"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-border">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {user?.name?.[0] || 'U'}
                    </div>
                </div>
            </div>
        </motion.header>
    );
};

export default Header;
