import { Home, ListTodo, Wallet, Car, Play } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import xogo from '../../assets/xogo.png';

const BottomNav = () => {
    const location = useLocation();
    const isRoutineActive = location?.pathname === '/routine';

    return (
        <div className="fixed bottom-6 left-4 right-4 md:hidden z-50 animate-fade-in-up">
            {/* Pill Container */}
            <div className="bg-slate-900 rounded-full px-2 py-2 flex items-center justify-between shadow-2xl shadow-slate-900/40 ring-1 ring-white/10 relative">

                {/* 1. Home */}
                <NavLink
                    to="/"
                    className={({ isActive }) => clsx(
                        "p-3 rounded-full transition-colors relative",
                        isActive ? "text-white bg-white/10 shadow-inner" : "text-slate-400 hover:text-white"
                    )}
                >
                    <Home className="w-5 h-5" />
                </NavLink>

                {/* 2. Tasks (Workspace) */}
                <NavLink
                    to="/workspace"
                    className={({ isActive }) => clsx(
                        "p-3 rounded-full transition-colors relative",
                        isActive ? "text-white bg-white/10 shadow-inner" : "text-slate-400 hover:text-white"
                    )}
                >
                    <ListTodo className="w-5 h-5" />
                </NavLink>

                {/* 3. GO / Routine (Central Floating) */}
                <div className="relative -top-1">
                    <NavLink
                        to="/routine"
                        className={clsx(
                            "flex items-center justify-center w-16 h-16 rounded-full shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-all duration-300",
                            "bg-primary-600 text-white shadow-primary-600/40 border-2 border-white/20",
                            isRoutineActive ? "scale-110 shadow-primary-600/60 ring-4 ring-primary-500/20" : "hover:scale-105"
                        )}
                    >
                        <img
                            src={xogo}
                            alt="GO"
                            className="w-10 h-auto drop-shadow-sm brightness-110"
                        />
                    </NavLink>
                </div>

                {/* 4. Finance */}
                <NavLink
                    to="/finance"
                    className={({ isActive }) => clsx(
                        "p-3 rounded-full transition-colors relative",
                        isActive ? "text-white bg-white/10" : "text-slate-400 hover:text-white"
                    )}
                >
                    <Wallet className="w-5 h-5" />
                </NavLink>

                {/* 5. Vehicle */}
                <NavLink
                    to="/vehicle"
                    className={({ isActive }) => clsx(
                        "p-3 rounded-full transition-colors relative",
                        isActive ? "text-white bg-white/10" : "text-slate-400 hover:text-white"
                    )}
                >
                    <Car className="w-5 h-5" />
                </NavLink>

            </div>
        </div>
    );
};

export default BottomNav;
