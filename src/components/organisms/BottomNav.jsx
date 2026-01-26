import { Home, ListTodo, Wallet, Car, Play } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const BottomNav = () => {
    // New Hierarchy: Home, Tasks, GO (Routine), Finance, Vehicle

    return (
        <div className="fixed bottom-6 left-4 right-4 md:hidden z-50">
            {/* Pill Container */}
            <div className="bg-slate-900 dark:bg-black rounded-full px-2 py-2 flex items-center justify-between shadow-2xl shadow-slate-900/20 ring-1 ring-white/10 relative">

                {/* 1. Home */}
                <NavLink
                    to="/"
                    className={({ isActive }) => clsx(
                        "p-3 rounded-full transition-colors relative",
                        isActive ? "text-white bg-white/10" : "text-slate-400 hover:text-white"
                    )}
                >
                    <Home className="w-5 h-5" />
                </NavLink>

                {/* 2. Tasks (Workspace) */}
                <NavLink
                    to="/workspace"
                    className={({ isActive }) => clsx(
                        "p-3 rounded-full transition-colors relative",
                        isActive ? "text-white bg-white/10" : "text-slate-400 hover:text-white"
                    )}
                >
                    <ListTodo className="w-5 h-5" />
                </NavLink>

                {/* 3. GO / Routine (Central Floating) */}
                <div className="relative -top-1">
                    <NavLink
                        to="/routine"
                        className={({ isActive }) => clsx(
                            "flex items-center justify-center w-16 h-16 rounded-full shadow-xl transition-transform duration-300",
                            "bg-indigo-600 text-white shadow-indigo-600/40", // Blue background like above, no ring
                            isActive ? "scale-105" : "hover:scale-105"
                        )}
                    >
                        <img
                            src="/xogo.png"
                            alt="GO"
                            className="w-10 h-auto drop-shadow-sm"
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
