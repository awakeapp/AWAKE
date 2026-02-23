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
import MotivationBanner from '../components/organisms/MotivationBanner';
import { useTranslation } from 'react-i18next';
import { RAMADAN_MODE } from '../lib/featureFlags';

const Home = () => {
    const { user } = useAuthContext();
    const { dailyData } = useData();
    const { tasks: workspaceTasks } = useTasks();
    const { getDailySpend } = useFinance();
    const { hijriDate, prayerTimes, loading: ramadanLoading } = useRamadan();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
    const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
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
            <FuelLogModal isOpen={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)} />
            <FinanceLogModal isOpen={isFinanceModalOpen} onClose={() => setIsFinanceModalOpen(false)} />

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
                    className="w-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-3xl p-5 shadow-lg shadow-indigo-500/25 active:opacity-90 transition-opacity cursor-pointer relative overflow-hidden"
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

            {/* Minimal Quick Action Bar -> Two Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <div 
                    className="bg-slate-900 dark:bg-white rounded-2xl p-4 flex flex-col justify-between cursor-pointer active:opacity-80 transition-opacity shadow-lg shadow-slate-900/10 dark:shadow-white/5 h-28"
                    onClick={() => setIsFuelModalOpen(true)}
                >
                    <div className="flex items-start justify-between">
                        <div className="bg-white/20 dark:bg-slate-900/10 p-2 rounded-xl text-white dark:text-slate-900">
                            <Fuel className="w-5 h-5 fill-current" />
                        </div>
                        <div className="bg-white/10 dark:bg-slate-900/5 p-1 rounded-full text-white dark:text-slate-900">
                            <span className="text-lg leading-none font-medium px-1">+</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white dark:text-slate-900">Fuel Log</p>
                        <p className="text-[11px] text-slate-300 dark:text-slate-500 font-medium uppercase tracking-wide">Add Fill-up</p>
                    </div>
                </div>

                <div 
                    className="bg-emerald-600 dark:bg-emerald-500 rounded-2xl p-4 flex flex-col justify-between cursor-pointer active:opacity-80 transition-opacity flex-1 shadow-lg shadow-emerald-500/20 h-28"
                    onClick={() => setIsFinanceModalOpen(true)}
                >
                    <div className="flex items-start justify-between">
                        <div className="bg-white/20 dark:bg-black/10 p-2 rounded-xl text-white dark:text-slate-900">
                            <IndianRupee className="w-5 h-5 fill-current" />
                        </div>
                        <div className="bg-white/10 dark:bg-black/5 p-1 rounded-full text-white dark:text-slate-900">
                            <span className="text-lg leading-none font-medium px-1">+</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white dark:text-slate-900">Finance Log</p>
                        <p className="text-[11px] text-emerald-100 dark:text-slate-800 font-medium uppercase tracking-wide">Add Expense</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Home;
