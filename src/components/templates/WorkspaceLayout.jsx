import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Layout, List, Settings, Plus, Bell, Search, Star, Clock, Menu as MenuIcon, X, ChevronRight, ListTodo } from 'lucide-react';
import BottomNavigation from '../organisms/BottomNavigation';
import { useTheme } from '../../context/ThemeContext';
import { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next'; // Added i18n support

const WorkspaceLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { t } = useTranslation();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { icon: List, label: t('workspace.active_tasks', 'Active Tasks'), path: '/workspace/tasks' },
        { icon: Calendar, label: t('workspace.calendar', 'Calendar'), path: '/workspace/calendar' },
        { icon: Layout, label: t('workspace.overview', 'Overview'), path: '/workspace/overview' },
        { icon: Settings, label: t('workspace.settings', 'Settings'), path: '/workspace/settings' },
    ];

    const quickAccess = [
        { icon: Clock, label: t('workspace.recent', 'Recent'), color: 'text-blue-500' },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300 pb-24">
            {/* Background Decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-float" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-float" style={{ animationDelay: '2s' }} />
            </div>

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
                                <h2 className="font-bold text-lg">{t('common.menu', 'Menu')}</h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                <section>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">{t('workspace.navigation', 'Navigation')}</h3>
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
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">{t('workspace.favorites', 'Favorites')}</h3>
                                    {quickAccess.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (item.label === t('workspace.important', 'Important')) navigate('/workspace/important');
                                                if (item.label === t('workspace.recent', 'Recent')) navigate('/workspace/recent');
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
