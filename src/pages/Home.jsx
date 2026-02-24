import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useTasks } from '../context/TaskContext';
import { useFinance } from '../context/FinanceContext';
import { useAuthContext } from '../hooks/useAuthContext';
import { useRamadan } from '../context/RamadanContext';
import { motion } from 'framer-motion';
import { Trophy, Target, List, IndianRupee, ArrowRight, Zap, Moon, ChevronRight, Fuel } from 'lucide-react';
import clsx from 'clsx';
import FuelLogModal from '../components/organisms/FuelLogModal';
import FinanceLogModal from '../components/organisms/FinanceLogModal';
import AddTaskModal from '../components/molecules/workspace/AddTaskModal';
import MotivationBanner from '../components/organisms/MotivationBanner';
import { useTranslation } from 'react-i18next';
import { RAMADAN_MODE } from '../lib/featureFlags';

const Home = () => {
    const { user } = useAuthContext();
    const { dailyData } = useData();
    const { tasks: workspaceTasks, addTask, currentDateStr } = useTasks();
    const { getDailySpend } = useFinance();
    const { hijriDate, prayerTimes, loading: ramadanLoading } = useRamadan();
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
    const todayDateNumber = now.getDate();
    const todayPrayers = prayerTimes?.find(p => parseInt(p.date.gregorian.day, 10) === todayDateNumber);
    let nextEvent = '';
    let countdownStr = '--:--:--';
    const isRamadanActive = hijriDate?.isRamadan;

    if (todayPrayers) {
        const { Fajr, Maghrib } = todayPrayers.timings;
        const parseTime = (timeStr) => {
            const [hours, mins] = timeStr.split(' ')[0].split(':');
            const d = new Date(now);
            d.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
            return d;
        };
        const fajrTime = parseTime(Fajr);
        const maghribTime = parseTime(Maghrib);
        
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
                <div
                    onClick={() => navigate('/ramadan')}
                    className="w-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-3xl p-5 shadow-lg shadow-indigo-500/25 active:from-indigo-700 active:to-violet-900 transition-colors duration-75 cursor-pointer relative overflow-hidden"
                >
                    {/* Glow background orbs */}
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -left-4 -bottom-6 w-20 h-20 bg-violet-400/20 rounded-full blur-xl" />

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner">
                                <Moon className="w-6 h-6 text-white fill-white/30" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-widest mb-0.5">Ramadan Hub</p>
                                {isRamadanActive ? (
                                    <>
                                        <p className="text-[13px] font-medium text-indigo-100">Day {hijriDate?.day} · {nextEvent}</p>
                                        <p className="text-[22px] font-bold text-white tabular-nums leading-tight">{countdownStr}</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-[15px] font-semibold text-white leading-tight">Track Fasting &amp; Worship</p>
                                        <p className="text-[12px] text-indigo-200">Prayers · Dhikr · Stats</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/60 shrink-0" />
                    </div>
                </div>
            )}

            {/* Quick Actions Title */}
            <div className="pt-2 px-1">
                <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3 text-left">
                    
                    {/* Routine Overview */}
                    <div 
                        onClick={() => navigate('/routine')}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-32 active:bg-slate-50 dark:active:bg-slate-800/80 transition-colors duration-75 cursor-pointer shadow-sm relative overflow-hidden group"
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
                                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors shadow-sm active:scale-95"
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
                    </div>

                    {/* Task Quick Action */}
                    <div 
                        onClick={() => setIsTaskModalOpen(true)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-32 active:bg-slate-50 dark:active:bg-slate-800/80 transition-colors duration-75 cursor-pointer shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex items-start justify-between relative z-10">
                            <div className="p-2 bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl shadow-sm">
                                <List className="w-5 h-5" />
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsTaskModalOpen(true); }}
                                className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold transition-colors active:scale-95 shadow-sm"
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
                    </div>

                    {/* Finance Log (Merged Spend) */}
                    <div 
                        onClick={() => setIsFinanceModalOpen(true)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-32 active:bg-slate-50 dark:active:bg-slate-800/80 transition-colors duration-75 cursor-pointer shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex items-start justify-between relative z-10">
                            <div className="p-2 bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl shadow-sm">
                                <IndianRupee className="w-5 h-5" />
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsFinanceModalOpen(true); }}
                                className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold transition-colors active:scale-95 shadow-sm"
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
                    </div>

                    {/* Fuel Log */}
                    <div 
                        onClick={() => setIsFuelModalOpen(true)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-32 active:bg-slate-50 dark:active:bg-slate-800/80 transition-colors duration-75 cursor-pointer shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex items-start justify-between relative z-10">
                            <div className="p-2 bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400 rounded-xl shadow-sm">
                                <Fuel className="w-5 h-5" />
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsFuelModalOpen(true); }}
                                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold transition-colors active:scale-95 shadow-sm"
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
                    </div>

                </div>
            </div>

        </div>
    );
};

export default Home;
