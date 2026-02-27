import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useRamadan } from '../../context/RamadanContext';
import { usePrayer } from '../../context/PrayerContext';
import { Plus, Check, Clock, Users, User, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRAYERS = [
    { key: 'fajr',   label: 'Fajr',   allowMode: true },
    { key: 'dhuhr',  label: 'Dhuhr',  allowMode: true },
    { key: 'asr',    label: 'Asr',    allowMode: true },
    { key: 'maghrib',label: 'Maghrib',allowMode: true },
    { key: 'isha',   label: 'Isha',   allowMode: true },
];

const EXTRA_PRAYERS = [
    { key: 'taraweeh', label: 'Taraweeh',  allowMode: true,  allowCount: false },
    { key: 'tahajjud', label: 'Tahajjud',  allowMode: true,  allowCount: false },
    { key: 'duha',     label: 'Duha',       allowMode: false, allowCount: false },
    { key: 'rawatib',  label: 'Rawatib',    allowMode: false, allowCount: true  },
];

const ModeSelector = ({ value, onChange }) => (
    <div className="flex bg-slate-100 dark:bg-white/5 rounded-xl p-1 gap-1 pointer-events-auto shadow-inner">
        {[
            { id: 'jamaah', icon: Users },
            { id: 'alone', icon: User }
        ].map(m => (
            <button
                key={m.id}
                onClick={(e) => { e.stopPropagation(); onChange(m.id); }}
                className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                    value === m.id
                        ? "bg-white dark:bg-indigo-500 shadow-sm text-indigo-600 dark:text-white"
                        : "text-slate-400 dark:text-[#48484A] hover:text-slate-600 dark:hover:text-[#8E8E93]"
                )}
            >
                <m.icon className="w-3 H-3" />
                <span className="hidden xs:inline">{m.id}</span>
            </button>
        ))}
    </div>
);

