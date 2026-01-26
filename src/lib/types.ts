export type DateKey = string; // YYYY-MM-DD

export enum LockState {
    LOCKED = 'LOCKED',       // Read-only
    UNLOCKED = 'UNLOCKED',   // Explicitly unlocked
    EDITABLE = 'EDITABLE',   // Default for today
    BLOCKED = 'BLOCKED'      // Future dates
}

export interface UnlockRequest {
    reason: string;
    timestamp: number; // Date.now()
    userEmail: string;
}

export interface DayEntry {
    date: DateKey;
    isSubmitted: boolean;
    unlockedAt?: number | null; // Timestamp if unlocked
    unlockReason?: string | null;
    unlockedBy?: string | null;
    data?: Record<string, any> | null; // Placeholder for actual daily data
}

export interface AuditLog {
    action: 'SUBMIT' | 'UNLOCK' | 'EDIT_ATTEMPT';
    date: DateKey;
    timestamp: number;
    userEmail: string;
    details?: string;
    success: boolean;
}

// -- Persistence Types --

export interface RoutineEntry {
    completed: boolean;
    timestamp: number;
}

export interface HabitEntry {
    score: number;
    notes?: string;
    timestamp: number;
}

export interface SyncMutation {
    mutationId: string;
    type: 'UPDATE_ROUTINE' | 'UPDATE_HABIT' | 'LOG_ACTION';
    data: any;
    date: DateKey;
    timestamp: number;
    retryCount: number;
}

export interface PersistenceConfig {
    lastSyncTimestamp: string;
    userId: string;
    version: string;
}
