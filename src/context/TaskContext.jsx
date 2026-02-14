import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
    const isDayLocked = useCallback((dateStr) => {
        return dateStr < currentDateStr;
    }, [currentDateStr]);

    const getDailyScore = useCallback((dateStr) => {
        // Note: 'tasks' is a dependency here. 
        // We need to access the LATEST tasks. 
        // Since 'tasks' updates often, this function will recreated often. 
        // This is unavoidable unless we pass tasks as arg or use ref. 
        // Current approach is fine, but we must include tasks in deps.
        // Wait, 'tasks' is defined AFTER this in original code? 
        // actually 'tasks' is defined below. We need to restructure or use activeTasks/completedTasks directly.
        // Let's use activeTasks/completedTasks state directly which are available here.
        const allTasks = [...activeTasks, ...completedTasks];
        const dayTasks = allTasks.filter(t => t.date === dateStr);
        if (dayTasks.length === 0) return 0;
        const completed = dayTasks.filter(t => t.status === 'completed' || t.isCompleted).length;
        return Math.round((completed / dayTasks.length) * 100);
    }, [activeTasks, completedTasks]);



    // --- Actions ---

    const addTask = useCallback(async (title, options = {}) => {
        if (!user) return; // TODO: Prompt login

        const taskDate = options.date || currentDateStr;
        if (taskDate < currentDateStr) { // Inlined isDayLocked to avoid dep cycle if needed, but isDayLocked is stable-ish
             // actually isDayLocked depends on currentDateStr. 
             // let's use the helper.
             // BUT isDayLocked uses currentDateStr.
        }
        // Let's rely on currentDateStr which changes once a day.
        
        if (taskDate < currentDateStr) {
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
            return { ...newTask, id: docRef.id };
        } catch (error) {
            console.error("Error adding task:", error);
            throw error;
        }
    }, [user, currentDateStr]);

    const updateTask = useCallback(async (id, updates) => {
        if (!user) return;
        // We need 'tasks' to check date? 
        // Accessing state 'activeTasks' or 'completedTasks' is better.
        // Or just fire update? 
        // The original code checked 'isDayLocked(task.date)'. 
        // We need the task object. 
        // We can find it in [...activeTasks, ...completedTasks].
        const allTasks = [...activeTasks, ...completedTasks];
        const task = allTasks.find(t => t.id === id);
        
        if (!task) return;

        if (task.date < currentDateStr) {
            console.warn("Cannot edit tasks of a locked day.");
            return;
        }

        // Optimistic update (optional, but UI listens to onSnapshot so it will bounce back quickly)
        // Here we just fire and forget the update
        await FirestoreService.updateItem(`users/${user.uid}/tasks`, id, updates);
    }, [user, activeTasks, completedTasks, currentDateStr]);

    const deleteTask = useCallback(async (id) => {
        if (!user) return;
        const allTasks = [...activeTasks, ...completedTasks];
        const task = allTasks.find(t => t.id === id);
        if (task && task.date < currentDateStr) {
            console.warn("Cannot delete tasks of a locked day.");
            return;
        }
        await FirestoreService.deleteItem(`users/${user.uid}/tasks`, id);
    }, [user, activeTasks, completedTasks, currentDateStr]);

    const rescheduleTask = useCallback(async (id, newDateStr) => {
        if (!user) return;
        await FirestoreService.updateItem(`users/${user.uid}/tasks`, id, { date: newDateStr });
    }, [user]);

    const smartToggleTask = useCallback(async (id) => {
        if (!user) return;
        const allTasks = [...activeTasks, ...completedTasks];
        const task = allTasks.find(t => t.id === id);
        if (!task) return;

        // Case 1: Past & Pending -> Move to Today & Complete
        if (task.date < currentDateStr && !task.isCompleted && task.status !== 'completed') {
            await FirestoreService.updateItem(`users/${user.uid}/tasks`, id, {
                date: currentDateStr,
                status: 'completed',
                isCompleted: true
            });
            return;
        }

        // Case 2: Past & Completed -> Locked (Read Only)
        if (task.date < currentDateStr) return;

        // Case 3: Normal Toggle
        const isNowCompleted = !(task.status === 'completed' || task.isCompleted);
        const newStatus = isNowCompleted ? 'completed' : 'pending';

        await FirestoreService.updateItem(`users/${user.uid}/tasks`, id, {
            status: newStatus,
            isCompleted: isNowCompleted
        });
    }, [user, activeTasks, completedTasks, currentDateStr]);
    
    // Alias for compatibility
    const toggleTask = smartToggleTask;

    const completeDay = useCallback(async () => {
        if (!user) return 0;
        // logic duplicated from getDailyScore to avoid dependency issues if possible, 
        // or just rely on state. 
        const allTasks = [...activeTasks, ...completedTasks];
        const dayTasks = allTasks.filter(t => t.date === currentDateStr);
        let score = 0;
        if (dayTasks.length > 0) {
            const completed = dayTasks.filter(t => t.status === 'completed' || t.isCompleted).length;
            score = Math.round((completed / dayTasks.length) * 100);
        }

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
    }, [user, activeTasks, completedTasks, currentDateStr, lockedDays]);

    const clearAllTasks = useCallback(async () => {
        // Warning: This could be heavy if there are thousands. For now, we iterate.
        if (!user) return;
        const allTasks = [...activeTasks, ...completedTasks];
        // Batching would be better but keeping it simple for now as requested.
        const promises = allTasks.map(t => FirestoreService.deleteItem(`users/${user.uid}/tasks`, t.id));
        await Promise.all(promises);
    }, [user, activeTasks, completedTasks]);

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
    }), [tasks, lockedDays, settings, currentDateStr, addTask, updateTask, deleteTask, smartToggleTask, rescheduleTask, completeDay, getDailyScore, isDayLocked, clearAllTasks, updateSettings, activePopoverId, isLoading]);

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
};
