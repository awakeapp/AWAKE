import { useNavigate } from 'react-router-dom';
import DashboardHero from '../components/organisms/DashboardHero';
import { useData } from '../context/DataContext';
import { useAggregatedData } from '../hooks/useAggregatedData';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Calendar, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

const Dashboard = () => {
    const navigate = useNavigate();
    const { dailyData, getDisciplineScore } = useData();
    const { alerts, pendingCounts } = useAggregatedData();

    const score = getDisciplineScore();
    const completedCount = dailyData?.tasks?.filter(t => t.status === 'checked').length || 0;
    const totalCount = dailyData?.tasks?.length || 0;

    return (
        <div className="pb-32 px-4 pt-4">
            {/* Zone 1: Routine Command Center */}
            <DashboardHero
                percentage={score}
                completedCount={completedCount}
                totalCount={totalCount}
            />

            {/* Zone 2: System Alerts (High Priority) */}
            <div className="mt-6">
                <AnimatePresence>
                    {alerts.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 mb-6"
                        >
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Attention Needed</h3>
                            {alerts.slice(0, 3).map((alert) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    onClick={() => navigate(alert.actionLink)}
                                    className={clsx(
                                        "p-4 rounded-xl border flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all",
                                        alert.level === 'critical'
                                            ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30"
                                            : "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "w-8 h-8 rounded-full flex items-center justify-center",
                                            alert.level === 'critical' ? "bg-red-100 dark:bg-red-800/30 text-red-600" : "bg-amber-100 dark:bg-amber-800/30 text-amber-600"
                                        )}>
                                            <AlertCircle className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className={clsx("text-sm font-semibold", alert.level === 'critical' ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400")}>
                                                {alert.title}
                                            </h4>
                                            {alert.sub && <p className="text-xs text-slate-500 mt-0.5">{alert.sub}</p>}
                                            {alert.date && <p className="text-[10px] text-slate-400 mt-1">Due {format(new Date(alert.date), 'MMM dd')}</p>}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Zone 3: Navigation Grid (Functional Only) */}
            <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-3">Workspaces</h3>
                <div className="grid grid-cols-2 gap-3">

                    {/* Routine (Quick Access) */}
                    <div
                        onClick={() => navigate('/routine')}
                        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-28 cursor-pointer active:scale-95 transition-all"
                    >
                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-slate-800 dark:text-white">{dailyData?.tasks?.length - completedCount}</span>
                            <p className="text-xs text-slate-500 font-medium">Remaining Habits</p>
                        </div>
                    </div>

                    {/* Pending Tasks */}
                    <div
                        onClick={() => navigate('/workspace')}
                        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-28 cursor-pointer active:scale-95 transition-all"
                    >
                        <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-900/20 text-sky-500 flex items-center justify-center">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-slate-800 dark:text-white">{pendingCounts.tasks}</span>
                            <p className="text-xs text-slate-500 font-medium">Pending Tasks</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Quick Link Footer */}
            <div className="mt-8 flex justify-center gap-6">
                <button onClick={() => navigate('/finance')} className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">Finance</button>
                <div className="w-px h-3 bg-slate-300 my-auto"></div>
                <button onClick={() => navigate('/vehicle')} className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">Vehicle</button>
                <div className="w-px h-3 bg-slate-300 my-auto"></div>
                <button onClick={() => navigate('/history')} className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">History</button>
            </div>

        </div>
    );
};

export default Dashboard;
