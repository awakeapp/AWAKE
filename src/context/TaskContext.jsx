import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { format } from 'date-fns';
import { FirestoreService } from '../services/firestore-service';
import { where, orderBy, limit } from 'firebase/firestore';

const TaskContext = createContext();

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskContextProvider');
    }
    return context;
};

export const TaskContextProvider = ({ children }) => {
    const { user, authIsReady } = useAuthContext();
    const [activeTasks, setActiveTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [completedLimit, setCompletedLimit] = useState(50);
    const [lockedDays, setLockedDays] = useState({});
    const [isLoading, setIsLoading] = useState(true);

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

    // --- Firestore Subscriptions ---
    useEffect(() => {
        if (!authIsReady) return;

        if (!user) {
            setActiveTasks([]);
            setCompletedTasks([]);
            setLockedDays({});
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        // 1. Subscribe to Active Tasks (Pending)
        // High limit to ensure we see all relevant work
        const activeUnsubscribe = FirestoreService.subscribeToCollection(
            `users/${user.uid}/tasks`,
            (data) => {
                setActiveTasks(data);
                // We consider app "loaded" when active tasks arrive
                setIsLoading(false);
            },
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc'),
            limit(200)
        );

        // 2. Subscribe to Completed Tasks (Limited)
        const completedUnsubscribe = FirestoreService.subscribeToCollection(
            `users/${user.uid}/tasks`,
            (data) => {
                setCompletedTasks(data);
            },
            where('status', '==', 'completed'),
            orderBy('createdAt', 'desc'),
            limit(completedLimit)
        );

        // 2. Subscribe to Settings
        const settingsUnsubscribe = FirestoreService.subscribeToDocument(
            `users/${user.uid}/config`,
            'taskSettings',
            (data) => {
                if (data) {
                    setSettings(prev => ({ ...prev, ...data }));
                }
            }
        );

        // 3. Subscribe to Locked Days
        // Storing simply as a single document for now to match easy migration
        const lockedUnsubscribe = FirestoreService.subscribeToDocument(
            `users/${user.uid}/data`,
            'lockedDays',
            (data) => {
                if (data && data.days) {
                    setLockedDays(data.days);
                }
            }
        );

        return () => {
            activeUnsubscribe();
            completedUnsubscribe();
            settingsUnsubscribe();
            lockedUnsubscribe();
        };
    }, [user, authIsReady, completedLimit]);

    // --- Persistence Helpers ---
    // (We now write directly to Firestore)

    const updateSettings = (updates) => {
        if (!user) return; // Guest mode deferred for now or handle appropriately
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings); // Optimistic
        FirestoreService.setItem(`users/${user.uid}/config`, 'taskSettings', newSettings);
    };

    // --- Helpers ---
    const isDayLocked = (dateStr) => {
        return dateStr < currentDateStr;
    };

    const getDailyScore = (dateStr) => {
        const dayTasks = tasks.filter(t => t.date === dateStr);
        if (dayTasks.length === 0) return 0;
        const completed = dayTasks.filter(t => t.status === 'completed' || t.isCompleted).length;
        return Math.round((completed / dayTasks.length) * 100);
    };

    // --- Actions ---

    const addTask = async (title, options = {}) => {
        if (!user) return; // TODO: Prompt login

        const taskDate = options.date || currentDateStr;
        if (isDayLocked(taskDate)) {
            console.warn("Cannot add tasks to a locked day.");
            return;
        }

        const newTask = {
            title,
            status: 'pending',
            isCompleted: false,
            date: taskDate,
            createdAt: Date.now(),
            priority: options.priority || 'Medium',
            category: options.category || 'Work',
            time: options.time || null,
            estimatedTime: options.estimatedTime || 15,
            description: options.description || '',
            userId: user.uid // Redundant with path but good for index safety
        };

        try {
            // Tasks are now individual documents in the collection
            const docRef = await FirestoreService.addItem(`users/${user.uid}/tasks`, newTask);
            console.log("Task added successfully with ID:", docRef.id);
            return { ...newTask, id: docRef.id };
        } catch (error) {
            console.error("Error adding task:", error);
            throw error;
        }
    };

    const updateTask = async (id, updates) => {
        if (!user) return;
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        if (isDayLocked(task.date)) {
            console.warn("Cannot edit tasks of a locked day.");
            return;
        }

        // Optimistic update (optional, but UI listens to onSnapshot so it will bounce back quickly)
        // Here we just fire and forget the update
        await FirestoreService.updateItem(`users/${user.uid}/tasks`, id, updates);
    };

    const deleteTask = async (id) => {
        if (!user) return;
        const task = tasks.find(t => t.id === id);
        if (task && isDayLocked(task.date)) {
            console.warn("Cannot delete tasks of a locked day.");
            return;
        }
        await FirestoreService.deleteItem(`users/${user.uid}/tasks`, id);
    };

    const toggleTask = async (id) => {
        console.warn("Using smartToggleTask instead.");
        smartToggleTask(id);
    };

    const rescheduleTask = async (id, newDateStr) => {
        if (!user) return;
        await FirestoreService.updateItem(`users/${user.uid}/tasks`, id, { date: newDateStr });
    };

    const smartToggleTask = async (id) => {
        if (!user) return;
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // Case 1: Past & Pending -> Move to Today & Complete
        if (isDayLocked(task.date) && !task.isCompleted && task.status !== 'completed') {
            await FirestoreService.updateItem(`users/${user.uid}/tasks`, id, {
                date: currentDateStr,
                status: 'completed',
                isCompleted: true
            });
            return;
        }

        // Case 2: Past & Completed -> Locked (Read Only)
        if (isDayLocked(task.date)) return;

        // Case 3: Normal Toggle
        const isNowCompleted = !(task.status === 'completed' || task.isCompleted);
        const newStatus = isNowCompleted ? 'completed' : 'pending';

        await FirestoreService.updateItem(`users/${user.uid}/tasks`, id, {
            status: newStatus,
            isCompleted: isNowCompleted
        });
    };

    const completeDay = async () => {
        if (!user) return 0;
        const score = getDailyScore(currentDateStr);

        // We do strictly one thing: Lock the day.
        const newLockedDays = {
            ...lockedDays,
            [currentDateStr]: {
                lockedAt: Date.now(),
                score: score
            }
        };

        setLockedDays(newLockedDays); // Optimistic
        await FirestoreService.setItem(`users/${user.uid}/data`, 'lockedDays', { days: newLockedDays });
        return score;
    };

    const clearAllTasks = async () => {
        // Warning: This could be heavy if there are thousands. For now, we iterate.
        if (!user) return;
        // Batching would be better but keeping it simple for now as requested.
        const promises = tasks.map(t => FirestoreService.deleteItem(`users/${user.uid}/tasks`, t.id));
        await Promise.all(promises);
    };

    const [activePopoverId, setActivePopoverId] = useState(null);

    // Merge active and completed tasks for consumers
    const tasks = useMemo(() => {
        const merged = [...activeTasks, ...completedTasks];
        // Re-sort in case strict time order is needed across both lists
        return merged.sort((a, b) => b.createdAt - a.createdAt);
    }, [activeTasks, completedTasks]);

    const value = useMemo(() => ({
        tasks,
        lockedDays,
        settings,
        currentDateStr,
        addTask,
        updateTask,
        deleteTask,
        toggleTask: smartToggleTask,
        rescheduleTask,
        completeDay,
        getDailyScore,
        isDayLocked,
        clearAllTasks,
        updateSettings,
        activePopoverId,
        setActivePopoverId,
        isLoading,
        loadMoreCompleted: () => setCompletedLimit(prev => prev + 50)
    }), [tasks, lockedDays, currentDateStr, settings, activePopoverId, isLoading]);

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
};
