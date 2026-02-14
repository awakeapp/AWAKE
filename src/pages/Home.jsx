import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useData } from '../context/DataContext';
import { useTasks } from '../context/TaskContext';
import { useAuthContext } from '../hooks/useAuthContext';
import { useFinance } from '../context/FinanceContext';
import { useDate } from '../context/DateContext';
import { 
    Clock, 
    Calendar, 
    CheckCircle2, 
    ListTodo, 
    Flame, 
    Target,
    IndianRupee,
    Trophy
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../components/atoms/Button';
import MotivationBanner from '../components/organisms/MotivationBanner';

const Home = () => {
    const { user } = useAuthContext();
    const { dailyData } = useData();
    const { tasks, getTaskCompletionStats } = useTasks();
    const { accounts } = useFinance();
    const { formattedDate } = useDate();
    const navigate = useNavigate();

    const [streak, setStreak] = useState(0);

    useEffect(() => {
        if (!user) return;
        try {
            setStreak(user.streak || 0);
        } catch (err) {
            console.error("Streak error", err);
        }
    }, [user]);

    const stats = getTaskCompletionStats();
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return (
        <div className="space-y-6 pb-20">
            {/* Minimal Header */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
                {/* Date Pill */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm whitespace-nowrap">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        Today, <span className="text-slate-500 font-medium">{format(new Date(), 'MMM dd')}</span>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                     {/* Routine Overview Pill */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm whitespace-nowrap">
                        <ListTodo className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {stats.completed}/{stats.total}
                        </span>
                    </div>

                    {/* Streak Pill */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm whitespace-nowrap">
                        <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                        <span className="text-sm font-bold text-orange-700 dark:text-orange-400">
                            {streak}
                        </span>
                    </div>
                </div>
            </div>

            {/* Motivation Banner */}
            <MotivationBanner />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Tasks Card */}
                <div 
                    onClick={() => navigate('/workspace')}
                    className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group cursor-pointer"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CheckCircle2 className="w-16 h-16 text-indigo-500" />
                    </div>
                    
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                        <ListTodo className="w-5 h-5" />
                    </div>
                    
                    <div className="relative z-10">
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Daily Tasks</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                            {stats.completed}/{stats.total}
                        </h3>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div 
                                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${stats.percentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Finance Card */}
                <div 
                    onClick={() => navigate('/finance')}
                    className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group cursor-pointer"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <IndianRupee className="w-16 h-16 text-emerald-500" />
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                        <IndianRupee className="w-5 h-5" />
                    </div>
                    
                    <div className="relative z-10">
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Balance</p>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">
                            ₹{totalBalance.toLocaleString()}
                        </h3>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> 
                            {accounts.length} Accounts
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 px-1">Quick Actions</h3>
                 <div className="grid grid-cols-2 gap-3">
                    <Button 
                        variant="secondary"
                        onClick={() => navigate('/workspace')}
                        className="h-auto py-4 flex flex-col gap-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        <Target className="w-6 h-6 text-purple-500" />
                        <span className="font-bold text-sm">Add Task</span>
                    </Button>
                    <Button 
                        variant="secondary"
                        onClick={() => navigate('/vehicle')}
                        className="h-auto py-4 flex flex-col gap-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        <Clock className="w-6 h-6 text-blue-500" />
                        <span className="font-bold text-sm">Log Fuel</span>
                    </Button>
                 </div>
            </div>
        </div>
    );
};

export default Home;
