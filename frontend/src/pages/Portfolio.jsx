import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, Globe, DollarSign, Target, Calendar, Briefcase,
    ArrowRight, Loader, Zap, MapPin, Award, CheckCircle, Search, Send, MessageSquare, User, Bot
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Markdown from 'react-markdown';

const MarketAnalysis = () => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search State
    const [searchRole, setSearchRole] = useState('');
    const [searchCountry, setSearchCountry] = useState('');

    // Chat State
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);

    useEffect(() => {
        fetchAnalysis();
    }, []);

    const fetchAnalysis = async (customRole = '', customCountry = '') => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/ai/market-analysis', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    custom_role: customRole,
                    custom_country: customCountry
                })
            });
            const data = await res.json();

            if (data.success) {
                setAnalysis(data.data);
                // If this was a custom search, sync the input boxes if they were empty? 
                // No, just keep them as user typed.
            } else {
                setError('Failed to generate insights');
            }
        } catch (err) {
            console.error(err);
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchRole.trim()) return toast.error("Please enter a role");
        fetchAnalysis(searchRole, searchCountry);
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatMessage.trim()) return;

        const userMsg = chatMessage;
        setChatMessage('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMsg,
                    context: JSON.stringify(analysis) // Pass current report as context
                })
            });
            const data = await res.json();

            if (data.success) {
                setChatHistory(prev => [...prev, { role: 'ai', content: data.reply }]);
            } else {
                toast.error("Failed to get response");
                setChatHistory(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't get a response. Please try again." }]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setChatLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Analyzing Job Market...</h2>
                <p className="text-slate-500 dark:text-slate-400">Gathering salary data, demand trends, and skill gaps for you.</p>
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-500">
                <div className="text-center">
                    <p className="text-xl font-bold mb-2">Error generating report</p>
                    <button onClick={() => fetchAnalysis()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Retry</button>
                </div>
            </div>
        );
    }

    const { role_name, summary, current_market, salary_insights, skill_gap_analysis, five_year_outlook, action_plan_30_days, action_plan_6_months } = analysis;

    return (
        <div className="max-w-7xl mx-auto pb-12 px-4 sm:px-6">
            {/* Search Bar */}
            <div className="mb-8 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Target Role (e.g. Data Scientist)"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                            value={searchRole}
                            onChange={(e) => setSearchRole(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 relative">
                        <MapPin className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Country/Region (e.g. USA, Remote)"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                            value={searchCountry}
                            onChange={(e) => setSearchCountry(e.target.value)}
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader size={20} className="animate-spin" /> : <Search size={20} />}
                        Analyze Market
                    </motion.button>
                </form>
            </div>

            {/* Header */}
            <header className="mb-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-bold mb-4">
                    <Zap size={16} /> AI Career Mentor
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
                    Career Insights: <span className="text-indigo-600 dark:text-indigo-400">{role_name}</span>
                </h1>
                <div className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                    <Markdown>{summary}</Markdown>
                </div>
            </header>

            {/* Key Metrics Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
            >
                <MetricCard
                    icon={<TrendingUp className="text-green-500" />}
                    title="Demand Level"
                    value={current_market.demand_level.toUpperCase()}
                    subtext="Current Market Status"
                    color="green"
                />
                <MetricCard
                    icon={<Globe className="text-blue-500" />}
                    title="Remote Opportunity"
                    value={current_market.remote_opportunity.toUpperCase()}
                    subtext="Work flexibility score"
                    color="blue"
                />
                <MetricCard
                    icon={<Target className="text-purple-500" />}
                    title="5-Year Outlook"
                    value={current_market.projected_growth_5y.toUpperCase()}
                    subtext={current_market.comment}
                    color="purple"
                />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                {/* Salary Insights */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                >
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <DollarSign className="text-green-600" /> Salary Bands ({salary_insights.currency})
                    </h2>
                    <div className="space-y-6">
                        <SalaryBar level="Junior" min={salary_insights.junior.min} max={salary_insights.junior.max} color="bg-slate-200 dark:bg-slate-700" fill="bg-green-400" />
                        <SalaryBar level="Mid-Level" min={salary_insights.mid.min} max={salary_insights.mid.max} color="bg-slate-200 dark:bg-slate-700" fill="bg-green-500" />
                        <SalaryBar level="Senior" min={salary_insights.senior.min} max={salary_insights.senior.max} color="bg-slate-200 dark:bg-slate-700" fill="bg-green-600" />
                    </div>
                    <p className="mt-4 text-xs text-slate-400 italic text-center text-opacity-80">
                        {salary_insights.note}
                    </p>
                </motion.div>

                {/* Skill Requirements */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                >
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Award className="text-amber-500" /> Skill Requirements
                    </h2>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {skill_gap_analysis.map((gap, i) => (
                            <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                <div className={`w-2 h-full min-h-[40px] rounded-full ${gap.status === 'needs_improvement' ? 'bg-red-400' : 'bg-green-400'}`}></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-slate-900 dark:text-white">{gap.skill}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${gap.status === 'needs_improvement'
                                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                            : 'bg-green-100 text-green-600'
                                            }`}>{gap.status.replace('_', ' ')}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Required: <span className="font-medium text-slate-700 dark:text-slate-300">{gap.required_level}</span> • You: <span className="font-medium text-slate-700 dark:text-slate-300">{gap.user_level}</span>
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                                        "{gap.comment}"
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Action Plans */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
            >
                <ActionList
                    title="30-Day Attack Plan"
                    icon={<Calendar className="text-indigo-500" />}
                    items={action_plan_30_days}
                    bg="bg-indigo-50 dark:bg-indigo-900/10"
                    itemIcon={<CheckCircle size={16} className="text-indigo-600 mt-1" />}
                />
                <ActionList
                    title="6-Month Strategy"
                    icon={<Briefcase className="text-purple-500" />}
                    items={action_plan_6_months}
                    bg="bg-purple-50 dark:bg-purple-900/10"
                    itemIcon={<Target size={16} className="text-purple-600 mt-1" />}
                />
            </motion.div>

            {/* 5 Year Outlook */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden mb-12 hover:scale-[1.01] transition-transform duration-300"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 relative z-10">
                    <TrendingUp /> 5-Year Market Forecast
                </h2>
                <div className="text-lg text-slate-300 mb-6 leading-relaxed relative z-10">
                    <Markdown>{five_year_outlook.summary}</Markdown>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3 relative z-10">Emerging Areas to Watch</h3>
                    <div className="flex flex-wrap gap-3 relative z-10">
                        {five_year_outlook.emerging_areas.map((area, i) => (
                            <motion.span
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-sm font-medium border border-white/10 hover:bg-white/20 transition-colors cursor-default"
                            >
                                {area}
                            </motion.span>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Ask the Mentor Chat */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <MessageSquare className="text-indigo-500" /> Ask the Mentor
                </h2>

                <div className="h-80 overflow-y-auto mb-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-4 custom-scrollbar">
                    {chatHistory.length === 0 && (
                        <p className="text-center text-slate-400 mt-20 text-sm">
                            Ask specific questions about this report.<br />
                            "How do I learn these skills?" or "Is this salary realistic?"
                        </p>
                    )}
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>

                                <Markdown>{msg.content}</Markdown>
                            </div>
                        </div>
                    ))}
                    {chatLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
                                <Loader size={16} className="text-indigo-600 animate-spin" />
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleChatSubmit} className="relative">
                    <input
                        type="text"
                        placeholder="Ask a follow-up question..."
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                    />
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="submit"
                        disabled={chatLoading || !chatMessage.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {chatLoading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                    </motion.button>
                </form>
            </div>
        </div>
    );
};

const MetricCard = ({ icon, title, value, subtext, color }) => (
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-100 dark:bg-${color}-900/20`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{value}</h3>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">{subtext}</p>
        </div>
    </div>
);

const SalaryBar = ({ level, min, max, color, fill }) => {
    // Determine relative width logic if we had real min/max context, 
    // for now we just make them look distinct visually.
    const kFormatter = (num) => num > 999 ? (num / 1000).toFixed(1) + 'k' : num;

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">{level}</span>
                <span className="text-slate-500">{kFormatter(min)} - {kFormatter(max)}</span>
            </div>
            <div className={`h-3 w-full ${color} rounded-full overflow-hidden relative`}>
                <div className={`absolute top-0 left-0 h-full ${fill} opacity-80`} style={{ width: level === 'Junior' ? '30%' : level === 'Mid-Level' ? '60%' : '100%' }}></div>
            </div>
        </div>
    )
};

const ActionList = ({ title, icon, items, bg, itemIcon }) => (
    <div className={`p-6 rounded-2xl border border-slate-200 dark:border-slate-700 ${bg}`}>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            {icon} {title}
        </h3>
        <ul className="space-y-3">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                    <div className="min-w-5 pt-0.5">{itemIcon}</div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{item}</p>
                </li>
            ))}
        </ul>
    </div>
);

export default MarketAnalysis;
