import React from 'react';
import { useRamadan } from '../../context/RamadanContext';
import { useNavigate } from 'react-router-dom';
import { Activity, BarChart2, CheckCircle2, Moon, Sun, BookOpen, Heart, MoreHorizontal, TrendingUp, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import PageLayout from '../../components/layout/PageLayout';

const StatCard = ({ title, icon: Icon, value, target, percent, colorClass = "from-emerald-400 to-emerald-600", bgTint = "bg-emerald-500/5", delay = 0 }) => {
    const displayPercent = Math.min(percent, 100);
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="group relative bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={clsx("p-2.5 rounded-2xl shrink-0 transition-transform group-hover:scale-110 duration-300", bgTint)}>
                    <Icon className={clsx("w-5 h-5", colorClass.replace('from-', 'text-').split(' ')[0])} />
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 dark:text-[#8E8E93] uppercase tracking-widest leading-none">
                        {Math.round(percent)}%
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                    </div>
                </div>
            </div>
            
            <div className="space-y-1 mb-4">
                <h3 className="text-[13px] font-bold text-slate-500 dark:text-[#8E8E93] tracking-tight">{title}</h3>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-[32px] font-black tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                        {value}
                    </span>
                    {target && (
                        <span className="text-[13px] text-slate-400 dark:text-[#48484A] font-bold">
                            / {target}
                        </span>
                    )}
                </div>
            </div>
            
            <div className="relative h-2 w-full bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${displayPercent}%` }}
                    transition={{ duration: 1, delay: delay + 0.2 }}
                    className={clsx("absolute inset-y-0 left-0 bg-gradient-to-r rounded-full shadow-[0_0_12px_rgba(0,0,0,0.1)]", colorClass)}
                />
            </div>
        </motion.div>
    );
};

const RamadanStats = () => {
    const navigate = useNavigate();
    const { loading, error, ramadanData, hijriDate } = useRamadan();

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin" />
                <p className="text-sm font-bold text-slate-400 animate-pulse">COMPUTING STATS...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/20 m-4">
            <Activity className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-rose-600 font-bold">{error}</p>
        </div>
    );

    const isRamadanActive = hijriDate?.isRamadan;

    if (!isRamadanActive) {
        return (
            <PageLayout
                title="Stats"
            >
                <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center">
                        <Moon className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Stats Inactive</h3>
                        <p className="text-sm text-slate-500 dark:text-[#8E8E93] max-w-[200px] mx-auto mt-1">
                            Ramadan hasn't started yet. Your journey begins soon.
                        </p>
                    </div>
                    <button 
                        onClick={() => navigate('/ramadan')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                        Return Home
                    </button>
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
        <PageLayout
            title="Analysis"
            rightNode={
                <button 
                    onClick={() => navigate('/ramadan/settings')}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
                >
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            }
        >
            <div className="space-y-6 pb-12">
                {/* Hero Summary Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-600 dark:to-indigo-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/20 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-[60px] -ml-24 -mb-24" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-indigo-100 uppercase tracking-[0.2em] text-[10px] font-black">Total Remembrance</h3>
                                <p className="text-[13px] font-bold text-white/80">Spreading peace through Dhikr</p>
                            </div>
                        </div>
                        
                        <div className="flex items-baseline gap-3">
                            <p className="text-[64px] font-black tabular-nums tracking-tighter leading-none">
                                {grandTotalDhikr.toLocaleString()}
                            </p>
                            <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-black uppercase tracking-wider mb-2">
                                Praise
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                            <div>
                                <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">Tahlil</p>
                                <p className="text-xl font-bold">{totalTahlil.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">Salawat</p>
                                <p className="text-xl font-bold">{totalSalawat.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">Istighfar</p>
                                <p className="text-xl font-bold">{totalIstighfar.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard 
                        title="Fasting Days" 
                        icon={Sun} 
                        value={totalFasted} 
                        target={currentDay} 
                        percent={fastingPercent} 
                        colorClass="from-orange-400 to-orange-600" 
                        bgTint="bg-orange-500/10"
                        delay={0.1}
                    />
                    <StatCard 
                        title="Quran Goals" 
                        icon={BookOpen} 
                        value={totalQuranCount} 
                        target={goalData.value} 
                        percent={quranPercent} 
                        colorClass="from-indigo-400 to-indigo-600" 
                        bgTint="bg-indigo-500/10"
                        delay={0.2}
                    />
                    <StatCard 
                        title="Daily Prayers" 
                        icon={CheckCircle2} 
                        value={totalCompletedPrayers} 
                        target={totalPossiblePrayers} 
                        percent={prayerPercent} 
                        colorClass="from-emerald-400 to-emerald-600" 
                        bgTint="bg-emerald-500/10"
                        delay={0.3}
                    />
                    <StatCard 
                        title="Taraweeh Done" 
                        icon={Moon} 
                        value={totalTaraweeh} 
                        target={currentDay} 
                        percent={taraweehPercent} 
                        colorClass="from-blue-400 to-blue-600" 
                        bgTint="bg-blue-500/10"
                        delay={0.4}
                    />
                    <StatCard 
                        title="Tahajjud Prays" 
                        icon={Sparkles} 
                        value={totalTahajjud} 
                        target={currentDay} 
                        percent={tahajjudPercent} 
                        colorClass="from-violet-400 to-violet-600" 
                        bgTint="bg-violet-500/10"
                        delay={0.5}
                    />
                    <StatCard 
                        title="Witr Prayers" 
                        icon={Heart} 
                        value={totalWitr} 
                        target={currentDay} 
                        percent={witrPercent} 
                        colorClass="from-rose-400 to-rose-600" 
                        bgTint="bg-rose-500/10"
                        delay={0.6}
                    />
                </div>
            </div>
        </PageLayout>
    );
};

export default RamadanStats;

