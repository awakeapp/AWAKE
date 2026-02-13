import { useNavigate } from 'react-router-dom';
import DashboardHero from '../components/organisms/DashboardHero';
import { useData } from '../context/DataContext';
import { useAggregatedData } from '../hooks/useAggregatedData';
import { useFinance } from '../context/FinanceContext';
import { useVehicle } from '../context/VehicleContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Calendar, CheckCircle2, ChevronRight, Wallet, Car, LayoutGrid } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import DailyWellnessCard from '../components/organisms/DailyWellnessCard';
import ModuleSummaryCard from '../components/molecules/ModuleSummaryCard';

const Dashboard = () => {
    const navigate = useNavigate();
    const { dailyData, getDisciplineScore } = useData();
    const { alerts, pendingCounts } = useAggregatedData();

    // Module Data
    const { getMonthlySpend, getTotalBalance } = useFinance();
    const { getActiveVehicle, getVehicleStats } = useVehicle();

    const score = getDisciplineScore();
    const completedCount = dailyData?.tasks?.filter(t => t.status === 'checked').length || 0;
    const totalCount = dailyData?.tasks?.length || 0;

    // Derived Financial Data
    const monthlySpend = getMonthlySpend();
    const totalBalance = getTotalBalance();

    // Derived Vehicle Data
    const activeVehicle = getActiveVehicle();
    const vehicleStats = activeVehicle ? getVehicleStats(activeVehicle.id) : null;

    return (
        <div className="pb-32 px-4 pt-4 space-y-8">
            {/* Zone 1: Routine Command Center */}
            <DashboardHero
                percentage={score}
                completedCount={completedCount}
                totalCount={totalCount}
            />

            {/* Zone 2: Health & Wellness (Restored) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <DailyWellnessCard />
            </motion.div>

            {/* Zone 3: System Alerts (High Priority) */}
            <div className="">
                <AnimatePresence>
                    {alerts.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
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

            {/* Zone 4: Module Overview (Standardized Grid) */}
            <div>
                <div className="flex items-center justify-between mb-3 pl-1">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Your World</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">

                    {/* 1. Routine */}
                    <ModuleSummaryCard
                        title="Routine"
                        icon={CheckCircle2}
                        colorClass="text-emerald-500"
                        bgClass="bg-emerald-50 dark:bg-emerald-900/20"
                        data={{
                            primary: `${score}%`,
                            secondary: "Daily Score",
                            tertiary: completedCount === totalCount ? "Complete" : `${totalCount - completedCount} left`,
                            indicator: true,
                            indicatorColor: score === 100 ? "bg-emerald-500" : "bg-emerald-300"
                        }}
                        onClick={() => navigate('/routine')}
                    />

                    {/* 2. Task (Workspace) */}
                    <ModuleSummaryCard
                        title="Tasks"
                        icon={LayoutGrid}
                        colorClass="text-violet-500"
                        bgClass="bg-violet-50 dark:bg-violet-900/20"
                        data={{
                            primary: pendingCounts.tasks.toString(),
                            secondary: "Pending",
                            tertiary: "View Board",
                            indicator: true,
                            indicatorColor: pendingCounts.tasks > 0 ? "bg-violet-400" : "bg-slate-300"
                        }}
                        onClick={() => navigate('/workspace')}
                    />

                    {/* 3. Finance */}
                    <ModuleSummaryCard
                        title="Finance"
                        icon={Wallet}
                        colorClass="text-indigo-500"
                        bgClass="bg-indigo-50 dark:bg-indigo-900/20"
                        data={{
                            primary: `₹${(monthlySpend / 1000).toFixed(1)}k`,
                            secondary: "Month Spend",
                            tertiary: `Bal: ₹${(totalBalance / 1000).toFixed(1)}k`,
                            indicator: true,
                            indicatorColor: "bg-indigo-400"
                        }}
                        onClick={() => navigate('/finance')}
                    />

                    {/* 4. Vehicle */}
                    <ModuleSummaryCard
                        title="Vehicle"
                        icon={Car}
                        colorClass="text-sky-500"
                        bgClass="bg-sky-50 dark:bg-sky-900/20"
                        data={{
                            primary: activeVehicle ? activeVehicle.name.split(' ')[0] : "None", // Shorten name
                            secondary: vehicleStats ? "Active" : "Add One",
                            tertiary: vehicleStats?.overdueCount > 0 ? `${vehicleStats.overdueCount} Alerts` : "Good",
                            indicator: true,
                            indicatorColor: vehicleStats?.overdueCount > 0 ? "bg-red-400" : "bg-emerald-400"
                        }}
                        onClick={() => navigate('/vehicle')}
                    />

                </div>
            </div>

            {/* Quick Link Footer */}
            <div className="flex justify-center gap-6 opacity-60">
                <button onClick={() => navigate('/history')} className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">View History</button>
                <div className="w-px h-3 bg-slate-300 my-auto"></div>
                <button onClick={() => navigate('/settings')} className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">Settings</button>
            </div>

        </div>
    );
};

export default Dashboard;
