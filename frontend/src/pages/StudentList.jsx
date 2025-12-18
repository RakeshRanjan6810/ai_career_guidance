import React, { useState, useEffect } from 'react';
import { Search, Mail, MapPin, Award, BookOpen, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudentList = () => {
    const [user, setUser] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Notification Modal State
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [editStudent, setEditStudent] = useState(null);
    const [viewStudent, setViewStudent] = useState(null);
    const [assignProjectStudent, setAssignProjectStudent] = useState(null);

    // New Notification Fields
    const [msgSubject, setMsgSubject] = useState('');
    const [msgType, setMsgType] = useState('info');
    const [msgText, setMsgText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('user'));
        setUser(u);
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/auth/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                // Mocking progress for now since we don't have historical data yet
                const dataWithProgress = data.data.map(s => {
                    // Calculate last active from logs or createdAt
                    let lastActiveMsg = 'Recently';
                    const lastDate = s.activityLogs && s.activityLogs.length > 0
                        ? new Date(s.activityLogs[s.activityLogs.length - 1].date)
                        : new Date(s.createdAt);

                    const diffTime = Math.abs(new Date() - lastDate);
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 0) lastActiveMsg = 'Today';
                    else if (diffDays === 1) lastActiveMsg = 'Yesterday';
                    else lastActiveMsg = `${diffDays} days ago`;

                    const lastTimeStr = lastDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return {
                        ...s,
                        progress: Math.floor(Math.random() * 100),
                        lastActive: lastActiveMsg,
                        lastTime: lastTimeStr
                    };
                });
                setStudents(dataWithProgress);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStudent = async (studentId) => {
        if (!window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/auth/student/${studentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (res.ok) {
                toast.success('Student deleted');
                setStudents(prev => prev.filter(s => s._id !== studentId));
            } else {
                toast.error(data.message || 'Failed to delete');
            }
        } catch (error) {
            toast.error('Server error');
        }
    };

    const handleSendNotification = async () => {
        if (!msgText || !msgSubject) return toast.error('Enter a subject and message');
        setSending(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    recipientId: selectedStudent._id,
                    message: msgText,
                    subject: msgSubject,
                    type: msgType
                })
            });

            if (res.ok) {
                toast.success(`Notification sent to ${selectedStudent.name}`);
                setSelectedStudent(null);
                setMsgText('');
                setMsgSubject('');
                setMsgType('info');
            } else {
                toast.error('Failed to send');
            }
        } catch (error) {
            toast.error('Error sending message');
        } finally {
            setSending(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-6 pb-10">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">My Students ({students.length})</h1>

            {/* ... (Search bar remains same) ... */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading students...</div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-hover">
                                <tr>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Student</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Target Career</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Activity Status</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredStudents
                                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                    .map(student => (
                                        <tr key={student._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-slate-900 dark:text-white">{student.name}</div>
                                                <div className="text-sm text-slate-500">{student.email}</div>
                                            </td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400">
                                                {student.targetCareer || 'Undecided'}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {student.lastActive || 'Recently'}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {student.lastTime}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setViewStudent(student)}
                                                        className="text-sm px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedStudent(student);
                                                            setMsgSubject('');
                                                            setMsgType('info');
                                                            setMsgText('');
                                                        }}
                                                        className="text-sm px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
                                                    >
                                                        Notify
                                                    </button>
                                                    {/* Assign Project Button */}
                                                    <button
                                                        onClick={() => setAssignProjectStudent(student)}
                                                        className="text-sm px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1"
                                                    >
                                                        <BookOpen size={14} /> Assign
                                                    </button>
                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => handleDeleteStudent(student._id)}
                                                        className="text-sm px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                                                        title="Delete Student"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* NOTIFICATION MODAL */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 relative">
                        <button
                            onClick={() => setSelectedStudent(null)}
                            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Notify {selectedStudent.name}</h3>

                        {selectedStudent.progress < 30 && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                                ⚠️ This student's progress is stagnant. Send an encouragement message?
                            </div>
                        )}

                        <div className="space-y-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                                <input
                                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                    placeholder="e.g. Weekly Check-In"
                                    value={msgSubject}
                                    onChange={(e) => setMsgSubject(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notification Type</label>
                                <select
                                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                    value={msgType}
                                    onChange={(e) => setMsgType(e.target.value)}
                                >
                                    <option value="info">General Info</option>
                                    <option value="alert">Alert / Urgent</option>
                                    <option value="warning">Warning</option>
                                    <option value="meeting">Meeting Request</option>
                                    <option value="success">Praise / Success</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                                <textarea
                                    className="w-full h-32 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Write your message here..."
                                    value={msgText}
                                    onChange={(e) => setMsgText(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendNotification}
                                disabled={sending}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                            >
                                {sending ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT STUDENT MODAL */}
            {editStudent && (
                <EditStudentModal
                    student={editStudent}
                    onClose={() => setEditStudent(null)}
                    onUpdate={fetchStudents}
                />
            )}

            {/* VIEW STUDENT PROFILE MODAL */}
            {viewStudent && (
                <ViewStudentModal
                    student={viewStudent}
                    onClose={() => setViewStudent(null)}
                />
            )}

            {/* ASSIGN PROJECT MODAL */}
            {assignProjectStudent && (
                <AssignProjectModal
                    student={assignProjectStudent}
                    onClose={() => setAssignProjectStudent(null)}
                />
            )}
        </div>
    );
};

// ... (EditStudentModal & ViewStudentModal components - ensure they are preserved) ...

const AssignProjectModal = ({ student, onClose }) => {
    const [topic, setTopic] = useState(student.targetCareer || (student.interests && student.interests[0]) || 'General Web Dev');
    const [difficulty, setDifficulty] = useState('Basic');
    const [generating, setGenerating] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/ai/project-desc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: `Custom Project for ${student.name}: ${topic}`,
                    difficulty: difficulty,
                    techStack: student.skills ? student.skills.join(', ') : 'General'
                })
            });

            const result = await res.json();
            if (result.success) {
                setAiResult(result.data);
            } else {
                toast.error('Generation Failed');
            }
        } catch (error) {
            toast.error('AI Error');
        } finally {
            setGenerating(false);
        }
    };

    const handleAssign = async () => {
        try {
            const token = localStorage.getItem('token');
            const fullDescription = `${aiResult.description}\n\n**Features:**\n${aiResult.features.join('\n')}\n\n**Learning Outcomes:**\n${aiResult.learningOutcomes.join('\n')}`;

            const res = await fetch('http://localhost:5000/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: `Assignment: ${topic} Project`,
                    description: fullDescription,
                    difficulty: difficulty,
                    type: 'assignment',
                    tags: student.skills || [],
                    assignedTo: student._id // Key Change: Assigning to specific student
                })
            });

            if (res.ok) {
                toast.success(`Project assigned to ${student.name}`);
                onClose();
            } else {
                toast.error('Failed to assign');
            }
        } catch (error) {
            toast.error('Server Error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <X size={20} />
                </button>
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="text-purple-500" /> Assign Project to {student.name}
                </h3>

                {!aiResult ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-white">Project Focus / Topic</label>
                            <input
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                            />
                            <p className="text-xs text-slate-500 mt-1">Based on student's interest: {student.interests?.join(', ')}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-white">Difficulty</label>
                            <select
                                value={difficulty}
                                onChange={e => setDifficulty(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                            >
                                <option>Basic</option>
                                <option>Intermediate</option>
                                <option>High</option>
                            </select>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                        >
                            {generating ? 'Generating AI Project...' : 'Generate Project Idea'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 bg-surface rounded-xl border border-border">
                            <h4 className="font-bold dark:text-white mb-2">{aiResult.title || topic}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{aiResult.description}</p>
                            <h5 className="font-semibold text-xs uppercase text-slate-500 mb-1">Outcomes</h5>
                            <ul className="text-xs list-disc list-inside text-slate-600 dark:text-slate-400">
                                {aiResult.learningOutcomes.map((l, i) => <li key={i}>{l}</li>)}
                            </ul>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setAiResult(null)}
                                className="flex-1 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleAssign}
                                className="flex-1 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors"
                            >
                                Confirm Assignment
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const EditStudentModal = ({ student, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        targetCareer: student.targetCareer || '',
        skills: student.skills ? student.skills.join(', ') : '',
        education: student.education || '',
        location: student.location || ''
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/auth/student/${student._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    skills: formData.skills.split(',').map(s => s.trim())
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Profile updated');
                onUpdate();
                onClose();
            } else {
                toast.error(data.message || 'Update failed');
            }
        } catch (error) {
            toast.error('Error updating');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <X size={20} />
                </button>
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Edit Student: {student.name}</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Career</label>
                        <input
                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                            value={formData.targetCareer}
                            onChange={e => setFormData({ ...formData, targetCareer: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Skills (comma separated)</label>
                        <input
                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                            value={formData.skills}
                            onChange={e => setFormData({ ...formData, skills: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Education</label>
                        <input
                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                            value={formData.education}
                            onChange={e => setFormData({ ...formData, education: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
                        <input
                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ViewStudentModal = ({ student, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl p-0 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl font-bold overflow-hidden border-2 border-slate-100 dark:border-slate-700">
                            {student.profilePicture ? (
                                <img src={student.profilePicture} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                                student.name[0]
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{student.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400">{student.email}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded-full">
                                    {student.role}
                                </span>
                                {student.targetCareer && (
                                    <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                                        Aspiring {student.targetCareer}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Contact & Info Grid - Only show if at least one exists */}
                    {(student.location || student.education || student.phone) && (
                        <div className="grid grid-cols-2 gap-6 bg-surface-hover p-4 rounded-xl">
                            {student.location && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Location</h4>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{student.location}</p>
                                </div>
                            )}
                            {student.education && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Education</h4>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{student.education}</p>
                                </div>
                            )}
                            {student.phone && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Phone</h4>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{student.phone}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {student.bio && (
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">About</h4>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                                {student.bio}
                            </p>
                        </div>
                    )}

                    {student.skills && student.skills.length > 0 && (
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {student.skills.map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {student.interests && student.interests.length > 0 && (
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Interests</h4>
                            <div className="flex flex-wrap gap-2">
                                {student.interests.map((int, i) => (
                                    <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs">
                                        {int}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentList;
