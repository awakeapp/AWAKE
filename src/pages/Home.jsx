import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useTasks } from '../context/TaskContext';
import { useFinance } from '../context/FinanceContext';
import { useAuthContext } from '../hooks/useAuthContext';
import { usePrayer } from '../context/PrayerContext';
import { motion } from 'framer-motion';
import { Trophy, Target, List, IndianRupee, ArrowRight, Zap, Moon, ChevronRight, Fuel } from 'lucide-react';
import clsx from 'clsx';
import FuelLogModal from '../components/organisms/FuelLogModal';
import FinanceLogModal from '../components/organisms/FinanceLogModal';
import AddTaskModal from '../components/molecules/workspace/AddTaskModal';
import MotivationBanner from '../components/organisms/MotivationBanner';
import Pressable from '../components/atoms/Pressable';
import RamadanImageSlider from '../components/ramadan/RamadanImageSlider';
import { useTranslation } from 'react-i18next';
import { RAMADAN_MODE } from '../lib/featureFlags';

const Home = () => {
    const { user } = useAuthContext();
    const { dailyData } = useData();
    const { tasks: workspaceTasks, addTask, currentDateStr } = useTasks();
    const { getDailySpend } = useFinance();
    const { hijriDate, dailyTimings } = usePrayer();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
    const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- Welcome Logic ---
    const hour = now.getHours();
    let greeting = t('home.greeting_morning', 'Good Morning');
    if (hour >= 12 && hour < 17) greeting = t('home.greeting_afternoon', 'Good Afternoon');
    else if (hour >= 17) greeting = t('home.greeting_evening', 'Good Evening');

    const outputTasks = dailyData?.tasks || [];
    const completedRoutine = outputTasks.filter(t => t.status === 'checked').length;
    const totalRoutine = outputTasks.length;
    const routineProgress = totalRoutine > 0 ? Math.round((completedRoutine / totalRoutine) * 100) : 0;
    const todayTasks = workspaceTasks.filter(t => t.date === (currentDateStr || now.toLocaleDateString('en-CA')));
    const totalWorkspaceTasks = todayTasks.length;
    const completedWorkspaceTasks = todayTasks.filter(t => t.status === 'done' || t.status === 'completed' || t.isCompleted).length;
    const remainingTasksCount = todayTasks.filter(t => t.status !== 'done' && t.status !== 'completed' && !t.isCompleted).length;
    const dailySpend = getDailySpend();

    let motivation = "";
    if (routineProgress >= 80) motivation = t('home.motivation_finishing', "Finishing strong.");
    if (routineProgress === 100) motivation = t('home.motivation_mastered', "Discipline mastered.");

    const handleAddTaskSubmit = async (title, options) => {
        try {
            await addTask(title, options);
            setIsTaskModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    // --- Ramadan Mini Widget Logic ---
    let nextEvent = '';
    let countdownStr = '--:--:--';
    let suhoorTimeStr = '--:--';
    let iftarTimeStr = '--:--';
    const isRamadanActive = hijriDate?.isRamadan;

    if (dailyTimings) {
        const { Fajr, Maghrib } = dailyTimings;
        const parseTime = (timeStr) => {
            const [hours, mins] = timeStr.split(' ')[0].split(':');
            const d = new Date(now);
            d.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
            return d;
        };
        const fajrTime = parseTime(Fajr);
        const maghribTime = parseTime(Maghrib);
        
        suhoorTimeStr = fajrTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        iftarTimeStr = maghribTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        
        if (now < fajrTime) {
            nextEvent = 'Suhoor ends in';
            countdownStr = formatDiff(fajrTime - now);
        } else if (now < maghribTime) {
            nextEvent = 'Iftar in';
            countdownStr = formatDiff(maghribTime - now);
        } else {
            nextEvent = 'Day Complete';
            countdownStr = '00:00:00';
        }
    }

    function formatDiff(ms) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        return `${Math.floor(totalSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
    }

    return (
        <div className="space-y-6 pb-24  px-1">
            <FuelLogModal isOpen={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)} />
            <FinanceLogModal isOpen={isFinanceModalOpen} onClose={() => setIsFinanceModalOpen(false)} />
            <AddTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onAdd={handleAddTaskSubmit} />

            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-800 dark:text-white tracking-tight">{greeting}</h1>
                        {motivation && <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{motivation}</p>}
                    </div>
                </div>
                <MotivationBanner />
            </div>

            {/* Ramadan Tracker Entry Card — only when RAMADAN_MODE=true */}
            {RAMADAN_MODE && (
                <Pressable
                    onClick={() => navigate('/ramadan')}
                    block
                    scaleDown={0.97}
                    className="w-full bg-slate-900 rounded-3xl p-6 shadow-lg shadow-black/20 relative overflow-hidden flex flex-col justify-between min-h-[190px]"
                >
                    <RamadanImageSlider />
                    
                    {/* Top Header */}
                    <div className="flex items-start justify-between relative z-10 w-full mb-4">
                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-sm shrink-0">
                                <Moon className="w-5 h-5 text-white drop-shadow-md" />
                            </div>
                            <div>
                                <h3 className="text-[13px] font-bold text-white uppercase tracking-widest drop-shadow-md">Ramadan Tracker</h3>
                                {isRamadanActive ? (
                                    <p className="text-[12px] font-medium text-white/90 drop-shadow-md mt-0.5">
                                        Day {hijriDate?.day}
                                    </p>
                                ) : (
                                    <p className="text-[12px] font-medium text-white/90 drop-shadow-md mt-0.5">Pre-Ramadan</p>
                                )}
                            </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-white/80 shrink-0" />
                    </div>

                    {/* Central Countdown */}
                    <div className="relative z-10 w-full text-center flex-1 flex flex-col justify-center items-center py-2">
                        {dailyTimings ? (
                            <>
                                <p className="text-white/90 uppercase tracking-widest text-xs font-bold mb-2 drop-shadow-md">{nextEvent}</p>
                                <p className="text-5xl sm:text-6xl font-black text-white tabular-nums tracking-tighter leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                                    {countdownStr}
                                </p>
                            </>
                        ) : (
                            <p className="text-white font-semibold text-lg drop-shadow-md">Loading timings...</p>
                        )}
                    </div>

                    {/* Bottom Suhoor / Iftar Row */}
                    {dailyTimings && (
                        <div className="relative z-10 flex justify-between w-full mt-3 pt-3 border-t border-white/20">
                            <div className="text-left">
                                <p className="text-white/70 text-[10px] uppercase font-bold tracking-wider mb-0.5">Suhoor Ends</p>
                                <p className="text-white font-bold text-lg drop-shadow-md">{suhoorTimeStr}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white/70 text-[10px] uppercase font-bold tracking-wider mb-0.5">Iftar Time</p>
                                <p className="text-white font-bold text-lg drop-shadow-md">{iftarTimeStr}</p>
                            </div>
                        </div>
                    )}
                </Pressable>
            )}

            {/* Quick Actions Title */}
            <div className="pt-2 px-1">
                <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3 text-left">
                    
                    {/* Routine Overview */}
                    <Pressable 
                        onClick={() => navigate('/routine')}
                        block
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-32 shadow-sm relative overflow-hidden group"
                    >
                        <div 
                            className="absolute bottom-0 left-0 h-1 bg-indigo-500/20 transition-all duration-1000"
                            style={{ width: `${routineProgress}%` }}
                        />
                        <div className="flex items-start justify-between relative z-10">
                            <div className={clsx(
                                "p-2 rounded-xl shadow-sm",
                                routineProgress === 100 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10"
                            )}>
                                {routineProgress === 100 ? <Trophy className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate('/routine'); }}
                                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors shadow-sm"
                            >
                                View
                            </button>
                        </div>
                        <div className="relative z-10 pt-2">
                            <div className="text-[19px] font-semibold text-slate-800 dark:text-slate-100 leading-none mb-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                {routineProgress}% <span className="text-xs text-slate-400 font-medium">{t('home.done', 'Done')}</span>
                            </div>
                            <div className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                {t('home.daily_routine', 'Daily Routine')}
                            </div>
                        </div>
                    </Pressable>

                    {/* Task Quick Action */}
                    <Pressable 
                        onClick={() => setIsTaskModalOpen(true)}
                        block
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-32 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex items-start justify-between relative z-10">
                            <div className="p-2 bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl shadow-sm">
                                <List className="w-5 h-5" />
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsTaskModalOpen(true); }}
                                className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold transition-colors shadow-sm"
                            >
                                + Task
                            </button>
                        </div>
                        <div className="relative z-10 pt-2">
                            <div className="text-[19px] font-semibold text-slate-800 dark:text-slate-100 leading-none mb-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                {remainingTasksCount} <span className="text-xs text-slate-400 font-medium">{t('home.left', 'Left')}</span>
                            </div>
                            <div className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                {completedWorkspaceTasks} / {totalWorkspaceTasks} {t('home.completed', 'Completed')}
                            </div>
                        </div>
                    </Pressable>

                    {/* Finance Log (Merged Spend) */}
                    <Pressable 
                        onClick={() => setIsFinanceModalOpen(true)}
                        block
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-32 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex items-start justify-between relative z-10">
                            <div className="p-2 bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl shadow-sm">
                                <IndianRupee className="w-5 h-5" />
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsFinanceModalOpen(true); }}
                                className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold transition-colors shadow-sm"
                            >
                                + Log
                            </button>
                        </div>
                        <div className="relative z-10 pt-2">
                            <div className="text-[19px] font-semibold text-slate-800 dark:text-slate-100 leading-none mb-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                <span dir="ltr">₹{dailySpend.toLocaleString()}</span>
                            </div>
                            <div className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                {t('home.todays_spend', "Today's Spent")}
                            </div>
                        </div>
                    </Pressable>

                    {/* Fuel Log */}
                    <Pressable 
                        onClick={() => setIsFuelModalOpen(true)}
                        block
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-32 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex items-start justify-between relative z-10">
                            <div className="p-2 bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400 rounded-xl shadow-sm">
                                <Fuel className="w-5 h-5" />
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsFuelModalOpen(true); }}
                                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold transition-colors shadow-sm"
                            >
                                + Fuel
                            </button>
                        </div>
                        <div className="relative z-10 pt-2">
                            <div className="text-[19px] font-semibold text-slate-800 dark:text-slate-100 leading-none mb-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                Vehicle
                            </div>
                            <div className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                Add Fill-up
                            </div>
                        </div>
                    </Pressable>

                </div>
            </div>

        </div>
    );
};

export default Home;
