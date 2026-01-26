import { useDate } from '../../context/DateContext';
import { useAuthContext } from '../../context/AuthContext';
import { useLogout } from '../../hooks/useLogout';
import { User, LogOut } from 'lucide-react';

const Navbar = () => {
    const { formattedDate, isToday } = useDate();
    const { user } = useAuthContext();
    const { logout, isPending } = useLogout();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between dark:bg-slate-900/80 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">HUMI AWAKE</h1>
                <span className={`text-sm text-slate-500 ${isToday ? '' : 'opacity-50'}`}>{isToday ? 'Today' : formattedDate}</span>
            </div>
            {user && (
                <button onClick={handleLogout} disabled={isPending} className="p-2 rounded-full hover:bg-slate-100 transition-colors dark:hover:bg-slate-800">
                    <LogOut className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
            )}
        </header>
    );
};

export default Navbar;
