import { motion } from 'framer-motion';
import { useDate } from '../../context/DateContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import xogo from '../../assets/xogo.png';

const DashboardHero = ({ percentage = 0, completedCount = 0, totalCount = 0 }) => {
    const { currentDate } = useDate();
    const navigate = useNavigate();

    // Format: "Sunday, Jan 25"
    const displayDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    }).format(currentDate);

    // Routine State Logic
    const getRoutineState = () => {
        if (percentage === 0) return {
            status: "Ready to Start",
            color: "text-white/80"
        };
        if (percentage === 100) return {
            status: "All Done",
            color: "text-emerald-200"
        };
        return {
            status: "In Progress",
            color: "text-primary-200"
        };
    };

    const state = getRoutineState();

    // Dynamic background based on time of day
    const getBackgroundClass = () => {
        if (percentage === 100) return "from-emerald-600 to-teal-800 shadow-emerald-500/20";

        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "bg-gradient-to-br from-primary-500 to-primary-700 shadow-primary-500/30"; // Morning
        if (hour >= 12 && hour < 17) return "bg-gradient-to-br from-primary-600 to-primary-800 shadow-primary-600/40"; // Afternoon
        if (hour >= 17 && hour < 20) return "bg-gradient-to-br from-primary-700 to-primary-900 shadow-primary-700/40"; // Evening
        return "bg-slate-900 shadow-slate-900/50 ring-1 ring-white/10"; // Night - Deep Blue/Slate
    };

    return (
        <div className={clsx(
            "relative rounded-[2.5rem] overflow-hidden p-6 transition-all duration-1000 bg-gradient-to-br shadow-2xl",
            getBackgroundClass()
        )}>
            {/* Ambient Background Elements - Animated */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none mix-blend-overlay"
            />
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"
            />

            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6">

                {/* Header / Date */}
                <div className="flex flex-col items-center space-y-1">
                    <h2 className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase">Today's Focus</h2>
                    <h1 className="text-white text-lg font-medium tracking-wide">{displayDate}</h1>
                </div>

                {/* GO Button System with Progress Ring */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                    {/* Rotating Background Decor Ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
                    >
                        <div className="w-full h-full rounded-full border-2 border-dashed border-white/50"></div>
                    </motion.div>

                    {/* Counter-Rotating Inner Decor Ring */}
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] pointer-events-none opacity-10"
                    >
                        <div className="w-full h-full rounded-full border border-dotted border-white"></div>
                    </motion.div>

                    {/* SVG Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-2xl" viewBox="0 0 160 160">
                        {/* Glow Effect behind ring */}
                        <motion.circle
                            animate={{ opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            cx="80" cy="80" r="70" stroke="white" strokeWidth="0" fill="none"
                            className={clsx("blur-md", percentage > 0 ? "opacity-30" : "opacity-0")}
                        />

                        {/* Background Ring - Solid */}
                        <circle cx="80" cy="80" r="74" fill="none" stroke="currentColor" strokeWidth="4" className="text-black/10" />

                        {/* Progress Ring */}
                        <motion.circle
                            initial={{ strokeDashoffset: 2 * Math.PI * 74 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 74 * (1 - percentage / 100) }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="80"
                            cy="80"
                            r="74"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 74}`}
                            className={clsx(
                                "drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]",
                                percentage === 100 ? "text-emerald-300" : "text-white"
                            )}
                        />
                    </svg>

                    {/* The Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={percentage < 100 ? {
                            boxShadow: ["0 0 0 rgba(255,255,255,0)", "0 0 20px rgba(255,255,255,0.3)", "0 0 0 rgba(255,255,255,0)"]
                        } : {}}
                        transition={percentage < 100 ? { duration: 2, repeat: Infinity } : {}}
                        onClick={() => navigate('/routine')}
                        className={clsx(
                            "w-36 h-36 rounded-full flex items-center justify-center relative z-20 transition-colors duration-500",
                            percentage === 100
                                ? "bg-emerald-500 shadow-emerald-900/50 shadow-xl"
                                : "bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl"
                        )}
                    >
                        <motion.div
                            animate={{ opacity: [0, 0.5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={clsx(
                                "absolute inset-0 rounded-full blur-xl",
                                percentage === 100 ? "bg-emerald-400/60" : "bg-white/30"
                            )}
                        />

                        <motion.img
                            src={xogo}
                            alt="XO GO!"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className={clsx(
                                "w-20 h-auto z-30 drop-shadow-lg",
                                percentage === 100 ? "brightness-125" : "brightness-110"
                            )}
                        />
                    </motion.button>
                </div>

                {/* Status Indicator */}
                <div className="space-y-1">
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/20 backdrop-blur-sm border border-white/5"
                    >
                        <span className={clsx("w-2 h-2 rounded-full animate-pulse", percentage === 100 ? "bg-emerald-400" : "bg-primary-300")}></span>
                        <span className={clsx("text-xs font-bold uppercase tracking-wider", state.color)}>
                            {state.status}
                        </span>
                    </motion.div>
                    {percentage > 0 && (
                        <p className="text-white/50 text-[10px] font-medium tracking-wide">
                            {completedCount} / {totalCount} completed
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardHero;
