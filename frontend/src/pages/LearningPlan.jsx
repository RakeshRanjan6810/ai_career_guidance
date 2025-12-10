import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, ChevronDown, BookOpen, Video, Code, Clock, Award, Loader2, ArrowLeft, PlayCircle, FileText, Target, Brain, ClipboardCheck, RotateCcw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const LearningPlan = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [expandedWeek, setExpandedWeek] = useState(0);
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const storedTrack = localStorage.getItem('selectedTrack');
        const storedUser = localStorage.getItem('user');

        // Priority: State -> LocalStorage -> Redirect
        const activeTrack = state?.track || (storedTrack ? JSON.parse(storedTrack) : null);
        const activeUser = state?.user || (storedUser ? JSON.parse(storedUser) : null);

        if (!activeTrack) {
            return;
        }

        const loadPlan = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');

                // 1. Try fetching saved plan first
                const savedRes = await fetch('http://localhost:5000/api/dashboard/plan', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const savedData = await savedRes.json();

                if (savedData.success && savedData.data && savedData.data.weeks?.length > 0) {
                    setPlan(savedData.data);
                    setIsSaved(true);
                    // If saved plan track matches current, use it. Otherwise, might need prompt.
                    // For now, assume user sticks to one track.
                } else {
                    // 2. No saved plan? Generate new one via AI
                    await generatePlanDraft(activeUser, activeTrack, token);
                }
            } catch (error) {
                console.error(error);
                toast.error('Connection Error');
            } finally {
                setLoading(false);
            }
        };

        loadPlan();
    }, [state]);

    const generatePlanDraft = async (user, track, token) => {
        setLoading(true); // Ensure loading state is visible
        try {
            const response = await fetch('http://localhost:5000/api/ai/plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_profile: user,
                    selected_track_id: track.id,
                    hours_per_week: 15,
                    target_weeks: 8
                })
            });

            const result = await response.json();

            if (result.success) {
                // Return data but DO NOT auto-save
                setPlan(result.data);
                setIsSaved(false);
                toast.success('Draft Generated! Review then Save.');
            } else if (response.status === 429) {
                toast.error('AI Rate Limit. Try again in a minute.');
            } else {
                toast.error('Failed to generate plan.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Generation Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePlan = async () => {
        if (!plan) return;

        // Check if we are overwriting an existing saved plan (if we were in saved state before draft)
        // Or we can check if the user HAS a plan in DB (via initial load logic, maybe obscure now)
        // Simplest: Just warn user "This will replace your current saved plan".

        if (!window.confirm("Saving this will replace any previously saved Learning Plan. Continue?")) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const storedTrack = localStorage.getItem('selectedTrack');
            const track = storedTrack ? JSON.parse(storedTrack) : { id: 'custom' };

            const res = await fetch('http://localhost:5000/api/dashboard/plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...plan,
                    track_id: track.id,
                    total_weeks: plan.totalWeeks || plan.weeks.length
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Plan Saved Successfully!');
                setIsSaved(true);
                // Re-fetch to confirm saved state or update local state logic
            } else {
                toast.error('Failed to save plan');
            }
        } catch (err) {
            console.error(err);
            toast.error('Save Error');
        }
    };

    const handleDeletePlan = async () => {
        if (!window.confirm("Are you sure you want to delete your Learning Plan? This action cannot be undone.")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/dashboard/plan', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                setPlan(null);
                setIsSaved(false);
                toast.success('Plan Deleted');
                navigate('/recommendations');
            } else {
                toast.error('Failed to delete plan');
            }
        } catch (err) {
            console.error(err);
            toast.error('Delete Error');
        }
    };

    const handleRegenerate = () => {
        const storedTrack = localStorage.getItem('selectedTrack');
        const storedUser = localStorage.getItem('user');
        const activeTrack = state?.track || (storedTrack ? JSON.parse(storedTrack) : null);
        const activeUser = state?.user || (storedUser ? JSON.parse(storedUser) : null);
        const token = localStorage.getItem('token');

        if (activeTrack && activeUser && token) {
            // Updated Message: Clarify it's safe
            if (window.confirm("Generate a new plan draft? Your SAVED plan will remain safe until you explicitly click 'Save Plan'.")) {
                generatePlanDraft(activeUser, activeTrack, token);
            }
        } else {
            toast.error("Missing user or track data");
        }
    };

    const [selectedTopic, setSelectedTopic] = useState(null);

    const openTopic = (week, topic) => {
        setSelectedTopic({ ...topic, weekTitle: week.title });
    };

    const handleStartTopic = async (weekNumber, topicIndex, currentStatus, week, topic) => {
        if (currentStatus === 'completed') return;

        // Open the viewer immediately for better UX
        openTopic(week, topic);

        if (currentStatus === 'in-progress') return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/dashboard/plan/topic', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    weekNumber,
                    topicIndex,
                    status: 'in-progress'
                })
            });

            const data = await res.json();
            if (data.success) {
                setPlan(data.data);
                toast.success('Topic Started!');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
            case 'in-progress': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20';
            default: return 'text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'video': return <Video size={16} className="text-blue-500" />;
            case 'practical': return <Code size={16} className="text-emerald-500" />;
            case 'theory': return <BookOpen size={16} className="text-amber-500" />;
            default: return <Circle size={16} />;
        }
    };

    const storedTrack = localStorage.getItem('selectedTrack');
    if (!state?.track && !storedTrack) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500">Please select a career track from the Recommendations page first.</p>
                <button onClick={() => navigate('/recommendations')} className="mt-4 text-indigo-600 font-bold">Go to Recommendations</button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Loading Your Journey...</h2>
                <p className="text-slate-500">Fetching your personalized curriculum.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 pb-10">
            {/* ... Header ... */}

            <AnimatePresence>
                {selectedTopic && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
                        onClick={() => setSelectedTopic(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedTopic.title}</h2>
                                    <p className="text-sm text-slate-500">{selectedTopic.weekTitle}</p>
                                </div>
                                <button onClick={() => setSelectedTopic(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <ChevronDown size={24} className="rotate-180 text-slate-500" />
                                    {/* Using Chevron as close for now or X */}
                                </button>
                            </div>

                            <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-[300px] flex flex-col items-center justify-center text-center">
                                {selectedTopic.type === 'video' ? (
                                    <div className="w-full aspect-video bg-slate-900 rounded-xl flex items-center justify-center mb-4">
                                        <PlayCircle size={48} className="text-white/50" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                                        {getIcon(selectedTopic.type)}
                                    </div>
                                )}
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Content Placeholder</h3>
                                <p className="text-slate-600 dark:text-slate-400 max-w-md">
                                    This is a simulated learning environment. in a real application, the course content (Video, Text, or Quiz) would appear here.
                                </p>
                            </div>

                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedTopic(null)}
                                    className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        toast.success('Marked as Complete');
                                        // TODO: Call backend to complete topic
                                        setSelectedTopic(null);
                                    }}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm shadow-emerald-200 dark:shadow-none"
                                >
                                    Mark as Complete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate('/recommendations')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors">
                    <ArrowLeft size={18} /> Back to Tracks
                </button>
                <div className="flex gap-3">
                    {!isSaved && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSavePlan}
                            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                        >
                            <ClipboardCheck size={16} /> Save Plan
                        </motion.button>
                    )}
                    {isSaved && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDeletePlan}
                            className="flex items-center gap-2 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                        >
                            <RotateCcw size={16} /> Delete Plan
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRegenerate}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                    >
                        <RotateCcw size={16} /> Regenerate
                    </motion.button>
                </div>
            </div>

            {/* Header ... */}

            {/* Header / Progress Overview */}
            {plan && plan.weeks && (
                <>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{state?.track?.name || JSON.parse(localStorage.getItem('selectedTrack'))?.name} Plan</h1>
                                <p className="text-slate-600 dark:text-slate-400">{plan.summary}</p>

                                {plan.personalizationReason && (
                                    <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-900/30 flex gap-3">
                                        <Brain className="text-indigo-600 flex-shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-1">
                                                Why this fits you
                                            </p>
                                            <p className="text-sm text-indigo-900 dark:text-indigo-200 italic">
                                                "{plan.personalizationReason}"
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                <Award className="text-orange-500" size={24} />
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Duration</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{plan.totalWeeks} Weeks</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Curriculum Timeline */}            {/* Weeks Container */}
                    <motion.div
                        className="space-y-4"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                    >
                        {plan.weeks.map((week, idx) => (
                            <motion.div
                                key={idx}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0 }
                                }}
                                className={`bg-white dark:bg-slate-800 rounded-xl border transition-all duration-300 ${week.status === 'completed' ? 'border-indigo-200 dark:border-indigo-900' :
                                    week.status === 'in-progress' ? 'border-2 border-indigo-600 shadow-md transform scale-[1.01]' :
                                        'border-slate-200 dark:border-slate-700 opacity-70'
                                    }`}
                            >
                                <button
                                    onClick={() => setExpandedWeek(expandedWeek === idx ? -1 : idx)}
                                    className="w-full flex items-center p-5 text-left"
                                >
                                    {/* Status Icon */}
                                    <div className="mr-4">
                                        {week.status === 'completed' ? (
                                            <CheckCircle className="text-emerald-500" size={24} />
                                        ) : week.status === 'in-progress' ? (
                                            <div className="w-6 h-6 rounded-full border-2 border-indigo-500 flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></div>
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={`font-bold text-lg ${week.status === 'locked' ? 'text-slate-400' : 'text-slate-900 dark:text-white'
                                                }`}>
                                                {week.title}
                                            </h3>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-md capitalize ${getStatusColor(week.status)}`}>
                                                {week.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} /> ~{week.estimatedHours || week.estimated_hours} Hours
                                            </span>
                                            <span>{week.topics?.length || 0} Topics</span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1 italic">{week.goal}</p>
                                    </div>

                                    <ChevronDown
                                        size={20}
                                        className={`text-slate-400 transition-transform duration-300 ${expandedWeek === idx ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {expandedWeek === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden bg-slate-50 dark:bg-slate-800/50 rounded-b-xl"
                                        >
                                            <div className="p-5 border-t border-slate-100 dark:border-slate-800">

                                                {/* Week Intelligence: Resume & Skills */}
                                                {(week.resumeBullet || (week.skillsGained && week.skillsGained.length > 0)) && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                        {week.resumeBullet && (
                                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                                                <div className="flex gap-3">
                                                                    <FileText className="text-emerald-600 flex-shrink-0" size={18} />
                                                                    <div>
                                                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Resume Impact</h4>
                                                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">"{week.resumeBullet}"</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {week.skillsGained && week.skillsGained.length > 0 && (
                                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                                                <div className="flex gap-3">
                                                                    <Target className="text-blue-600 flex-shrink-0" size={18} />
                                                                    <div className="flex-1">
                                                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Skills Unlocked</h4>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {week.skillsGained.map((skill, si) => (
                                                                                <span key={si} className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md font-medium border border-blue-100 dark:border-blue-900/50">
                                                                                    {skill}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Learning Modules</h4>
                                                <div className="space-y-3">
                                                    {week.topics?.map((topic, i) => (
                                                        <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50`}>
                                                                    {getIcon(topic.type)}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-slate-700 dark:text-slate-200 block">
                                                                        {topic.title}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500">{topic.estimatedHours || topic.estimated_hours}h • {topic.type?.replace('_', ' ')}</span>
                                                                </div>
                                                            </div>
                                                            {topic.status === 'in-progress' ? (
                                                                <button
                                                                    onClick={() => handleStartTopic(week.weekNumber || week.week_number, i, topic.status, week, topic)}
                                                                    className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors flex items-center gap-2"
                                                                >
                                                                    In Progress <PlayCircle size={12} />
                                                                </button>
                                                            ) : topic.status === 'completed' ? (
                                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                                                    Done
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleStartTopic(week.weekNumber || week.week_number, i, topic.status, week, topic)}
                                                                    className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                                                                >
                                                                    <PlayCircle size={14} /> Start
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Weekly Assessment */}
                                                {week.assessment && (
                                                    <div className="mt-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-4">
                                                        <div className="flex items-start gap-3">
                                                            <ClipboardCheck className="text-amber-600 mt-1" size={20} />
                                                            <div>
                                                                <h4 className="font-bold text-amber-900 dark:text-amber-200 mb-1">Weekly Checkpoint: {week.assessment.type?.toUpperCase() || "QUIZ"}</h4>
                                                                <p className="text-sm text-amber-800 dark:text-amber-300/80 mb-2">{week.assessment.goal}</p>
                                                                <div className="inline-flex items-center gap-2 text-xs font-bold bg-white dark:bg-slate-900 px-3 py-1 rounded-full text-amber-700 border border-amber-100 shadow-sm">
                                                                    <span>🔒 Unlock Condition:</span>
                                                                    <span>{week.assessment.unlockCondition}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </motion.div>
                </>
            )}
        </div>
    );
};

export default LearningPlan;
