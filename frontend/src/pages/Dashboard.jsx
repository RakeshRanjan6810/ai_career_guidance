import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Award, Clock, Briefcase, Zap, Lightbulb, CheckCircle, ArrowRight, PlayCircle, BookOpen, AlertCircle, Target, MessageSquare, X } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import RecentActivity from '../components/RecentActivity';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import MentorDashboard from './MentorDashboard';

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({ name: 'Student', role: 'Student' });
    const navigate = useNavigate();

    // Mentor Message State
    const [showMentorModal, setShowMentorModal] = useState(false);
    const [msgSubject, setMsgSubject] = useState('');
    const [msgContent, setMsgContent] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }


        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await fetch('http://localhost:5000/api/dashboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.success) {
                    setDashboardData(data.data);
                } else {
                    console.error("Failed to fetch dashboard data:", data.message);
                }
            } catch (error) {
                console.error('Error fetching dashboard:', error);
                toast.error('Could not sync latest data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleSendMessage = async () => {
        if (!msgSubject.trim() || !msgContent.trim()) {
            return toast.error("Please fill in all fields");
        }

        setSendingMsg(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    recipientId: dashboardData.assignedMentor._id,
                    subject: msgSubject,
                    message: `${msgContent}\n\n- Sent by: ${user.name}`,
                    type: 'info' // or 'query'
                })
            });

            if (res.ok) {
                toast.success('Message sent to mentor!');
                setShowMentorModal(false);
                setMsgSubject('');
                setMsgContent('');
            } else {
                toast.error('Failed to send message');
            }
        } catch (error) {
            toast.error('Server error');
        } finally {
            setSendingMsg(false);
        }
    };

    // 1. Stats Data - Only show if data exists
    const metrics = [
        {
            title: 'Class Rank',
            value: dashboardData?.metrics?.peerRank || 'N/A',
            trend: 'Among Peers',
            change: 0,
            icon: Users,
            color: 'bg-emerald-500'
        },
        {
            title: 'Skills Acquired',
            value: dashboardData?.metrics?.skillsAcquired || '0',
            trend: 'Total Skills',
            change: 0,
            icon: Award,
            color: 'bg-purple-500'
        },
        {
            title: 'Study Hours',
            value: dashboardData?.metrics?.studyHours || '0',
            trend: 'Total Hours',
            change: 0,
            icon: Clock,
            color: 'bg-blue-500'
        },
        {
            title: 'Weekly Progress',
            value: dashboardData?.metrics?.weeklyProgress ? `${dashboardData.metrics.weeklyProgress}%` : '0%',
            trend: 'This Week',
            change: 0,
            icon: TrendingUp,
            color: 'bg-amber-500'
        },
    ];

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    // If Instructor, show Mentor Dashboard
    if (user.role === 'Instructor' || user.role === 'instructor') {
        return <MentorDashboard user={user} />;
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (

        <motion.div
            className="max-w-7xl mx-auto space-y-8 pb-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-main">
                        Welcome back, <span className="text-primary">{user.name}</span>!
                    </h1>
                    <p className="text-text-muted mt-1">Here is your learning progress for today.</p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-text-main">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </motion.div>

            {/* Stats Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, idx) => (
                    <StatsCard key={idx} {...metric} />
                ))}
            </motion.div>

            {/* Main Content: Resume Learning & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: Resume Learning (Hero) */}
                <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                    {/* Hero Card */}
                    <div className="bg-gradient-to-r from-primary to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors duration-500"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 text-indigo-100 font-medium text-sm uppercase tracking-wide">
                                <Zap size={16} /> Continue Learning
                            </div>
                            <h2 className="text-3xl font-bold mb-4">
                                {dashboardData?.continueLearning?.title || "No Active Course"}
                            </h2>

                            {dashboardData?.continueLearning ? (
                                <>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="flex-1 max-w-sm h-2 bg-black/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-white rounded-full transition-all duration-1000"
                                                style={{ width: `${dashboardData.continueLearning.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="font-bold">{dashboardData.continueLearning.progress}%</span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate('/courses')}
                                        className="bg-white text-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-black/10 hover:shadow-black/20 transition-all"
                                    >
                                        <PlayCircle size={20} /> Resume
                                    </motion.button>
                                </>
                            ) : (
                                <div>
                                    <p className="text-indigo-100 mb-6">You haven't started any courses yet. Pick a track to get started!</p>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate('/courses')}
                                        className="bg-white text-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                                    >
                                        <BookOpen size={20} /> Browse Courses
                                    </motion.button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Career Insights Summary */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            onClick={() => navigate('/portfolio')}
                            className="bg-surface p-6 rounded-2xl shadow-sm border border-border cursor-pointer hover:shadow-md transition-all"
                        >
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-text-main mb-2">Career Insights</h3>
                            <p className="text-sm text-text-muted mb-4">View your market analysis, skill gaps, and salary potential.</p>
                            <div className="flex items-center text-emerald-600 font-medium text-sm group">
                                View Report <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </motion.div>

                        {/* Learning Plan */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            onClick={() => navigate('/learning-plan')}
                            className="bg-surface p-6 rounded-2xl shadow-sm border border-border cursor-pointer hover:shadow-md transition-all"
                        >
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                                <Target className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-text-main mb-2">Learning Plan</h3>
                            <p className="text-sm text-text-muted mb-4">Track your weekly goals and curriculum progress.</p>
                            <div className="flex items-center text-blue-600 font-medium text-sm group">
                                View Plan <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Mentor Section */}
                    {dashboardData?.assignedMentor && (
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-surface p-6 rounded-2xl shadow-sm border border-border mt-6"
                        >
                            <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                                <Users className="text-primary" size={20} /> My Mentor
                            </h3>
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-primary text-2xl font-bold overflow-hidden border-2 border-slate-100 dark:border-slate-700">
                                    {dashboardData.assignedMentor.profilePicture ? (
                                        <img src={dashboardData.assignedMentor.profilePicture} alt="Mentor" className="w-full h-full object-cover" />
                                    ) : (
                                        dashboardData.assignedMentor.name[0]
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-text-main">{dashboardData.assignedMentor.name}</h4>
                                    <p className="text-sm text-text-muted mb-2">{dashboardData.assignedMentor.email}</p>
                                    {dashboardData.assignedMentor.bio && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-3">
                                            "{dashboardData.assignedMentor.bio}"
                                        </p>
                                    )}
                                    <button
                                        onClick={() => setShowMentorModal(true)}
                                        className="text-sm bg-indigo-50 dark:bg-indigo-900/30 text-primary px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-2 w-fit"
                                    >
                                        <MessageSquare size={16} /> Message Mentor
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Right Col: Recent Activity */}
                <motion.div variants={itemVariants} className="bg-surface rounded-3xl p-6 shadow-sm border border-border h-fit">
                    <h3 className="font-bold text-xl text-text-main mb-6 flex items-center gap-2">
                        <Clock className="text-slate-400" size={20} /> Recent Activity
                    </h3>

                    {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                        <RecentActivity activity={dashboardData.recentActivity} />
                    ) : (
                        <div className="text-center py-10 text-slate-400">
                            <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
                            <p>No activity recorded yet.</p>
                        </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-border">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/projects')}
                            className="w-full py-3 bg-slate-50 dark:bg-slate-700 text-text-main rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                            View All Projects
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            {/* Mentor Message Modal */}
            <AnimatePresence>
                {showMentorModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-surface w-full max-w-lg rounded-2xl p-6 shadow-2xl relative border border-border"
                        >
                            <button
                                onClick={() => setShowMentorModal(false)}
                                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-text-main rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <h3 className="text-xl font-bold mb-1 text-text-main flex items-center gap-2">
                                <MessageSquare className="text-primary" /> Message Mentor
                            </h3>
                            <p className="text-sm text-text-muted mb-6">
                                Send a query or update to your mentor, {dashboardData?.assignedMentor?.name}.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Subject</label>
                                    <input
                                        className="w-full p-2.5 rounded-lg border border-border bg-background text-text-main focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="e.g. Help with Coursework"
                                        value={msgSubject}
                                        onChange={(e) => setMsgSubject(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Message</label>
                                    <textarea
                                        className="w-full h-32 p-3 rounded-xl border border-border bg-background text-text-main focus:ring-2 focus:ring-primary outline-none resize-none"
                                        placeholder="Type your message here..."
                                        value={msgContent}
                                        onChange={(e) => setMsgContent(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowMentorModal(false)}
                                    className="px-4 py-2 text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={sendingMsg}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {sendingMsg ? (
                                        <>Sending...</>
                                    ) : (
                                        <>Send Message</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};



export default Dashboard;
