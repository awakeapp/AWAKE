import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../lib/persistence/storage-service';
import { SyncManager } from '../lib/persistence/sync-manager';
import { DateKey } from '../lib/types';

export function useDailyStore(date: DateKey) {
    const [routines, setRoutines] = useState<Record<string, boolean>>({});
    const [habits, setHabits] = useState<Record<string, any>>({});
    const [isLocked, setIsLocked] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);

    // Hydrate from Storage when date changes
    useEffect(() => {
        loadData();
    }, [date]);

    const loadData = () => {
        const storedRoutines = StorageService.getDailyRoutines(date);
        const routinesMap: Record<string, boolean> = {};
        Object.entries(storedRoutines).forEach(([id, entry]) => {
            routinesMap[id] = entry.completed;
        });
        setRoutines(routinesMap);

        const storedHabits = StorageService.getDailyHabits(date);
        setHabits(storedHabits);

        setIsLocked(StorageService.isDateLocked(date));
    };

    const toggleRoutine = useCallback((routineId: string, currentStatus: boolean) => {
        if (isLocked) {
            console.warn('Date is locked');
            return;
        }
        const newStatus = !currentStatus;
        StorageService.saveRoutine(date, routineId, newStatus);
        setRoutines((prev: Record<string, boolean>) => ({ ...prev, [routineId]: newStatus }));
    }, [date, isLocked]);

    const updateHabit = useCallback((habitId: string, score: number, notes?: string) => {
        if (isLocked) {
            console.warn('Date is locked');
            return;
        }
        StorageService.saveHabit(date, habitId, score, notes);
        setHabits((prev: Record<string, any>) => ({ ...prev, [habitId]: { score, notes } }));
    }, [date, isLocked]);

    const submitDay = async () => {
        setIsSyncing(true);
        setSyncError(null);
        try {
            const result = await SyncManager.submitDay(date);
            if (result.status === 'ERROR') {
                setSyncError(result.message);
            } else {
                // Success or Offline
                // If success, maybe lock state changed?
                setIsLocked(StorageService.isDateLocked(date));
            }
        } catch (e: any) {
            setSyncError(e.message);
        } finally {
            setIsSyncing(false);
        }
    };

    return {
        routines, // Note: Currently empty in this implementation as we need a way to load ALL.
        habits,
        isLocked,
        isSyncing,
        syncError,
        toggleRoutine,
        updateHabit,
        submitDay,
        refresh: loadData
    };
}
