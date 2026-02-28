import React from 'react';
import { useRamadan } from '../../context/RamadanContext';
import { useNavigate } from 'react-router-dom';
import { Activity, BarChart2, CheckCircle2, Moon, Sun, BookOpen, Heart, MoreHorizontal, TrendingUp, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import PageLayout from '../../components/layout/PageLayout';

const StatCard = ({ title, icon: Icon, value, target, percent, colorClass = "from-emerald-400 to-emerald-600", bgTint = "bg-emerald-500/10", delay = 0 }) => {
    const displayPercent = Math.min(percent, 100);
    
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay }}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between mb-3">
                <div className={clsx("p-2 rounded-xl shrink-0 transition-transform group-hover:scale-105 duration-300", bgTint)}>
                    <Icon className={clsx("w-5 h-5", colorClass.replace('from-', 'text-').split(' ')[0])} />
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {Math.round(percent)}%
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                    </div>
                </div>
            </div>
            
            <div className="space-y-1 mb-3">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-tight">{title}</h3>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                        {value}
                    </span>
                    {target && (
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                            / {target}
                        </span>
                    )}
                </div>
            </div>
            
            <div className="relative h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${displayPercent}%` }}
                    transition={{ duration: 0.8, delay: delay + 0.1 }}
                    className={clsx("absolute inset-y-0 left-0 bg-gradient-to-r rounded-full", colorClass)}
                />
            </div>
        </motion.div>
    );
};

const RamadanStats = () => {
    const navigate = useNavigate();
    const { loading, error, ramadanData, hijriDate } = useRamadan();

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-indigo-500 animate-spin" />
            </div>
        </div>
    );

    if (error) return (
        <div className="p-4 text-center bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20 m-4">
            <p className="text-rose-600 font-medium">{error}</p>
        </div>
    );

    const isRamadanActive = hijriDate?.isRamadan;

    if (!isRamadanActive) {
        return (
            <PageLayout title="Analysis">
                <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center">
                        <Moon className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Stats Inactive</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px] mx-auto mt-1">
                            Ramadan hasn't started yet. Your journey begins soon.
                        </p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    const currentDay = hijriDate.day || 1;
    const daysLog = Object.values(ramadanData?.days || {});
    
    const totalFasted = daysLog.filter(d => d.fasted).length;
    const fastingPercent = currentDay > 0 ? (totalFasted / currentDay) * 100 : 0;

    const totalTaraweeh = daysLog.filter(d => d.taraweeh).length;
    const taraweehPercent = currentDay > 0 ? (totalTaraweeh / currentDay) * 100 : 0;
    
    const totalTahajjud = daysLog.filter(d => d.tahajjud).length;
    const tahajjudPercent = currentDay > 0 ? (totalTahajjud / currentDay) * 100 : 0;
    
    const totalWitr = daysLog.filter(d => d.witr).length;
    const witrPercent = currentDay > 0 ? (totalWitr / currentDay) * 100 : 0;

    const goalData = ramadanData?.quranGoal || { type: 'pages', value: 604 };
    const totalQuranCount = daysLog.reduce((sum, d) => sum + (goalData.type === 'juz' ? (d.quranJuz || 0) : (d.quranPages || 0)), 0);
    const quranPercent = goalData.value > 0 ? (totalQuranCount / goalData.value) * 100 : 0;

    const DAILY_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const totalPossiblePrayers = currentDay * DAILY_PRAYERS.length;
    const totalCompletedPrayers = daysLog.reduce((sum, d) =>
        sum + DAILY_PRAYERS.filter(p => d[p]).length, 0
    );
    const prayerPercent = totalPossiblePrayers > 0 ? (totalCompletedPrayers / totalPossiblePrayers) * 100 : 0;

    const totalTahlil = daysLog.reduce((sum, d) => sum + (d.tahlil || 0), 0);
    const totalSalawat = daysLog.reduce((sum, d) => sum + (d.salawat || 0), 0);
    const totalIstighfar = daysLog.reduce((sum, d) => sum + (d.istighfar || 0), 0);
    const grandTotalDhikr = totalTahlil + totalSalawat + totalIstighfar;

    return (
        <PageLayout title="Analysis" contentPadClass="px-4 pb-24 pt-4 flex flex-col gap-6">
            <div className="space-y-4">
                {/* Hero Summary Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative bg-indigo-600 dark:bg-indigo-900/40 rounded-2xl p-6 text-white shadow-sm overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-indigo-100" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Total Dhikr</h3>
                                <p className="text-sm font-medium text-white/80">Spreading peace</p>
                            </div>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-black tabular-nums tracking-tight leading-none">
                                {grandTotalDhikr.toLocaleString()}
                            </p>
                            <span className="text-xs font-medium text-indigo-200">counts</span>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                            <div>
                                <p className="text-xs font-semibold text-indigo-200 mb-1">Tahlil</p>
                                <p className="text-lg font-bold">{totalTahlil.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-indigo-200 mb-1">Salawat</p>
                                <p className="text-lg font-bold">{totalSalawat.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-indigo-200 mb-1">Istighfar</p>
                                <p className="text-lg font-bold">{totalIstighfar.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <StatCard 
                        title="Fasting Days" 
                        icon={Sun} 
                        value={totalFasted} 
                        target={currentDay} 
                        percent={fastingPercent} 
                        colorClass="from-orange-400 to-orange-500" 
                        bgTint="bg-orange-50 dark:bg-orange-500/10"
                        delay={0.1}
                    />
                    <StatCard 
                        title="Quran Goals" 
                        icon={BookOpen} 
                        value={totalQuranCount} 
                        target={goalData.value} 
                        percent={quranPercent} 
                        colorClass="from-indigo-400 to-indigo-500" 
                        bgTint="bg-indigo-50 dark:bg-indigo-500/10"
                        delay={0.2}
                    />
                    <StatCard 
                        title="Prayers" 
                        icon={CheckCircle2} 
                        value={totalCompletedPrayers} 
                        target={totalPossiblePrayers} 
                        percent={prayerPercent} 
                        colorClass="from-emerald-400 to-emerald-500" 
                        bgTint="bg-emerald-50 dark:bg-emerald-500/10"
                        delay={0.3}
                    />
                    <StatCard 
                        title="Taraweeh" 
                        icon={Moon} 
                        value={totalTaraweeh} 
                        target={currentDay} 
                        percent={taraweehPercent} 
                        colorClass="from-blue-400 to-blue-500" 
                        bgTint="bg-blue-50 dark:bg-blue-500/10"
                        delay={0.4}
                    />
                    <StatCard 
                        title="Tahajjud" 
                        icon={Sparkles} 
                        value={totalTahajjud} 
                        target={currentDay} 
                        percent={tahajjudPercent} 
                        colorClass="from-violet-400 to-violet-500" 
                        bgTint="bg-violet-50 dark:bg-violet-500/10"
                        delay={0.5}
                    />
                    <StatCard 
                        title="Witr" 
                        icon={Heart} 
                        value={totalWitr} 
                        target={currentDay} 
                        percent={witrPercent} 
                        colorClass="from-rose-400 to-rose-500" 
                        bgTint="bg-rose-50 dark:bg-rose-500/10"
                        delay={0.6}
                    />
                </div>
            </div>
        </PageLayout>
    );
};

export default RamadanStats;

