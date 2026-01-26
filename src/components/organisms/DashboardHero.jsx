import { motion } from 'framer-motion';
import { useDate } from '../../context/DateContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, User } from 'lucide-react';
import clsx from 'clsx';

const DashboardHero = ({ percentage = 0, completedCount = 0, totalCount = 0, onOpenMenu }) => {
    const { currentDate } = useDate();
    const { isDark, toggleTheme } = useTheme();
    const { user } = useAuthContext();
    const navigate = useNavigate();

    // Format: "Sunday · Jan 25"
    const displayDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    }).format(currentDate).replace(',', ' ·');

    // Routine State Logic
    const getRoutineState = () => {
        if (percentage === 0) return {
            status: "Routine not started",
            action: "START ROUTINE",
            color: "text-slate-500 dark:text-slate-400"
        };
        if (percentage === 100) return {
            status: "Routine completed",
            action: "REVIEW ROUTINE",
            color: "text-emerald-500"
        };
        return {
            status: "Routine in progress",
            action: "CONTINUE ROUTINE",
            color: "text-indigo-500"
        };
    };

    const state = getRoutineState();

    // Dynamic background based on time of day or completion
    const getBackgroundColor = () => {
        if (percentage === 100) {
            return "bg-emerald-600 dark:bg-emerald-900"; // Green when completed
        }

        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            return "bg-sky-600 dark:bg-sky-900"; // Morning: Sky Blue (lighter)
        } else if (hour >= 12 && hour < 17) {
            return "bg-blue-600 dark:bg-blue-900"; // Afternoon: Blue
        } else if (hour >= 17 && hour < 20) {
            return "bg-indigo-600 dark:bg-indigo-900"; // Evening: Indigo (deeper blue)
        } else {
            return "bg-blue-800 dark:bg-blue-950"; // Night: Navy (darkest blue)
        }
    };

    return (
        <div className={`pt-2 pb-8 ${getBackgroundColor()}`}>

            {/* Zone 1: Routine Command Center */}
            <div className="flex flex-col items-center justify-center text-center space-y-6 mt-4">
                {/* Date Display */}
                <div className="inline-block px-6 py-2.5 rounded-full bg-white/10 dark:bg-white/5 border border-white/20">
                    <h2 className="text-base font-medium text-white tracking-wide">
                        {displayDate}
                    </h2>
                </div>

                {/* GO Button System with Progress Ring */}
                <div className="relative">
                    {/* SVG Progress Ring */}
                    <svg
                        className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                        viewBox="0 0 160 160"
                    >
                        {/* Background Ring */}
                        <circle
                            cx="80"
                            cy="80"
                            r="75"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-white/20"
                        />
                        {/* Progress Ring */}
                        <circle
                            cx="80"
                            cy="80"
                            r="75"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 75}`}
                            strokeDashoffset={`${2 * Math.PI * 75 * (1 - percentage / 100)}`}
                            className={clsx(
                                "transition-all duration-700 ease-out",
                                percentage === 100
                                    ? "text-emerald-400"
                                    : "text-white"
                            )}
                        />
                    </svg>

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/routine')}
                        className={clsx(
                            "w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-300 relative z-10",
                            percentage === 100
                                ? "bg-emerald-500 text-white"
                                : "bg-indigo-700 dark:bg-indigo-800 text-white"
                        )}
                    >
                        <img
                            src="/xogo.png"
                            alt="XO GO!"
                            className="w-24 h-auto"
                        />
                    </motion.button>
                </div>

                {/* Routine State Indicator */}
                <div className="space-y-1.5">
                    <p className={clsx("text-xs font-semibold uppercase tracking-wide",
                        percentage === 100 ? "text-emerald-300" : "text-white/70"
                    )}>
                        {state.status}
                    </p>
                    {percentage > 0 && percentage < 100 && (
                        <p className="text-xl font-bold text-white tabular-nums">
                            {percentage}<span className="text-sm text-white/60">%</span>
                            <span className="text-xs text-white/50 font-medium ml-2">• {completedCount}/{totalCount} completed</span>
                        </p>
                    )}
                    {percentage === 100 && totalCount > 0 && (
                        <p className="text-sm text-emerald-300/80 font-medium">
                            {totalCount}/{totalCount} completed
                        </p>
                    )}
                    {percentage === 0 && totalCount > 0 && (
                        <p className="text-sm text-white/50 font-medium">
                            0/{totalCount} completed
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardHero;
