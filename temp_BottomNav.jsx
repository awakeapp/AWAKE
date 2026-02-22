import { ListTodo, Wallet, Car, Repeat, Home } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const BottomNav = () => {
    return (
        <div className="fixed bottom-6 left-4 right-4 md:hidden z-50 animate-fade-in-up">
            {/* Pill Container */}
            <div className="bg-slate-900 rounded-full px-6 py-3 flex items-center justify-between shadow-2xl shadow-slate-900/40 ring-1 ring-white/10 relative">

                {/* 0. Home (Cockpit/Routine) */}
                <NavLink
                    to="/"
                    className={({ isActive }) => clsx(
                        "p-3 rounded-full transition-all duration-300 relative flex items-center justify-center",
                        isActive
                            ? "text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-110"
                            : "text-slate-400 hover:text-blue-400 hover:scale-110 hover:bg-white/5"
                    )}
                >
                    <Home className="w-6 h-6" />
                </NavLink>

                {/* 1. Tasks */}
                <NavLink
                    to="/workspace"
                    className={({ isActive }) => clsx(
                        "p-3 rounded-full transition-all duration-300 relative flex items-center justify-center",
                        isActive
                            ? "text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-110"
                            : "text-slate-400 hover:text-blue-400 hover:scale-110 hover:bg-white/5"
                    )}
                >
                    <ListTodo className="w-6 h-6" />
                </NavLink>

                {/* 2. Finance */}
                <NavLink
                    to="/finance"
                    className={({ isActive }) => clsx(
                        "p-3 rounded-full transition-all duration-300 relative flex items-center justify-center",
                        isActive
                            ? "text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-110"
                            : "text-slate-400 hover:text-blue-400 hover:scale-110 hover:bg-white/5"
                    )}
                >
                    <Wallet className="w-6 h-6" />
                </NavLink>

                {/* 3. Vehicle */}
                <NavLink
                    to="/vehicle"
                    className={({ isActive }) => clsx(
                        "p-3 rounded-full transition-all duration-300 relative flex items-center justify-center",
                        isActive
                            ? "text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-110"
                            : "text-slate-400 hover:text-blue-400 hover:scale-110 hover:bg-white/5"
                    )}
                >
                    <Car className="w-6 h-6" />
                </NavLink>

            </div>
        </div>
    );
};

export default BottomNav;
