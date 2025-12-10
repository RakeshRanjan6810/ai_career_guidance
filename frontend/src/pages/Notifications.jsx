import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setNotifications(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Update local state
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Filter to unread? Or show all with style diff? user might want history.

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Bell className="text-indigo-600" /> Notifications
            </h1>

            {loading ? (
                <div className="text-center py-10 dark:text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
                    No notifications yet.
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map(note => (
                        <div
                            key={note._id}
                            onClick={() => !note.isRead && markAsRead(note._id)}
                            className={`p-6 rounded-2xl border transition-all cursor-pointer ${note.isRead
                                    ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-70'
                                    : 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-900/50 shadow-md transform hover:-translate-y-1'
                                }`}
                        >
                            <div className="flex gap-4">
                                <div className={`p-3 rounded-full h-fit flex-shrink-0 ${note.type === 'success' ? 'bg-green-100 text-green-600' :
                                        note.type === 'alert' ? 'bg-red-100 text-red-600' :
                                            'bg-blue-100 text-blue-600'
                                    }`}>
                                    {note.type === 'success' ? <CheckCircle size={24} /> :
                                        note.type === 'alert' ? <AlertCircle size={24} /> :
                                            <Info size={24} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-bold text-lg ${note.isRead ? 'text-slate-700 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                            {note.subject}
                                        </h3>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock size={12} /> {new Date(note.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className={`${note.isRead ? 'text-slate-500 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {note.message}
                                    </p>
                                    {!note.isRead && (
                                        <div className="mt-3 text-xs font-bold text-indigo-600 flex items-center gap-1">
                                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                                            New
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
