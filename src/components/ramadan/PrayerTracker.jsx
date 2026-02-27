import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useRamadan } from '../../context/RamadanContext';
import { usePrayer } from '../../context/PrayerContext';
import { Plus } from 'lucide-react';

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
    <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-lg p-0.5 gap-0.5 pointer-events-auto">
        {['jamaah', 'alone'].map(m => (
            <button
                key={m}
                onClick={(e) => { e.stopPropagation(); onChange(m); }}
                className={clsx(
                    "w-[58px] py-1 text-[11px] flex items-center justify-center font-semibold rounded-md transition-colors capitalize",
                    value === m
                        ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                        : "text-slate-500 dark:text-slate-400"
                )}
            >
                {m === 'jamaah' ? "Jama'ah" : 'Alone'}
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
            "flex items-center min-h-[56px] justify-between py-2 transition-colors cursor-pointer select-none",
            !isLast && !isActive && "border-b border-slate-100 dark:border-[#38383A]",
            isActive ? "bg-emerald-50 dark:bg-emerald-900/20 -mx-3 px-3 rounded-xl border border-emerald-500/30 my-1 shadow-sm" : "px-0"
        )}>
            <div className="flex items-center justify-between flex-1 min-w-0 gap-2 pr-3">
                <span className={clsx(
                    "text-[15px] leading-tight truncate flex items-center gap-2",
                    isActive ? "font-bold text-emerald-700 dark:text-emerald-400" : (completed ? "font-medium text-slate-900 dark:text-white" : "font-medium text-slate-500 dark:text-slate-400")
                )}>
                    {label}
                    {isActive && <span className="text-[9px] uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded flex-shrink-0">Now</span>}
                </span>
                
                {time && (
                    <div className="w-[85px] shrink-0 py-1 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-700/50 flex justify-center">
                        <span className="text-[13px] text-slate-600 dark:text-indigo-300 font-semibold tabular-nums">
                            {time}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
                {allowCount && completed && (
                    <div className="flex items-center gap-1 pointer-events-auto">
                        <button
                            onClick={(e) => { e.stopPropagation(); onUpdate(`${prayerKey}Count`, Math.max(0, count - 1)); }}
                            className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold flex items-center justify-center"
                        >−</button>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-5 text-center">{count}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); onUpdate(`${prayerKey}Count`, count + 1); }}
                            className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold flex items-center justify-center"
                        >+</button>
                    </div>
                )}
                {allowMode && (
                    <ModeSelector value={mode} onChange={(m) => onUpdate(`${prayerKey}Mode`, m)} />
                )}
                
                {/* iOS Style Toggle positioned after the prayer content */}
                <button
                    onClick={(e) => { e.stopPropagation(); onUpdate(prayerKey, !completed); }}
                    className={clsx(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none pointer-events-auto",
                        completed ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
                    )}
                >
                    <span
                        className={clsx(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            completed ? "translate-x-5" : "translate-x-0"
                        )}
                    />
                </button>
            </div>
        </div>
    );
};

const PrayerTracker = () => {
    const { ramadanData, updateRamadanDay, updateCustomPrayers, hijriDate } = useRamadan();
    const { dailyTimings, serverTodayKey } = usePrayer();
    
    // Fallback to local date if API hasn't loaded, ensures dynamic updates across midnight
    const [todayKey, setTodayKey] = useState(serverTodayKey || new Date().toLocaleDateString('en-CA'));
    const [now, setNow] = useState(new Date());
    
    // Update whenever serverKey changes
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        
        if (serverTodayKey) {
            setTodayKey(serverTodayKey);
        } else {
            // Setup a midnight roller if serverKey isn't working
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
        // If it's before Fajr, the active prayer is technically Isha of previous day, but we'll show no active prayer block for today or Isha. 
        if (!activePrayer && times.length > 0) activePrayer = times[times.length -1].key;
    }

    return (
        <div className="space-y-6">
            {/* 5 Daily Prayers */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-xl sm:rounded-2xl border border-slate-200 dark:border-[#2C2C2E] shadow-sm dark:shadow-none overflow-hidden">
                <div className="px-5 pt-4 pb-2">
                    <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Daily Prayers
                    </h2>
                </div>
                <div className="px-5 pb-2">
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
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-2">
                    <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Other Prayers
                    </h2>
                </div>
                <div className="px-5 pb-2">
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
                    
                    {/* Inline Add Prayer functionality */}
                    {isAddingPrayer ? (
                        <div className="flex flex-col sm:flex-row items-center gap-2 py-3 border-t border-slate-100 dark:border-[#38383A] animate-in fade-in slide-in-from-top-2">
                            <input 
                                type="text" 
                                value={newPrayerName}
                                onChange={e => setNewPrayerName(e.target.value)}
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleAddPrayer()}
                                placeholder="e.g. Istikhara"
                                className="flex-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button 
                                    onClick={handleAddPrayer} 
                                    className="flex-1 sm:flex-none px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    Save
                                </button>
                                <button 
                                    onClick={() => { setIsAddingPrayer(false); setNewPrayerName(''); }} 
                                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsAddingPrayer(true)} 
                            className="flex items-center justify-center gap-1.5 w-full py-3 mt-1 text-indigo-500 text-[15px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Prayer
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrayerTracker;
