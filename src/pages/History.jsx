import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useDate } from '../context/DateContext';
import { useAuthContext } from '../hooks/useAuthContext';
import { Card, CardContent } from '../components/atoms/Card';
import JumpDateModal from '../components/organisms/JumpDateModal';
import { Calendar as CalendarIcon, PieChart, AlertCircle, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const History = () => {
    const { dailyData } = useData();
    const { formattedDate, setDate, isToday } = useDate();
    const { user } = useAuthContext();
    const [showJumpModal, setShowJumpModal] = useState(false);
    const [streakData, setStreakData] = useState([]);

    // --- Streak Logic (Last 30 Days) ---
    // --- Streak Logic (Last 30 Days) ---
    const { getHistory } = useData();

    useEffect(() => {
        const historyData = getHistory(30);
        // Map to format expected by UI
        const mapped = historyData.map(day => {
            let status = 'none';
            if (day.score === 100) status = 'perfect';
            else if (day.score >= 50) status = 'good';
            else if (day.score > 0) status = 'partial';
            else if (day.data && day.data.tasks) status = 'empty'; // Was accessed but no completion

            // Format format:
            // "keyDate" for logic (YYYY-MM-DD from getHistory)
            // "date" object for UI
            const parts = day.date.split('-');
            const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);

            return {
                date: dateObj,
                keyDate: day.date,
                status,
                score: day.score
            };
        });
        setStreakData(mapped);
    }, [dailyData]); // Re-run if today's data changes

    // --- Report Calculations ---
    const totalTasks = dailyData.tasks?.length || 0;
    const completedTasks = dailyData.tasks?.filter(t => t.status === 'checked') || [];
    const missedTasks = dailyData.tasks?.filter(t => t.status === 'missed') || [];
    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    const violations = [];
    if (dailyData.habits?.junkFood) violations.push("Ate Junk Food");
    if (dailyData.habits?.sugar) violations.push("Consumed Sugar");
    if (dailyData.habits?.coldDrinks) violations.push("Drank Cold Drinks");
    if (dailyData.habits?.screenTime > 2) violations.push(`High Screen Time (${dailyData.habits.screenTime}h)`);

    const improvements = [
        ...missedTasks.map(t => `Missed task: ${t.name}`),
        ...violations.map(v => `Avoid: ${v}`)
    ];

    return (
        <div className="pb-24 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Report History</h2>
                <button
                    onClick={() => setShowJumpModal(true)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-indigo-600 rounded-full transition-colors dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-indigo-400"
                >
                    <CalendarIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Streak Tape */}
            <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                <div className="flex gap-3 w-max">
                    {streakData.map((day) => {
                        const isSelected = day.keyDate === formattedDate;
                        return (
                            <button
                                key={day.keyDate}
                                onClick={() => setDate(day.date)}
                                className={clsx(
                                    "flex flex-col items-center gap-1 min-w-[3.5rem] p-2 rounded-2xl transition-all border",
                                    isSelected
                                        ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-500/30 scale-105"
                                        : "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800 hover:border-indigo-200"
                                )}
                            >
                                <span className={clsx("text-[10px] font-bold uppercase", isSelected ? "text-indigo-200" : "text-slate-400")}>
                                    {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <div className={clsx(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2",
                                    isSelected ? "bg-white text-indigo-700 border-transparent" : "",
                                    !isSelected && day.status === 'perfect' && "bg-emerald-100 text-emerald-700 border-emerald-200",
                                    !isSelected && day.status === 'good' && "bg-blue-100 text-blue-700 border-blue-200",
                                    !isSelected && day.status === 'partial' && "bg-orange-100 text-orange-700 border-orange-200",
                                    !isSelected && (day.status === 'none' || day.status === 'empty') && "bg-slate-50 text-slate-300 border-slate-100 dark:bg-slate-800 dark:border-slate-700"
                                )}>
                                    {day.date.getDate()}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Date Report */}
            <motion.div
                key={formattedDate}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
            >
                <div className="text-center mb-6">
                    <h3 className="text-lg font-medium text-slate-500 dark:text-slate-400">
                        Overview for <span className="text-slate-900 dark:text-white font-bold">{new Date(formattedDate + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                    </h3>
                </div>

                {/* Score Card */}
                <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <PieChart size={120} />
                    </div>
                    <CardContent className="p-6 relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-indigo-200 font-medium mb-1">Daily Score</p>
                            <div className="text-5xl font-black tracking-tight flex items-baseline gap-1">
                                {completionRate}
                                <span className="text-2xl opacity-60">%</span>
                            </div>
                            <p className="text-sm text-indigo-100 mt-2 opacity-80">
                                {completedTasks.length} / {totalTasks} tasks completed
                            </p>
                        </div>
                        <div className="w-24 h-24 rounded-full border-8 border-white/20 flex items-center justify-center relative">
                            <TrendingUp className="w-10 h-10 text-white" />
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-bold text-emerald-900 dark:text-emerald-100">Completed</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{completedTasks.length}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-800/30">
                        <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <span className="font-bold text-red-900 dark:text-red-100">Missed</span>
                        </div>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">{missedTasks.length}</p>
                    </div>
                </div>

                {/* Violations */}
                {violations.length > 0 && (
                    <Card className="border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30">
                        <CardContent className="p-5">
                            <h4 className="font-bold text-red-800 dark:text-red-200 flex items-center gap-2 mb-3">
                                <AlertCircle className="w-5 h-5" />
                                Violations Detected
                            </h4>
                            <ul className="space-y-2">
                                {violations.map((v, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                        {v}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Improvements */}
                {improvements.length > 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase text-xs tracking-wider">
                            Areas to Improve
                        </h4>
                        <ul className="space-y-3">
                            {improvements.map((item, i) => (
                                <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0 text-slate-400 text-xs font-bold border border-slate-100 dark:border-slate-700">
                                        {i + 1}
                                    </div>
                                    <span className="py-0.5">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-6 text-center border-dashed border-2 border-emerald-100 dark:border-emerald-800/30">
                        <p className="text-emerald-700 dark:text-emerald-300 font-medium">No improvements needed! Perfect day!</p>
                    </div>
                )}
            </motion.div>

            {/* Jump Date Modal */}
            <JumpDateModal
                isOpen={showJumpModal}
                onClose={() => setShowJumpModal(false)}
            />
        </div>
    );
};

export default History;
