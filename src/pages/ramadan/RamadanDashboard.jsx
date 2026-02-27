import React, { useState, useEffect, useRef } from 'react';
import { useRamadan } from '../../context/RamadanContext';
import { usePrayer } from '../../context/PrayerContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Edit3, MoreHorizontal, MapPin } from 'lucide-react';
import clsx from 'clsx';
import NotificationSettings from '../../components/ramadan/NotificationSettings';
import PrayerTracker from '../../components/ramadan/PrayerTracker';
import RamadanImageSlider from '../../components/ramadan/RamadanImageSlider';
import LocationModal from '../../components/ramadan/LocationModal';

const FastingTracker = ({ todayKey, ramadanData, updateDay }) => {
    const todayData = ramadanData?.days?.[todayKey] || {};
    
    // We use local state for the textarea to debounce the save
    const [reflection, setReflection] = useState(todayData.reflection || '');
    const debounceTimer = useRef(null);

    // Sync local reflection if Firestore changes broadly
    useEffect(() => {
        if (todayData.reflection !== undefined) {
            setReflection(todayData.reflection);
        }
    }, [todayData.reflection]);

    const handleToggleFasting = (isFasting) => {
        updateDay(todayKey, {
            fasted: isFasting,
            missed: !isFasting,
            qadhaRequired: !isFasting
        });
    };

    const handleReflectionChange = (e) => {
        const val = e.target.value;
        setReflection(val);
        
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            updateDay(todayKey, { reflection: val });
        }, 500);
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-[17px] font-semibold text-black dark:text-white mb-4">Today's Fast</h2>
            
            <div className="flex gap-3 mb-4">
                <button 
                    onClick={() => handleToggleFasting(true)}
                    className={clsx(
                        "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all shadow-sm border",
                        todayData.fasted 
                            ? "bg-emerald-500 text-white border-emerald-600 dark:border-transparent" 
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                    )}
                >
                    {todayData.fasted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    Fasting
                </button>
                <button 
                    onClick={() => handleToggleFasting(false)}
                    className={clsx(
                        "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all shadow-sm border",
                        todayData.missed 
                            ? "bg-rose-500 text-white border-rose-600 dark:border-transparent" 
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                    )}
                >
                    {todayData.missed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    Not Fasting
                </button>
            </div>

            {todayData.missed && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-medium mb-2">
                        <Edit3 className="w-4 h-4" /> Optional Reason / Reflection
                    </div>
                    <textarea 
                        maxLength={300}
                        value={reflection}
                        onChange={handleReflectionChange}
                        placeholder="Why was the fast missed today? (e.g. Travel, Illness)"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 placeholder:text-slate-400 resize-none h-20"
                    />
                    <div className="text-right text-xs text-slate-400 mt-1">
                        {reflection.length}/300
                    </div>
                    <div className="mt-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/50 p-2 rounded leading-relaxed">
                        <strong>Note:</strong> Since today was missed, 1 day of Qadha requires to be completed later.
                    </div>
                </div>
            )}
        </div>
    );
};

const PrayerRow = ({ title, completed, mode, onToggle, onChangeMode }) => {
    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
            <div className="flex items-center gap-3">
                <button 
                    onClick={onToggle}
                    className={clsx(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        completed 
                            ? "bg-indigo-500 text-white" 
                            : "border-2 border-slate-300 dark:border-slate-600"
                    )}
                >
                    {completed && <CheckCircle2 className="w-4 h-4" />}
                </button>
                <span className={clsx(
                    "text-[15px] font-medium transition-colors",
                    completed ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                )}>{title}</span>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button 
                    onClick={() => onChangeMode('jamaah')}
                    className={clsx(
                        "px-3 py-1 rounded text-xs font-semibold transition-colors",
                        mode === 'jamaah' 
                            ? "bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400" 
                            : "text-slate-500 dark:text-slate-400"
                    )}
                >
                    Jama'ah
                </button>
                <button 
                    onClick={() => onChangeMode('alone')}
                    className={clsx(
                        "px-3 py-1 rounded text-xs font-semibold transition-colors",
                        mode === 'alone' 
                            ? "bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400" 
                            : "text-slate-500 dark:text-slate-400"
                    )}
                >
                    Alone
                </button>
            </div>
        </div>
    );
};

