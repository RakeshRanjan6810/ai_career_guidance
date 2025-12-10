import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
    {
        number: "01",
        title: "Create Profile",
        desc: "Enter your skills, career goals, and experience level to get a tailored path."
    },
    {
        number: "02",
        title: "Get Analysis",
        desc: "Our AI scans the market and your profile to find your perfect career match."
    },
    {
        number: "03",
        title: "Start Learning",
        desc: "Follow a personalized weekly roadmap with curated resources and challenges."
    }
];

const HowItWorks = () => {
    const [activeStep, setActiveStep] = useState(0); // First step open by default

    return (
        <div id="how-it-works" className="py-24 bg-white dark:bg-slate-950 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                    {/* Left Content - Accordion */}
                    <div className="w-full lg:w-1/2">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-12 leading-tight">
                            Simple path to your <br />
                            <span className="text-indigo-600 dark:text-indigo-400">dream career</span>
                        </h2>

                        <div className="space-y-6 relative">
                            {/* Connecting Line (Optional, simplified for accordion) */}
                            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-100 dark:bg-slate-800 -z-10"></div>

                            {steps.map((step, index) => (
                                <div
                                    key={index}
                                    onClick={() => setActiveStep(activeStep === index ? null : index)}
                                    className={`relative cursor-pointer bg-white dark:bg-slate-900 border transition-all duration-300 rounded-2xl p-6 ${activeStep === index
                                            ? 'border-indigo-600 shadow-lg shadow-indigo-500/10'
                                            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-full border flex items-center justify-center text-sm font-bold transition-colors ${activeStep === index
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700'
                                            }`}>
                                            {step.number}
                                        </div>
                                        <h3 className={`text-xl font-bold transition-colors ${activeStep === index ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'
                                            }`}>
                                            {step.title}
                                        </h3>
                                    </div>

                                    <AnimatePresence>
                                        {activeStep === index && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <p className="pl-[72px] pt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    {step.desc}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Image/Preview */}
                    <div className="w-full lg:w-1/2 relative">
                        <div className="absolute inset-0 bg-indigo-600/10 blur-3xl rounded-full transform rotate-6 scale-90"></div>

                        {/* Mock Dashboard UI */}
                        <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-8 aspect-square sm:aspect-video lg:aspect-square flex flex-col">
                            {/* Mock Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-200">AI</div>
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full"></div>
                                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full"></div>
                                </div>
                            </div>

                            {/* Mock Content Grid */}
                            <div className="grid grid-cols-2 gap-6 flex-1">
                                {/* Card 1: Match Score */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 relative flex flex-col items-center justify-center">
                                    <div className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider self-start">Match Score</div>
                                    <div className="relative w-24 h-24 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-slate-700" />
                                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset="10" className="text-indigo-500" strokeLinecap="round" />
                                        </svg>
                                        <span className="absolute text-2xl font-bold text-slate-800 dark:text-white">98%</span>
                                    </div>
                                </div>

                                {/* Card 2: Skill Graph */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-center gap-4">
                                    <div className="h-2 w-16 bg-slate-200 dark:bg-slate-600 rounded-full mb-2"></div>

                                    <div className="space-y-3 w-full">
                                        {['bg-purple-500', 'bg-pink-500', 'bg-blue-500'].map((color, i) => (
                                            <div key={i} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className={`h-full ${color} rounded-full`} style={{ width: `${85 - (i * 15)}%` }}></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Card 3: Bottom Action (Resume) */}
                                <div className="col-span-2 bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900 flex items-center gap-5">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2.5 w-32 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                                        <div className="h-2 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                    </div>
                                    <div className="ml-auto px-4 py-1.5 bg-white dark:bg-slate-900 rounded-full text-xs font-bold text-indigo-600 shadow-sm border border-indigo-100">
                                        Resume
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] shadow-indigo-500/10 border border-slate-100 dark:border-slate-700 max-w-[200px]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Growth</div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">+120%</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;
