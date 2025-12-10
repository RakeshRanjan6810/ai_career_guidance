import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, Send, CheckCircle, AlertTriangle, Lightbulb, Loader, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ResumeReview = () => {
    const [resumeText, setResumeText] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            if (selected.type !== 'application/pdf') {
                return toast.error('Only PDF files are allowed');
            }
            if (selected.size > 5 * 1024 * 1024) {
                return toast.error('File too large (Max 5MB)');
            }
            setFile(selected);
            setResumeText(''); // Clear text if file is selected
        }
    };

    const handleAnalyze = async () => {
        if ((!resumeText && !file) || !targetRole) {
            return toast.error('Please provide a resume and target role');
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('targetRole', targetRole);

            if (file) {
                formData.append('resume', file);
            } else {
                formData.append('resumeText', resumeText);
            }

            const res = await fetch('http://localhost:5000/api/ai/resume-review', {
                method: 'POST',
                headers: {
                    // Content-Type is auto-set by FormData
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                setResult(data.data);
                toast.success('Analysis Complete!');
            } else {
                toast.error(data.message || 'Analysis Failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Connection Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <FileText className="text-indigo-600" /> AI Resume Review
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Upload your PDF resume or paste text to get instant feedback.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* INPUT FORM */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 h-fit">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-white">Target Role</label>
                            <input
                                value={targetRole}
                                onChange={e => setTargetRole(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                placeholder="e.g. Senior Frontend Engineer"
                            />
                        </div>

                        {/* TABS / SWITCHER */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium mb-1 dark:text-white">Resume Content</label>

                            {/* File Upload Area */}
                            {!resumeText && (
                                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${file ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'}`}>
                                    {file ? (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-medium">
                                                <FileText size={20} />
                                                {file.name}
                                            </div>
                                            <button onClick={() => setFile(null)} className="p-1 hover:bg-white/50 rounded-full">
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                                            <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Click to upload PDF
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">Max 5MB</p>
                                        </label>
                                    )}
                                </div>
                            )}

                            {/* Divider if no file selected yet */}
                            {!file && (
                                <>
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
                                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-800 px-2 text-slate-500">Or paste text</span></div>
                                    </div>

                                    <textarea
                                        value={resumeText}
                                        onChange={e => setResumeText(e.target.value)}
                                        className="w-full h-32 px-4 py-2 rounded-xl border dark:bg-slate-900 dark:border-slate-700 dark:text-white font-mono text-sm"
                                        placeholder="Paste your resume text here..."
                                    />
                                </>
                            )}
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={loading || (!resumeText && !file) || !targetRole}
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="animate-spin" /> : <Send size={18} />}
                            {loading ? 'Analyzing...' : 'Analyze Resume'}
                        </button>
                    </div>
                </div>

                {/* RESULTS */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    {result ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold dark:text-white">Analysis Report</h2>
                                <div className={`px-4 py-1 rounded-full text-sm font-bold ${result.score >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    Score: {result.score}/100
                                </div>
                            </div>

                            <div className="text-sm text-slate-600 dark:text-slate-300 italic border-l-4 border-indigo-500 pl-4 py-1">
                                <ReactMarkdown>{result.summary}</ReactMarkdown>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-green-600 flex items-center gap-2 mb-2">
                                        <CheckCircle size={18} /> Strengths
                                    </h3>
                                    <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1">
                                        {result.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-rose-500 flex items-center gap-2 mb-2">
                                        <AlertTriangle size={18} /> Improvements Needed
                                    </h3>
                                    <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1">
                                        {result.improvements?.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-amber-500 flex items-center gap-2 mb-2">
                                        <Lightbulb size={18} /> Missing Keywords
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {result.missing_keywords?.map((k, i) => (
                                            <span key={i} className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs rounded-md border border-amber-200 dark:border-amber-800">
                                                {k}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                            <FileText size={48} className="mb-4" />
                            <p>Analysis details will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResumeReview;
