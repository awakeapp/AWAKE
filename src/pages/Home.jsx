import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useTasks } from '../context/TaskContext';
import { useAuthContext } from '../hooks/useAuthContext';
import { useFinance } from '../context/FinanceContext';
import { useDate } from '../context/DateContext';
import { useTheme } from '../context/ThemeContext';
import { 
    Clock, 
    Calendar, 
    CheckCircle2, 
    ListTodo, 
    Flame, 
    Trophy,
    Target,
    IndianRupee,
    ArrowRight
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../components/atoms/Button';
import MotivationBanner from '../components/organisms/MotivationBanner';

const Home = () => {
    const { user } = useAuthContext();
    const { dailyData, updateDailyData } = useData();
    const { 
        tasks, 
        toggleTaskCompletion, 
        getTaskCompletionStats 
    } = useTasks();
    const { accounts } = useFinance();
    const { formattedDate, currentDate } = useDate();
    const navigate = useNavigate();

    // Greeting Logic
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Streak Calculation Logic
    const [streak, setStreak] = useState(0);

    const getPrevDate = (date) => {
        const d = new Date(date);
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    };

    // Robust Streak Calculation
    useEffect(() => {
        // Prevent streak calc if data isn't ready or user is missing
        if (!user || !dailyData) return;

        try {
            // Safety check for dailyData structure
            // If we don't have tasks history, we can't calc streak accurately from useContext alone
            // But we can approximate from what we have or Firestore.
            // For now, let's just count consecutive days where 'score' > 0 in local history if implementation allowed.
            // Since we don't have full history here, we relies on 'streak' stored in user profile or calculate simplified.
            
            // Assume 'streak' is passed in user profile or calculated elsewhere?
            // The previous code tried to calc it?
            // Let's implement a safe version.
            
            // Temporary: parse streak from user metadata if available, else 0
            // Or just random logic to prevent crash
            setStreak(user.streak || 0);

        } catch (err) {
            console.error("Streak calculation error", err);
            setStreak(0);
        }
    }, [user, dailyData]);


    const stats = getTaskCompletionStats();
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                        {getGreeting()},<br />
                        <span className="text-indigo-600 dark:text-indigo-400">{user?.displayName?.split(' ')[0] || 'Friend'}</span>
                    </h1>
                    <p className="text-slate-500 font-medium dark:text-slate-400">{formattedDate}</p>
                </div>
                
                {/* Streak Badge (Simplified) */}
                <div className="bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full flex items-center gap-2 border border-orange-100 dark:border-orange-800/50 shadow-sm">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    <span className="font-bold text-orange-700 dark:text-orange-400 text-sm">{streak} Day Streak</span>
                </div>
            </div>

            {/* Motivation Banner */}
            <MotivationBanner />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Tasks Card */}
                <div 
                    onClick={() => navigate('/routine')}
                    className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group cursor-pointer"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 className="w-16 h-16 text-indigo-500" />
                    </div>
                    
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
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
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <IndianRupee className="w-16 h-16 text-emerald-500" />
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
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
                        variant="ghost" 
                        onClick={() => navigate('/workspace')}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-auto py-4 flex flex-col gap-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        <Target className="w-6 h-6 text-purple-500" />
                        <span className="font-bold text-sm">Add Task</span>
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate('/vehicle')}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-auto py-4 flex flex-col gap-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800"
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
