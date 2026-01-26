import { DateKey, RoutineEntry, HabitEntry, SyncMutation, PersistenceConfig } from '../types';

const KEYS = {
    CONFIG: 'awake_app_config',
    ROUTINES: 'awake_routines',
    HABITS: 'awake_habits',
    LOGS: 'awake_logs',
    SYNC_QUEUE: 'awake_sync_queue',
    LOCKED_DATES: 'awake_locked_dates'
};

export const StorageService = {
    // --- Config ---
    getConfig(): PersistenceConfig | null {
        const raw = localStorage.getItem(KEYS.CONFIG);
        return raw ? JSON.parse(raw) : null;
    },

    saveConfig(config: PersistenceConfig) {
        localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
    },

    // --- Routines ---
    getDailyRoutines(date: DateKey): Record<string, RoutineEntry> {
        const all = this._getAll(KEYS.ROUTINES);
        return all[date] || {};
    },

    getRoutine(date: DateKey, routineId: string): RoutineEntry | null {
        const all = this._getAll(KEYS.ROUTINES);
        return all[date]?.[routineId] || null;
    },

    saveRoutine(date: DateKey, routineId: string, status: boolean) {
        const all = this._getAll(KEYS.ROUTINES);
        if (!all[date]) all[date] = {};

        const entry: RoutineEntry = {
            completed: status,
            timestamp: Date.now()
        };

        all[date][routineId] = entry;
        localStorage.setItem(KEYS.ROUTINES, JSON.stringify(all));

        this.queueMutation('UPDATE_ROUTINE', { routineId, status }, date);
    },

    // --- Habits ---
    getDailyHabits(date: DateKey): Record<string, HabitEntry> {
        const all = this._getAll(KEYS.HABITS);
        return all[date] || {};
    },

    getHabit(date: DateKey, habitId: string): HabitEntry | null {
        const all = this._getAll(KEYS.HABITS);
        return all[date]?.[habitId] || null;
    },

    saveHabit(date: DateKey, habitId: string, score: number, notes?: string) {
        const all = this._getAll(KEYS.HABITS);
        if (!all[date]) all[date] = {};

        const entry: HabitEntry = {
            score,
            notes,
            timestamp: Date.now()
        };

        all[date][habitId] = entry;
        localStorage.setItem(KEYS.HABITS, JSON.stringify(all));

        this.queueMutation('UPDATE_HABIT', { habitId, score, notes }, date);
    },

    // --- Logs ---
    logAction(action: string, payload: any) {
        const logs = this.getLogs();
        logs.push({
            id: crypto.randomUUID(),
            action,
            payload,
            timestamp: Date.now()
        });
        localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
    },

    getLogs() {
        const raw = localStorage.getItem(KEYS.LOGS);
        return raw ? JSON.parse(raw) : [];
    },

    clearLogs() {
        localStorage.setItem(KEYS.LOGS, JSON.stringify([]));
    },

    // --- Queue ---
    queueMutation(type: SyncMutation['type'], data: any, date: DateKey) {
        const queue = this.getQueue();
        const mutation: SyncMutation = {
            mutationId: crypto.randomUUID(),
            type,
            data,
            date,
            timestamp: Date.now(),
            retryCount: 0
        };
        queue.push(mutation);
        localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
    },

    getQueue(): SyncMutation[] {
        const raw = localStorage.getItem(KEYS.SYNC_QUEUE);
        return raw ? JSON.parse(raw) : [];
    },

    setQueue(queue: SyncMutation[]) {
        localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
    },

    // --- Locked Dates ---
    getLockedDates(): DateKey[] {
        const raw = localStorage.getItem(KEYS.LOCKED_DATES);
        return raw ? JSON.parse(raw) : [];
    },

    setLockedDates(dates: DateKey[]) {
        localStorage.setItem(KEYS.LOCKED_DATES, JSON.stringify(dates));
    },

    isDateLocked(date: DateKey): boolean {
        const locked = this.getLockedDates();
        return locked.includes(date);
    },

    // --- Private Helpers ---
    _getAll(key: string): Record<string, any> {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : {};
    }
};
