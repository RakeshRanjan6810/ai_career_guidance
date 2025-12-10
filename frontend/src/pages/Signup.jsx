import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { Toaster, toast } from 'react-hot-toast';

import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student' // Default role
    });

    const { name, email, password, role } = formData;

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const token = await user.getIdToken();

            const response = await fetch('http://localhost:5000/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, role }), // Pass selected role
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                toast.success('Account created successfully!');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            } else {
                toast.error(data.message || 'Google signup failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Google sign-up failed. Please try again.');
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                // Clear any stale AI tracks
                localStorage.removeItem('aiTracks');
                localStorage.removeItem('aiTracksOwner');
                localStorage.removeItem('selectedTrack');
                localStorage.removeItem('selectedTrackId');

                toast.success('Account created successfully!');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            } else {
                toast.error(data.message || 'Registration failed');
            }
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <Toaster position="top-center" reverseOrder={false} />
            <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700 p-8 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/10">

                {/* Decorative background glow */}
                <div className="absolute top-0 left-0 w-80 h-80 bg-purple-600/10 dark:bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-600/10 dark:bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="text-center mb-8 relative z-10">
                    <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                            AI
                        </div>
                        <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">CareerPath</span>
                    </Link>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Create Account</h2>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Start your personalized career journey today</p>
                </div>

                <form className="space-y-5 relative z-10" onSubmit={onSubmit}>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                            <input
                                type="text"
                                name="name"
                                value={name}
                                onChange={onChange}
                                placeholder="John Doe"
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                placeholder="you@example.com"
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                            <input
                                type="password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Role</label>
                        <div className="relative">
                            <select
                                name="role"
                                value={role}
                                onChange={onChange}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium appearance-none"
                            >
                                <option value="student">Student</option>
                                <option value="instructor">Mentor</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                        Create Account
                        <ArrowRight size={20} />
                    </button>
                </form>

                <div className="my-8 flex items-center gap-4 relative z-10">
                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                    <span className="text-slate-500 text-sm font-medium">or sign up with</span>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                </div>

                <div className="relative z-10">
                    <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm hover:shadow-md font-semibold text-slate-700 dark:text-slate-200 group">
                        <FaGoogle size={20} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                        Google
                    </button>
                </div>

                <p className="text-center text-slate-600 dark:text-slate-400 text-sm mt-8 relative z-10 font-medium">
                    Already have an account? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
