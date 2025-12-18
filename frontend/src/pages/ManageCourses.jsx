import React, { useState, useEffect } from 'react';
import { BookOpen, Edit2, Trash2, Video, Plus, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ManageCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCourse, setEditingCourse] = useState(null); // Course being edited
    const [currentInstructorId, setCurrentInstructorId] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) setCurrentInstructorId(user.id);
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/courses');
            const data = await res.json();
            if (data.success) {
                // Filter client side for now since we don't have a /my-courses endpoint
                // In a real app, you'd want ?instructor=ID query param
                setCourses(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/courses/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                toast.success('Course deleted');
                setCourses(courses.filter(c => c._id !== id));
            } else {
                toast.error('Failed to delete');
            }
        } catch (error) {
            toast.error('Server error');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/courses/${editingCourse._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: editingCourse.title,
                    description: editingCourse.description
                })
            });

            if (res.ok) {
                toast.success('Course updated');
                setEditingCourse(null);
                fetchCourses(); // Refresh
            } else {
                toast.error('Failed to update');
            }
        } catch (error) {
            toast.error('Server error');
        }
    };

    // Filter only my courses
    const myCourses = courses.filter(course => {
        const instructorId = course.instructor?._id || course.instructor;
        // console.log('Checking course:', course.title, 'InstID:', instructorId, 'MyID:', currentInstructorId);
        return instructorId && String(instructorId) === String(currentInstructorId);
    });

    return (
        <div className="max-w-7xl mx-auto p-6 pb-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <BookOpen className="text-indigo-600" />
                        Uploaded Content
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Edit, rename, or remove your uploaded content.
                    </p>
                </div>
                <Link to="/courses/create" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                    <Plus size={20} /> New Course
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading courses...</div>
            ) : myCourses.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 mb-4">You haven't created any courses yet.</p>
                    <Link to="/courses/create" className="text-indigo-600 font-bold hover:underline">Get Started</Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {myCourses.map(course => (
                        <div key={course._id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">

                            {/* Course Info or Edit Form */}
                            <div className="flex-1 w-full">
                                {editingCourse?._id === course._id ? (
                                    <form onSubmit={handleUpdate} className="space-y-4">
                                        <input
                                            type="text"
                                            value={editingCourse.title}
                                            onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                                            placeholder="Course Title"
                                        />
                                        <textarea
                                            value={editingCourse.description}
                                            onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                                            placeholder="Description"
                                        />
                                        <div className="flex gap-2">
                                            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-1">
                                                <Save size={16} /> Save
                                            </button>
                                            <button type="button" onClick={() => setEditingCourse(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium flex items-center gap-1">
                                                <X size={16} /> Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{course.title}</h3>
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${course.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                                                course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {course.difficulty}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {course.resources?.map((res, i) => (
                                                <span key={i} className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full">
                                                    {res.type === 'video' ? <Video size={12} /> : <BookOpen size={12} />}
                                                    {res.title}
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Actions */}
                            {!editingCourse && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => setEditingCourse(course)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                        title="Rename / Edit"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(course._id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                        title="Delete Course"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageCourses;
