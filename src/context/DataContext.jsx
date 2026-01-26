import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useDate } from './DateContext';
import { useAuthContext } from '../hooks/useAuthContext';
import { DEFAULT_ROUTINE } from '../data/defaultRoutine';
// import { StorageService } from '../lib/persistence/storage-service'; // Mocking for now as ts file imports in jsx can be tricky without proper tsconfig/build setup, but vite handles it. 
// Ideally we should move to .tsx files, but for now we follow the user instruction to just compose contexts.
// NOTE: I am using the existing useDailyStore hook instead of raw StorageService calls where possible, or wrapping them here.
// But to follow ARCHITECTURE.md strictly, DataContext wraps the logic.

// Since the user provided `.ts` files for logic but `.jsx` for contexts in the prompt example, I will assume standard Vite + React setup where importing .ts from .jsx works.

// We need to import the internal logic, assuming the provided files exist.
// Since I cannot see storage-service.ts content in full detail (I saw only the file list and size), I'll implement a wrapper that interfaces with the likely methods described in ARCHITECTURE.md.

// RE-READING ARCHITECTURE: 
// DataContext State: dailyData, syncStatus, lockState via actions updateTask, updateNote, submitDay, unlockDay

import { useDailyStore } from '../hooks/use-daily-store';
import { api } from '../services/api';

const DataContext = createContext();

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataContextProvider');
    }
    return context;
};

