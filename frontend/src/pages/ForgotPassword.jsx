import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();

            if (response.ok) {
                setSubmitted(true);
                toast.success('Reset link sent!');
            } else {
                toast.error(data.message || 'Something went wrong');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <Toaster position="top-center" reverseOrder={false} />
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 p-8 rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden text-center">

                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="mb-6 relative z-10 flex justify-center">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        {submitted ? <CheckCircle size={24} /> : <Mail size={24} />}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 relative z-10">
                    {submitted ? 'Check your email' : 'Forgot Password?'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-8 relative z-10">
                    {submitted
                        ? `We sent a password reset link to ${email}`
                        : 'Enter your email address to reset your password.'}
                </p>

                {!submitted ? (
                    <form onSubmit={onSubmit} className="space-y-4 relative z-10">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                            <ArrowRight size={18} />
                        </button>
                    </form>
                ) : (
                    <div className="relative z-10">
                        <button
                            onClick={() => setSubmitted(false)}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                        >
                            Resend email
                        </button>
                    </div>
                )}

                <div className="mt-8 relative z-10">
                    <Link to="/login" className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                        <ArrowLeft size={16} />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
