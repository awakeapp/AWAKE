import React from 'react';
import { useRamadan } from '../../context/RamadanContext';
import { useNavigate } from 'react-router-dom';
import { Activity, BarChart2, CheckCircle2, Moon, Sun, BookOpen, Heart, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import PageLayout from '../../components/layout/PageLayout';

const StatCard = ({ title, icon: Icon, value, target, percent, colorClass = "bg-emerald-500", textClass = "text-emerald-500" }) => {
    const displayPercent = percent > 100 ? 100 : percent;
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <div className={clsx("p-2 rounded-xl bg-opacity-10", textClass, colorClass.replace('bg-', 'bg-').replace('500', '500/10'))}>
                        <Icon className={clsx("w-4 h-4", textClass)} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[12px] leading-tight">{title}</h3>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">{Math.round(percent)}%</p>
                    </div>
                </div>
            </div>
            
            <div className="flex items-end justify-between mb-2 mt-1">
                <div className="flex items-baseline gap-1">
                    <span className="text-[26px] font-black tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">{value}</span>
                    {target && <span className="text-[12px] text-slate-400 font-semibold mb-0.5">/ {target}</span>}
                </div>
            </div>
            
            <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                <div 
                    className={clsx("h-full rounded-full transition-all duration-1000", colorClass)} 
                    style={{ width: `${displayPercent}%` }}
                />
            </div>
        </div>
    );
};

const RamadanStats = () => {
    const navigate = useNavigate();
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
        <PageLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-white">Stats</h1>
                    <button 
                        onClick={() => navigate('/ramadan/settings')}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 active:scale-95 transition-all shadow-sm"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Top Level Summary Card */}
                <div className="bg-indigo-600 dark:bg-indigo-900 rounded-xl sm:rounded-2xl p-6 shadow-md text-white relative overflow-hidden">
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 uppercase tracking-wider text-[11px] font-bold mb-1">Total Dhikr</p>
                            <p className="text-[40px] font-black tabular-nums tracking-tight leading-none">{grandTotalDhikr}</p>
                        </div>
                        <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                            <Heart className="w-8 h-8 text-white fill-white/10" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    title="Taraweeh Done" 
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
        </PageLayout>
    );
};

export default RamadanStats;
