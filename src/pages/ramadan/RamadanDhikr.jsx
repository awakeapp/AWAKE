import React, { useState, useEffect } from 'react';
import { useRamadan } from '../../context/RamadanContext';
import { usePrayer } from '../../context/PrayerContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Target, MoreHorizontal, Activity, Check, Plus, Minus, Hash, Flame } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../../components/layout/PageLayout';

const CounterCard = ({ title, count, target, onSave, accentClass, bgTint = "bg-indigo-500/5", delay = 0 }) => {
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay }}
            className="group relative bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={clsx("p-2 rounded-xl", bgTint)}>
                        <Hash className={clsx("w-4 h-4", accentClass.replace('bg-', 'text-'))} />
                    </div>
                    <h3 className="text-[14px] font-bold text-slate-800 dark:text-[#8E8E93] tracking-tight">{title}</h3>
                </div>
                {target > 0 && count >= target && (
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="bg-emerald-500 text-white p-1 rounded-full shadow-lg shadow-emerald-500/20"
                    >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.div>
                )}
            </div>

            <div className="flex items-center justify-between gap-4 mb-6">
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
                                className="flex items-baseline gap-1.5"
                            >
                                <span className="text-[44px] font-black text-slate-900 dark:text-white tabular-nums tracking-tighter leading-none">
                                    {count}
                                </span>
                                {target > 0 && (
                                    <span className="text-sm font-bold text-slate-400 dark:text-[#48484A] mb-1">/ {target}</span>
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
                                    className="w-full bg-slate-50 dark:bg-white/5 border-none p-0 text-[40px] font-black tracking-tighter text-indigo-600 dark:text-indigo-400 outline-none rounded-lg"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleSubOne}
                        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-[#8E8E93] hover:bg-slate-200 dark:hover:bg-white/10 active:scale-90 transition-all flex items-center justify-center border border-slate-100 dark:border-white/5"
                    >
                        <Minus className="w-5 h-5 stroke-[3]" />
                    </button>
                    <button 
                        onClick={handleAddOne}
                        className={clsx(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all text-white border-2 border-white dark:border-white/10",
                            accentClass
                        )}
                    >
                        <Plus className="w-6 h-6 stroke-[3]" />
                    </button>
                </div>
            </div>

            {target > 0 && (
                <div className="relative w-full h-2 bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8 }}
                        className={clsx("absolute inset-y-0 left-0 rounded-full", accentClass, progress >= 100 && "shadow-[0_0_12px_rgba(16,185,129,0.4)]")}
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
    
    let statusText = "Perfect Pace";
    let statusColor = "text-emerald-500 bg-emerald-500/10";
    if (diff > 0) {
        statusText = `${diff} ${goalData?.type} ahead`;
        statusColor = "text-emerald-500 bg-emerald-500/10";
    } else if (diff < 0) {
        statusText = `${Math.abs(diff)} ${goalData?.type} behind`;
        statusColor = "text-rose-500 bg-rose-500/10";
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
                className="bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-500/20 rounded-[2rem] p-6 shadow-sm"
            >
                <div className="flex items-center gap-3 mb-6 text-indigo-600 dark:text-indigo-400">
                    <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center">
                        <Target className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-[17px] font-black uppercase tracking-tight">Set Quran Goal</h3>
                        <p className="text-[11px] font-bold opacity-60">PLAN YOUR SPIRITUAL JOURNEY</p>
                    </div>
                </div>
                
                <div className="flex gap-2 mb-4 bg-white/50 dark:bg-black/20 p-1 rounded-2xl">
                    <button 
                        onClick={() => { setGoalType('pages'); setGoalValue(604); }}
                        className={clsx("flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all", goalType === 'pages' ? "bg-white dark:bg-indigo-500 text-indigo-600 dark:text-white shadow-sm" : "text-slate-400")}
                    >
                        Pages
                    </button>
                    <button 
                        onClick={() => { setGoalType('juz'); setGoalValue(30); }}
                        className={clsx("flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all", goalType === 'juz' ? "bg-white dark:bg-indigo-500 text-indigo-600 dark:text-white shadow-sm" : "text-slate-400")}
                    >
                        Juz
                    </button>
                </div>
                
                <div className="flex gap-3">
                    <input 
                        type="number" 
                        value={goalValue} 
                        onChange={e => setGoalValue(e.target.value)}
                        className="flex-1 bg-white dark:bg-black border border-indigo-200 dark:border-indigo-800 rounded-2xl px-5 py-4 font-black text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder:opacity-30"
                        placeholder="Qty"
                    />
                    <button onClick={handleSave} className="bg-indigo-600 text-white px-8 py-4 font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
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
            className="group relative bg-[#1C1C1E] rounded-[2.5rem] p-7 shadow-2xl border border-white/5 overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] -mr-16 -mt-16" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                        <BookOpen className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-[#8E8E93] uppercase tracking-[0.2em] leading-none">Quran Focus</h3>
                        <div className="mt-1.5 flex items-baseline gap-2">
                            <span className="text-[36px] font-black text-white tabular-nums leading-none tracking-tight">{currentTotal}</span>
                            <span className="text-sm font-bold text-[#48484A]">/ {goalData.value} {goalData.type}</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-[#8E8E93] hover:text-white transition-all active:scale-90"
                >
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            <div className="relative z-10 space-y-4">
                <div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-2 px-1">
                        <span className="text-[#8E8E93]">Overall Completion</span>
                        <span className="text-emerald-400">{completionPercent}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden p-0.5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(completionPercent, 100)}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-end px-1"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 blur-[2px]" />
                        </motion.div>
                    </div>
                </div>
                
                <div className="flex items-center justify-between gap-3 font-bold text-[11px] uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-[#48484A]">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Pace: {expectedProgress}</span>
                    </div>
                    <div className={clsx("px-3 py-1.5 rounded-full", statusColor)}>
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin" />
                <p className="text-sm font-bold text-slate-400 animate-pulse">SYNCING REMEMBRANCE...</p>
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
                title="Dhikr"
            >
                <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center">
                        <Flame className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Silent Mode</h3>
                        <p className="text-sm text-slate-500 dark:text-[#8E8E93] max-w-[200px] mx-auto mt-1">
                            Remembrance tracking is available during the holy month of Ramadan.
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
            title="Remembrance"
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
                        bgTint="bg-blue-500/10"
                        delay={0.1}
                    />
                    <CounterCard 
                        title="Salawat" 
                        count={todayData.salawat || 0} 
                        target={100}
                        onSave={(val) => handleSave('salawat', val)}
                        accentClass="bg-indigo-500"
                        bgTint="bg-indigo-500/10"
                        delay={0.2}
                    />
                    <CounterCard 
                        title="Istighfar" 
                        count={todayData.istighfar || 0} 
                        target={100}
                        onSave={(val) => handleSave('istighfar', val)}
                        accentClass="bg-violet-500"
                        bgTint="bg-violet-500/10"
                        delay={0.3}
                    />
                    
                    {customDhikrItems.map((cd, index) => (
                        <CounterCard 
                            key={cd.id}
                            title={cd.title} 
                            count={todayData[cd.id] || 0} 
                            target={cd.target}
                            onSave={(val) => handleSave(cd.id, val)}
                            accentClass={["bg-blue-600", "bg-indigo-600", "bg-violet-600", "bg-emerald-600"][index % 4]}
                            bgTint={["bg-blue-500/10", "bg-indigo-500/10", "bg-violet-500/10", "bg-emerald-500/10"][index % 4]}
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
                                <div className="bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-xl space-y-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-[17px] font-black uppercase tracking-tight text-slate-900 dark:text-white">Custom Target</h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                                            <input 
                                                type="text" 
                                                value={newDhikrName}
                                                onChange={e => setNewDhikrName(e.target.value)}
                                                placeholder="e.g. SubhanAllah"
                                                autoFocus
                                                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/5 transition-all rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Goal</label>
                                            <input 
                                                type="number" 
                                                value={newDhikrTarget}
                                                onChange={e => setNewDhikrTarget(e.target.value)}
                                                placeholder="100"
                                                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/5 transition-all rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => { setIsAddingDhikr(false); setNewDhikrName(''); }} 
                                            className="flex-1 py-4 text-slate-500 font-bold uppercase text-[11px] tracking-widest"
                                        >
                                            Discard
                                        </button>
                                        <button 
                                            onClick={handleAddCustomDhikr} 
                                            className="flex-[2] py-4 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20"
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
                                className="w-full py-5 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2rem] text-slate-400 font-black uppercase text-[11px] tracking-[0.2em] hover:border-indigo-500/50 hover:text-indigo-500 hover:bg-indigo-500/5 transition-all flex justify-center items-center gap-3"
                            >
                                <Plus className="w-4 h-4" /> New Dhikr Account
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                <div className="pt-8 border-t border-slate-100 dark:border-white/5 space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h2 className="text-[20px] font-black text-slate-900 dark:text-white uppercase tracking-tightest leading-none">Quranic Log</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Daily Reading Progress</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
