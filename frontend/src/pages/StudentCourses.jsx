import React, { useState, useEffect } from 'react';
import { BookOpen, Video, FileText, ExternalLink, User, PlayCircle, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const StudentCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/courses');
            const data = await res.json();
            if (data.success) {
                setCourses(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch courses", error);
            toast.error("Failed to load mentor content");
        } finally {
            setLoading(false);
        }
    };

    const handleStartCourse = async (courseId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/courses/${courseId}/start`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Course Started! Check your Dashboard.");
                navigate('/dashboard');
            } else {
                toast.error(data.message || "Failed to start course");
            }
        } catch (error) {
            toast.error("Connection error");
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                <BookOpen className="text-indigo-600" />
                Mentor Courses
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
                Explore learning materials and courses created by your mentors.
            </p>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <div key={course._id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${course.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                                        course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {course.difficulty}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            <User size={12} /> {course.instructor?.name || 'Mentor'}
                                        </div>
                                        {course.instructor?.email && (
                                            <a
                                                href={`mailto:${course.instructor.email}?subject=Question regarding ${course.title}`}
                                                className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                            >
                                                <Mail size={12} /> Contact
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                                    {course.title}
                                </h3>

                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                                    {course.description}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {course.tags.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleStartCourse(course._id)}
                                    className="mt-auto w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                                >
                                    <PlayCircle size={18} /> Start Learning
                                </button>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-700">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Content</h4>
                                <div className="space-y-3">
                                    {course.resources.length > 0 ? (
                                        course.resources.map((res, idx) => {
                                            const isDrive = res.url.includes('drive.google.com');
                                            const isPdf = res.type === 'pdf' || res.title.toLowerCase().includes('.pdf');
                                            const isVideo = res.type === 'video' || res.url.includes('youtube.com') || res.url.includes('youtu.be');

                                            const handleResourceClick = (e, url) => {
                                                e.preventDefault();

                                                let targetUrl = url;

                                                // 1. Handle Base64 Data URLs (often blocked by browser if opened directly)
                                                if (url.startsWith('data:')) {
                                                    const win = window.open();
                                                    if (win) {
                                                        win.document.write(
                                                            `<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                                                        );
                                                    } else {
                                                        toast.error("Pop-up blocked. Please allow pop-ups.");
                                                    }
                                                    return;
                                                }

                                                // 2. Handle missing protocol
                                                if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
                                                    targetUrl = `https://${url}`;
                                                }

                                                window.open(targetUrl, '_blank', 'noopener,noreferrer');
                                            };

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={(e) => handleResourceClick(e, res.url)}
                                                    className="group w-full flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm transition-all text-left"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`p-2 rounded-lg flex-shrink-0 ${isDrive ? 'bg-blue-50 text-blue-600' :
                                                            isPdf ? 'bg-red-50 text-red-600' :
                                                                isVideo ? 'bg-red-50 text-red-600' :
                                                                    'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {isDrive ? <ExternalLink size={18} /> :
                                                                isPdf ? <FileText size={18} /> :
                                                                    isVideo ? <Video size={18} /> :
                                                                        <ExternalLink size={18} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                                                                {res.title || 'Untitled Resource'}
                                                            </p>
                                                            <p className="text-xs text-slate-500 truncate">
                                                                {isDrive ? 'Google Drive' : res.type.toUpperCase()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-slate-400 italic text-center py-2">No accessible resources.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {courses.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
                            No courses available yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentCourses;
