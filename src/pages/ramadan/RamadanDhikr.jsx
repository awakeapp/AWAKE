import React, { useState, useEffect } from 'react';
import { useRamadan } from '../../context/RamadanContext';
import { usePrayer } from '../../context/PrayerContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Target, MoreHorizontal, Activity, Check, Plus, Minus, Hash, Flame, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../../components/layout/PageLayout';

const DhikrListItem = ({ title, count, target, onClick, accentClass, bgTint = "bg-indigo-500/10", delay = 0 }) => {
    const progress = target > 0 ? Math.min((count / target) * 100, 100) : 0;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
            onClick={onClick}
            className="group relative bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-white/5 rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex items-center justify-between"
        >
            <div className="flex items-center gap-4">
                <div className={clsx("p-3 rounded-2xl", bgTint)}>
                    <Hash className={clsx("w-5 h-5", accentClass.replace('bg-', 'text-'))} />
                </div>
                <div>
                    <h3 className="text-[16px] font-black text-slate-900 dark:text-white leading-none mb-1.5">{title}</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-slate-500 dark:text-[#8E8E93] tabular-nums tracking-tight">
                            {count} {target > 0 && `/ ${target}`}
                        </span>
                    </div>
                </div>
            </div>

            {target > 0 && (
                <div className="w-12 h-12 relative flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                            className="text-slate-100 dark:text-white/5"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                            className={accentClass.replace('bg-', 'text-')}
                            strokeWidth="3"
                            strokeDasharray={`${progress}, 100`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    {progress >= 100 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Check className={clsx("w-4 h-4", accentClass.replace('bg-', 'text-'))} />
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

const FullScreenCounter = ({ dhikr, onSave, onClose }) => {
    const { title, count, target } = dhikr;
    const [currentCount, setCurrentCount] = useState(count);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentCount !== count) onSave(currentCount);
        }, 500);
        return () => clearTimeout(timer);
    }, [currentCount, count, onSave]);

    const handleIncrement = () => {
        if (navigator.vibrate) navigator.vibrate(10);
        setCurrentCount(prev => prev + 1);
    };

    const handleReset = () => {
        if (!showResetConfirm) {
            setShowResetConfirm(true);
            setTimeout(() => setShowResetConfirm(false), 3000);
            return;
        }
        setCurrentCount(0);
        setShowResetConfirm(false);
    };

    const progress = target > 0 ? Math.min((currentCount / target) * 100, 100) : 0;
    const isComplete = target > 0 && currentCount >= target;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[200] bg-white dark:bg-[#1C1C1E] flex flex-col items-center justify-between py-12 px-6 overflow-hidden"
        >
            <div className="w-full flex justify-between items-center z-10 pt-4">
                <button onClick={() => { onSave(currentCount); onClose(); }} className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-slate-900 dark:text-white" />
                </button>
                <h2 className="text-[16px] font-black tracking-widest uppercase text-slate-900 dark:text-white absolute left-1/2 -translate-x-1/2">{title}</h2>
                <div className="w-12 h-12" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative w-full pt-10">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleIncrement}
                    className="relative w-48 h-48 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex flex-col items-center justify-center focus:outline-none shadow-[0_0_60px_rgba(99,102,241,0.05)] dark:shadow-[0_0_60px_rgba(99,102,241,0.1)] group select-none transition-transform mb-8"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                    {target > 0 && (
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-md" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2" fill="none" className="text-slate-200 dark:text-white/5" />
                            <motion.circle 
                                cx="50" cy="50" r="48" 
                                stroke="currentColor" 
                                strokeWidth="4" 
                                strokeLinecap="round"
                                strokeDasharray="301.59" 
                                initial={{ strokeDashoffset: 301.59 }}
                                animate={{ strokeDashoffset: 301.59 - (progress / 100) * 301.59 }}
                                fill="none" 
                                className="text-indigo-500 transition-all duration-300 ease-out" 
                            />
                        </svg>
                    )}
                    <div className="absolute inset-4 rounded-full bg-gradient-to-b from-white dark:from-white/5 to-slate-50 dark:to-transparent border border-white dark:border-white/5 shadow-inner flex flex-col flex-1 items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-500/30">
                            <Plus className="w-8 h-8" />
                        </div>
                    </div>
                </motion.button>
                
                <div className="flex flex-col items-center text-center">
                    <span className="text-[80px] font-black tracking-tighter leading-none tabular-nums text-slate-900 dark:text-white">
                        {currentCount}
                    </span>
                    {target > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className={clsx(
                                "mt-4 px-6 py-2.5 rounded-full border text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors",
                                isComplete ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10"
                            )}
                        >
                            Target: {target}
                            {isComplete && <Check className="w-3.5 h-3.5" />}
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="pb-8 z-10 min-h-[60px]">
                <AnimatePresence mode="wait">
                    {!showResetConfirm ? (
                        <motion.button
                            key="reset-btn"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleReset}
                            className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-[#8E8E93] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                        >
                            Reset Counter
                        </motion.button>
                    ) : (
                        <motion.button
                            key="confirm-btn"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={handleReset}
                            className="px-6 py-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-500/30 text-[10px] font-black uppercase tracking-widest shadow-sm"
                        >
                            Tap to Confirm
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
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
    const [activeCounter, setActiveCounter] = useState(null);

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
            <PageLayout title="Remembrance">
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
        <PageLayout title="Remembrance" contentPadClass="px-4 pb-24 pt-4 flex flex-col gap-6">
            <div className="space-y-4">
                <QuranGoalWidget 
                    ramadanData={ramadanData} 
                    updateQuranGoal={updateQuranGoal} 
                    currentDay={hijriDate.day} 
                />

                <div className="space-y-3">
                    <DhikrListItem 
                        title="Tahlil (La ilaha illAllah)" 
                        count={todayData.tahlil || 0} 
                        target={100}
                        onClick={() => setActiveCounter({ key: 'tahlil', title: 'Tahlil (La ilaha illAllah)', count: todayData.tahlil || 0, target: 100 })}
                        accentClass="bg-blue-500 border-blue-600"
                        delay={0.1}
                    />
                    <DhikrListItem 
                        title="Salawat" 
                        count={todayData.salawat || 0} 
                        target={100}
                        onClick={() => setActiveCounter({ key: 'salawat', title: 'Salawat', count: todayData.salawat || 0, target: 100 })}
                        accentClass="bg-indigo-500 border-indigo-600"
                        delay={0.2}
                    />
                    <DhikrListItem 
                        title="Istighfar" 
                        count={todayData.istighfar || 0} 
                        target={100}
                        onClick={() => setActiveCounter({ key: 'istighfar', title: 'Istighfar', count: todayData.istighfar || 0, target: 100 })}
                        accentClass="bg-violet-500 border-violet-600"
                        delay={0.3}
                    />
                    
                    {customDhikrItems.map((cd, index) => (
                        <DhikrListItem 
                            key={cd.id}
                            title={cd.title} 
                            count={todayData[cd.id] || 0} 
                            target={cd.target}
                            onClick={() => setActiveCounter({ key: cd.id, title: cd.title, count: todayData[cd.id] || 0, target: cd.target })}
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
                        <DhikrListItem 
                            title="Pages Read" 
                            count={todayData.quranPages || 0} 
                            target={0}
                            onClick={() => setActiveCounter({ key: 'quranPages', title: 'Pages Read', count: todayData.quranPages || 0, target: 0 })}
                            accentClass="bg-emerald-500"
                            bgTint="bg-emerald-500/10"
                            delay={0.1}
                        />
                        <DhikrListItem 
                            title="Juz Read" 
                            count={todayData.quranJuz || 0} 
                            target={0}
                            onClick={() => setActiveCounter({ key: 'quranJuz', title: 'Juz Read', count: todayData.quranJuz || 0, target: 0 })}
                            accentClass="bg-emerald-600"
                            bgTint="bg-emerald-600/10"
                            delay={0.2}
                        />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {activeCounter && (
                    <FullScreenCounter 
                        dhikr={activeCounter} 
                        onSave={(val) => handleSave(activeCounter.key, val)}
                        onClose={() => setActiveCounter(null)}
                    />
                )}
            </AnimatePresence>
        </PageLayout>
    );
};

export default RamadanDhikr;
