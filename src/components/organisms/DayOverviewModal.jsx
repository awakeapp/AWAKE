import { motion, AnimatePresence } from 'framer-motion';
import Button from '../atoms/Button';
import { CheckCircle2, AlertCircle, X, Lock, Pizza, Candy, Salad, CheckCircle, Wallet, Smartphone, GlassWater, Activity } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import clsx from 'clsx';

const HABIT_COMPONENTS = {
    Pizza, Candy, Salad, CheckCircle, Wallet, Smartphone, GlassWater, Activity
};

const DayOverviewModal = ({ isOpen, onClose, data, onConfirm }) => {
    if (!isOpen) return null;

    const totalTasks = data.tasks.length;
    const completed = data.tasks.filter(t => t.status === 'checked').length;
    const missed = data.tasks.filter(t => t.status === 'missed').length;
    const percentage = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    // Finance Stats
    const { getDailySpend, getWeeklySavings } = useFinance();
    const dailySpend = getDailySpend();
    const weeklySavings = getWeeklySavings();

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/20 backdrop-blur-sm">
                <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="w-full sm:max-w-md bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
                >
                    <div className="p-8">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">Day Overview</h2>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Daily Recap</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-all active:bg-slate-200 dark:active:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Completion Rate Circle */}
                        <div className="flex flex-col items-center justify-center mb-10">
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                {/* Background Circle */}
                                <svg className="absolute w-full h-full -rotate-90">
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="72"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="text-slate-100 dark:text-slate-800"
                                    />
                                    <motion.circle
                                        cx="80"
                                        cy="80"
                                        r="72"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeDasharray="452.39"
                                        initial={{ strokeDashoffset: 452.39 }}
                                        animate={{ strokeDashoffset: 452.39 - (452.39 * percentage) / 100 }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className="text-indigo-500"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="text-center z-10">
                                    <div className="flex flex-col items-center">
                                        <span className="text-6xl font-light text-slate-900 dark:text-white tracking-tight">
                                            {percentage}<span className="text-2xl font-light text-indigo-500 ml-0.5">%</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-medium mt-2 tracking-[0.2em] uppercase">Completion Rate</p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <div className="bg-emerald-50/30 dark:bg-emerald-500/5 p-4 rounded-3xl flex flex-col items-center ring-1 ring-emerald-500/5 hover:bg-emerald-50/50 transition-colors">
                                <div className="w-8 h-8 bg-white dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-2 shadow-sm ring-1 ring-emerald-500/10">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <span className="text-xl font-medium text-slate-900 dark:text-white">{completed}</span>
                                <span className="text-[9px] font-medium text-emerald-600/60 dark:text-emerald-500/60 uppercase tracking-widest mt-1">Completed</span>
                            </div>
                            <div className="bg-rose-50/30 dark:bg-rose-500/5 p-4 rounded-3xl flex flex-col items-center ring-1 ring-rose-500/5 hover:bg-rose-50/50 transition-colors">
                                <div className="w-8 h-8 bg-white dark:bg-rose-500/10 rounded-full flex items-center justify-center mb-2 shadow-sm ring-1 ring-rose-500/10">
                                    <AlertCircle className="w-4 h-4 text-rose-500" />
                                </div>
                                <span className="text-xl font-medium text-slate-900 dark:text-white">{missed}</span>
                                <span className="text-[9px] font-medium text-rose-600/60 dark:text-rose-500/60 uppercase tracking-widest mt-1">Missed</span>
                            </div>
                        </div>

                        {/* Finance Block */}
                        <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl p-5 mb-8 flex justify-between items-center ring-1 ring-slate-200/40 dark:ring-slate-800/40">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
                                    <Wallet className="w-4 h-4 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.1em] mb-0.5">Today's Spend</p>
                                    <p className="text-base font-medium text-slate-700 dark:text-slate-200">₹{dailySpend.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.1em] mb-0.5">Weekly Save</p>
                                <p className={clsx(
                                    "text-base font-medium",
                                    weeklySavings >= 0 ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    {weeklySavings >= 0 ? '+' : ''}₹{weeklySavings.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Habits Section */}
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-5 px-1">
                                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800/40"></div>
                                <h4 className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em] text-center">Habit Breakdown</h4>
                                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800/40"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                                {data?.habits?.map((habit) => {
                                    const Icon = HABIT_COMPONENTS[habit.icon] || CheckCircle;
                                    const isPositive = habit.type === 'toggle' ? !habit.value : habit.value > 0;

                                    let displayLabel = habit.label;
                                    if (habit.type === 'toggle') {
                                        displayLabel = habit.value ? habit.label : `No ${habit.label.replace('?', '')}`;
                                    } else {
                                        const shortUnit = habit.unit === 'hrs' ? 'hr' : 'min';
                                        displayLabel = `${habit.value}${shortUnit} ${habit.label}`;
                                    }

                                    return (
                                        <div key={habit.id} className="flex items-start gap-2.5">
                                            <div className={clsx(
                                                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                                isPositive
                                                    ? "bg-emerald-500/5 text-emerald-500"
                                                    : "bg-rose-500/5 text-rose-500"
                                            )}>
                                                {isPositive ? <CheckCircle className="w-3.5 h-3.5 stroke-[2]" /> : <Icon className="w-3.5 h-3.5 stroke-[2]" />}
                                            </div>
                                            <div className="flex flex-col min-w-0 pt-0.5">
                                                <span className={clsx(
                                                    "text-xs font-normal leading-tight truncate",
                                                    isPositive ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"
                                                )}>
                                                    {displayLabel}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                            <Button
                                onClick={onConfirm}
                                className="w-full py-4 text-base font-medium rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:bg-indigo-800"
                            >
                                <Lock className="w-4 h-4" />
                                Lock & Save Day
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DayOverviewModal;
