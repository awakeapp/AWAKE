import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useTasks } from '../context/TaskContext';
import { useFinance } from '../context/FinanceContext';
import { useAuthContext } from '../hooks/useAuthContext';
import { FirestoreService } from '../services/firestore-service';
import { orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Target, Flame, IndianRupee, ArrowRight, List, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import Button from '../components/atoms/Button';
import MotivationBanner from '../components/organisms/MotivationBanner';

// Lazy load components if needed, but for Home simple cards are fine.

const Home = () => {
    const { user } = useAuthContext();
    const { dailyData } = useData();
    const { tasks: workspaceTasks } = useTasks();
    const { getDailySpend } = useFinance();
    const navigate = useNavigate();

    // --- Streak Logic (Copied from Dashboard) ---
    const [streak, setStreak] = useState({ current: 0, longest: 0, loading: true });
    
    useEffect(() => {
        if (!user) return;
        const fetchStreak = async () => {
            try {
                const history = await FirestoreService.getCollection(
                    `users/${user.uid}/days`,
                    orderBy('date', 'desc'),
                    limit(365)
                );
                
                const isComplete = (d) => {
                    if (!d || !d.tasks || d.tasks.length === 0) return false;
                    const c = d.tasks.filter(t => t.status === 'checked').length;
                    return Math.round((c / d.tasks.length) * 100) === 100;
                };

                let current = 0;
                let longest = 0;
                
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                
                // Safe check for today's doc
                const todayDoc = history.find(d => d.date === todayStr);
                const todayComplete = todayDoc ? isComplete(todayDoc) : false;
                
                if (todayComplete) current = 1;
                
                const getPrevDate = (dateStr) => {
                    try {
                        const d = new Date(dateStr);
                        if (isNaN(d.getTime())) return null; 
                        d.setDate(d.getDate() - 1);
                        return d.toISOString().split('T')[0];
                    } catch (e) { return null; }
                };
                
                let checkDate = getPrevDate(todayStr);
                
                // Safety limiter
                let loopLimit = 0;
                while (checkDate && loopLimit < 366) {
                    const doc = history.find(d => d.date === checkDate || d.id === checkDate);
                    if (doc && isComplete(doc)) {
                        current++;
                        checkDate = getPrevDate(checkDate);
                    } else {
                        break;
                    }
                    loopLimit++;
                }
                
                // Longest Calculation (Simplified and Safe)
                const sortedHistory = [...history].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
                if (sortedHistory.length > 0) {
                     const validHistory = sortedHistory.filter(h => h.date && !isNaN(new Date(h.date).getTime()));
                     if (validHistory.length > 0) {
                        let iterDate = new Date(validHistory[0].date);
                        const lastDate = new Date(validHistory[validHistory.length - 1].date);
                        
                        let running = 0;
                        let iterCount = 0;
                        while (iterDate <= lastDate && iterCount < 400) {
                             const dStr = iterDate.toISOString().split('T')[0];
                             const doc = validHistory.find(d => d.date === dStr || d.id === dStr);
                             if (doc && isComplete(doc)) running++;
                             else {
                                 longest = Math.max(longest, running);
                                 running = 0;
                             }
                             iterDate.setDate(iterDate.getDate() + 1);
                             iterCount++;
                        }
                        longest = Math.max(longest, running);
                     }
                }
                
                setStreak({ current, longest, loading: false });
            } catch (err) {
                console.error("Streak error:", err);
                setStreak({ current: 0, longest: 0, loading: false });
            }
        };
        fetchStreak();
    }, [user, dailyData.tasks]);

    // --- Welcome Logic ---
    const hour = new Date().getHours();
    let greeting = 'Good Morning';
    if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
    else if (hour >= 17) greeting = 'Good Evening';

    const outputTasks = dailyData?.tasks || [];
    const completedRoutine = outputTasks.filter(t => t.status === 'checked').length;
    const totalRoutine = outputTasks.length;
    const routineProgress = totalRoutine > 0 ? Math.round((completedRoutine / totalRoutine) * 100) : 0;
    const remainingTasksCount = workspaceTasks.filter(t => t.status !== 'done').length;
    const dailySpend = getDailySpend();

    // Motivation
    let motivation = "";
    if (routineProgress >= 80) motivation = "Finishing strong.";
    if (routineProgress === 100) motivation = "Discipline mastered.";

    return (
        <div className="space-y-6 pb-24 pt-4 px-1">
            {/* Header */}
             <div className="space-y-4">
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{greeting}</h1>
                        {motivation && <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{motivation}</p>}
                    </div>
                </div>
                
                {/* Motivation Banner */}
                <MotivationBanner />
            </div>

            {/* Routine Summary Card */}
            <div 
                onClick={() => navigate('/routine')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer group"
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
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Daily Routine</div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
                                {routineProgress}% <span className="text-base font-medium text-slate-400 ml-1">Done</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-full text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Streak */}
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-4 flex flex-col justify-between h-32">
                    <div className="flex items-start justify-between">
                         <div className="p-2 bg-white dark:bg-slate-900/50 rounded-xl text-orange-500 shadow-sm">
                            <Flame className={clsx("w-5 h-5", streak.current > 0 && "fill-current")} />
                        </div>
                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Streak</span>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none mb-1">
                            {streak.current} <span className="text-sm text-slate-400 font-medium">Days</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Longest: {streak.longest}
                        </div>
                    </div>
                </div>

                {/* Tasks */}
                <div 
                    onClick={() => navigate('/workspace')} 
                    className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex flex-col justify-between h-32 active:scale-[0.98] transition-transform cursor-pointer"
                >
                    <div className="flex items-start justify-between">
                         <div className="p-2 bg-white dark:bg-slate-900/50 rounded-xl text-blue-500 shadow-sm">
                            <List className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Tasks</span>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none mb-1">
                            {remainingTasksCount} <span className="text-sm text-slate-400 font-medium">Left</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Workspace
                        </div>
                    </div>
                </div>
            </div>

            {/* Finance Summary */}
             <div 
                onClick={() => navigate('/finance')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <IndianRupee className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Today's Spend</div>
                        <div className="text-xl font-bold text-slate-900 dark:text-white">
                            ₹{dailySpend.toLocaleString()}
                        </div>
                    </div>
                </div>
                 <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-full text-slate-400">
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>


        </div>
    );
};

export default Home;
