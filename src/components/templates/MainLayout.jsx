import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Suspense } from 'react';

import SideMenu from '../organisms/SideMenu';
import BottomNavigation from '../organisms/BottomNavigation';
import RamadanBottomNav from '../ramadan/RamadanBottomNav';
import { AppHeader } from '../ui/AppHeader';
import { Menu } from 'lucide-react';
import { RAMADAN_MODE } from '../../lib/featureFlags';

import { useDate } from '../../context/DateContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useState } from 'react';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';

const MainLayout = ({ children }) => {
    const { user } = useAuthContext();
    const { formattedDate } = useDate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Top-level routes have no back button
    const topLevelRoutes = ['/', '/routine', '/history', '/settings'];
    const isTopLevel = topLevelRoutes.includes(location.pathname);

    // Pages that have their own header — hide the global AppHeader
    const hiddenHeaderRoutes = ['/routine', '/history', '/settings', '/finance', '/vehicle', '/diet', '/analytics', '/profile', '/about'];
    const showHeader = !hiddenHeaderRoutes.some(route => location.pathname.startsWith(route));

    // Full-bleed routes: page manages its own layout — no wrapper padding or max-width
    const fullBleedRoutes = ['/finance', '/vehicle', '/diet', '/analytics', '/profile', '/about'];
    const isFullBleed = fullBleedRoutes.some(route => location.pathname.startsWith(route));

    const { isDark } = useTheme();
    const swipeHandlers = useSwipeNavigation();
    const isRamadanPath = RAMADAN_MODE && location.pathname.startsWith('/ramadan');

    const Loader = (
        <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div
            className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors"
            style={isFullBleed ? undefined : { paddingBottom: '5rem' }}
            {...swipeHandlers}
        >
            {/* Global AppHeader — hidden on pages with their own header */}
            {showHeader && (
                <AppHeader
                    title=""
                    showBack={!isTopLevel}
                    onBack={() => navigate(-1)}
                    leftNode={
                        <button
                            onClick={() => navigate('/profile')}
                            className="focus:outline-none hover:opacity-80 transition-opacity flex items-center justify-center"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ring-1 ring-white dark:ring-slate-700 overflow-hidden ${user?.profileColor ? `${user.profileColor} text-white` : 'bg-indigo-100 text-indigo-600'}`}>
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt={user?.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="uppercase">{user?.initials || user?.name?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                        </button>
                    }
                    rightNode={
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    }
                />
            )}

            {/* Page Content */}
            {isFullBleed ? (
                /* Full-bleed: zero wrapper — the page controls its own paddings, width, and header */
                <Suspense fallback={Loader}>
                    {children || <Outlet />}
                </Suspense>
            ) : (
                <main className="px-4 py-6 max-w-md mx-auto w-full">
                    <Suspense fallback={Loader}>
                        {children || <Outlet />}
                    </Suspense>
                    <div className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] text-center mt-8 mb-2 opacity-60">
                        Developed by CoolCraft
                    </div>
                </main>
            )}

            {/* Bottom Navigation — swap to Ramadan nav on /ramadan/* paths */}
            {isRamadanPath ? <RamadanBottomNav /> : <BottomNavigation />}

            {/* Side Menu Drawer */}
            <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </div>
    );
};

export default MainLayout;
