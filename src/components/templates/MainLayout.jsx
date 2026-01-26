import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from '../organisms/BottomNav';
import SideMenu from '../organisms/SideMenu';
import { LayoutGrid, ArrowLeft, Droplet, Moon, Sun } from 'lucide-react';
// import ChatWidget from '../organisms/chat/ChatWidget';
import { useDate } from '../../context/DateContext';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';

const MainLayout = ({ children }) => {
    const { formattedDate } = useDate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Check for Top-Level Pages (No Back Button)
    const topLevelRoutes = ['/', '/routine', '/history', '/settings'];
    const isTopLevel = topLevelRoutes.includes(location.pathname);

    const { isDark, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 dark:bg-slate-950 dark:text-slate-50 transition-colors">
            {/* Top Navigation */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between dark:bg-slate-900/80 dark:border-slate-800 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/')}
                            className="focus:outline-none hover:opacity-80 transition-opacity"
                        >
                            <img
                                src={isDark ? "/logo-dark.png" : "/logo-light.png"}
                                alt="HUMI AWAKE"
                                className="h-8 w-auto object-contain"
                            />
                        </button>
                    </div>

                    {!isTopLevel && (
                        <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors dark:text-slate-400 dark:hover:bg-slate-800"
                                title="Go Back"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <LayoutGrid className="w-6 h-6" />
                    </button>
                </div>
            </header>
            <main className="px-4 py-6 max-w-md mx-auto w-full">
                {children || <Outlet />}
            </main>

            {/* Bottom Navigation (Mobile Only) */}
            <BottomNav onOpenMenu={() => setIsMenuOpen(true)} />

            {/* Overlay Menu */}
            <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* AI Health Assistant Removed */}
            {/* <ChatWidget /> */}
        </div>
    );
};

export default MainLayout;
