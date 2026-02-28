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

    const ToggleRow = ({ label, isOn, onToggle }) => (
        <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0 group">
            <span className="block text-[13px] font-black uppercase tracking-widest text-slate-500 dark:text-[#8E8E93] group-hover:text-indigo-500 transition-colors">{label}</span>
            <button 
                onClick={onToggle}
                className={clsx(
                    "relative inline-flex h-6 w-10 items-center rounded-full transition-all duration-300 shadow-inner",
                    isOn ? "bg-indigo-600" : "bg-slate-200 dark:bg-white/10"
                )}
            >
                <div className={clsx(
                    "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out",
                    isOn ? "translate-x-5" : "translate-x-1"
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
                    <h2 className="text-[17px] font-black uppercase tracking-tight text-slate-900 dark:text-white">Reminders</h2>
                </div>
            </div>
            
            <div className="flex flex-col">
                <ToggleRow 
                    label="Suhoor" 
                    isOn={prefs.suhoor} 
                    onToggle={() => handleToggle('suhoor')} 
                />
                <ToggleRow 
                    label="Iftar" 
                    isOn={prefs.iftar} 
                    onToggle={() => handleToggle('iftar')} 
                />
                <ToggleRow 
                    label="Tahajjud" 
                    isOn={prefs.tahajjud} 
                    onToggle={() => handleToggle('tahajjud')} 
                />
            </div>
        </motion.div>
    );
};


export default NotificationSettings;
