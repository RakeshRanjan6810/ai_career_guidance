import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-slate-950 pt-16 pb-8 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">

                {/* CTA Banner */}
                <div className="bg-indigo-600 rounded-3xl p-8 md:p-12 text-center md:text-left relative overflow-hidden mb-20 shadow-2xl shadow-indigo-500/30">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Ready to accelerate your career?
                            </h2>
                            <p className="text-indigo-100 text-lg max-w-xl">
                                Join thousands of students who have already found their dream tech roles.
                            </p>
                        </div>
                        <Link
                            to="/signup"
                            className="shrink-0 bg-white text-indigo-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all shadow-lg flex items-center gap-2"
                        >
                            Get Started Now <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <Link to="/" className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">AI</span>
                            CareerPath
                        </Link>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Empowering your journey from beginner to hired professional with the power of AI.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li><Link to="/features" className="hover:text-indigo-600 transition-colors">Features</Link></li>
                            <li><Link to="/pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link></li>
                            <li><Link to="/reviews" className="hover:text-indigo-600 transition-colors">Reviews</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li><Link to="/blog" className="hover:text-indigo-600 transition-colors">Blog</Link></li>
                            <li><Link to="/community" className="hover:text-indigo-600 transition-colors">Community</Link></li>
                            <li><Link to="/help" className="hover:text-indigo-600 transition-colors">Help Center</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li><Link to="/privacy" className="hover:text-indigo-600 transition-colors">Privacy</Link></li>
                            <li><Link to="/terms" className="hover:text-indigo-600 transition-colors">Terms</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
                    © {new Date().getFullYear()} AI CareerPath. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
