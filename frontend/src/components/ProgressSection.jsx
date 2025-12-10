import React from 'react';

const ProgressSection = ({ studyGroup = [], skillGap = [] }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Study Group Peers</h3>

            {studyGroup.length > 0 ? (
                <div className="space-y-5">
                    {studyGroup.slice(0, 5).map((peer, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                {peer.name ? peer.name.charAt(0) : 'U'}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">{peer.name}</span>
                                    <span className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">{peer.role || 'Student'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-sm text-slate-500 py-4">No peers assigned yet.</div>
            )}

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-8 mb-4">Skill Gap Analysis</h3>
            {skillGap.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {skillGap.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-lg border border-rose-100 dark:border-rose-800">
                            Missing: {skill}
                        </span>
                    ))}
                </div>
            ) : (
                <div className="text-sm text-emerald-500">You're on track! No missing skills.</div>
            )}
        </div>
    );
};

export default ProgressSection;
