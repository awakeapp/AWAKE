import { useTasks } from '../../context/TaskContext';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { CheckCircle2, Circle, Clock, TrendingUp, AlertCircle, ArrowLeft } from 'lucide-react';


import { useNavigate } from 'react-router-dom';

const Overview = () => {
    const navigate = useNavigate();
    const { tasks } = useTasks();

    // --- Stats Calculation ---

    // 1. Completion Rate (Discipline) - ONLY Past + Today
    // Filter tasks that are relevant for "Discipline" (up to today)
    const today = new Date();
    const relevantTasks = tasks.filter(t => {
        if (!t.date) return false;
        const taskDate = new Date(t.date);
        return taskDate <= new Date(new Date().setHours(23, 59, 59, 999));
    });

    const totalRelevant = relevantTasks.length;
    const completedRelevant = relevantTasks.filter(t => t.status === 'completed' || t.isCompleted).length;
    const completionRate = totalRelevant > 0 ? Math.round((completedRelevant / totalRelevant) * 100) : 0;

    // 2. Weekly Activity Data for Chart
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

    const activityData = last7Days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayTasks = tasks.filter(t => t.date === dateStr);
        const dayCompleted = dayTasks.filter(t => t.status === 'completed' || t.isCompleted).length;

        return {
            name: format(day, 'EEE'), // Mon, Tue
            total: dayTasks.length,
            completed: dayCompleted
        };
    });

    // 3. Category Breakdown
    const categories = ['Work', 'Health', 'Personal', 'Study'];
    const categoryData = categories.map(cat => {
        const count = tasks.filter(t => t.category === cat).length;
        return { name: cat, value: count };
    }).filter(d => d.value > 0);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

    return (
        <div className="space-y-8 pb-24" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 80px)' }}>
            {/* Fixed Header */}
            <div 
                className="fixed top-0 left-0 right-0 z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-transparent"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0px)' }}
            >
                <div className="max-w-lg mx-auto w-full px-4 h-16 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-transparent hover:bg-slate-100 dark:bg-transparent dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 text-slate-700 dark:text-slate-300 -ml-2 focus:outline-none"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Overview</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your productivity report & discipline tracking</p>
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20">
                    <div className="flex items-start justify-between opacity-80 mb-4">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Discipline</span>
                    </div>
                    <div className="text-4xl font-extrabold mb-1">{completionRate}%</div>
                    <div className="text-xs font-medium opacity-90">Completion Rate</div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-start justify-between text-slate-400 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Done</span>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{completedRelevant}</div>
                        <div className="text-xs text-slate-500">Tasks Completed (All Time)</div>
                    </div>
                </div>
            </div>

            {/* Weekly Discipline Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-white">Weekly Discipline</h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Completed</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" /> Total</span>
                    </div>
                </div>

                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityData}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                dy={10}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="total" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="completed" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-white mb-6">Task Distribution</h3>
                <div className="flex items-center justify-center">
                    <div className="w-40 h-40 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xs font-bold text-slate-400">CATEGORY</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                    {categoryData.map((cat, i) => (
                        <div key={cat.name} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="font-medium text-slate-600 dark:text-slate-300">{cat.name}</span>
                            <span className="text-slate-400 ml-auto">{cat.value}</span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default Overview;
