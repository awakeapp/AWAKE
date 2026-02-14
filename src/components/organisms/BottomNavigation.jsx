import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CheckCircle2, IndianRupee, Car, ListTodo } from 'lucide-react';
import { useState, useEffect } from 'react';

// Import lazy modules for prefetching (using Vite's dynamic import pattern)
const prefetchRoutes = {
    '/': () => import('../../pages/Home'),
    '/routine': () => import('../../pages/Routine'),
    '/workspace': () => import('../../pages/workspace/TaskDashboard'), // Correct entry point
    '/finance': () => import('../../pages/finance/FinanceDashboard'),
    '/vehicle': () => import('../../pages/vehicle/VehicleDashboard'),
};

const NavLink = ({ to, icon: Icon, label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex-1 flex items-center justify-center relative h-12 group"
            aria-label={label}
            onMouseEnter={() => {
                if (prefetchRoutes[to]) prefetchRoutes[to]();
            }}
            onTouchStart={() => {
                 if (prefetchRoutes[to]) prefetchRoutes[to]();
            }}
        >
            {isActive && (
                <div className="absolute inset-x-2 inset-y-2 bg-blue-500 rounded-xl opacity-100 shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-in fade-in zoom-in duration-200" />
            )}
            <Icon 
                className={`w-6 h-6 relative z-10 transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-white group-hover:scale-110'}`} 
                strokeWidth={isActive ? 2.5 : 2} 
            />
        </button>
    );
};

const BottomNavigation = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(pathname);

    // Sync with external navigation (back/forward interaction)
    useEffect(() => {
        setActiveTab(pathname);
    }, [pathname]);

    const handleNav = (path) => {
        setActiveTab(path); // Optimistic update: Instant feedback
        navigate(path);
    };

    // Helper to determine active state (handling sub-routes)
    const isActive = (path) => activeTab === path || (path !== '/' && activeTab.startsWith(path));

    return (
        <nav className="fixed bottom-5 left-0 right-0 z-50 sm:hidden flex justify-center px-4">
            <div className="flex items-center justify-between w-full max-w-sm bg-slate-900/95 border border-slate-700/50 rounded-full px-2 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl ring-1 ring-white/10">
                <NavLink 
                    to="/" 
                    icon={Home} 
                    label="Home" 
                    isActive={activeTab === '/'} 
                    onClick={() => handleNav('/')} 
                />
                <NavLink 
                    to="/routine" 
                    icon={CheckCircle2} 
                    label="Routine" 
                    isActive={isActive('/routine')} 
                    onClick={() => handleNav('/routine')} 
                />
                <NavLink 
                    to="/workspace" 
                    icon={ListTodo} 
                    label="To-Do" 
                    isActive={isActive('/workspace')} 
                    onClick={() => handleNav('/workspace')} 
                />
                <NavLink 
                    to="/finance" 
                    icon={IndianRupee} 
                    label="Finance" 
                    isActive={isActive('/finance')} 
                    onClick={() => handleNav('/finance')} 
                />
                <NavLink 
                    to="/vehicle" 
                    icon={Car} 
                    label="Vehicle" 
                    isActive={isActive('/vehicle')} 
                    onClick={() => handleNav('/vehicle')} 
                />
            </div>
        </nav>
    );
};

export default BottomNavigation;
