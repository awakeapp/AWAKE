import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useTasks } from '../context/TaskContext';
import { useFinance } from '../context/FinanceContext';
import { useAuthContext } from '../hooks/useAuthContext';
import { useRamadan } from '../context/RamadanContext';
import { motion } from 'framer-motion';
import { Trophy, Target, List, IndianRupee, ArrowRight, Zap, Moon, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import QuickActionModal from '../components/organisms/QuickActionModal';
import MotivationBanner from '../components/organisms/MotivationBanner';
import { useTranslation } from 'react-i18next';

const Home = () => {
    const { user } = useAuthContext();
    const { dailyData } = useData();
    const { tasks: workspaceTasks } = useTasks();
    const { getDailySpend } = useFinance();
    const { hijriDate, prayerTimes, loading: ramadanLoading } = useRamadan();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
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
    const remainingTasksCount = workspaceTasks.filter(t => t.status !== 'done').length;
    const dailySpend = getDailySpend();

    let motivation = "";
    if (routineProgress >= 80) motivation = t('home.motivation_finishing', "Finishing strong.");
    if (routineProgress === 100) motivation = t('home.motivation_mastered', "Discipline mastered.");

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
        <div className="space-y-6 pb-24 pt-4 px-1">
            <QuickActionModal isOpen={isQuickActionOpen} onClose={() => setIsQuickActionOpen(false)} />

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

            {/* Ramadan Tracker Widget */}
            {!ramadanLoading && isRamadanActive && (
                <div 
                    onClick={() => navigate('/settings')} // Routing to Ramadan Hub via settings mapping later, or creating specific route
                    className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-3xl p-5 shadow-sm active:opacity-80 transition-opacity cursor-pointer relative overflow-hidden"
                >
                    {/* Background embellishment */}
                    <Moon className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-500/5 rotate-[-15deg]" />
                    
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
                                <Moon className="w-6 h-6 fill-current" />
                            </div>
                            <div>
                                <div className="text-xs font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-1">
                                    Day {hijriDate?.day} Ramadan
                                </div>
                                <div className="flex items-end gap-2 text-indigo-900 dark:text-indigo-100">
                                    <span className="text-xl font-semibold leading-none tabular-nums tracking-tight">{countdownStr}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-medium text-indigo-500/80 mb-1">{nextEvent}</span>
                            <div className="p-1 px-3 bg-white dark:bg-indigo-950 rounded-lg text-xs font-medium text-indigo-600 shadow-sm flex items-center gap-1">
                                Hub <ChevronRight className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Routine Summary Card */}
            <div 
                onClick={() => navigate('/routine')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden active:opacity-80 transition-opacity cursor-pointer group"
            >
                <div 
                    className="absolute bottom-0 left-0 h-1 bg-indigo-500/20 transition-all duration-1000"
                    style={{ width: `${routineProgress}%` }}
                />

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-5">
                         <div className={clsx(
                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                            routineProgress === 100 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400"
                        )}>
                            {routineProgress === 100 ? <Trophy className="w-7 h-7" /> : <Target className="w-7 h-7" />}
                        </div>
                        <div>
                            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{t('home.daily_routine', 'Daily Routine')}</div>
                            <div className="text-lg font-semibold text-slate-900 dark:text-white leading-none">
                                {routineProgress}% <span className="text-sm font-medium text-slate-400 ml-1">{t('home.done', 'Done')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-full text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Combined Tasks Overview & Today's Spent Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Tasks */}
                <div 
                    onClick={() => navigate('/workspace')} 
                    className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex flex-col justify-between h-32 active:opacity-80 transition-opacity cursor-pointer"
                >
                    <div className="flex items-start justify-between">
                         <div className="p-2 bg-white dark:bg-slate-900/50 rounded-xl text-blue-500 shadow-sm">
                            <List className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-blue-500 uppercase tracking-wider">{t('home.tasks', 'Tasks')}</span>
                    </div>
                    <div>
                        <div className="text-xl font-semibold text-slate-800 dark:text-slate-100 leading-none mb-1">
                            {remainingTasksCount} <span className="text-xs text-slate-400 font-medium">{t('home.left', 'Left')}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                            {t('home.workspace', 'Workspace')}
                        </div>
                    </div>
                </div>

                {/* Finance Summary */}
                <div 
                    onClick={() => navigate('/finance')}
                    className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 flex flex-col justify-between h-32 active:opacity-80 transition-opacity cursor-pointer"
                >
                    <div className="flex items-start justify-between">
                        <div className="p-2 bg-white dark:bg-slate-900/50 rounded-xl text-emerald-500 shadow-sm">
                            <IndianRupee className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider">Spend</span>
                    </div>
                    <div>
                        <div className="text-xl font-semibold text-slate-800 dark:text-slate-100 leading-none mb-1">
                             <span dir="ltr">₹{dailySpend.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                            {t('home.todays_spend', "Today's Spent")}
                        </div>
                    </div>
                </div>
            </div>

            {/* Minimal Quick Action Bar */}
            <div 
                className="bg-slate-900 dark:bg-white rounded-2xl p-4 flex items-center justify-between cursor-pointer active:opacity-80 transition-opacity shadow-lg shadow-slate-900/20 dark:shadow-white/10"
                onClick={() => setIsQuickActionOpen(true)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 dark:bg-slate-900/10 p-2 rounded-xl text-white dark:text-slate-900">
                        <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white dark:text-slate-900">Quick Log</p>
                        <p className="text-xs text-slate-300 dark:text-slate-500 font-normal uppercase tracking-wide">Add Task or Expense</p>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-slate-900/10 flex items-center justify-center text-white dark:text-slate-900">
                    <span className="text-lg leading-none font-medium pb-0.5">+</span>
                </div>
            </div>

        </div>
    );
};

export default Home;
