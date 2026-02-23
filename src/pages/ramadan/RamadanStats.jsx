import React from 'react';
import { useRamadan } from '../../context/RamadanContext';
import { Activity, BarChart2, CheckCircle2, Moon, Sun, BookOpen, Heart } from 'lucide-react';
import clsx from 'clsx';

const StatCard = ({ title, icon: Icon, value, target, percent, colorClass = "bg-emerald-500", textClass = "text-emerald-500" }) => {
    const displayPercent = percent > 100 ? 100 : percent;
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className={clsx("p-2 rounded-xl bg-opacity-10", textClass, colorClass.replace('bg-', 'bg-').replace('500', '500/10'))}>
                    <Icon className={clsx("w-5 h-5", textClass)} />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300">{title}</h3>
            </div>
            
            <div className="flex items-end justify-between mb-2">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{value}</span>
                    {target && <span className="text-sm text-slate-400 font-medium">/ {target}</span>}
                </div>
                <span className={clsx("text-sm font-bold", textClass)}>{Math.round(percent)}%</span>
            </div>
            
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                    className={clsx("h-full rounded-full transition-all duration-1000", colorClass)} 
                    style={{ width: `${displayPercent}%` }}
                />
            </div>
        </div>
    );
};

const RamadanStats = () => {
    const { loading, error, ramadanData, hijriDate } = useRamadan();

    if (loading) return <div className="p-4 text-center mt-16 text-slate-500 animate-pulse">Loading Stats...</div>;
    if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

    const isRamadanActive = hijriDate?.isRamadan;

    if (!isRamadanActive) {
        return (
            <div className="p-6 text-center mt-16 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Stats unavailable.</p>
                <p className="text-sm">It is currently not Ramadan.</p>
            </div>
        );
    }

    const currentDay = hijriDate.day || 1;
    const daysLog = Object.values(ramadanData?.days || {});
    
    // Compute Fasting
    const totalFasted = daysLog.filter(d => d.fasted).length;
    const fastingPercent = currentDay > 0 ? (totalFasted / currentDay) * 100 : 0;

    // Compute Prayers
    const totalTaraweeh = daysLog.filter(d => d.taraweeh).length;
    const taraweehPercent = currentDay > 0 ? (totalTaraweeh / currentDay) * 100 : 0;
    
    const totalTahajjud = daysLog.filter(d => d.tahajjud).length;
    const tahajjudPercent = currentDay > 0 ? (totalTahajjud / currentDay) * 100 : 0;
    
    const totalWitr = daysLog.filter(d => d.witr).length;
    const witrPercent = currentDay > 0 ? (totalWitr / currentDay) * 100 : 0;

    // Compute Quran
    const goalData = ramadanData?.quranGoal || { type: 'pages', value: 604 };
    const totalQuranCount = daysLog.reduce((sum, d) => sum + (goalData.type === 'juz' ? (d.quranJuz || 0) : (d.quranPages || 0)), 0);
    const quranPercent = goalData.value > 0 ? (totalQuranCount / goalData.value) * 100 : 0;

    // Compute 5 Daily Prayers completion (Fajr+Dhuhr+Asr+Maghrib+Isha)
    const DAILY_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const totalPossiblePrayers = currentDay * DAILY_PRAYERS.length;
    const totalCompletedPrayers = daysLog.reduce((sum, d) =>
        sum + DAILY_PRAYERS.filter(p => d[p]).length, 0
    );
    const prayerPercent = totalPossiblePrayers > 0 ? (totalCompletedPrayers / totalPossiblePrayers) * 100 : 0;

    // Compute Total Dhikr
    const totalTahlil = daysLog.reduce((sum, d) => sum + (d.tahlil || 0), 0);
    const totalSalawat = daysLog.reduce((sum, d) => sum + (d.salawat || 0), 0);
    const totalIstighfar = daysLog.reduce((sum, d) => sum + (d.istighfar || 0), 0);
    const grandTotalDhikr = totalTahlil + totalSalawat + totalIstighfar;

    return (
        <div className="space-y-6 pb-24">
            <header className="mb-6 px-2">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ramadan Stats</h1>
                        <p className="text-slate-500 text-sm mt-1">Your overall progress this month.</p>
                    </div>
                </div>
            </header>

            {/* Top Level Summary Card */}
            <div className="bg-indigo-600 dark:bg-indigo-900/50 rounded p-6 shadow-md text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-indigo-100 uppercase tracking-wider text-xs font-bold mb-1">Total Dhikr</p>
                        <p className="text-5xl font-black tabular-nums tracking-tight">{grandTotalDhikr}</p>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <Heart className="w-8 h-8 text-white fill-white/20" />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <StatCard 
                    title="Fasting Days" 
                    icon={Sun} 
                    value={totalFasted} 
                    target={currentDay} 
                    percent={fastingPercent} 
                    colorClass="bg-emerald-500" 
                    textClass="text-emerald-500"
                />
                <StatCard 
                    title="Daily Prayers" 
                    icon={CheckCircle2} 
                    value={totalCompletedPrayers} 
                    target={totalPossiblePrayers} 
                    percent={prayerPercent} 
                    colorClass="bg-blue-500" 
                    textClass="text-blue-500"
                />
                <StatCard 
                    title="Taraweeh Completed" 
                    icon={Moon} 
                    value={totalTaraweeh} 
                    target={currentDay} 
                    percent={taraweehPercent} 
                    colorClass="bg-emerald-500" 
                    textClass="text-emerald-500"
                />
                <StatCard 
                    title="Tahajjud Prays" 
                    icon={Moon} 
                    value={totalTahajjud} 
                    target={currentDay} 
                    percent={tahajjudPercent} 
                    colorClass="bg-indigo-500" 
                    textClass="text-indigo-500"
                />
                <StatCard 
                    title="Witr Prays" 
                    icon={Moon} 
                    value={totalWitr} 
                    target={currentDay} 
                    percent={witrPercent} 
                    colorClass="bg-indigo-500" 
                    textClass="text-indigo-500"
                />
                <StatCard 
                    title="Quran Goal" 
                    icon={BookOpen} 
                    value={totalQuranCount} 
                    target={goalData.value} 
                    percent={quranPercent} 
                    colorClass="bg-blue-500" 
                    textClass="text-blue-500"
                />
            </div>
        </div>
    );
};

export default RamadanStats;