const PrayerRow = ({ prayerKey, label, time, data, onUpdate, allowMode, allowCount, isLast, isActive }) => {
    const completed = data[prayerKey] || false;
    const mode = data[`${prayerKey}Mode`] || 'jamaah';
    const count = data[`${prayerKey}Count`] || 0;

    return (
        <div 
            onClick={() => onUpdate(prayerKey, !completed)}
            className={clsx(
                "group relative flex items-center min-h-[72px] justify-between py-3 transition-all duration-300 cursor-pointer select-none px-4 rounded-[20px]",
                isActive 
                    ? "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 my-2 shadow-sm" 
                    : "bg-transparent border border-transparent hover:bg-slate-50 dark:hover:bg-white/5"
            )}
        >
            {/* Status Indicator Bar */}
            <div className={clsx(
                "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full transition-all duration-500",
                completed ? "bg-emerald-500 scale-y-100" : "bg-slate-200 dark:bg-white/10 scale-y-0"
            )} />

            <div className="flex items-center flex-1 min-w-0 gap-4">
                <div className={clsx(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border",
                    completed 
                        ? "bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/20" 
                        : "bg-white dark:bg-[#1C1C1E] border-slate-100 dark:border-white/10"
                )}>
                    {completed ? (
                        <Check className="w-6 h-6 text-white stroke-[3]" />
                    ) : (
                        <span className="text-[10px] font-black text-slate-300 dark:text-[#48484A] uppercase tracking-tighter">
                            {label.substring(0, 3)}
                        </span>
                    )}
                </div>

                <div className="flex flex-col">
                    <span className={clsx(
                        "text-[16px] font-black tracking-tight leading-none transition-colors",
                        completed ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-[#8E8E93]"
                    )}>
                        {label}
                        {isActive && <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-indigo-500 animate-pulse">Live</span>}
                    </span>
                    {time && (
                        <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-slate-400 dark:text-[#48484A]" />
                            <span className="text-[11px] font-bold text-slate-400 dark:text-[#48484A] tabular-nums">
                                {time}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-2">
                {allowCount && completed && (
                    <div className="flex items-center bg-slate-100 dark:bg-white/5 rounded-xl p-1 pointer-events-auto">
                        <button
                            onClick={(e) => { e.stopPropagation(); onUpdate(`${prayerKey}Count`, Math.max(0, count - 1)); }}
                            className="w-7 h-7 rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all flex items-center justify-center"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black text-slate-800 dark:text-white w-6 text-center">{count}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); onUpdate(`${prayerKey}Count`, count + 1); }}
                            className="w-7 h-7 rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all flex items-center justify-center"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
                
                {allowMode && completed && (
                    <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <ModeSelector value={mode} onChange={(m) => onUpdate(`${prayerKey}Mode`, m)} />
                    </motion.div>
                )}
                
                {!completed && (
                    <div className="w-11 h-6 bg-slate-100 dark:bg-white/5 rounded-full flex items-center px-1">
                        <div className="w-4 h-4 bg-slate-300 dark:bg-[#48484A] rounded-full" />
                    </div>
                )}
            </div>
        </div>
    );
};

const PrayerTracker = () => {
    const { ramadanData, updateRamadanDay, updateCustomPrayers, hijriDate } = useRamadan();
    const { dailyTimings, serverTodayKey } = usePrayer();
    
    const [todayKey, setTodayKey] = useState(serverTodayKey || new Date().toLocaleDateString('en-CA'));
    const [now, setNow] = useState(new Date());
    
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        
        if (serverTodayKey) {
            setTodayKey(serverTodayKey);
        } else {
            const interval = setInterval(() => {
                setTodayKey(new Date().toLocaleDateString('en-CA'));
            }, 60000);
            return () => { clearInterval(interval); clearInterval(timer); };
        }
        return () => clearInterval(timer);
    }, [serverTodayKey]);

    const todayData = ramadanData?.days?.[todayKey] || {};
    const customPrayers = ramadanData?.customPrayers || [];
    
    const [isAddingPrayer, setIsAddingPrayer] = useState(false);
    const [newPrayerName, setNewPrayerName] = useState('');

    const handleUpdate = (field, value) => {
        updateRamadanDay(todayKey, { [field]: value });
    };

    const formatPrayerTime = (timeStr) => {
        if (!timeStr) return null;
        try {
            const timePart = timeStr.split(' ')[0];
            const [hours, mins] = timePart.split(':');
            const d = new Date();
            d.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
            return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        } catch (e) {
            return timeStr;
        }
    };

    const handleAddPrayer = () => {
        const trimmed = newPrayerName.trim();
        if (!trimmed) return;
        
        const newPrayer = { 
            id: 'custom_' + Date.now(), 
            label: trimmed, 
            allowMode: false, 
            allowCount: false 
        };
        
        updateCustomPrayers([...customPrayers, newPrayer]);
        setNewPrayerName('');
        setIsAddingPrayer(false);
    };

    if (!hijriDate?.isRamadan) return null;

    const allOtherPrayers = [...EXTRA_PRAYERS, ...customPrayers];

    const parseTime = (timeStr) => {
        if (!timeStr) return null;
        try {
            const timePart = timeStr.split(' ')[0];
            const [hours, mins] = timePart.split(':');
            const d = new Date(now);
            d.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
            return d;
        } catch { return null; }
    };

    let activePrayer = null;
    if (dailyTimings) {
        const times = PRAYERS.map(p => ({
            key: p.key,
            date: parseTime(dailyTimings[p.label])
        })).filter(t => t.date);

        times.sort((a,b) => a.date - b.date);

        for (let i = times.length - 1; i >= 0; i--) {
            if (now >= times[i].date) {
                activePrayer = times[i].key;
                break;
            }
        }
        if (!activePrayer && times.length > 0) activePrayer = times[times.length -1].key;
    }

    return (
        <div className="space-y-10">
            {/* 5 Daily Prayers */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h2 className="text-[20px] font-black text-slate-900 dark:text-white uppercase tracking-tightest leading-none">OBLIGATORY</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">The Five Foundations</p>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm p-2 space-y-1">
                    {PRAYERS.map((p, idx) => {
                        const rawTime = dailyTimings?.[p.label]; 
                        const formattedTime = formatPrayerTime(rawTime);
                        return (
                            <PrayerRow
                                key={p.key}
                                prayerKey={p.key}
                                label={p.label}
                                time={formattedTime}
                                data={todayData}
                                onUpdate={handleUpdate}
                                allowMode={p.allowMode}
                                allowCount={false}
                                isLast={idx === PRAYERS.length - 1}
                                isActive={activePrayer === p.key}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Other Prayers */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h2 className="text-[20px] font-black text-slate-900 dark:text-white uppercase tracking-tightest leading-none">VOLUNTARY</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Extra Spiritual Miles</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm p-2 space-y-1">
                    {allOtherPrayers.map((p, idx) => (
                        <PrayerRow
                            key={p.key || p.id}
                            prayerKey={p.key || p.id}
                            label={p.label}
                            data={todayData}
                            onUpdate={handleUpdate}
                            allowMode={p.allowMode}
                            allowCount={p.allowCount}
                            isLast={idx === allOtherPrayers.length - 1 && !isAddingPrayer}
                        />
                    ))}
                    
                    <AnimatePresence>
                        {isAddingPrayer ? (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-4 py-4"
                            >
                                <div className="space-y-4">
                                    <input 
                                        type="text" 
                                        value={newPrayerName}
                                        onChange={e => setNewPrayerName(e.target.value)}
                                        autoFocus
                                        onKeyDown={e => e.key === 'Enter' && handleAddPrayer()}
                                        placeholder="Prayer Name (e.g. Istikhara)"
                                        className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/5 transition-all rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => { setIsAddingPrayer(false); setNewPrayerName(''); }} 
                                            className="flex-1 py-4 text-slate-500 font-bold uppercase text-[11px] tracking-widest"
                                        >
                                            Discard
                                        </button>
                                        <button 
                                            onClick={handleAddPrayer} 
                                            className="flex-[2] py-4 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20"
                                        >
                                            Add Prayer
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.button 
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsAddingPrayer(true)} 
                                className="w-full py-5 text-indigo-500 font-black uppercase text-[11px] tracking-[0.2em] hover:bg-indigo-500/5 rounded-[2rem] transition-all flex justify-center items-center gap-2"
                            >
                                <Plus className="w-4 h-4 stroke-[3]" /> Custom Dedication
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default PrayerTracker;
