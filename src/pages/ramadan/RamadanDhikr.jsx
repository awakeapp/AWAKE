import React, { useState, useEffect } from 'react';
import { useRamadan } from '../../context/RamadanContext';
import { usePrayer } from '../../context/PrayerContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Target, MoreHorizontal, Activity, Check, Plus, Minus, Hash, Flame } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../../components/layout/PageLayout';

const CounterCard = ({ title, count, target, onSave, accentClass, bgTint = "bg-indigo-500/10", delay = 0 }) => {
    const [inputVal, setInputVal] = useState(String(count));
    const [saved, setSaved] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setInputVal(String(count));
    }, [count]);

    const handleSave = () => {
        const parsed = parseInt(inputVal, 10);
        if (!isNaN(parsed) && parsed >= 0) {
            onSave(parsed);
            setSaved(true);
            setIsEditing(false);
            setTimeout(() => setSaved(false), 1500);
        }
    };
    
    const handleAddOne = (e) => {
        e.stopPropagation();
        const newVal = count + 1;
        onSave(newVal);
        setInputVal(String(newVal));
    };

    const handleSubOne = (e) => {
        e.stopPropagation();
        const newVal = Math.max(0, count - 1);
        onSave(newVal);
        setInputVal(String(newVal));
    };

    const progress = target > 0 ? Math.min((count / target) * 100, 100) : 0;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay }}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={clsx("p-2 rounded-xl", bgTint)}>
                        <Hash className={clsx("w-4 h-4", accentClass.replace('bg-', 'text-'))} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
                </div>
                {target > 0 && count >= target && (
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="bg-emerald-500 text-white p-1 rounded-full shadow-sm"
                    >
                        <Check className="w-3 h-3 stroke-[3]" />
                    </motion.div>
                )}
            </div>

            <div className="flex items-center justify-between gap-4 mb-4">
                <div 
                    onClick={() => setIsEditing(true)}
                    className="flex-1 cursor-text"
                >
                    <AnimatePresence mode="wait">
                        {!isEditing ? (
                            <motion.div 
                                key="display"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="flex items-baseline gap-1"
                            >
                                <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                                    {count}
                                </span>
                                {target > 0 && (
                                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">/ {target}</span>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="editor"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="number"
                                    autoFocus
                                    value={inputVal}
                                    onChange={e => setInputVal(e.target.value)}
                                    onBlur={handleSave}
                                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none p-1 text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 outline-none rounded-lg"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <button 
                        onClick={handleSubOne}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95 transition-all flex items-center justify-center shadow-sm"
                    >
                        <Minus className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleAddOne}
                        className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all text-white",
                            accentClass
                        )}
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {target > 0 && (
                <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8 }}
                        className={clsx("absolute inset-y-0 left-0 rounded-full", accentClass, progress >= 100 && "shadow-lg")}
                    />
                </div>
            )}
        </motion.div>
    );
};

