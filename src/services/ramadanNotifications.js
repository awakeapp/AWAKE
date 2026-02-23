/**
 * Ramadan Notification Service
 * Uses browser Notification API with setTimeout scheduling.
 * All timeouts are tracked and cleaned up on demand.
 * 
 * @module ramadanNotifications
 */

const _pendingTimeouts = new Map(); // key -> timeout ID

/**
 * Request browser notification permission.
 * @returns {Promise<boolean>} true if granted
 */
export const requestPermission = async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
};

/**
 * Schedule a browser notification at a specific Date.
 * Prevents duplicate scheduling for the same key.
 * 
 * @param {string} key - Unique dedup key (e.g. 'suhoor-2026-02-23')
 * @param {Date} fireAt - Exact date/time to fire
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 */
export const scheduleNotification = (key, fireAt, title, body) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    // Clear existing if any
    if (_pendingTimeouts.has(key)) {
        clearTimeout(_pendingTimeouts.get(key));
        _pendingTimeouts.delete(key);
    }

    const msUntil = fireAt.getTime() - Date.now();
    if (msUntil <= 0) return; // Already passed

    const id = setTimeout(() => {
        try {
            new Notification(title, { body, icon: '/AWAKE/app-icon.png', badge: '/AWAKE/app-icon.png' });
        } catch (e) {
            console.warn('Notification failed:', e);
        }
        _pendingTimeouts.delete(key);
    }, msUntil);

    _pendingTimeouts.set(key, id);
};

/**
 * Parse a prayer time string like "05:12 (+0530)" to a Date object for today.
 * @param {string} timeStr
 * @returns {Date}
 */
const parseTimeToToday = (timeStr) => {
    const timePart = timeStr.split(' ')[0];
    const [hours, mins] = timePart.split(':').map(Number);
    const d = new Date();
    d.setHours(hours, mins, 0, 0);
    return d;
};

/**
 * Schedule Suhoor reminder (10 minutes before Fajr).
 * @param {string} fajrTimeStr - Raw time string from AlAdhan API
 * @param {string} dateKey - Today's YYYY-MM-DD key for dedup
 */
export const scheduleSuhoorReminder = (fajrTimeStr, dateKey) => {
    const fajr = parseTimeToToday(fajrTimeStr);
    fajr.setMinutes(fajr.getMinutes() - 10); // 10 mins before
    scheduleNotification(
        `suhoor-${dateKey}`,
        fajr,
        '🌙 Suhoor Reminder',
        'Suhoor ends in 10 minutes. Eat and prepare for your fast.'
    );
};

/**
 * Schedule Iftar reminder (at Maghrib time).
 * @param {string} maghribTimeStr
 * @param {string} dateKey
 */
export const scheduleIftarReminder = (maghribTimeStr, dateKey) => {
    const maghrib = parseTimeToToday(maghribTimeStr);
    scheduleNotification(
        `iftar-${dateKey}`,
        maghrib,
        '🌅 Iftar Time!',
        'Maghrib has arrived. You may break your fast. Allahu Akbar!'
    );
};

/**
 * Schedule Tahajjud reminder (default 2:00 AM).
 * @param {string} dateKey
 */
export const scheduleTahajjudReminder = (dateKey) => {
    const tahajjud = new Date();
    // Next 2am - if already past 2am, schedule for next day
    tahajjud.setHours(2, 0, 0, 0);
    if (tahajjud.getTime() <= Date.now()) {
        tahajjud.setDate(tahajjud.getDate() + 1);
    }
    scheduleNotification(
        `tahajjud-${dateKey}`,
        tahajjud,
        '✨ Tahajjud Time',
        'A blessed time for night prayer and dua. Rise and connect.'
    );
};

/**
 * Cancel all pending notification timeouts.
 * Call this on provider unmount or when RAMADAN_MODE is disabled.
 */
export const clearAllNotifications = () => {
    for (const id of _pendingTimeouts.values()) {
        clearTimeout(id);
    }
    _pendingTimeouts.clear();
};
