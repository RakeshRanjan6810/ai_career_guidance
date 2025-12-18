import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Video, Plus, TrendingUp, Activity } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MentorDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeCourses: 0,
        contentUploads: 0,
        avgResources: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('token');
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const instructorId = storedUser ? (storedUser._id || storedUser.id) : null;

            try {
                // 1. Fetch Students Count (Real)
                const resStudents = await fetch('http://localhost:5000/api/auth/students', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dataStudents = await resStudents.json();
                const studentCount = dataStudents.success ? dataStudents.data.length : 0;

                // 2. Fetch Courses (Real)
                const resCourses = await fetch('http://localhost:5000/api/courses');
                const dataCourses = await resCourses.json();

                let myCourses = [];
                let uploadCount = 0;

                if (dataCourses.success) {
                    // Filter courses belonging to this instructor
                    // Filter courses belonging to this instructor with robust ID check
                    myCourses = dataCourses.data.filter(c => {
                        const cInstructorId = c.instructor?._id || c.instructor;
                        return cInstructorId && String(cInstructorId) === String(instructorId);
                    });

                    // 3. Calculate Content Uploads (Sum of resources in my courses)
                    myCourses.forEach(c => {
                        if (c.resources && Array.isArray(c.resources)) {
                            uploadCount += c.resources.length;
                        }
                    });
                }

                // 4. Calculate Average
                const avgRes = myCourses.length > 0 ? (uploadCount / myCourses.length).toFixed(1) : 0;

                setStats({
                    totalStudents: studentCount,
                    activeCourses: myCourses.length,
                    contentUploads: uploadCount,
                    avgResources: avgRes
                });

            } catch (e) {
                console.error("Dashboard Stats Error:", e);
            }
        };
        fetchStats();
    }, []);

    // Real Metrics
    const metrics = [
        {
            title: 'Total Students',
            value: stats.totalStudents,
            trend: 'Enrolled',
            change: 0,
            icon: Users,
            color: 'bg-indigo-500'
        },
        {
            title: 'Active Courses',
            value: stats.activeCourses,
            trend: 'Published',
            change: 0,
            icon: BookOpen,
            color: 'bg-emerald-500'
        },
        {
            title: 'Content Uploads',
            value: stats.contentUploads,
            trend: 'Total Resources',
            change: 0,
            icon: Video,
            color: 'bg-blue-500'
        },
        {
            title: 'Avg. Resources',
            value: stats.avgResources,
            trend: 'Per Course',
            change: 0,
            icon: Activity,
            color: 'bg-amber-500'
        }
    ];

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
            <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Hello, <span className="text-indigo-600">{user.name}</span>
                </h1>
                <p className="text-slate-500 mt-1">Manage your students and course content.</p>
            </motion.div>

            {/* Empty State - No Students */}
            {stats.totalStudents === 0 && (
                <motion.div variants={itemVariants} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-2xl flex items-start gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-xl">
                        <Users className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">You don't have any students assigned yet.</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Students will be assigned automatically once the previous mentor reaches full capacity (15 students).
                            In the meantime, you can start creating course content.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Stats Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, idx) => (
                    <StatsCard key={idx} {...metric} />
                ))}
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    onClick={() => navigate('/students')}
                    className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                        <Users size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Manage Students</h3>
                    <p className="text-sm text-slate-500 mt-2">View student progress, assign mentors, and track performance.</p>
                </div>

                <div
                    onClick={() => navigate('/courses/create')}
                    className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Create Content</h3>
                    <p className="text-sm text-slate-500 mt-2">Upload new video lectures, documents, and course materials.</p>
                </div>

                <div
                    onClick={() => navigate('/courses/manage')}
                    className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                        <BookOpen size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Uploaded Content</h3>
                    <p className="text-sm text-slate-500 mt-2">Manage existing courses, update curriculum, and review stats.</p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default MentorDashboard;
