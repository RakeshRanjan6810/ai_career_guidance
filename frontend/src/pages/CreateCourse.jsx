import React, { useState } from 'react';
import { BookOpen, Video, FileText, Plus, Save, Trash } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CreateCourse = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        tags: '',
        difficulty: 'Beginner'
    });

    const [resources, setResources] = useState([
        { title: 'Introduction Video', type: 'video', url: '' }
    ]);

    const handleAddResource = () => {
        setResources([...resources, { title: '', type: 'video', url: '' }]);
    };

    const handleRemoveResource = (index) => {
        const newResources = resources.filter((_, i) => i !== index);
        setResources(newResources);
    };

    const handleResourceChange = (index, field, value) => {
        const newResources = [...resources];
        newResources[index][field] = value;
        setResources(newResources);
    };

    const handleFileChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (limit to 5MB for base64 safety)
            if (file.size > 5 * 1024 * 1024) {
                return toast.error('File too large (Max 5MB)');
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const newResources = [...resources];
                newResources[index].url = reader.result; // Store base64
                // Keep the title if it's empty, user might want to name it same as file or custom
                if (!newResources[index].title) {
                    newResources[index].title = file.name;
                }
                setResources(newResources);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    tags: formData.tags.split(',').map(tag => tag.trim()),
                    resources
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Course created successfully!');
                setFormData({ title: '', description: '', tags: '', difficulty: 'Beginner' });
                setResources([{ title: '', type: 'video', url: '' }]);
            } else {
                toast.error(data.message || 'Failed to create course');
            }
        } catch (error) {
            toast.error('Server error');
        }
    };

    const [generating, setGenerating] = useState(false);

    const handleGenerateAI = async () => {
        if (!formData.title) return toast.error('Please enter a title first');
        setGenerating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/ai/course-desc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.title,
                    difficulty: formData.difficulty,
                    tags: formData.tags
                })
            });
            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({
                    ...prev,
                    description: data.data.description + '\n\n' +
                        (data.data.modules ? 'Suggested Modules:\n- ' + data.data.modules.join('\n- ') : '')
                }));
                toast.success('AI Description Generated!');
            } else {
                toast.error('AI Generation failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error generating');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                <BookOpen className="text-indigo-600" />
                Create New Course
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Basic Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Course Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g., Advanced React Patterns"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                                <button
                                    type="button"
                                    onClick={handleGenerateAI}
                                    disabled={generating}
                                    className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    {generating ? '✨ Generating...' : '✨ Auto-Generate with AI'}
                                </button>
                            </div>
                            <textarea
                                required
                                rows="6"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                placeholder="What will students learn?"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    placeholder="react, frontend, web"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                                <select
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resources */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Course Resources (Videos/PDFs)</h2>
                        <button type="button" onClick={handleAddResource} className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                            <Plus size={16} /> Add Resource
                        </button>
                    </div>

                    <div className="space-y-4">
                        {resources.map((res, index) => (
                            <div key={index} className="flex gap-4 items-start p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex-1 space-y-3">
                                    <div className="flex gap-4">
                                        <input
                                            type="text"
                                            placeholder="Resource Title"
                                            value={res.title}
                                            onChange={(e) => handleResourceChange(index, 'title', e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                                        />
                                        <select
                                            value={res.type}
                                            onChange={(e) => handleResourceChange(index, 'type', e.target.value)}
                                            className="w-32 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                                        >
                                            <option value="video">Video</option>
                                            <option value="pdf">PDF</option>
                                            <option value="link">Link</option>
                                        </select>
                                    </div>

                                    {res.type === 'pdf' ? (
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => handleFileChange(index, e)}
                                                className="block w-full text-sm text-slate-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-full file:border-0
                                                    file:text-sm file:font-semibold
                                                    file:bg-indigo-50 file:text-indigo-700
                                                    hover:file:bg-indigo-100"
                                            />
                                            {res.url && <span className="text-xs text-green-500">File Selected</span>}
                                        </div>
                                    ) : (
                                        <input
                                            type="url"
                                            placeholder="URL (e.g., YouTube link or Google Drive link)"
                                            value={res.url}
                                            onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                                        />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveResource(index)}
                                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <Trash size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
                    >
                        <Save size={20} />
                        Publish Course
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateCourse;
