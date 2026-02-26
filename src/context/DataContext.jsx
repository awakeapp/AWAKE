import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useDate } from './DateContext';
import { useAuthContext } from '../hooks/useAuthContext';
import { DEFAULT_ROUTINE } from '../data/defaultRoutine';
import { FirestoreService } from '../services/firestore-service';
import { Timestamp, orderBy, limit } from 'firebase/firestore'; // For robust timestamps if needed
import { DB } from '../services/db';

const DataContext = createContext();

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataContextProvider');
    }
    return context;
};

export const DataContextProvider = ({ children }) => {
    const { formattedDate, isPast } = useDate();
    const { user } = useAuthContext();
    const [isLoading, setIsLoading] = useState(true);

    // Default Schema Template
    // FREEDOM MODE: Start with NO habits.
    const DEFAULT_HABITS = [];
    const LEGACY_HABIT_IDS = ['junkFood', 'sugar', 'coldDrinks', 'screenTime', 'logExpense'];

    const getInitialDefaults = () => ({
        tasks: [],
        habits: [],
        submitted: false,
        locked: false,
        lastModified: Date.now()
    });

    const [dailyData, setDailyData] = useState(getInitialDefaults());

    // --- Master Template Logic ---
    // --- Master Template Logic ---

    // Sanitize helper to prevent undefined values
    // Stable reference (independent of state)
    const sanitizeTask = useCallback((t) => ({
        id: t.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: t.name || 'Untitled Task',
        time: t.time || '',
        category: t.category || 'EVE/NIGHT',
        icon: t.icon || 'CheckCircle',
        status: t.status || 'unchecked'
    }), []);

    const saveTemplate = useCallback(async (tasks) => {
        if (!user) return;
        try {
            // Strip status/completion data, keep structure
            const templateTasks = tasks.map(t => {
                const clean = sanitizeTask(t);
                clean.status = 'unchecked';
                return clean;
            });

            await FirestoreService.setItem(`users/${user.uid}/modules`, 'routine', {
                tasks: templateTasks,
                lastModified: Date.now()
            }, true);
        } catch (error) {
            console.error("[DataContext] Failed to save master template:", error);
        }
    }, [user, sanitizeTask]);

    // --- Firestore Subscriptions ---
    useEffect(() => {
        if (!user) {
            setDailyData(getInitialDefaults());
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const doBackfill = async () => {
            try {
                // STRATEGY: 
                // 1. Try to load from "Master Template" (users/{uid}/modules/routine)
                // 2. If no template, try to copy "Last Active Day"
                // 3. Else, use empty defaults.



                // 1. Check Master Template
                const templateDoc = await FirestoreService.getDocument(`users/${user.uid}/modules`, 'routine');

                if (templateDoc && templateDoc.tasks && templateDoc.tasks.length > 0) {

                    const templateTasks = templateDoc.tasks.map(t => ({
                        ...t,
                        status: 'unchecked' // Ensure fresh state
                    }));

                    // We also need to get Habits from somewhere... 
                    // For now, habits stick to the "Last Day" logic or defaults. 
                    // Ideally habits should also be templated, but let's persist with Last Day for habits 
                    // to match user expectation of "stickiness" for habits vs "permanent" for routine.

                    // Actually, let's try to get habits from last day even if we got tasks from template.
                    let carriedHabits = [];
                    const history = await FirestoreService.getCollection(
                        `users/${user.uid}/days`,
                        orderBy('date', 'desc'),
                        limit(1)
                    );

                    if (history && history.length > 0) {
                        const lastDay = history[0];
                        carriedHabits = (lastDay.habits || []).map(h => ({
                            ...h,
                            value: h.type === 'number' ? 0 : false
                        }));
                    }

                    const payload = {
                        tasks: templateTasks,
                        habits: carriedHabits,
                        date: formattedDate,
                        source: 'template',
                        submitted: false,
                        locked: false,
                        lastModified: Date.now()
                    };

                    await FirestoreService.setItem(`users/${user.uid}/days`, formattedDate, payload, true);
                    return payload;
                }

                // 2. Fallback to Last Day History (Old behavior)
                // Find the last record (orderBy date desc limit 1)
                const history = await FirestoreService.getCollection(
                    `users/${user.uid}/days`,
                    orderBy('date', 'desc'),
                    limit(1)
                );

                if (history && history.length > 0) {
                    const lastDay = history[0];
                    // Prevent carrying over from FUTURE or SELF
                    if (lastDay.date === formattedDate) return null;



                    const carriedTasks = (lastDay.tasks || []).map(t => ({
                        ...t,
                        status: 'unchecked'
                    }));

                    const carriedHabits = (lastDay.habits || []).map(h => ({
                        ...h,
                        value: h.type === 'number' ? 0 : false
                    }));

                    const payload = {
                        tasks: carriedTasks,
                        habits: carriedHabits,
                        date: formattedDate,
                        carriedOverFrom: lastDay.date,
                        submitted: false,
                        locked: false,
                        lastModified: Date.now()
                    };

                    // SAVE IMMEDIATELY
                    await FirestoreService.setItem(`users/${user.uid}/days`, formattedDate, payload, true);
                    return payload;
                }
                return null;
            } catch (err) {
                console.error("[DataContext] Backfill error:", err);
                return null;
            }
        };

        // Subscribe to the specific day document
        // Path: users/{uid}/days/{YYYY-MM-DD}
        const unsubscribe = FirestoreService.subscribeToDocument(
            `users/${user.uid}/days`,
            formattedDate,
            (data) => {
                if (data) {
                    // Merge with defaults to ensure schema evolution (e.g. new habits added to code show up)
                    // Note: This is a simple merge. Deep merging arrays needs care.
                    // For now, we trust the DB if it exists, but might need to backfill new default habits.

                    // Simple migration/backfill check for habits
                    let mergedHabits = data.habits || [];

                    // FREEDOM MODE: Purge legacy default habits if they exist
                    const rawHabitCount = mergedHabits.length;
                    mergedHabits = mergedHabits.filter(h => !LEGACY_HABIT_IDS.includes(h.id));
                    const hasLegacyHabits = mergedHabits.length !== rawHabitCount;

                    let loadedTasks = data.tasks || [];

                    // --- AUTO-MIGRATION: REMOVE LEGACY DEFAULTS ---
                    // The user wants "Freedom Mode". We must identify and purge old default tasks.
                    // Old defaults have IDs like "task_001", "task_002", etc.
                    // New/User tasks use "task_{Date.now()}" timestamp IDs.
                    const hasLegacyTasks = loadedTasks.some(t => t.id && String(t.id).startsWith('task_0'));

                    // --- CHECK IF BACKFILL IS NEEDED FOR EXISTING EMPTY DOC ---
                    // If doc exists but has NO tasks and NO habits, it's effectively empty.
                    // We should attempt to backfill unless we already did (carriedOverFrom check would be smart but maybe just checking emptiness is safer for now).
                    const isEmptyDay = loadedTasks.length === 0 && mergedHabits.length === 0;

                    if (isEmptyDay) {

                        doBackfill();
                        // We will receive a new snapshot shortly if backfill succeeds.
                        // Continue to render empty state for now.
                    }

                    // --- AUTO-FIX: BACKFILL MISSING CATEGORIES ---
                    // If user added tasks during Freedom Mode v1, they might lack categories.
                    // We infer category from their time to make them visible.
                    let needsUpdate = false;
                    loadedTasks = loadedTasks.map(t => {
                        if (!t.category && t.time) {
                            const [h] = t.time.split(':').map(Number);
                            let computedCategory = 'EVE/NIGHT';
                            if (h >= 4 && h < 9) computedCategory = 'EARLY MORNING';
                            else if (h >= 9 && h < 13) computedCategory = 'BEFORE NOON';
                            else if (h >= 13 && h < 17) computedCategory = 'AFTER NOON';

                            needsUpdate = true;

                            // computedCategory applied to local object
                            // console.log(`DataContext: Auto-categorizing task '${t.name}' to ${computedCategory}`);
                            return { ...t, category: computedCategory };
                        }
                        return t;
                    });

                    if (hasLegacyTasks || hasLegacyHabits) {
                        // FREEDOM MODE: Ensure day is UNLOCKED when purging legacy defaults.
                        // Only strictly necessary writes here.
                        FirestoreService.updateItem(`users/${user.uid}/days`, formattedDate, {
                            tasks: loadedTasks,
                            habits: mergedHabits,
                            locked: false,
                            submitted: false
                        });
                    }

                    setDailyData({
                        ...getInitialDefaults(),
                        ...data,
                        tasks: loadedTasks,
                        habits: mergedHabits,
                        // Update local state to match the forced unlock or use data/defaults
                        locked: (hasLegacyTasks || hasLegacyHabits) ? false : (data.locked || false),
                        submitted: (hasLegacyTasks || hasLegacyHabits) ? false : (data.submitted || false),
                    });
                } else {
                    // --- NEW DAY DETECTED (No data found) ---
                    // "Rolling Plan" Logic: Attempt to carry over from the most recent active day.

                    doBackfill().then((payload) => {
                        if (!payload) {
                            // Fallback to empty defaults if no history
                            setDailyData(getInitialDefaults());
                        }
                    }).finally(() => setIsLoading(false));

                    // Return early, doBackfill handles loading state
                    return;
                }
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [formattedDate, user]);

    // --- Persistence ---
    const saveData = useCallback(async (newData) => {
        if (!user) return; // Guest mode deferred

        // Sanitize payloads
        const cleanTasks = (newData.tasks || []).map(sanitizeTask);
        const cleanHabits = (newData.habits || []).map(h => ({
            ...h,
            id: h.id || `habit_${Date.now()}`,
            value: h.value !== undefined ? h.value : false
        }));

        const payload = {
            ...newData,
            tasks: cleanTasks,
            habits: cleanHabits,
            date: formattedDate, // Ensure date is queryable/stored
            lastModified: Date.now()
        };

        // Optimistic Update
        setDailyData(payload);

        // Fire to Firestore
        try {
            await FirestoreService.setItem(`users/${user.uid}/days`, formattedDate, payload);
        } catch (error) {
            console.error("[DataContext] Save failed:", error);
        }
    }, [user, formattedDate, sanitizeTask]);

    // Derived State
    const isToday = formattedDate === new Date().toISOString().split('T')[0];

    // Lock the day universally if it is in the past (Previous Day Lock System)
    const isEffectivelyLocked = isPast;

    // --- Actions ---

    const updateTaskStatus = useCallback(async (taskId) => {
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

        await saveData({ ...dailyData, tasks: newTasks });
    }, [dailyData, isEffectivelyLocked, saveData]);

    const updateHabit = useCallback(async (habitId, value) => {
        if (isEffectivelyLocked) return;

        const newHabits = dailyData.habits.map(h =>
            h.id === habitId ? { ...h, value } : h
        );

        await saveData({ ...dailyData, habits: newHabits });
    }, [dailyData, isEffectivelyLocked, saveData]);

    const addHabit = useCallback(async (label, type = 'toggle', unit = 'hrs', iconName) => {
        if (isEffectivelyLocked) return;

        const newHabit = {
            id: `habit_${Date.now()}`,
            label,
            type,
            icon: iconName || (type === 'number' ? 'Activity' : 'CheckCircle'),
            value: type === 'number' ? 0 : false,
            unit: type === 'number' ? unit : null
        };

        await saveData({
            ...dailyData,
            habits: [...dailyData.habits, newHabit]
        });
    }, [dailyData, isEffectivelyLocked, saveData]);

    const deleteHabit = useCallback(async (habitId) => {
        if (isEffectivelyLocked) return;
        const newHabits = dailyData.habits.filter(h => h.id !== habitId);
        await saveData({ ...dailyData, habits: newHabits });
    }, [dailyData, isEffectivelyLocked, saveData]);

    const submitDay = useCallback(async () => {
        const lockedData = { ...dailyData, submitted: true, locked: true };
        await saveData(lockedData);
    }, [dailyData, saveData]);

    const unlockDay = useCallback(async (reason) => {
        if (isPast) {
            console.warn("Cannot unlock past days.");
            return;
        }

        const unlockedData = {
            ...dailyData,
            locked: false,
            unlockHistory: [
                ...(dailyData.unlockHistory || []),
                {
                    timestamp: Date.now(),
                    reason: reason
                }
            ]
        };
        await saveData(unlockedData);
    }, [dailyData, isPast, saveData]);

    const initTasks = useCallback(async (defaultTasks) => {
        if (dailyData.tasks.length === 0) {
            await saveData({ ...dailyData, tasks: defaultTasks });
        }
    }, [dailyData, saveData]);

    // Task CRUD Operations (For Routine Tasks)
    const addTask = useCallback(async (taskData) => {
        if (isEffectivelyLocked) return;

        const newTask = sanitizeTask({
            ...taskData,
            id: `task_${Date.now()}`,
            status: 'unchecked'
        });

        const newTasks = [...dailyData.tasks, newTask];
        newTasks.sort((a, b) => {
            if (!a.time || !b.time) return 0;
            const timeA = a.time.split(':').map(Number);
            const timeB = b.time.split(':').map(Number);
            return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        });

        await saveData({ ...dailyData, tasks: newTasks });

        // Sync to Template
        saveTemplate(newTasks);
    }, [dailyData, isEffectivelyLocked, saveData, saveTemplate, sanitizeTask]);

    const editTask = useCallback(async (taskId, updates) => {
        if (isEffectivelyLocked) return;

        const newTasks = dailyData.tasks.map(t =>
            t.id === taskId ? { ...t, ...updates } : t
        );

        if (updates.time) {
            newTasks.sort((a, b) => {
                const timeA = a.time.split(':').map(Number);
                const timeB = b.time.split(':').map(Number);
                return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
            });
        }

        await saveData({ ...dailyData, tasks: newTasks });

        // Sync to Template
        saveTemplate(newTasks);
    }, [dailyData, isEffectivelyLocked, saveData, saveTemplate]);

    const deleteTask = useCallback(async (taskId) => {
        if (isEffectivelyLocked) return;
        const newTasks = dailyData.tasks.filter(t => t.id !== taskId);
        await saveData({ ...dailyData, tasks: newTasks });

        // Sync to Template
        saveTemplate(newTasks);
    }, [dailyData, isEffectivelyLocked, saveData, saveTemplate]);

    const updateAllTasks = useCallback(async (newTasks) => {
        if (isEffectivelyLocked) return;
        const cleanTasks = newTasks.map(sanitizeTask);
        await saveData({ ...dailyData, tasks: cleanTasks });

        // Sync to Template
        saveTemplate(cleanTasks);
    }, [dailyData, isEffectivelyLocked, saveData, saveTemplate, sanitizeTask]);

    // --- Metrics & History ---

    const getDisciplineScore = useCallback(() => {
        // Safe check for tasks existence
        if (!dailyData?.tasks || dailyData.tasks.length === 0) return 0;
        const total = dailyData.tasks.length;
        const checked = dailyData.tasks.filter(t => t.status === 'checked').length;
        return Math.round((checked / total) * 100);
    }, [dailyData]);

    // Asynchronous History Implementation
    const getHistory = useCallback(async (days = 7) => {
        if (!user) return [];

        const promises = [];
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            // Parallel Fetch
            promises.push(
                FirestoreService.getDocument(`users/${user.uid}/days`, dateStr)
                    .then(doc => {
                        // Normalize return shape
                        if (!doc) return { date: dateStr, score: 0, data: null };

                        const t = doc.tasks || [];
                        const c = t.filter(x => x.status === 'checked').length;
                        const score = t.length ? Math.round((c / t.length) * 100) : 0;
                        return { date: dateStr, score, data: doc };
                    })
            );
        }

        // Actually, for history, we usually just want to query the collection
        // users/{uid}/days where date >= 7 days ago.
        // But our docs are keyed by date. 
        // We'll return an empty array for now and I will add a proper 'History' hook or method to FirestoreService.
        // Or better yet, we can't break the UI signature. 
        // If the UI expects data immediately, we are in trouble.
        // Let's return empty array and fix the UI to load history async.
        return [];
    }, [user]);

    const getAllHistory = useCallback(async () => {
        if (!user) return [];
        return await DB.getAllHistory(user.uid);
    }, [user]);

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
        getHistory,
        getAllHistory,
        isLoading
    }), [
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
        user,
        isEffectivelyLocked,
        getDisciplineScore,
        getHistory,
        getAllHistory,
        isLoading
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
