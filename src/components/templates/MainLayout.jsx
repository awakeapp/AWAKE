import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Suspense } from 'react';

import SideMenu from '../organisms/SideMenu';
import BottomNavigation from '../organisms/BottomNavigation';
import { AppHeader } from '../ui/AppHeader';
import { LayoutGrid, ArrowLeft, Droplet, Moon, Sun } from 'lucide-react';

import { useDate } from '../../context/DateContext';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';
import awakeLogo from '../../assets/awake_logo_new.png';

const MainLayout = ({ children }) => {
    const { formattedDate } = useDate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Check for Top-Level Pages (No Back Button)
    const topLevelRoutes = ['/', '/routine', '/history', '/settings'];
    const isTopLevel = topLevelRoutes.includes(location.pathname);

    // Completely hide top header on these sections
    const hiddenHeaderRoutes = ['/routine', '/history', '/settings', '/finance', '/vehicle', '/diet', '/analytics'];
    const showHeader = !hiddenHeaderRoutes.some(route => location.pathname.startsWith(route));

    const { isDark } = useTheme();

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 dark:bg-slate-950 dark:text-slate-50 transition-colors">
            {/* Top Navigation using unified AppHeader */}
            {showHeader && (
                <AppHeader 
                    title=""
                    showBack={!isTopLevel}
                onBack={() => navigate(-1)}
                leftNode={
                    <button
                        onClick={() => navigate('/')}
                        className="focus:outline-none hover:opacity-80 transition-opacity"
                    >
                        <img
                            src={awakeLogo}
                            alt="HUMI AWAKE"
                            className="h-8 w-auto object-cover dark:brightness-0 dark:invert"
                        />
                    </button>
                }
                rightNode={
                    <>
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            <LayoutGrid className="w-6 h-6" />
                        </button>
                    </>
                }
            />
            )}
            <main className="px-4 py-6 max-w-md mx-auto w-full">
                <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}>
                    {children || <Outlet />}
                </Suspense>
                <div className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] text-center mt-8 mb-2 opacity-60">
                    Developed by CoolCraft
                </div>
            </main>

            {/* Bottom Navigation (Mobile Only) */}
            {/* Bottom Navigation (Mobile Only) */}
            <BottomNavigation />


            {/* Overlay Menu */}
            <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* AI Health Assistant Removed */}
            {/* <ChatWidget /> */}
        </div>
    );
};



export default MainLayout;
