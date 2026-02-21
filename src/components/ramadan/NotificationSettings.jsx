import React, { useState, useEffect } from 'react';
import { useRamadan } from '../../context/RamadanContext';
import { Bell, BellOff } from 'lucide-react';
import clsx from 'clsx';

const NotificationSettings = () => {
    const { prayerTimes, hijriDate } = useRamadan();
    const [prefs, setPrefs] = useState(() => {
        const saved = localStorage.getItem('awake_ramadan_notifications');
        return saved ? JSON.parse(saved) : { suhoor: false, iftar: false, tahajjud: false };
    });
    const [permission, setPermission] = useState(Notification.permission);

    // Save preferences
    useEffect(() => {
        localStorage.setItem('awake_ramadan_notifications', JSON.stringify(prefs));
    }, [prefs]);

    // Request permissions
    const requestPermission = async () => {
        if (!("Notification" in window)) return false;
        if (Notification.permission === "granted") return true;
        
        const perm = await Notification.requestPermission();
        setPermission(perm);
        return perm === "granted";
    };

    const handleToggle = async (key) => {
        if (!prefs[key]) {
            // Turning ON -> request permission first
            const granted = await requestPermission();
            if (!granted) {
                alert("Please enable notifications in your browser settings to receive reminders.");
                return;
            }
        }
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // The Scheduling Engine (runs every minute to check if it's time to notify)
    useEffect(() => {
        if (import.meta.env.VITE_RAMADAN_MODE !== 'true') return;
        if (!hijriDate?.isRamadan) return;
        if (permission !== 'granted') return;

        const checkReminders = () => {
            const now = new Date();
            const todayDateNumber = now.getDate();
            const todayPrayers = prayerTimes?.find(p => parseInt(p.date.gregorian.day, 10) === todayDateNumber);
            
            if (!todayPrayers) return;

            const parseTime = (timeStr) => {
                const timePart = timeStr.split(' ')[0];
                const [hours, mins] = timePart.split(':');
                const d = new Date(now);
                d.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
                return d;
            };

            const fajrTime = parseTime(todayPrayers.timings.Fajr);
            const maghribTime = parseTime(todayPrayers.timings.Maghrib);
            
            // Suhoor: 30 mins before Fajr
            const suhoorReminderTime = new Date(fajrTime.getTime() - 30 * 60000);
            
            // Tahajjud: 1.5 hours before Fajr (custom arbitrary time as requested)
            const tahajjudReminderTime = new Date(fajrTime.getTime() - 90 * 60000);

            const formatTimeMatch = (dateObj) => dateObj.getHours() + ':' + dateObj.getMinutes();
            const currentMatch = formatTimeMatch(now);

            // Check Suhoor
            if (prefs.suhoor && currentMatch === formatTimeMatch(suhoorReminderTime)) {
                sendNotification("Suhoor Reminder", "It's time for Suhoor. Fajr is in 30 minutes!");
            }

            // Check Iftar
            if (prefs.iftar && currentMatch === formatTimeMatch(maghribTime)) {
                sendNotification("Iftar Time", "It's time to break your fast! May Allah accept it.");
            }

            // Check Tahajjud
            if (prefs.tahajjud && currentMatch === formatTimeMatch(tahajjudReminderTime)) {
                sendNotification("Tahajjud Reminder", "Rise for Tahajjud. The best prayer after the obligatory ones.");
            }
        };

        const intervalId = setInterval(checkReminders, 60000); // Check every minute
        
        // Run once on mount to handle edge cases where they load right on the minute
        checkReminders();

        return () => clearInterval(intervalId);
    }, [prefs, prayerTimes, hijriDate, permission]);

    const sendNotification = (title, body) => {
        // Prevent spamming if already notified in this minute
        const lastNotif = sessionStorage.getItem(`notified_${title}`);
        const currentMinute = new Date().getMinutes();
        if (lastNotif && parseInt(lastNotif, 10) === currentMinute) return;

        sessionStorage.setItem(`notified_${title}`, currentMinute.toString());

        try {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                // Try SW first if available globally
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
        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
            <div>
                <span className="block font-medium text-slate-900 dark:text-white text-sm">{label}</span>
                <span className="block text-xs text-slate-500">{description}</span>
            </div>
            <button 
                onClick={onToggle}
                className={clsx(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    isOn ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"
                )}
            >
                <span className={clsx(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    isOn ? "translate-x-6" : "translate-x-1"
                )} />
            </button>
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Reminders</h2>
            </div>
            
            {permission === 'denied' && (
                <div className="mb-4 text-xs text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-3 rounded border border-rose-100 dark:border-rose-900/50">
                    Notifications are disabled in your browser. Reminders will not work until enabled.
                </div>
            )}

            <div className="flex flex-col">
                <ToggleRow 
                    label="Suhoor" 
                    description="30 minutes before Fajr"
                    isOn={prefs.suhoor} 
                    onToggle={() => handleToggle('suhoor')} 
                />
                <ToggleRow 
                    label="Iftar" 
                    description="At time of Maghrib"
                    isOn={prefs.iftar} 
                    onToggle={() => handleToggle('iftar')} 
                />
                <ToggleRow 
                    label="Tahajjud" 
                    description="1.5 hours before Fajr"
                    isOn={prefs.tahajjud} 
                    onToggle={() => handleToggle('tahajjud')} 
                />
            </div>
        </div>
    );
};

export default NotificationSettings;