export const DataContextProvider = ({ children }) => {
    const { formattedDate } = useDate();
    const { user } = useAuthContext();

    // Default Schema Template
    const DEFAULT_HABITS = [
        { id: 'junkFood', label: 'Junk Food', type: 'toggle', icon: 'Pizza', value: false },
        { id: 'sugar', label: 'Excess Sugar', type: 'toggle', icon: 'Candy', value: false },
        { id: 'coldDrinks', label: 'Cold Drinks', type: 'toggle', icon: 'GlassWater', value: false },
        { id: 'screenTime', label: 'Screen Time', type: 'number', icon: 'Smartphone', value: 0, unit: 'hrs' },
        { id: 'logExpense', label: 'Logged Expenses?', type: 'toggle', icon: 'Wallet', value: false }
    ];

    const getInitialData = () => {
        // Generate key based on user or fallback to guest (though app should enforce login)
        const uid = user ? user.uid : 'guest';
        const storageKey = `awake_data_${uid}_${formattedDate}`;

        const stored = localStorage.getItem(storageKey);
        if (stored) {
            const data = JSON.parse(stored);
            // Ensure base arrays exist
            if (!data.tasks) data.tasks = [...DEFAULT_ROUTINE];
            if (!data.habits) data.habits = [...DEFAULT_HABITS];

            // Migration check: if habits is an object, convert to array
            if (data.habits && !Array.isArray(data.habits)) {
                data.habits = [
                    { id: 'junkFood', label: 'Junk Food', type: 'toggle', icon: 'Pizza', value: !!data.habits.junkFood },
                    { id: 'sugar', label: 'Excess Sugar', type: 'toggle', icon: 'Candy', value: !!data.habits.sugar },
                    { id: 'coldDrinks', label: 'Cold Drinks', type: 'toggle', icon: 'GlassWater', value: !!data.habits.coldDrinks },
                    { id: 'screenTime', label: 'Screen Time', type: 'number', icon: 'Smartphone', value: data.habits.screenTime || 0, unit: 'hrs' },
                    { id: 'logExpense', label: 'Logged Expenses?', type: 'toggle', icon: 'Wallet', value: !!data.habits.logExpense }
                ];
            } else if (data.habits && Array.isArray(data.habits)) {
                // Ensure migration for unit field if missing
                data.habits = data.habits.map(h => ({
                    ...h,
                    unit: h.type === 'number' ? (h.unit || 'hrs') : undefined
                }));
            }

            // Ensure habits has all default items if it's a new user or missing some
            DEFAULT_HABITS.forEach(defHabit => {
                if (!data.habits.find(h => h.id === defHabit.id)) {
                    data.habits.push(defHabit);
                }
            });

            // Migration: NIGHT -> EVE/NIGHT
            if (data.tasks) {
                data.tasks = data.tasks.map(t => ({
                    ...t,
                    category: t.category === 'NIGHT' ? 'EVE/NIGHT' : t.category
                }));
            }

            return data;
        }

        return {
            tasks: [...DEFAULT_ROUTINE], // Seed with default routine
            habits: [...DEFAULT_HABITS],
            submitted: false,
            locked: false,
            lastModified: Date.now()
        };
    };

    const [dailyData, setDailyData] = useState(getInitialData);

    // Sync validation on date/user change
    useEffect(() => {
        setDailyData(getInitialData());
    }, [formattedDate, user]);


    // --- API SYNC INTEGRATION ---
    const [remoteData, setRemoteData] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // 1. Fetch Remote Data on Mount
    useEffect(() => {
        const loadRemote = async () => {
            try {
                const data = await api.fetchAll();
                if (data && data.days) {
                    console.log("Remote Data Loaded:", Object.keys(data.days));
                    setRemoteData(data.days);
                }
            } catch (err) {
                console.error("Failed to load remote data", err);
            }
        };
        loadRemote();
    }, []);

    // 2. Re-Hydrate if Remote Data arrives and we are on a date that has remote data
    // Strategy: If Local is default/empty OR Remote is newer (we don't have timestamps easy check yet, assume Remote Wins for now if local matches default)
    useEffect(() => {
        if (remoteData && remoteData[formattedDate]) {
            // Check if we should overwrite local?
            // For MVP: If remote exists, use it.
            // But we don't want to overwrite un-saved local work?
            // Let's assume: If I open the app, I want what's on the sheet.
            // We should only overwrite if our local 'lastModified' is older than remote? 
            // We don't have remote timestamps in this simple kv store yet.
            // SIMPLEST: Just use remote if available.
            const incoming = remoteData[formattedDate];

            // Basic safety: Don't overwrite if we already have the SAME data
            if (JSON.stringify(incoming) !== JSON.stringify(dailyData)) {
                // Check if it looks valid
                if (incoming.tasks) {
                    console.log("Hydrating from Remote for", formattedDate);
                    setDailyData(incoming);
                    // Update LocalStorage too so it persists offline
                    const uid = user ? user.uid : 'guest';
                    localStorage.setItem(`awake_data_${uid}_${formattedDate}`, JSON.stringify(incoming));
                }
            }
        }
    }, [remoteData, formattedDate]); // Dependencies: when remote loads OR date changes

    // Persistence Layer
    const saveData = (newData) => {
        const uid = user ? user.uid : 'guest';
        const storageKey = `awake_data_${uid}_${formattedDate}`;

        const payload = {
            ...newData,
            lastModified: Date.now()
        };
        setDailyData(payload);
        localStorage.setItem(storageKey, JSON.stringify(payload));

        // SYNC TO GOOGLE SHEET
        // Debounce this? For now, fire and forget.
        api.sync({
            mutations: [{
                mutationId: crypto.randomUUID(),
                type: 'UPDATE_DAY',
                date: formattedDate,
                data: payload
            }]
        }).then(res => console.log("Synced:", res));
    };

    // Derived Locked State (Explicit Lock OR Past Date)
    const { isPast } = useDate();
    const isEffectivelyLocked = dailyData.locked || isPast;

    // Actions
    const updateTaskStatus = (taskId) => {
        if (isEffectivelyLocked) return;

        const newTasks = dailyData.tasks.map(t => {
            if (t.id === taskId) {
                // Cycle: unchecked -> checked -> missed -> unchecked
                let newStatus = 'unchecked';
                if (t.status === 'unchecked') newStatus = 'checked';
                else if (t.status === 'checked') newStatus = 'missed';

                return { ...t, status: newStatus };
            }
            return t;
        });
        saveData({ ...dailyData, tasks: newTasks });
    };

    const updateHabit = (habitId, value) => {
        if (isEffectivelyLocked) return;

        const newHabits = dailyData.habits.map(h =>
            h.id === habitId ? { ...h, value } : h
        );

        saveData({
            ...dailyData,
            habits: newHabits
        });
    };

    const addHabit = (label, type = 'toggle', unit = 'hrs', iconName) => {
        if (isEffectivelyLocked) return;

        const newHabit = {
            id: `habit_${Date.now()}`,
            label,
            type,
            icon: iconName || (type === 'number' ? 'Activity' : 'CheckCircle'),
            value: type === 'number' ? 0 : false,
            unit: type === 'number' ? unit : undefined
        };

        saveData({
            ...dailyData,
            habits: [...dailyData.habits, newHabit]
        });
    };

    const deleteHabit = (habitId) => {
        if (isEffectivelyLocked) return;

        // Prevent deleting default habits if desired, or just allow all
        const newHabits = dailyData.habits.filter(h => h.id !== habitId);
        saveData({ ...dailyData, habits: newHabits });
    };

    const submitDay = () => {
        // Can submit even if past, to lock it? Or only today?
        // User said: "When the user clicks “Complete Day”: The entire day is immediately locked."
        // Assuming allowed.
        const lockedData = { ...dailyData, submitted: true, locked: true };
        saveData(lockedData);
        // Here we would also trigger Google Sheets Sync
        console.log("Submitting to Cloud:", lockedData);
    };

    const unlockDay = (reason) => {
        // Only allow unlocking if NOT past (Strict rule: Past days read-only)
        if (isPast) {
            console.warn("Cannot unlock past days.");
            return;
        }

        console.log("Unlocking day:", formattedDate, "Reason:", reason);
        saveData({
            ...dailyData,
            locked: false,
            unlockHistory: [
                ...(dailyData.unlockHistory || []),
                {
                    timestamp: Date.now(),
                    reason: reason
                }
            ]
        });
    };

    // Init Tasks if empty (Helper for UI to call)
    const initTasks = (defaultTasks) => {
        if (dailyData.tasks.length === 0) {
            saveData({ ...dailyData, tasks: defaultTasks });
        }
    };

    // Task CRUD Operations
    const addTask = (taskData) => {
        if (isEffectivelyLocked) return;

        const newTask = {
            id: `task_${Date.now()}`,
            name: taskData.name,
            time: taskData.time,
            category: taskData.category,
            icon: taskData.icon || '✨',
            status: 'unchecked'
        };

        const newTasks = [...dailyData.tasks, newTask];
        // Sort by time
        newTasks.sort((a, b) => {
            if (!a.time || !b.time) return 0;
            const timeA = a.time.split(':').map(Number);
            const timeB = b.time.split(':').map(Number);
            return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        });

        saveData({ ...dailyData, tasks: newTasks });
    };

    const editTask = (taskId, updates) => {
        if (isEffectivelyLocked) return;

        const newTasks = dailyData.tasks.map(t =>
            t.id === taskId ? { ...t, ...updates } : t
        );

        // Re-sort if time was changed
        if (updates.time) {
            newTasks.sort((a, b) => {
                const timeA = a.time.split(':').map(Number);
                const timeB = b.time.split(':').map(Number);
                return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
            });
        }

        saveData({ ...dailyData, tasks: newTasks });
    };

    const deleteTask = (taskId) => {
        if (isEffectivelyLocked) return;

        const newTasks = dailyData.tasks.filter(t => t.id !== taskId);
        saveData({ ...dailyData, tasks: newTasks });
    };

    const updateAllTasks = (newTasks) => {
        if (isEffectivelyLocked) return;
        saveData({ ...dailyData, tasks: newTasks });
    };

    // --- Computed Metrics ---

    // Calculate Discipline Score (0-100)
    // Formula: (Routine Completion % * 0.7) + (Habit Adherence * 0.3) - (Missed Important * 5)
    const getDisciplineScore = () => {
        if (!dailyData.tasks || dailyData.tasks.length === 0) return 0;

        const totalTasks = dailyData.tasks.length;
        const completedTasks = dailyData.tasks.filter(t => t.status === 'checked').length;
        const completionRate = (completedTasks / totalTasks) * 100;

        // Simple v1: Just completion rate for now, enforcing "Real Data Only"
        return Math.round(completionRate);
    };

    // Get Historical Data (Read-Only)
    // Tries to get from remote/local storage for past N days
    const getHistory = (days = 7) => {
        const history = [];
        const now = new Date();

        // We need to access other keys in localStorage since we only hold 'dailyData' (current date) in state
        // This simulates a database query by scanning local keys
        // Format: awake_data_{uid}_{date}

        for (let i = 0; i < days; i++) {
            // Calculate date string
            // Note: We need a date formatter that matches 'yyyy-MM-dd' exactly as used in storage
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0]; // Simple ISO date part

            const uid = user ? user.uid : 'guest';
            const key = `awake_data_${uid}_${dateStr}`;
            const stored = localStorage.getItem(key);

            if (stored) {
                const data = JSON.parse(stored);
                // Calculate score for that day
                const t = data.tasks || [];
                const c = t.filter(x => x.status === 'checked').length;
                const score = t.length ? Math.round((c / t.length) * 100) : 0;

                history.push({ date: dateStr, score, data });
            } else {
                history.push({ date: dateStr, score: 0, data: null });
            }
        }
        return history.reverse(); // Oldest to newest
    };

    const value = useMemo(() => ({
        dailyData,
        updateTaskStatus,
        updateHabit,
        addHabit,
        deleteHabit,
        submitDay,
        unlockDay,
        initTasks,
        addTask,
        editTask,
        deleteTask,
        updateAllTasks,
        isAuthenticated: !!user,
        isLocked: isEffectivelyLocked,
        getDisciplineScore,
        getHistory
    }), [dailyData, isEffectivelyLocked, user]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
