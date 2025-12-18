import React from 'react';
import { CheckCircle2, PlayCircle, Trophy, BookOpen, Activity } from 'lucide-react';

const RecentActivity = ({ activity = [] }) => {
    return (
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm h-full">
            <div className="mb-6 flex justify-between items-center">
                <h3 className="text-lg font-bold text-text-main">Recent Activity</h3>
            </div>

            <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                {activity.length > 0 ? activity.map((item, idx) => (
                    <div key={idx} className="relative pl-10 flex gap-4">
                        <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary-light/10 ring-4 ring-bg-card z-10`}>
                            <Activity size={14} className="text-primary" />
                        </div>

                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-text-main">{item.action}</h4>
                            <p className="text-xs text-text-muted mt-1">{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}</p>
                        </div>
                    </div>
                )) : (
                    <div className="pl-10 text-sm text-text-muted">No recent activity</div>
                )}
            </div>
        </div>
    );
};

export default RecentActivity;
