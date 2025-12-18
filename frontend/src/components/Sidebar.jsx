import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Target, Calendar, BookOpen, Briefcase, Video, FolderGit2, Settings as SettingsIcon, LogOut, Users, Sparkles, Bell, TrendingUp } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = React.useState({
        name: 'Guest',
        role: 'Visitor',
        initials: 'G'
    });

    React.useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            const initials = storedUser.name
                ? storedUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                : 'U';

            setUser({
                name: storedUser.name,
                role: storedUser.role || 'Student',
                initials
            });
        }
    }, []);

    // Define menus based on roles
    const commonItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: SettingsIcon, label: 'Settings', path: '/settings' },
    ];

    const studentItems = [
        { icon: Target, label: 'Recommendations', path: '/recommendations' },
        { icon: Calendar, label: 'Learning Plan', path: '/learning-plan' },
        { icon: BookOpen, label: 'Mentor Content', path: '/courses' },
        { icon: Sparkles, label: 'AI Mentor', path: '/mentor-chat' },
        { icon: BookOpen, label: 'AI Resources', path: '/ai-resources' },
        { icon: Briefcase, label: 'Projects', path: '/projects' },
        { icon: TrendingUp, label: 'Career Insights', path: '/portfolio' },
        { icon: Video, label: 'Resume Review', path: '/resume-review' },
    ];

    const instructorItems = [
        { icon: Users, label: 'My Students', path: '/students' },

        { icon: BookOpen, label: 'Uploaded Content', path: '/courses/manage' },
        { icon: Video, label: 'Upload Content', path: '/courses/create' },
        { icon: Briefcase, label: 'Student Projects', path: '/projects' },
    ];

    // Combine items based on role (case-insensitive check)
    const role = user.role ? user.role.toLowerCase() : 'student';

    let menuItems = [...commonItems];

    if (role === 'instructor') {
        // Insert instructor items after Dashboard (index 0)
        menuItems.splice(1, 0, ...instructorItems);
    } else {
        // Default to student items
        menuItems.splice(1, 0, ...studentItems);
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('aiTracks');
        localStorage.removeItem('selectedTrack');
        localStorage.removeItem('selectedTrackId');
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <motion.div
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="h-screen w-64 bg-surface border-r border-border text-text-muted flex flex-col fixed left-0 top-0 z-50 transition-colors"
        >
            <div className="p-6">
                <Link to="/" className="text-2xl font-bold text-text-main flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">AI</span>
                    CareerPath
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <motion.div
                            key={item.path}
                            whileHover={{ x: 4 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <Link to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-primary-light/10 text-primary font-medium'
                                : 'hover:bg-surface-hover hover:text-primary'
                                }`}>
                                <item.icon size={20} className={isActive ? 'text-primary' : 'group-hover:text-primary'} />
                                <span>{item.label}</span>
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-surface-hover p-4 rounded-xl flex items-center gap-3 mb-2 border border-border">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                        {user.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-main truncate">{user.name}</p>
                        <p className="text-xs text-text-muted truncate capitalize">
                            {user.role === 'instructor' ? 'Mentor' : user.role}
                        </p>
                    </div>
                    <button onClick={handleLogout} title="Logout">
                        <LogOut size={18} className="text-text-muted hover:text-rose-500 cursor-pointer transition-colors" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default Sidebar;