const RamadanDashboard = () => {
    const navigate = useNavigate();
    const { ramadanData, updateRamadanDay } = useRamadan();
    const { dailyTimings, hijriDate, displayName, loading, error, requestLocation } = usePrayer();
    const [now, setNow] = useState(new Date());
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (loading && !dailyTimings) {
        return <div className="p-4 text-center mt-16 text-slate-500 animate-pulse">Initializing Ramadan Engine...</div>;
    }

    let nextEvent = '';
    let countdownStr = '';
    let suhoorTimeStr = '--:--';
    let iftarTimeStr = '--:--';

    if (dailyTimings) {
        const { Fajr, Maghrib } = dailyTimings;
        // Parse "05:12 (+0530)" to local date object
        const parseTime = (timeStr) => {
            const timePart = timeStr.split(' ')[0];
            const [hours, mins] = timePart.split(':');
            const d = new Date(now);
            d.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
            return d;
        };

        const fajrTime = parseTime(Fajr);
        const maghribTime = parseTime(Maghrib);
        
        suhoorTimeStr = fajrTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        iftarTimeStr = maghribTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        if (now < fajrTime) {
            nextEvent = 'Suhoor ends in';
            countdownStr = formatDiff(fajrTime - now);
        } else if (now < maghribTime) {
            nextEvent = 'Iftar in';
            countdownStr = formatDiff(maghribTime - now);
        } else {
            nextEvent = 'Day Complete';
            countdownStr = '00:00:00';
        }
    }

    function formatDiff(ms) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    const isRamadanActive = hijriDate?.isRamadan;

    return (
        <div className="pb-12">
            <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
            
            {/* Header */}
            <header className="sticky top-0 z-30 bg-slate-50/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 -mx-4 px-4 mb-6" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
                <div className="py-3 flex items-center justify-between">
                    <div>
                        <h1 className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-white">Ramadan Track</h1>
                        {displayName && (
                            <div 
                                onClick={() => setIsLocationModalOpen(true)}
                                className="flex items-center gap-1 cursor-pointer"
                            >
                                <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                    {displayName.split(',')[0]}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => navigate('/ramadan/settings')}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 active:scale-95 transition-all shadow-sm"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="space-y-6">

            {error && !dailyTimings && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
                    <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 rounded text-xs font-bold hover:bg-red-200 dark:hover:bg-red-500/40">Retry</button>
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden relative min-h-[220px] sm:min-h-[260px] flex flex-col justify-between">
                 {/* Cinematic Image Slider Background */}
                 <RamadanImageSlider />

                 <div className="relative z-20 p-6 sm:p-8 flex-1 flex flex-col justify-between">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase border border-white/10 shadow-sm">
                                {isRamadanActive ? `Day ${hijriDate.day}` : 'Pre-Ramadan'}
                            </span>
                        </div>
                        <div className="text-right">
                             <p className="font-semibold text-white text-[16px] drop-shadow-md">{hijriDate?.day} Ramadan {hijriDate?.year}</p>
                             <p className="text-slate-300 text-[13px] mt-0.5 drop-shadow-md">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                        </div>
                     </div>

                     <div className="mt-auto text-center pb-2">
                         <p className="text-white/80 uppercase tracking-widest text-xs sm:text-sm font-bold mb-3 drop-shadow-md">{nextEvent}</p>
                         {/* Massive tabular countdown timer */}
                         <div className="text-6xl sm:text-8xl font-black tabular-nums tracking-tighter text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                             {countdownStr}
                         </div>
                     </div>
                 </div>
            </div>

            {/* Suhoor and Iftar Highlights */}
            {dailyTimings && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1.5">Suhoor Ends</span>
                        <span className="text-black dark:text-white text-[24px] font-bold tracking-tight">{suhoorTimeStr}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1.5">Iftar Time</span>
                        <span className="text-black dark:text-white text-[24px] font-bold tracking-tight">{iftarTimeStr}</span>
                    </div>
                </div>
            )}

            {/* Full Prayer Tracker (Daily + Night) */}
            {isRamadanActive && (
                <PrayerTracker />
            )}

            {/* Notification Reminders Section */}
            {isRamadanActive && (
                <NotificationSettings />
            )}

            {!isRamadanActive && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center text-slate-400 text-[14px]">
                    Ramadan has not officially started yet according to the calculated Hijri date.
                </div>
            )}
            
            </div>
        </div>
    );
};

export default RamadanDashboard;
