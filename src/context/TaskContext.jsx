import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { format, isBefore, startOfDay, isSameDay } from 'date-fns';

const TaskContext = createContext();

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskContextProvider');
    }
    return context;
};

export const TaskContextProvider = ({ children }) => {
    const { user } = useAuthContext();
    const [tasks, setTasks] = useState([]);
    const [lockedDays, setLockedDays] = useState({}); // { "YYYY-MM-DD": { score: 85, completedAt: timestamp } }

    // Default Settings
    const [settings, setSettings] = useState({
        autoDeleteCompleted: false,
        confirmDelete: true,
        showCompletedInList: true,
        defaultPriority: 'Medium',
        defaultDuration: 15,
        dailyReminder: true,
        reminderTime: '09:00'
    });

    const currentDateStr = format(new Date(), 'yyyy-MM-dd');

    // Load from local storage
    useEffect(() => {
        const uid = user ? user.uid : 'guest';
        const tasksKey = `awake_workspace_tasks_${uid}`;
        const lockedKey = `awake_workspace_locked_days_${uid}`;
        const settingsKey = `awake_workspace_settings_${uid}`;

        try {
            const storedTasks = localStorage.getItem(tasksKey);
            const storedLocked = localStorage.getItem(lockedKey);
            const storedSettings = localStorage.getItem(settingsKey);

            if (storedTasks) setTasks(JSON.parse(storedTasks));
            else setTasks([]);

            if (storedLocked) setLockedDays(JSON.parse(storedLocked));
            else setLockedDays({});

            if (storedSettings) setSettings(prev => ({ ...prev, ...JSON.parse(storedSettings) }));
        } catch (e) {
            console.error("Failed to load task data", e);
        }
    }, [user]);

    // Persistence Helper
    const saveData = (newTasks, newLockedDays, newSettings) => {
        const uid = user ? user.uid : 'guest';
        if (newTasks !== undefined) {
            setTasks(newTasks);
            localStorage.setItem(`awake_workspace_tasks_${uid}`, JSON.stringify(newTasks));
        }
        if (newLockedDays !== undefined) {
            setLockedDays(newLockedDays);
            localStorage.setItem(`awake_workspace_locked_days_${uid}`, JSON.stringify(newLockedDays));
        }
        if (newSettings !== undefined) {
            setSettings(newSettings);
            localStorage.setItem(`awake_workspace_settings_${uid}`, JSON.stringify(newSettings));
        }
    };

    const updateSettings = (updates) => {
        const newSettings = { ...settings, ...updates };
        saveData(undefined, undefined, newSettings);
    };

    // --- Helpers ---
    const isDayLocked = (dateStr) => {
        // Only lock strictly past dates. Today is always editable until midnight.
        return dateStr < currentDateStr;
    };

    const getDailyScore = (dateStr) => {
        const dayTasks = tasks.filter(t => t.date === dateStr);
        if (dayTasks.length === 0) return 0;

        // Count completed tasks (status 'completed' OR boolean check if migrating)
        const completed = dayTasks.filter(t => t.status === 'completed' || t.isCompleted).length;
        return Math.round((completed / dayTasks.length) * 100);
    };

    // --- Actions ---

    // Enhanced Add Task
    const addTask = (title, options = {}) => {
        const taskDate = options.date || currentDateStr;

        if (isDayLocked(taskDate)) {
            console.warn("Cannot add tasks to a locked day.");
            return;
        }

        const newTask = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            status: 'pending', // pending | completed | missed
            isCompleted: false, // Backward compatibility
            date: taskDate,
            createdAt: Date.now(),

            // New Properties
            priority: options.priority || 'Medium',
            category: options.category || 'Work',
            time: options.time || null,
            estimatedTime: options.estimatedTime || 15,
            description: options.description || '',
        };

        saveData([newTask, ...tasks], undefined);
    };

    const updateTask = (id, updates) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        if (isDayLocked(task.date)) {
            console.warn("Cannot edit tasks of a locked day.");
            return;
        }

        const newTasks = tasks.map(t =>
            t.id === id ? { ...t, ...updates } : t
        );
        saveData(newTasks, undefined);
    };

    const toggleTask = (id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // Smart Toggle: If completing a PENDING task from a LOCKED (past) day, move it to TODAY first.
        if (isDayLocked(task.date)) {
            if (task.status !== 'completed' && !task.isCompleted) {
                // Move to today and complete
                updateTask(id, {
                    date: currentDateStr,
                    status: 'completed',
                    isCompleted: true
                });
                // Note: updateTask has a lock check, so we need to bypass it or use a raw update here.
                // updateTask blocks locked days. We should use a raw update or the new reschedule logic combined.
                return; // We'll handle this purely in the replacement block below to avoid double calls/logic issues.
            } else {
                return; // Prevent unchecking/modifying already completed past tasks
            }
        }

        // Standard logic for non-locked days
        const isNowCompleted = !(task.status === 'completed' || task.isCompleted);
        const newStatus = isNowCompleted ? 'completed' : 'pending';

        updateTask(id, {
            status: newStatus,
            isCompleted: isNowCompleted
        });
    };

    // Special action to move a task regardless of lock status (e.g., rolling over)
    const rescheduleTask = (id, newDateStr) => {
        const newTasks = tasks.map(t =>
            t.id === id ? { ...t, date: newDateStr } : t
        );
        saveData(newTasks, undefined); // Bypasses specific Update warnings
    };

    // Revision of toggleTask to use raw data update for the "Smart Move" to avoid the updateTask lock
    const smartToggleTask = (id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // Case 1: Task is on a locked past day AND is pending
        if (isDayLocked(task.date) && !task.isCompleted && task.status !== 'completed') {
            const newTasks = tasks.map(t =>
                t.id === id ? { ...t, date: currentDateStr, status: 'completed', isCompleted: true } : t
            );
            saveData(newTasks, undefined);
            return;
        }

        // Case 2: Task is on a locked day (completed/missed) -> Read Only
        if (isDayLocked(task.date)) return;

        // Case 3: Normal Toggle on Active Day
        const isNowCompleted = !(task.status === 'completed' || task.isCompleted);
        const newStatus = isNowCompleted ? 'completed' : 'pending';

        const newTasks = tasks.map(t =>
            t.id === id ? { ...t, status: newStatus, isCompleted: isNowCompleted } : t
        );
        saveData(newTasks, undefined);
    };

    const deleteTask = (id) => {
        const task = tasks.find(t => t.id === id);
        if (task && isDayLocked(task.date)) {
            console.warn("Cannot delete tasks of a locked day.");
            return;
        }
        const newTasks = tasks.filter(t => t.id !== id);
        saveData(newTasks, undefined);
    };

    // Complete Day Action
    const completeDay = () => {
        const score = getDailyScore(currentDateStr);

        // Mark all non-completed tasks as missed -> CHANGED: Keep them pending for rollover
        // We only lock the day. Pending tasks remain pending and will show up in "Pending from Previous Days"
        const newTasks = tasks.map(t => {
            // No status change for pending
            return t;
        });

        const newLockedDays = {
            ...lockedDays,
            [currentDateStr]: {
                lockedAt: Date.now(),
                score: score
            }
        };

        saveData(newTasks, newLockedDays);
        return score;
    };

    const clearAllTasks = () => {
        saveData([], {});
    };

    const [activePopoverId, setActivePopoverId] = useState(null);

    const value = useMemo(() => ({
        tasks,
        lockedDays,
        settings, // Expose
        currentDateStr,
        addTask,
        updateTask,
        deleteTask,
        toggleTask: smartToggleTask, // Use our new smart logic
        rescheduleTask, // New capability
        completeDay,
        getDailyScore,
        isDayLocked,
        clearAllTasks,
        updateSettings, // Expose
        activePopoverId, // New Global State for UI
        setActivePopoverId // New Global Setter
    }), [tasks, lockedDays, currentDateStr, settings, activePopoverId]);

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
};
