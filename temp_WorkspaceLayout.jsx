import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Layout, List, Settings, Plus, Bell, Search, Star, Clock, Menu, X, ChevronRight, ListTodo } from 'lucide-react';
import BottomNavigation from '../organisms/BottomNavigation';
import { useTheme } from '../../context/ThemeContext';
import { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WorkspaceLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { icon: List, label: 'Active Tasks', path: '/workspace/tasks' },
        { icon: Calendar, label: 'Calendar', path: '/workspace/calendar' },
        { icon: Layout, label: 'Overview', path: '/workspace/overview' },
        { icon: Settings, label: 'Settings', path: '/workspace/settings' },
    ];

    const quickAccess = [
        { icon: Clock, label: 'Recent', color: 'text-blue-500' },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300 pb-24">
            {/* Background Decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-float" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-float" style={{ animationDelay: '2s' }} />
            </div>

            {/* Mobile Header - Always Visible */}
            <header className="sticky top-0 left-0 right-0 h-16 glass-panel z-30 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center gap-3" onClick={() => navigate('/')}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                        <ListTodo className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="block font-bold text-slate-900 dark:text-white leading-none">Todo</span>
                    </div>
                </div>
                <button
                    onClick={toggleSidebar}
                    className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            {/* Sidebar Drawer */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
                        />

                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-100 dark:border-slate-800"
                        >
                            {/* Drawer Header */}
                            <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                                <h2 className="font-bold text-lg">Menu</h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                <section>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Navigation</h3>
                                    <div className="space-y-1">
                                        {navItems.map((item) => (
                                            <button
                                                key={item.path}
                                                onClick={() => {
                                                    navigate(item.path);
                                                    setIsSidebarOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all ${isActive(item.path)
                                                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 font-semibold'
                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon className="w-5 h-5" />
                                                    {item.label}
                                                </div>
                                                {isActive(item.path) && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Favorites</h3>
                                    {quickAccess.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (item.label === 'Important') navigate('/workspace/important');
                                                if (item.label === 'Recent') navigate('/workspace/recent');
                                                setIsSidebarOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                                        >
                                            <item.icon className={`w-5 h-5 ${item.color}`} />
                                            {item.label}
                                        </button>
                                    ))}
                                </section>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="relative z-10 px-4 py-6 max-w-lg mx-auto w-full">
                <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}>
                    {children || <Outlet />}
                </Suspense>
            </main>

            <BottomNavigation />
        </div>
    );
};

export default WorkspaceLayout;
