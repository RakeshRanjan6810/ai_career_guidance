import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';

import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const { email, password } = formData;

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.type]: e.target.value,
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
                body: JSON.stringify({ token }),
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

                toast.success(`Welcome back, ${data.user.name}!`);
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            } else {
                toast.error(data.message || 'Google login failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Google sign-in failed. Please try again.');
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
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
                // Clear any stale AI tracks from previous users
                localStorage.removeItem('aiTracks');
                localStorage.removeItem('aiTracksOwner');
                localStorage.removeItem('selectedTrack');
                localStorage.removeItem('selectedTrackId');

                toast.success(`Welcome back, ${data.user.name}!`);
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            } else {
                toast.error(data.message || 'Invalid credentials');
            }
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <Toaster position="top-center" reverseOrder={false} />
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700 p-8 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/10"
            >

                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 dark:bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                <div className="text-center mb-8 relative z-10">
                    <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                            AI
                        </div>
                        <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">CareerPath</span>
                    </Link>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Welcome Back</h2>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Sign in to continue your career journey</p>
                </div>

                <form className="space-y-5 relative z-10" onSubmit={onSubmit}>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={onChange}
                                placeholder="you@example.com"
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                            <Link to="/forgot-password" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Forgot password?</Link>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={onChange}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                        Sign In
                        <ArrowRight size={20} />
                    </button>
                </form>

                <div className="my-8 flex items-center gap-4 relative z-10">
                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                    <span className="text-slate-500 text-sm font-medium">or continue with</span>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                </div>

                <div className="relative z-10">
                    <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm hover:shadow-md font-semibold text-slate-700 dark:text-slate-200 group">
                        <FaGoogle size={20} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                        Google
                    </button>
                </div>

                <p className="text-center text-slate-600 dark:text-slate-400 text-sm mt-8 relative z-10 font-medium">
                    Don't have an account? <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold hover:underline">Sign up</Link>
                </p>
            </motion.div>
        </div >
    );
};

export default Login;
