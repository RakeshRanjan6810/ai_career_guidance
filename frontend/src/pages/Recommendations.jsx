import React, { useState, useEffect } from 'react';
import { BookOpen, Briefcase, Award, ArrowRight, Star, Share2, Bookmark, ChevronDown, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Recommendations = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [aiTracks, setAiTracks] = useState(null);
    const [targetCareer, setTargetCareer] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedTracks = localStorage.getItem('aiTracks');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            // If user has a target career in DB, set it
            if (parsedUser.targetCareer) {
                setTargetCareer(parsedUser.targetCareer);
            }
            // Persistence Check: Only load tracks if they belong to THIS user
            const tracksOwner = localStorage.getItem('aiTracksOwner');

            // RELAXED CHECK:
            // 1. If tracksOwner exists, it MUST match the user ID (prevents leakage).
            // 2. If tracksOwner is MISSING (legacy data), we allow it ONLY if we trust Login cleared it for new users.
            //    Since we vetted Login/Signup clears aiTracks, surviving legacy tracks belong to the current session user.
            const isOwner = tracksOwner ? (tracksOwner === parsedUser.id || tracksOwner === parsedUser._id) : true;

            if (storedTracks && isOwner) {
                setAiTracks(JSON.parse(storedTracks));
            }
        }
    }, []);

    const generateRecommendations = async () => {
        if (!targetCareer.trim()) {
            toast.error('Please enter a Target Career first');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/ai/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    target_career: targetCareer,
                    interests: user?.interests ? user.interests.join(', ') : 'Tech, Innovation',
                    skills: user?.skills ? user.skills.join(', ') : 'Beginner',
                    education: user?.education || 'Self Learner',
                    experience: user?.experience || 'Beginner',
                    country: user?.country || 'Global',
                    hours_per_week: 10
                })
            });

            const result = await response.json();

            if (result.success) {
                setAiTracks(result.data.tracks);
                localStorage.setItem('aiTracks', JSON.stringify(result.data.tracks)); // Persist tracks
                // Save ownership
                localStorage.setItem('aiTracksOwner', user.id || user._id);
                toast.success('Career Paths Generated!');
            } else if (response.status === 429) {
                // ... (handling logic remains)
                toast.error('AI Limit reached. Please wait a minute!');
            } else {
                toast.error(result.message || 'AI Generation Failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Connection Error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTrack = (track) => {
        localStorage.setItem('selectedTrack', JSON.stringify(track)); // Persist selection
        localStorage.setItem('selectedTrackId', track.id);
        navigate('/learning-plan', { state: { track: track, user: user } });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-3xl text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-3 flex items-center gap-2">
                        AI Career Architect <Sparkles className="text-yellow-400" />
                    </h1>
                    <p className="text-indigo-200 max-w-xl text-lg mb-6">
                        Analyze your profile to discover top career matches and generate a personalized weekly learning plan.
                    </p>

                    <div className="relative max-w-md">
                        <input
                            type="text"
                            value={targetCareer}
                            onChange={(e) => setTargetCareer(e.target.value)}
                            placeholder="Target Career (Required, e.g. Full Stack Developer)"
                            className="w-full px-5 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all placeholder:text-sm"
                        />
                    </div>
                </div>

                <div className="relative z-10">
                    <button
                        onClick={generateRecommendations}
                        disabled={loading}
                        className="px-8 py-4 bg-white text-indigo-900 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-70 disabled:scale-100"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : <Zap size={20} className="fill-indigo-900" />}
                        {loading ? 'Analyzing Profile...' : 'Generate New Paths'}
                    </button>
                </div>

                {/* BG Decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
            </div>

            {/* AI RESULT DISPLAY - Condition: Must have generated tracks AND targetCareer effectively */}
            {aiTracks && aiTracks.length > 0 ? (
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Briefcase className="text-indigo-600" /> Top Recommended Paths
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {aiTracks.map((track, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl overflow-hidden hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors shadow-lg flex flex-col">
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                                            <Award size={32} />
                                        </div>
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                                            {(track.fit_score * 100).toFixed(0)}% Match
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{track.name}</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                                        {track.why_fit}
                                    </p>

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Key Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {track.skills_to_learn.slice(0, 4).map((skill, sIdx) => (
                                                    <span key={sIdx} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {track.skills_to_learn.length > 4 && <span className="text-xs text-slate-400 py-1">+more</span>}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Modules</p>
                                            <ul className="space-y-1">
                                                {track.recommended_modules.slice(0, 3).map((mod, mIdx) => (
                                                    <li key={mIdx} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                                        <BookOpen size={14} className="text-indigo-400" /> {mod}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                                        <span>⏱ {track.estimated_time_months} Months</span>
                                        <span className="capitalize">📊 {track.difficulty}</span>
                                    </div>
                                    <button
                                        onClick={() => handleSelectTrack(track)}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        Generate Plan <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Empty State
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <Sparkles size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Discover Your Path</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Click "Generate New Paths" to have our AI analyze your profile and suggest the top 3 career tracks for you.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Recommendations;
