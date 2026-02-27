import React, { useState, useEffect } from 'react';
import { useRamadan } from '../../context/RamadanContext';
import { usePrayer } from '../../context/PrayerContext';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Compass, CloudMoon, Sun } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationSettings from '../../components/ramadan/NotificationSettings';
import PrayerTracker from '../../components/ramadan/PrayerTracker';
import RamadanImageSlider from '../../components/ramadan/RamadanImageSlider';
import LocationModal from '../../components/ramadan/LocationModal';
import PageLayout from '../../components/layout/PageLayout';

const RamadanDashboard = () => {
    const navigate = useNavigate();
    const { hijriDate } = useRamadan();
    const { dailyTimings, displayName, loading, error } = usePrayer();
    const [now, setNow] = useState(new Date());
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const renderHeader = (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tightest uppercase italic">Journey</h1>
                {displayName && (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setIsLocationModalOpen(true)}
                        className="flex items-center gap-1.5 mt-0.5 cursor-pointer group"
                    >
                        <Compass className="w-3.5 h-3.5 text-emerald-500 group-hover:rotate-45 transition-transform duration-500" />
                        <span className="text-[10px] font-black text-slate-400 dark:text-[#8E8E93] uppercase tracking-widest truncate max-w-[140px]">
                            {displayName.split(',')[0]}
                        </span>
                    </motion.div>
                )}
            </div>
            
            <button 
                onClick={() => navigate('/ramadan/settings')}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-white/5 text-slate-500 dark:text-[#8E8E93] active:scale-90 transition-all shadow-sm"
            >
                <MoreHorizontal className="w-6 h-6" />
            </button>
        </div>
    );

    if (loading && !dailyTimings) {
        return (
            <PageLayout header={renderHeader}>
                <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-6">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-white/5 border-t-emerald-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Compass className="w-6 h-6 text-emerald-500/50" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Finding Qibla...</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-[#8E8E93] uppercase tracking-[0.2em] mt-1">Syncing Celestial Data</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    let nextEvent = '';
    let countdownStr = '';
    let suhoorTimeStr = '--:--';
    let iftarTimeStr = '--:--';
    let isSuhoorEndingSoon = false;

    if (dailyTimings) {
        const { Fajr, Maghrib } = dailyTimings;
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
            isSuhoorEndingSoon = (fajrTime - now) <= 15 * 60 * 1000;
        } else if (now < maghribTime) {
            nextEvent = 'Iftar in';
            countdownStr = formatDiff(maghribTime - now);
        } else {
            nextEvent = 'Fasting Complete';
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
        <PageLayout
            header={renderHeader}
            renderFloating={<LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />}
        >
            <div className="space-y-6 pb-12">

            {error && !dailyTimings && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/30 rounded-3xl p-4 flex items-center justify-between shadow-sm"
                >
                    <p className="text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-tight">{error}</p>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 active:scale-95 transition-all">Retry</button>
                </motion.div>
            )}

            <div className="group relative bg-[#1C1C1E] border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden min-h-[320px] sm:min-h-[400px] flex flex-col justify-between">
                 <RamadanImageSlider />
                 
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 z-10" />

                 <div className="relative z-20 p-8 sm:p-12 flex-1 flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <span className="bg-white/10 backdrop-blur-xl text-white px-4 py-2 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase border border-white/10 shadow-2xl">
                                {isRamadanActive ? `JOURNEY DAY ${hijriDate.day}` : 'PRE-SEASON'}
                            </span>
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-right"
                        >
                             <p className="font-black text-white text-[20px] tracking-tightest leading-none drop-shadow-2xl">
                                 {hijriDate?.day} Ramadan {hijriDate?.year}
                             </p>
                             <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mt-2 drop-shadow-md">
                                 {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                             </p>
                        </motion.div>
                     </div>

                     <div className="mt-auto text-center">
                         <motion.p 
                            key={nextEvent}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-white/40 uppercase tracking-[0.3em] text-[11px] font-black mb-4 drop-shadow-md"
                         >
                             {nextEvent}
                         </motion.p>
                         <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-7xl sm:text-9xl font-black tabular-nums tracking-tighter text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.8)] italic"
                         >
                             {countdownStr}
                         </motion.div>
                     </div>
                 </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className={clsx(
                        "relative border rounded-[2.5rem] p-6 flex flex-col items-center justify-center shadow-sm transition-all duration-500 overflow-hidden", 
                        isSuhoorEndingSoon 
                            ? "bg-rose-500 border-rose-400 text-white shadow-rose-500/20" 
                            : "bg-white dark:bg-[#1C1C1E] border-slate-100 dark:border-white/5"
                    )}
                >
                    {isSuhoorEndingSoon && (
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-rose-600 opacity-90" />
                    )}
                    <div className="relative z-10 flex flex-col items-center">
                        <div className={clsx("p-2 rounded-xl mb-3", isSuhoorEndingSoon ? "bg-white/20" : "bg-orange-500/10")}>
                            <CloudMoon className={clsx("w-5 h-5", isSuhoorEndingSoon ? "text-white" : "text-orange-500")} />
                        </div>
                        <span className={clsx("text-[10px] font-black uppercase tracking-widest mb-1", 
                            isSuhoorEndingSoon ? "text-white animate-pulse" : "text-slate-400"
                        )}>
                            Suhoor {isSuhoorEndingSoon && 'Critical'}
                        </span>
                        <span className={clsx("text-[28px] font-black tracking-tightest leading-none",
                            isSuhoorEndingSoon ? "text-white" : "text-slate-900 dark:text-white"
                        )}>{suhoorTimeStr}</span>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative bg-emerald-500 border border-emerald-400 rounded-[2.5rem] p-6 flex flex-col items-center justify-center shadow-xl shadow-emerald-500/20 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 opacity-90" />
                    <div className="relative z-10 flex flex-col items-center text-white">
                        <div className="p-2 rounded-xl bg-white/20 mb-3">
                            <Sun className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Iftar Time</span>
                        <span className="text-[28px] font-black tracking-tightest leading-none">{iftarTimeStr}</span>
                    </div>
                </motion.div>
            </div>

            {isRamadanActive ? (
                <div className="space-y-10 pt-4">
                    <PrayerTracker />
                    <NotificationSettings />
                </div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2rem] p-8 text-center"
                >
                    <Compass className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-xs font-black text-slate-400 dark:text-[#8E8E93] uppercase tracking-[0.3em]">Standby</p>
                    <p className="text-[13px] font-bold text-slate-500 dark:text-[#48484A] mt-2">
                        Celestial tracking will activate once the moon is sighted.
                    </p>
                </motion.div>
            )}
            </div>
        </PageLayout>
    );
};

export default RamadanDashboard;
