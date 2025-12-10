import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        const u = JSON.parse(localStorage.getItem('user'));
        setUser(u);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/'); // Redirect to Home
    };

    const navLinks = [
        { label: 'Features', path: '/#features' },
        { label: 'How it Works', path: '/#how-it-works' },

    ];

    return (
        <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-4 shadow-sm dark:shadow-none' : 'bg-transparent py-6'
            }`}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform">
                        AI
                    </div>
                    <span className={`text-xl font-bold transition-colors ${isScrolled
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-900 dark:text-white'}`}>CareerPath</span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.path}
                            className={`font-medium transition-colors ${isScrolled
                                ? 'text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'
                                : 'text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'}`}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Desktop Auth Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-full transition-colors ${isScrolled
                            ? 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                            : 'text-slate-600 hover:bg-white/10 dark:text-slate-300 dark:hover:bg-slate-800'
                            }`}
                        aria-label="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {user ? (
                        <>
                            <Link
                                to="/dashboard"
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-indigo-500/20"
                            >
                                Dashboard
                            </Link>
                            <button
                                onClick={handleLogout}
                                className={`font-medium transition-colors ${isScrolled
                                    ? 'text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'
                                    : 'text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'}`}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className={`font-medium transition-colors ${isScrolled
                                    ? 'text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'
                                    : 'text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'}`}
                            >
                                Log In
                            </Link>
                            <Link
                                to="/signup"
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-indigo-500/20"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="flex items-center gap-4 md:hidden">
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-full transition-colors ${isScrolled
                            ? 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                            : 'text-slate-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-slate-800'
                            }`}
                        aria-label="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button
                        className={`transition-colors ${isScrolled
                            ? 'text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'
                            : 'text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white'}`}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                        <div className="px-6 py-6 space-y-4 flex flex-col">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.path}
                                    className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white font-medium py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </a>
                            ))}
                            <hr className="border-slate-200 dark:border-slate-800 my-4" />
                            {user ? (
                                <>
                                    <Link
                                        to="/dashboard"
                                        className="text-center px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="text-center text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white font-medium py-2 w-full"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-center text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white font-medium py-2"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="text-center px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
