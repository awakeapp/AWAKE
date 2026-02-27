import React, { useState, useEffect } from 'react';
import { usePrayer } from '../../context/PrayerContext';
import { Bell, BellOff, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const NotificationSettings = () => {
    const { dailyTimings, hijriDate } = usePrayer();
    const [prefs, setPrefs] = useState(() => {
        const saved = localStorage.getItem('awake_ramadan_notifications');
        return saved ? JSON.parse(saved) : { suhoor: false, iftar: false, tahajjud: false };
    });
    const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');

    useEffect(() => {
        localStorage.setItem('awake_ramadan_notifications', JSON.stringify(prefs));
    }, [prefs]);

    const requestPermission = async () => {
        if (typeof Notification === 'undefined') return false;
        if (Notification.permission === "granted") return true;
        
        const perm = await Notification.requestPermission();
        setPermission(perm);
        return perm === "granted";
    };

    const handleToggle = async (key) => {
        if (!prefs[key]) {
            const granted = await requestPermission();
            if (!granted) {
                return;
            }
        }
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    useEffect(() => {
        if (import.meta.env.VITE_RAMADAN_MODE !== 'true') return;
        if (!hijriDate?.isRamadan) return;
        if (permission !== 'granted') return;

        const checkReminders = () => {
            const now = new Date();
            if (!dailyTimings) return;

            const parseTime = (timeStr) => {
                const timePart = timeStr.split(' ')[0];
                const [hours, mins] = timePart.split(':');
                const d = new Date(now);
                d.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
                return d;
            };

            const fajrTime = parseTime(dailyTimings.Fajr);
            const maghribTime = parseTime(dailyTimings.Maghrib);
            const suhoorReminderTime = new Date(fajrTime.getTime() - 30 * 60000);
            const tahajjudReminderTime = new Date(fajrTime.getTime() - 90 * 60000);

            const formatTimeMatch = (dateObj) => dateObj.getHours() + ':' + dateObj.getMinutes();
            const currentMatch = formatTimeMatch(now);

            if (prefs.suhoor && currentMatch === formatTimeMatch(suhoorReminderTime)) {
                sendNotification("Suhoor Reminder", "It's time for Suhoor. Fajr is in 30 minutes!");
            }
            if (prefs.iftar && currentMatch === formatTimeMatch(maghribTime)) {
                sendNotification("Iftar Time", "It's time to break your fast! May Allah accept it.");
            }
            if (prefs.tahajjud && currentMatch === formatTimeMatch(tahajjudReminderTime)) {
                sendNotification("Tahajjud Reminder", "Rise for Tahajjud. The best prayer after the obligatory ones.");
            }
        };

        const intervalId = setInterval(checkReminders, 60000);
        checkReminders();
        return () => clearInterval(intervalId);
    }, [prefs, dailyTimings, hijriDate, permission]);

    const sendNotification = (title, body) => {
        const lastNotif = sessionStorage.getItem(`notified_${title}`);
        const currentMinute = new Date().getMinutes();
        if (lastNotif && parseInt(lastNotif, 10) === currentMinute) return;

        sessionStorage.setItem(`notified_${title}`, currentMinute.toString());

        try {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(reg => {
                    reg.showNotification(title, { body, icon: '/favicon.ico' });
                });
            } else {
                new Notification(title, { body, icon: '/favicon.ico' });
            }
        } catch(e) {
            console.error("Notification failed", e);
        }
    };

    const ToggleRow = ({ label, description, isOn, onToggle }) => (
        <div className="flex items-center justify-between py-5 border-b border-slate-100 dark:border-white/5 last:border-0 group">
            <div className="space-y-1">
                <span className="block text-[13px] font-black uppercase tracking-widest text-slate-400 dark:text-[#8E8E93] group-hover:text-indigo-500 transition-colors">{label}</span>
                <span className="block text-[11px] font-bold text-slate-400 dark:text-[#48484A]">{description}</span>
            </div>
            <button 
                onClick={onToggle}
                className={clsx(
                    "relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 shadow-inner",
                    isOn ? "bg-indigo-600 shadow-indigo-600/30" : "bg-slate-200 dark:bg-white/5"
                )}
            >
                <div className={clsx(
                    "w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-500 ease-in-out",
                    isOn ? "translate-x-6" : "translate-x-1"
                )} />
            </button>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] -mr-16 -mt-16" />
            
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                    <Bell className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                    <h2 className="text-[17px] font-black uppercase tracking-tight text-slate-900 dark:text-white">Pulse Reminders</h2>
                    <p className="text-[10px] font-black text-slate-400 dark:text-[#8E8E93] uppercase tracking-[0.2em] mt-0.5">Spiritual Sync</p>
                </div>
            </div>
            
            <AnimatePresence>
                {permission === 'denied' && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-6"
                    >
                        <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-950/30">
                            <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 leading-relaxed uppercase tracking-tight">
                                Frequency Blocked. Enable system notifications to activate beacon alerts.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col">
                <ToggleRow 
                    label="Suhoor Signal" 
                    description="Triggered 30m prior to Dawn"
                    isOn={prefs.suhoor} 
                    onToggle={() => handleToggle('suhoor')} 
                />
                <ToggleRow 
                    label="Iftar Signal" 
                    description="Sync with sunset transition"
                    isOn={prefs.iftar} 
                    onToggle={() => handleToggle('iftar')} 
                />
                <ToggleRow 
                    label="Tahajjud Wake" 
                    description="Deep night spiritual call"
                    isOn={prefs.tahajjud} 
                    onToggle={() => handleToggle('tahajjud')} 
                />
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={clsx("w-2 h-2 rounded-full", permission === 'granted' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-slate-300 dark:bg-[#48484A]")} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-[#48484A]">
                        System Link: {permission === 'granted' ? 'Active' : 'Standby'}
                    </span>
                </div>
                {permission !== 'granted' && (
                    <button 
                        onClick={requestPermission}
                        className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 transition-colors"
                    >
                        Sync Notifications
                    </button>
                )}
            </div>
        </motion.div>
    );
};


export default NotificationSettings;
