import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Clock, Loader2, Save, Search, ExternalLink, Video, FileText, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const AiResources = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'saved'

    // Search State
    const [formData, setFormData] = useState({
        topic: '',
        level: 'Beginner',
        duration: 4
    });
    const [generating, setGenerating] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState(null);

    // Saved State
    const [savedPlans, setSavedPlans] = useState([]);
    const [loadingSaved, setLoadingSaved] = useState(false);

    useEffect(() => {
        if (activeTab === 'saved') {
            fetchSavedPlans();
        }
    }, [activeTab]);

    const fetchSavedPlans = async () => {
        setLoadingSaved(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/saved-resources', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSavedPlans(data.data);
            }
        } catch (error) {
            console.error("Failed to load saved plans", error);
        } finally {
            setLoadingSaved(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this plan?")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/saved-resources/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Plan deleted");
                fetchSavedPlans(); // Refresh list
            }
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!formData.topic.trim()) {
            toast.error("Please enter a topic");
            return;
        }

        setGenerating(true);
        setGeneratedPlan(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/ai/resource-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    topic: formData.topic,
                    level: formData.level,
                    duration: `${formData.duration} weeks`
                })
            });

            const data = await res.json();
            if (data.success) {
                setGeneratedPlan(data.data);
                toast.success("Plan Generated!");
            } else {
                toast.error("Failed to generate plan");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!generatedPlan) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/saved-resources', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(generatedPlan)
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Plan Saved Successfully!");
                setActiveTab('saved');
            }
        } catch (error) {
            toast.error("Failed to save plan");
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 pb-20">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-2 transition-colors">
                        <ArrowLeft size={18} /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <BookOpen className="text-indigo-600" /> AI Resource Finder
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Get personalized, week-by-week study resources for any topic.
                    </p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'new'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        New Search
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'saved'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Saved Plans
                    </button>
                </div>
            </div>

            {activeTab === 'new' ? (
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Search Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sticky top-6">
                            <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Plan Parameters</h2>
                            <form onSubmit={handleGenerate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Topic to Learn</label>
                                    <input
                                        type="text"
                                        value={formData.topic}
                                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                        placeholder="e.g. React Native, Data Structures..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Level</label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                    >
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (Weeks)</label>
                                    <input
                                        type="number"
                                        min="1" max="12"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Recommended: 4-6 weeks</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={generating}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                                >
                                    {generating ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                                    {generating ? 'Designing Plan...' : 'Generate Resources'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Results Display */}
                    <div className="lg:col-span-2">
                        {generating && (
                            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                <Loader2 size={48} className="text-indigo-600 animate-spin mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Curating content for you...</h3>
                                <p className="text-slate-500">Searching for the best tutorials, docs, and videos.</p>
                            </div>
                        )}

                        {!generating && !generatedPlan && (
                            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                <Search size={48} className="text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Ready to Learn?</h3>
                                <p className="text-slate-500">Enter a topic specifically to get a tailored resource list.</p>
                            </div>
                        )}

                        {generatedPlan && (
                            <div className="animate-in fade-in slide-in-from-bottom-4">
                                <div className="bg-indigo-600 text-white p-6 rounded-t-3xl flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-1">{generatedPlan.topic}</h2>
                                        <div className="flex gap-3 text-indigo-100 text-sm">
                                            <span className="bg-indigo-500/50 px-2 py-0.5 rounded flex items-center gap-1"><Check size={14} /> {generatedPlan.level}</span>
                                            <span className="bg-indigo-500/50 px-2 py-0.5 rounded flex items-center gap-1"><Clock size={14} /> {generatedPlan.duration}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center gap-2"
                                    >
                                        <Save size={16} /> Save Plan
                                    </button>
                                </div>
                                <div className="bg-white dark:bg-slate-800 rounded-b-3xl border border-slate-200 dark:border-slate-700 p-6 space-y-8">
                                    {generatedPlan.weeks.map((week) => (
                                        <div key={week.weekNumber} className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-700 pb-2 last:pb-0">
                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-800"></div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{week.title}</h3>

                                            <div className="grid gap-3">
                                                {week.resources.map((res, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={res.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group flex items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-white border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all"
                                                    >
                                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-indigo-600 mr-4 shadow-sm">
                                                            {res.type === 'video' ? <Video size={20} /> : <FileText size={20} />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{res.title}</h4>
                                                            <p className="text-xs text-slate-500 capitalize">{res.type} • External Resource</p>
                                                        </div>
                                                        <ExternalLink size={16} className="text-slate-300 group-hover:text-indigo-400" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {loadingSaved ? (
                        <div className="col-span-full text-center py-20"><Loader2 className="animate-spin text-indigo-600 mx-auto" /></div>
                    ) : savedPlans.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-slate-500">No saved plans yet. Create one!</div>
                    ) : (
                        savedPlans.map(plan => (
                            <div key={plan._id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.topic}</h3>
                                    <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500">{new Date(plan.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex gap-2 text-sm text-slate-600 dark:text-slate-400 mb-6">
                                    <span className="flex items-center gap-1"><Check size={14} /> {plan.level}</span>
                                    <span className="flex items-center gap-1"><Clock size={14} /> {plan.duration}</span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setGeneratedPlan(plan);
                                            setActiveTab('new'); // Switch view to see details
                                        }}
                                        className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-medium transition-colors"
                                    >
                                        View Plan
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(plan._id, e)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Plan"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AiResources;
