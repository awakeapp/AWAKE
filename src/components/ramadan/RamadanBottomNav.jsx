import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Moon, Heart, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NavLink = ({ to, icon: Icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className="flex-1 flex flex-col items-center justify-center relative py-2 gap-1 group"
    >
        <Icon 
            className={`w-[22px] h-[22px] transition-all duration-300 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} 
            strokeWidth={isActive ? 2.5 : 2} 
        />
        <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {label}
        </span>
    </button>
);

const RamadanBottomNav = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleNav = (path) => navigate(path);

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between w-full px-4">
                <NavLink 
                    to="/" 
                    icon={Home} 
                    label="AWAKE" 
                    isActive={false} 
                    onClick={() => handleNav('/')} 
                />
                <NavLink 
                    to="/ramadan" 
                    icon={Moon} 
                    label="Ramadan" 
                    isActive={pathname === '/ramadan'} 
                    onClick={() => handleNav('/ramadan')} 
                />
                <NavLink 
                    to="/ramadan/dhikr" 
                    icon={Heart} 
                    label="Dhikr" 
                    isActive={pathname === '/ramadan/dhikr'} 
                    onClick={() => handleNav('/ramadan/dhikr')} 
                />
                <NavLink 
                    to="/ramadan/stats" 
                    icon={BarChart2} 
                    label="Stats" 
                    isActive={pathname === '/ramadan/stats'} 
                    onClick={() => handleNav('/ramadan/stats')} 
                />
            </div>
        </nav>
    );
};

export default RamadanBottomNav;