const QuranGoalWidget = ({ ramadanData, updateQuranGoal, currentDay }) => {
    const goalData = ramadanData?.quranGoal || null;
    const [isEditing, setIsEditing] = useState(!goalData);
    const [goalType, setGoalType] = useState(goalData?.type || 'pages');
    const [goalValue, setGoalValue] = useState(goalData?.value || (goalType === 'juz' ? 30 : 604));

    const totalPages = Object.values(ramadanData?.days || {}).reduce((sum, d) => sum + (d.quranPages || 0), 0);
    const totalJuz = Object.values(ramadanData?.days || {}).reduce((sum, d) => sum + (d.quranJuz || 0), 0);

    const currentTotal = goalData?.type === 'juz' ? totalJuz : totalPages;
    const target = goalData?.value || 1;
    const completionPercent = ((currentTotal / target) * 100).toFixed(1);
    
    const expectedProgress = Math.floor((currentDay / 30) * target);
    const diff = currentTotal - expectedProgress;
    
    let statusText = "On Track";
    let statusColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10";
    if (diff > 0) {
        statusText = `+${diff} ${goalData?.type}`;
        statusColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10";
    } else if (diff < 0) {
        statusText = `${diff} ${goalData?.type}`;
        statusColor = "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10";
    }

    const handleSave = () => {
        updateQuranGoal({ type: goalType, value: parseInt(goalValue, 10) });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm"
            >
                <div className="flex items-center gap-3 mb-5 text-indigo-600 dark:text-indigo-400">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                        <Target className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Set Quran Goal</h3>
                        <p className="text-xs font-medium text-slate-500">Plan your completion</p>
                    </div>
                </div>
                
                <div className="flex gap-2 mb-4 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                        onClick={() => { setGoalType('pages'); setGoalValue(604); }}
                        className={clsx("flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all", goalType === 'pages' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400")}
                    >
                        Pages
                    </button>
                    <button 
                        onClick={() => { setGoalType('juz'); setGoalValue(30); }}
                        className={clsx("flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all", goalType === 'juz' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400")}
                    >
                        Juz
                    </button>
                </div>
                
                <div className="flex gap-2">
                    <input 
                        type="number" 
                        value={goalValue} 
                        onChange={e => setGoalValue(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder:opacity-30"
                        placeholder="Quantity"
                    />
                    <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-3 font-bold text-sm rounded-xl active:scale-95 transition-all">
                        Commit
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-[#1C1C1E] dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] -mr-16 -mt-16" />
            
            <div className="flex justify-between items-start mb-5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                        <BookOpen className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quran Focus</h3>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums leading-none tracking-tight">{currentTotal}</span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ {goalData.value} {goalData.type}</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-[#8E8E93] hover:text-slate-600 dark:hover:text-white transition-all active:scale-90"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            <div className="relative z-10 space-y-3">
                <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5 px-1">
                        <span className="text-slate-500 dark:text-[#8E8E93]">Completion</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{completionPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(completionPercent, 100)}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-emerald-500 rounded-full"
                        />
                    </div>
                </div>
                
                <div className="flex items-center justify-between gap-3 font-semibold text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Expected: {expectedProgress}</span>
                    </div>
                    <div className={clsx("px-2.5 py-1 rounded-md font-bold", statusColor)}>
                        {statusText}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const RamadanDhikr = () => {
    const navigate = useNavigate();
    const { loading, error, ramadanData, updateRamadanDay, updateQuranGoal, updateCustomDhikr, hijriDate } = useRamadan();
    const { serverTodayKey } = usePrayer();
    const [now, setNow] = useState(new Date());
    const [isAddingDhikr, setIsAddingDhikr] = useState(false);
    const [newDhikrName, setNewDhikrName] = useState('');
    const [newDhikrTarget, setNewDhikrTarget] = useState(100);

    const customDhikrItems = ramadanData?.customDhikr || [];

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

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
            <PageLayout
                header={
                    <div className="flex items-center justify-between w-full">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Remembrance</h1>
                    </div>
                }
            >
                <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center">
                        <Flame className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Active in Ramadan</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px] mx-auto mt-1">
                            This feature unlocks during the holy month.
                        </p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    const todayKey = serverTodayKey || now.toLocaleDateString('en-CA');
    const todayData = ramadanData?.days?.[todayKey] || {};

    const handleSave = (field, newVal) => {
        updateRamadanDay(todayKey, { [field]: newVal });
    };

    const handleAddCustomDhikr = () => {
        const trimmed = newDhikrName.trim();
        if (!trimmed) return;
        
        const newDhikr = {
            id: 'dhikr_' + Date.now(),
            title: trimmed,
            target: parseInt(newDhikrTarget, 10) || 0
        };
        
        updateCustomDhikr([...customDhikrItems, newDhikr]);
        setNewDhikrName('');
        setNewDhikrTarget(100);
        setIsAddingDhikr(false);
    };

    return (
        <PageLayout
            header={
                <div className="flex flex-row items-center justify-between w-full">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Remembrance</h1>
                        <p className="text-xs font-medium text-slate-500">{hijriDate?.day} Ramadan</p>
                    </div>
                    <button 
                        onClick={() => navigate('/ramadan/settings')}
                        className="p-2 -mr-2 text-slate-400 dark:text-[#8E8E93] hover:text-slate-600 dark:hover:text-white transition-colors"
                    >
                        <MoreHorizontal className="w-6 h-6" />
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                <QuranGoalWidget 
                    ramadanData={ramadanData} 
                    updateQuranGoal={updateQuranGoal} 
                    currentDay={hijriDate.day} 
                />

                <div className="space-y-3">
                    <CounterCard 
                        title="Tahlil (La ilaha illAllah)" 
                        count={todayData.tahlil || 0} 
                        target={100}
                        onSave={(val) => handleSave('tahlil', val)}
                        accentClass="bg-blue-500 border-blue-600"
                        delay={0.1}
                    />
                    <CounterCard 
                        title="Salawat" 
                        count={todayData.salawat || 0} 
                        target={100}
                        onSave={(val) => handleSave('salawat', val)}
                        accentClass="bg-indigo-500 border-indigo-600"
                        delay={0.2}
                    />
                    <CounterCard 
                        title="Istighfar" 
                        count={todayData.istighfar || 0} 
                        target={100}
                        onSave={(val) => handleSave('istighfar', val)}
                        accentClass="bg-violet-500 border-violet-600"
                        delay={0.3}
                    />
                    
                    {customDhikrItems.map((cd, index) => (
                        <CounterCard 
                            key={cd.id}
                            title={cd.title} 
                            count={todayData[cd.id] || 0} 
                            target={cd.target}
                            onSave={(val) => handleSave(cd.id, val)}
                            accentClass={["bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-emerald-500"][index % 4]}
                            delay={0.4 + (index * 0.1)}
                        />
                    ))}

                    <AnimatePresence>
                        {isAddingDhikr ? (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Custom Target</h3>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <input 
                                            type="text" 
                                            value={newDhikrName}
                                            onChange={e => setNewDhikrName(e.target.value)}
                                            placeholder="Dhikr Name (e.g. SubhanAllah)"
                                            autoFocus
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                                        />
                                        <input 
                                            type="number" 
                                            value={newDhikrTarget}
                                            onChange={e => setNewDhikrTarget(e.target.value)}
                                            placeholder="Daily Goal"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button 
                                            onClick={() => { setIsAddingDhikr(false); setNewDhikrName(''); }} 
                                            className="flex-1 py-3 text-slate-500 font-bold text-xs bg-slate-100 dark:bg-slate-800 rounded-xl"
                                        >
                                            Discard
                                        </button>
                                        <button 
                                            onClick={handleAddCustomDhikr} 
                                            className="flex-1 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
                                        >
                                            Save Dhikr
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.button 
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsAddingDhikr(true)} 
                                className="w-full py-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 font-semibold text-sm hover:border-indigo-500 hover:text-indigo-600 transition-all flex justify-center items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50"
                            >
                                <Plus className="w-4 h-4" /> Add Dhikr Note
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 px-1">Quranic Log</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <CounterCard 
                            title="Pages Read" 
                            count={todayData.quranPages || 0} 
                            target={0}
                            onSave={(val) => handleSave('quranPages', val)}
                            accentClass="bg-emerald-500"
                            bgTint="bg-emerald-500/10"
                            delay={0.1}
                        />
                        <CounterCard 
                            title="Juz Read" 
                            count={todayData.quranJuz || 0} 
                            target={0}
                            onSave={(val) => handleSave('quranJuz', val)}
                            accentClass="bg-emerald-600"
                            bgTint="bg-emerald-600/10"
                            delay={0.2}
                        />
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default RamadanDhikr;
