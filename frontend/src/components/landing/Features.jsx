import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Compass, BarChart2, Map, Mic, FileText, TrendingUp, Briefcase, BookOpen, Video, Zap, Globe, ChevronDown
} from 'lucide-react';

const features = [
    {
        icon: <Compass className="w-6 h-6 text-white" />,
        title: "Career Path AI",
        desc: "Discover your perfect role using AI based on your unique profile and market data.",
        color: "bg-indigo-600",
        delay: 0.1
    },
    {
        icon: <BarChart2 className="w-6 h-6 text-white" />,
        title: "Skill Gap Analyzer",
        desc: "See exactly what skills you're missing compared to your dream job requirements.",
        color: "bg-pink-500",
        delay: 0.2
    },
    {
        icon: <Map className="w-6 h-6 text-white" />,
        title: "12-Week Roadmap",
        desc: "Follow a simple, structured weekly learning plan guiding you from zero to hired.",
        color: "bg-purple-500",
        delay: 0.3
    },
    {
        icon: <Zap className="w-6 h-6 text-white" />,
        title: "Daily Challenges",
        desc: "Solve quick, byte-sized coding tasks every day to build your streak and skills.",
        color: "bg-amber-500",
        delay: 0.4
    },
    {
        icon: <Globe className="w-6 h-6 text-white" />,
        title: "Global Community",
        desc: "Connect with students, mentors, and alumni worldwide for support and networking.",
        color: "bg-indigo-500",
        delay: 0.5
    },
    {
        icon: <FileText className="w-6 h-6 text-white" />,
        title: "Smart Resume Builder",
        desc: "Build a resume that passes ATS scanners with our AI-powered keyword optimizer.",
        color: "bg-orange-500",
        delay: 0.6
    },
    {
        icon: <TrendingUp className="w-6 h-6 text-white" />,
        title: "Market Trends",
        desc: "Track real-time salaries vs job demand to choose the most profitable skills.",
        color: "bg-blue-500",
        delay: 0.7
    },
    {
        icon: <Briefcase className="w-6 h-6 text-white" />,
        title: "Project Workspace",
        desc: "Showcase your best projects in a portfolio designed to impress technical recruiters.",
        color: "bg-cyan-500",
        delay: 0.8
    },
    {
        icon: <BookOpen className="w-6 h-6 text-white" />,
        title: "AI Resource Hub",
        desc: "Access a curated library of top AI tools, documentation, and cheat sheets.",
        color: "bg-teal-500",
        delay: 0.9
    },
    {
        icon: <Video className="w-6 h-6 text-white" />,
        title: "Expert Courses",
        desc: "Learn from industry pros through high-quality video lessons and workshops.",
        color: "bg-rose-500",
        delay: 1.0
    }
];

const Features = () => {
    const [activeFeature, setActiveFeature] = useState(null);

    return (
        <div id="features" className="py-24 bg-slate-50 dark:bg-slate-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Everything you need to <span className="text-indigo-600 dark:text-indigo-400">level up</span>
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Click on any feature to learn more about how it helps your career.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: feature.delay }}
                            onClick={() => setActiveFeature(activeFeature === index ? null : index)}
                            className={`cursor-pointer bg-white dark:bg-slate-800 rounded-2xl p-8 border transition-all duration-300 ${activeFeature === index
                                    ? 'border-indigo-600 shadow-xl ring-2 ring-indigo-600/10'
                                    : 'border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20`}>
                                    {feature.icon}
                                </div>
                                <div className={`transition-transform duration-300 ${activeFeature === index ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                {feature.title}
                            </h3>

                            <AnimatePresence>
                                {activeFeature === index && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="pt-2 text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-700 mt-2">
                                            {feature.desc}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Features;
