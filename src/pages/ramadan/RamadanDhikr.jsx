import React, { useState, useEffect } from 'react';
import { useRamadan } from '../../context/RamadanContext';
import { BookOpen, Target, Settings2, Activity, Check } from 'lucide-react';
import clsx from 'clsx';

const CounterCard = ({ title, count, target, onSave, accentClass }) => {
    const [inputVal, setInputVal] = useState(String(count));
    const [saved, setSaved] = useState(false);

    // Keep in sync if parent count changes (e.g. on load)
    useEffect(() => {
        setInputVal(String(count));
    }, [count]);

    const handleSave = () => {
        const parsed = parseInt(inputVal, 10);
        if (!isNaN(parsed) && parsed >= 0) {
            onSave(parsed);
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
        }
    };

    const progress = target > 0 ? Math.min((count / target) * 100, 100) : 0;

    return (
        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-none">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">{title}</h3>

            {/* Count display */}
            <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-black text-black dark:text-white tabular-nums leading-none tracking-tight">{count}</span>
                {target > 0 && <span className="text-sm font-medium text-slate-400 mb-1">/ {target}</span>}
            </div>

            {/* Progress bar */}
            {target > 0 && (
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-4">
                    <div
                        className={clsx("h-full rounded-full transition-all duration-500", accentClass)}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {/* Manual input row */}
            <div className="flex items-center gap-2 mt-2">
                <input
                    type="number"
                    min="0"
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder="Enter count"
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                    onClick={handleSave}
                    className={clsx(
                        "px-4 py-2 rounded text-sm font-bold text-white transition-all active:scale-95 flex items-center gap-1",
                        saved ? "bg-emerald-500" : accentClass
                    )}
                >
                    {saved ? <><Check className="w-4 h-4" /> Saved</> : "Save"}
                </button>
            </div>
        </div>
    );
};

const QuranGoalWidget = ({ ramadanData, updateQuranGoal, currentDay }) => {
    const goalData = ramadanData?.quranGoal || null;
    const [isEditing, setIsEditing] = useState(!goalData);
    const [goalType, setGoalType] = useState(goalData?.type || 'pages');
    const [goalValue, setGoalValue] = useState(goalData?.value || (goalType === 'juz' ? 30 : 604));

    // Aggregate total across all days
    const totalPages = Object.values(ramadanData?.days || {}).reduce((sum, d) => sum + (d.quranPages || 0), 0);
    const totalJuz = Object.values(ramadanData?.days || {}).reduce((sum, d) => sum + (d.quranJuz || 0), 0);

    const currentTotal = goalData?.type === 'juz' ? totalJuz : totalPages;
    const target = goalData?.value || 1;
    const completionPercent = ((currentTotal / target) * 100).toFixed(1);
    
    const expectedProgress = Math.floor((currentDay / 30) * target);
    const diff = currentTotal - expectedProgress;
    
    let statusText = "On Track";
    let statusColor = "text-emerald-500";
    if (diff > 0) {
        statusText = `${diff} ${goalData?.type} ahead`;
        statusColor = "text-emerald-500";
    } else if (diff < 0) {
        statusText = `${Math.abs(diff)} ${goalData?.type} behind`;
        statusColor = "text-rose-500";
    }

    const handleSave = () => {
        updateQuranGoal({ type: goalType, value: parseInt(goalValue, 10) });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-500/20 rounded p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-indigo-800 dark:text-indigo-200 font-bold">
                    <Target className="w-5 h-5" /> Set Quran Goal
                </div>
                <div className="flex gap-3 mb-4">
                    <button 
                        onClick={() => { setGoalType('pages'); setGoalValue(604); }}
                        className={clsx("flex-1 py-2 text-sm font-semibold rounded-xl border", goalType === 'pages' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-indigo-600 border-indigo-200")}
                    >
                        Pages
                    </button>
                    <button 
                        onClick={() => { setGoalType('juz'); setGoalValue(30); }}
                        className={clsx("flex-1 py-2 text-sm font-semibold rounded-xl border", goalType === 'juz' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-indigo-600 border-indigo-200")}
                    >
                        Juz
                    </button>
                </div>
                <div className="flex gap-3">
                    <input 
                        type="number" 
                        value={goalValue} 
                        onChange={e => setGoalValue(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-800 rounded px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                    />
                    <button onClick={handleSave} className="bg-indigo-600 text-white px-6 font-bold rounded active:scale-95 transition-transform">
                        Save
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-none text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Quran Goal
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-black">{currentTotal}</span>
                        <span className="text-slate-400 font-medium">/ {goalData.value} {goalData.type}</span>
                    </div>
                </div>
                <button onClick={() => setIsEditing(true)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <Settings2 className="w-4 h-4" />
                </button>
            </div>

            <div className="relative z-10">
                <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-300">Completion</span>
                    <span className="text-white">{completionPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden mb-3">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(completionPercent, 100)}%` }} />
                </div>
                <div className="flex justify-between items-center text-xs font-semibold bg-slate-800/50 py-2 px-3 rounded">
                    <span className="text-slate-400">Pace target: {expectedProgress}</span>
                    <span className={statusColor}>{statusText}</span>
                </div>
            </div>
        </div>
    );
};

const RamadanDhikr = () => {
    const { loading, error, ramadanData, updateRamadanDay, updateQuranGoal, hijriDate } = useRamadan();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    if (loading) return <div className="p-4 text-center mt-16 text-slate-500 animate-pulse">Loading Tracker...</div>;
    if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

    const isRamadanActive = hijriDate?.isRamadan;

    if (!isRamadanActive) {
        return (
            <div className="p-6 text-center mt-16 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Tracking is paused.</p>
                <p className="text-sm">It is currently not Ramadan.</p>
            </div>
        );
    }

    const todayKey = now.toLocaleDateString('en-CA');
    const todayData = ramadanData?.days?.[todayKey] || {};

    const handleSave = (field, newVal) => {
        updateRamadanDay(todayKey, { [field]: newVal });
    };

    return (
        <div className="pb-24 pt-2 sm:pt-4">
            <header className="px-4 sm:px-0 flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-[28px] font-bold tracking-tight text-black dark:text-white">Dhikr</h1>
                </div>
            </header>

            <div className="px-4 sm:px-0 space-y-6">
                <QuranGoalWidget 
                    ramadanData={ramadanData} 
                    updateQuranGoal={updateQuranGoal} 
                    currentDay={hijriDate.day} 
                />

                <div className="space-y-4">
                    <CounterCard 
                        title="Tahlil (La ilaha illAllah)" 
                        count={todayData.tahlil || 0} 
                        target={100}
                        onSave={(val) => handleSave('tahlil', val)}
                        accentClass="bg-blue-500"
                    />
                    <CounterCard 
                        title="Salawat" 
                        count={todayData.salawat || 0} 
                        target={100}
                        onSave={(val) => handleSave('salawat', val)}
                        accentClass="bg-indigo-500"
                    />
                    <CounterCard 
                        title="Istighfar" 
                        count={todayData.istighfar || 0} 
                        target={100}
                        onSave={(val) => handleSave('istighfar', val)}
                        accentClass="bg-violet-500"
                    />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#2C2C2E]">
                    <h2 className="text-[17px] font-semibold text-black dark:text-white">Daily Quran Log</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <CounterCard 
                            title="Pages Read" 
                            count={todayData.quranPages || 0} 
                            target={0}
                            onSave={(val) => handleSave('quranPages', val)}
                            accentClass="bg-emerald-500"
                        />
                        <CounterCard 
                            title="Juz Read" 
                            count={todayData.quranJuz || 0} 
                            target={0}
                            onSave={(val) => handleSave('quranJuz', val)}
                            accentClass="bg-emerald-600"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RamadanDhikr;
