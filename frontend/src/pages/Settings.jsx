import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Trash2, Save, AlertTriangle, CheckCircle } from 'lucide-react';


const Settings = () => {
    const [user, setUser] = useState({
        name: '',
        email: '',
        phone: '',
        education: '',
        targetCareer: '',
        skills: '',
        interests: '',
        location: '',
        bio: '',
        profilePicture: '',
        role: 'student'
    });
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await fetch('http://localhost:5000/api/auth/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.success) {
                    const userData = data.user;
                    // Update Local Storage
                    localStorage.setItem('user', JSON.stringify(userData));

                    // Update State
                    setUser({
                        name: userData.name || '',
                        email: userData.email || '',
                        phone: userData.phone || '',
                        education: userData.education || '',
                        targetCareer: userData.targetCareer || '',
                        skills: Array.isArray(userData.skills) ? userData.skills.join(', ') : (userData.skills || ''),
                        interests: Array.isArray(userData.interests) ? userData.interests.join(', ') : (userData.interests || ''),
                        location: userData.location || '',
                        bio: userData.bio || '',
                        profilePicture: userData.profilePicture || '',
                        role: userData.role || 'student',
                        createdAt: userData.createdAt,
                        assignedInstructor: userData.assignedInstructor ? (userData.assignedInstructor.name || userData.assignedInstructor) : 'Not Assigned',
                        activityLogs: userData.activityLogs || []
                    });
                }
            } catch (err) {
                console.error("Failed to fetch fresh profile:", err);
                // Fallback to local storage if fetch fails
                const storedUser = JSON.parse(localStorage.getItem('user'));
                if (storedUser) {
                    setUser(prev => ({ ...prev, ...storedUser }));
                }
            }
        };

        fetchProfile();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Not authorized. Please login.');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    education: user.education,
                    targetCareer: user.targetCareer,
                    skills: user.skills.split(',').map(s => s.trim()).filter(Boolean),
                    interests: user.interests.split(',').map(s => s.trim()).filter(Boolean),
                    location: user.location,
                    bio: user.bio,
                    profilePicture: user.profilePicture,
                    password: password || undefined
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage('Profile updated successfully');
                // Update local storage user data
                localStorage.setItem('user', JSON.stringify(data.user));
                setPassword('');
            } else {
                setError(data.message || 'Update failed');
            }
        } catch (err) {
            setError('Server error');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                window.location.href = '/login';
            } else {
                alert('Failed to delete account');
            }
        } catch (err) {
            alert('Server error');
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Account Settings</h2>

            <div className="bg-surface rounded-2xl p-8 border border-border shadow-sm mb-8">
                <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
                    <User size={20} className="text-indigo-600 dark:text-indigo-400" />
                    Profile Information
                </h3>

                {message && (
                    <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center gap-2 text-sm font-medium">
                        <CheckCircle size={16} />
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg flex items-center gap-2 text-sm font-medium">
                        <AlertTriangle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-6">
                    {/* Profile Picture & Basic Info - 2 Col Grid */}
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex flex-col items-center space-y-3">
                            <div className="relative w-32 h-32">
                                {user.profilePicture ? (
                                    <img
                                        src={user.profilePicture}
                                        alt="Profile"
                                        className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-primary-light/10 flex items-center justify-center text-primary text-4xl font-bold border-4 border-surface shadow-lg">
                                        {user.name ? user.name[0].toUpperCase() : <User />}
                                    </div>
                                )}
                                <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-indigo-700 shadow-sm transition-colors transform hover:scale-110">
                                    <span className="sr-only">Upload Photo</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setUser({ ...user, profilePicture: reader.result });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full uppercase tracking-wider">
                                    {user.role}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={user.name}
                                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    value={user.email}
                                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                                <input
                                    type="tel"
                                    value={user.phone}
                                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                                    placeholder="+1 234 567 890"
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Location</label>
                                <input
                                    type="text"
                                    value={user.location}
                                    onChange={(e) => setUser({ ...user, location: e.target.value })}
                                    placeholder="City, Country"
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Bio</label>
                        <textarea
                            value={user.bio}
                            onChange={(e) => setUser({ ...user, bio: e.target.value })}
                            placeholder="Tell us a little about yourself..."
                            rows="3"
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        />
                    </div>

                    {/* Academic & Career */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                        <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Academic & Career Goals</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Education</label>
                                <input
                                    type="text"
                                    value={user.education}
                                    onChange={(e) => setUser({ ...user, education: e.target.value })}
                                    placeholder="University / Degree"
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Career</label>
                                <input
                                    type="text"
                                    value={user.targetCareer}
                                    onChange={(e) => setUser({ ...user, targetCareer: e.target.value })}
                                    placeholder="e.g. Machine Learning Engineer"
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Skills & Interests */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Skills (comma separated)</label>
                            <input
                                type="text"
                                value={user.skills}
                                onChange={(e) => setUser({ ...user, skills: e.target.value })}
                                placeholder="e.g. Python, React, Data Analysis"
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Interests (comma separated)</label>
                            <input
                                type="text"
                                value={user.interests}
                                onChange={(e) => setUser({ ...user, interests: e.target.value })}
                                placeholder="e.g. AI, Robotics, Design"
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                        </div>
                    </div>

                    {/* Password Change */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                        <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Security</h4>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password (Optional)</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                            <input
                                type="password"
                                placeholder="Leave blank to keep current"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2">
                            <Save size={18} />
                            Save Profile
                        </button>
                    </div>
                </form>
            </div>

            {/* Read-Only Debug / Data View Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-4">System Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 bg-surface rounded-xl border border-border">
                        <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Created</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                    <div className="p-4 bg-surface rounded-xl border border-border">
                        <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Mentor ID</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                            {user.assignedInstructor || 'Not Assigned'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-rose-50 dark:bg-rose-900/10 rounded-2xl p-8 border border-rose-200 dark:border-rose-900/30">
                <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
                    <Trash2 size={20} />
                    Delete Account
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                    onClick={handleDelete}
                    className="px-6 py-2.5 bg-white dark:bg-rose-950 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                    Delete Account
                </button>
            </div>
        </div>
    );
};

export default Settings;
