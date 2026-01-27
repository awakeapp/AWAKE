import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Settings, LogOut, Sun, Cloud, ChefHat, Heart } from 'lucide-react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useLogout } from '../../hooks/useLogout';
import { cn } from '../../lib/utils';
import awakeLogo from '../../assets/awake_logo_new.png';

const Sidebar = ({ onClose }) => {
    const { logout } = useLogout();
    const { user } = useAuthContext();

    const navItems = [
        { icon: LayoutDashboard, label: 'Today', path: '/' },
        { icon: Calendar, label: 'History', path: '/history' },
        { icon: ChefHat, label: 'Diet Planner', path: '/diet-planner' },
        { icon: Heart, label: 'Nutrition', path: '/nutrition-helper' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-center gap-2">
                <img src={awakeLogo} alt="Logo" className="h-8 w-auto object-contain dark:brightness-0 dark:invert" />
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                            isActive
                                ? "bg-primary-50 text-primary-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-100">
                <div className="mb-4 px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <Cloud className="w-3 h-3" />
                        <span>Sync Status</span>
                    </div>
                    <span className="text-sm font-medium text-slate-700">All synced</span>
                </div>

                <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-slate-700 truncate">{user?.displayName || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div >
    );
};

export default Sidebar;
