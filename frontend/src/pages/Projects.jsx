import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Briefcase, Sparkles, Plus, Save, Loader, Trash2, Activity, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Projects = () => {
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Instructor Form State
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        difficulty: 'Basic',
        techStack: '',
        manualDescription: '',
        manualFeatures: '',
        manualOutcomes: ''
    });
    const [creationMode, setCreationMode] = useState('ai'); // 'ai' or 'manual'
    const [aiResult, setAiResult] = useState(null);
    const [generating, setGenerating] = useState(false);

    // Assignment State
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('user'));
        setUser(u);
        fetchProjects();
        if (u?.role === 'instructor') {
            fetchStudents();
        }
    }, []);

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/auth/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setStudents(data.data);
            }
        } catch (error) {
            console.error("Failed to load students", error);
        }
    };

    const updateProjectStatus = async (projectId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/projects/${projectId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(`Project marked as ${newStatus.replace('-', ' ')}!`);
                setProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: newStatus } : p));
            } else {
                toast.error(data.msg || 'Failed to update status');
            }
        } catch (error) {
            console.error(error);
            toast.error('Connection Error');
        }
    };

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/projects?type=assignment', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            // Filter Logic:
            // 1. Show projects created by Instructors/Admins (Global Assignments)
            // 2. Show projects created by the CURRENT USER (Personal Projects)
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const userId = currentUser?.id || currentUser?._id;

            const visibleProjects = data.filter(p => {
                const isInstructorOrAdmin = p.user && (p.user.role === 'instructor' || p.user.role === 'admin');
                const pUserId = p.user?._id || p.user?.id || p.user; // Handle populated object or raw ID
                const isMyProject = pUserId && userId && (typeof pUserId === 'object' ? pUserId.toString() === userId.toString() : pUserId === userId);

                return isInstructorOrAdmin || isMyProject;
            });

            setProjects(visibleProjects);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!formData.title) return toast.error('Please enter a title');

        setGenerating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/ai/project-desc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await res.json();
            if (result.success) {
                setAiResult(result.data);
                toast.success('Description Generated!');
            } else {
                toast.error(result.message || 'Generation Failed');
            }
        } catch (error) {
            toast.error('AI Service Error');
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveProject = async () => {
        if (creationMode === 'ai' && !aiResult) return toast.error('Please generate content first');
        if (creationMode === 'manual' && !formData.manualDescription) return toast.error('Description is required');

        try {
            const token = localStorage.getItem('token');
            let fullDescription = '';
            let aiDataToSave = null;

            if (creationMode === 'ai') {
                fullDescription = `${aiResult.description}\n\n**Features:**\n${aiResult.features.join('\n')}\n\n**Learning Outcomes:**\n${aiResult.learningOutcomes.join('\n')}`;
                aiDataToSave = JSON.stringify(aiResult);
            } else {
                fullDescription = `${formData.manualDescription}\n\n**Features:**\n${formData.manualFeatures}\n\n**Learning Outcomes:**\n${formData.manualOutcomes}`;
            }

            const res = await fetch('http://localhost:5000/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: fullDescription,
                    difficulty: formData.difficulty,
                    type: 'assignment',
                    tags: formData.techStack.split(','),
                    aiDescription: aiDataToSave,
                    assignedTo: selectedStudentId || null
                })
            });

            if (res.ok) {
                toast.success(selectedStudentId ? 'Project Assigned to Student!' : 'Project Created!');
                setShowForm(false);
                setAiResult(null);
                setFormData({ title: '', difficulty: 'Basic', techStack: '', manualDescription: '', manualFeatures: '', manualOutcomes: '' });
                setSelectedStudentId('');
                fetchProjects();
            } else {
                toast.error('Failed to post');
            }
        } catch (error) {
            toast.error('Server Error');
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Project Deleted');
                setProjects(prev => prev.filter(p => p._id !== projectId));
            } else {
                toast.error('Failed to delete');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error deleting project');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 pb-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main flex items-center gap-3">
                        <Briefcase className="text-primary" />
                        Projects
                    </h1>
                    <p className="text-text-muted">
                        {user?.role === 'instructor'
                            ? "Create AI-enhanced project tasks for your students."
                            : "Real-world projects assigned by your instructors."}
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={20} /> {user?.role === 'instructor' ? 'New Assignment' : 'New Project'}
                </button>
            </div>

            {/* INSTRUCTOR CREATE FORM */}
            {showForm && (
                <div className="bg-surface p-6 rounded-2xl border border-primary/20 shadow-xl mb-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-text-main">
                            {creationMode === 'ai' ? <Sparkles className="text-yellow-500" /> : <Briefcase className="text-blue-500" />}
                            {user?.role === 'instructor' ? 'Create Assignment' : 'Create Project'}
                        </h2>
                        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                            <button
                                onClick={() => setCreationMode('ai')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${creationMode === 'ai' ? 'bg-background shadow-sm text-primary' : 'text-text-muted'}`}
                            >
                                AI Generator
                            </button>
                            {user?.role === 'instructor' && (
                                <button
                                    onClick={() => setCreationMode('manual')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${creationMode === 'manual' ? 'bg-background shadow-sm text-primary' : 'text-text-muted'}`}
                                >
                                    Manual
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-text-main">Project Title</label>
                                <input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border bg-background border-border text-text-main"
                                    placeholder="e.g. E-Commerce API"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-text-main">Difficulty</label>
                                    <select
                                        value={formData.difficulty}
                                        onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border bg-background border-border text-text-main"
                                    >
                                        <option>Basic</option>
                                        <option>Intermediate</option>
                                        <option>High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-text-main">Tech Stack</label>
                                    <input
                                        value={formData.techStack}
                                        onChange={e => setFormData({ ...formData, techStack: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border bg-background border-border text-text-main"
                                        placeholder="React, Node..."
                                    />
                                </div>
                            </div>

                            {/* INSTRUCTOR ASSIGNMENT ONLY */}
                            {user?.role === 'instructor' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-text-main">Assign to Student (Optional)</label>
                                    <select
                                        value={selectedStudentId}
                                        onChange={e => setSelectedStudentId(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border bg-background border-border text-text-main"
                                    >
                                        <option value="">-- Create as General Assignment --</option>
                                        {students.map(s => (
                                            <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {creationMode === 'ai' && (
                                <button
                                    onClick={handleGenerateAI}
                                    disabled={generating}
                                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    {generating ? <Loader className="animate-spin" /> : <Sparkles size={18} />}
                                    Generate Description
                                </button>
                            )}
                        </div>

                        {/* PREVIEW or MANUAL INPUTS */}
                        <div className="bg-background rounded-xl p-4 border border-border min-h-[300px]">
                            {creationMode === 'manual' ? (
                                <div className="space-y-4 h-full flex flex-col">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium mb-1 text-text-main">Project Description</label>
                                        <textarea
                                            value={formData.manualDescription}
                                            onChange={e => setFormData({ ...formData, manualDescription: e.target.value })}
                                            className="w-full h-32 px-4 py-2 rounded-lg border bg-surface dark:bg-slate-800 border-border text-text-main"
                                            placeholder="Describe the project..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-text-main">Key Features</label>
                                        <textarea
                                            value={formData.manualFeatures}
                                            onChange={e => setFormData({ ...formData, manualFeatures: e.target.value })}
                                            className="w-full h-20 px-4 py-2 rounded-lg border bg-surface dark:bg-slate-800 border-border text-text-main"
                                            placeholder="List features..."
                                        />
                                    </div>
                                    <button
                                        onClick={handleSaveProject}
                                        className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold mt-4 flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} /> {user?.role === 'instructor' ? 'Post Assignment' : 'Create Project'}
                                    </button>
                                </div>
                            ) : (
                                aiResult ? (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
                                            <strong>Why {formData.difficulty}:</strong> {aiResult.difficultyReasoning}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-main">Description</h3>
                                            <div className="text-sm text-text-muted">
                                                <ReactMarkdown>{aiResult.description}</ReactMarkdown>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-main">Key Features</h3>
                                            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                                                {aiResult.features.map((f, i) => <li key={i}>{f}</li>)}
                                            </ul>
                                        </div>
                                        <button
                                            onClick={handleSaveProject}
                                            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold mt-4 flex items-center justify-center gap-2"
                                        >
                                            <Save size={18} /> {selectedStudentId ? 'Assign to Student' : 'Post Project'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <Sparkles size={40} className="mb-2 opacity-50" />
                                        <p>AI Preview will appear here</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* LIST */}
            <div className="grid gap-6">
                {projects.map(proj => {
                    // Safety check for ownership
                    // Backend sends user.id, but local objects might refer to _id
                    const userId = user?.id || user?._id;
                    const projUserId = proj.user?._id || proj.user;
                    const assigneeId = proj.assignedTo?._id || proj.assignedTo;

                    const isOwner = userId && projUserId && (projUserId.toString() === userId.toString());
                    const isAssignee = userId && assigneeId && (assigneeId.toString() === userId.toString());

                    const canEditStatus = isOwner || isAssignee;

                    return (
                        <div key={proj._id} className="bg-surface p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 px-4 py-1 text-xs font-bold rounded-bl-xl ${proj.difficulty === 'High' ? 'bg-red-100 text-red-700' :
                                proj.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                {proj.difficulty}
                            </div>

                            <h3 className="text-xl font-bold text-text-main mb-2 pr-12">{proj.title}</h3>

                            {/* If we stored raw AI data, try to parse it, otherwise show description */}
                            <div className="prose dark:prose-invert max-w-none text-sm text-text-muted">
                                <ReactMarkdown>{proj.description}</ReactMarkdown>
                            </div>

                            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        {/* Status Badge */}
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${proj.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            proj.status === 'in-progress' ? 'bg-orange-100 text-orange-700' :
                                                proj.status === 'started' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-500'
                                            }`}>
                                            {proj.status === 'in-progress' ? 'In Progress' : (proj.status || 'Assigned')}
                                        </span>

                                        <div className="flex gap-1">
                                            {proj.tags?.map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-surface-hover text-xs rounded-md font-mono">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {canEditStatus && (!proj.status || proj.status === 'assigned') && (
                                            <button onClick={() => updateProjectStatus(proj._id, 'started')}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1">
                                                <Play size={14} /> Start
                                            </button>
                                        )}
                                        {canEditStatus && proj.status === 'started' && (
                                            <button onClick={() => updateProjectStatus(proj._id, 'in-progress')}
                                                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1">
                                                <Activity size={14} /> In Progress
                                            </button>
                                        )}
                                        {canEditStatus && proj.status === 'in-progress' && (
                                            <button onClick={() => updateProjectStatus(proj._id, 'completed')}
                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1">
                                                <CheckCircle size={14} /> Complete
                                            </button>
                                        )}

                                        {isOwner && (
                                            <button
                                                onClick={() => handleDeleteProject(proj._id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors p-1.5"
                                                title="Delete Project"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {proj.assignedTo && proj.assignedTo.name && (
                                <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold text-right">
                                    Assigned to: {proj.assignedTo.name}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default Projects;
