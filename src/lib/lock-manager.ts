import { LockState, DayEntry, UnlockRequest, DateKey } from './types.js';
import { DateTimeStatus, getDateStatus, getTodayDateKey } from './date-utils.js';
import { auditLogger } from './audit-logger.js';

export class LockManager {
    private timezone: string;

    constructor(timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone) {
        this.timezone = timezone;
    }

    /**
     * Determines the effective lock state for a given day.
     */
    getLockState(dateKey: DateKey, entry: DayEntry | null): LockState {
        const today = getTodayDateKey(this.timezone);
        const timeStatus = getDateStatus(dateKey, today);

        // Rule 3: Future dates -> BLOCKED
        if (timeStatus === DateTimeStatus.FUTURE) {
            return LockState.BLOCKED;
        }

        // Rule 1: Today -> Fully Editable (unless manually submitted/locked)
        if (timeStatus === DateTimeStatus.PRESENT) {
            // If explicitly submitted today, it becomes locked
            if (entry?.isSubmitted) {
                // Exception: If it was subsequently unlocked
                if (entry.unlockedAt) {
                    return LockState.UNLOCKED; // 'Editable' via unlock
                }
                return LockState.LOCKED;
            }
            return LockState.EDITABLE;
        }

        // Rule 2: Past dates
        // - If data exists -> read-only (locked)
        // - If unlocked -> editable
        // - (Implicit logic: if no data exists for past, is it editable? 
        //   Usually 'backfilling' is allowed or not? 'If data exists -> locked' implies if no data -> maybe editable or locked?
        //   Let's assume past dates are LOCKED by default if data exists, or if the day is simply 'past'.
        //   The rule "If unlocked -> editable" applies. 
        //   Let's interpret "If data exists -> locked" as "Past days are locked by default".

        if (entry?.unlockedAt) {
            return LockState.UNLOCKED;
        }

        return LockState.LOCKED;
    }

    /**
     * Attempts to submit/lock a day.
     */
    submitDay(entry: DayEntry, userEmail: string): DayEntry {
        const today = getTodayDateKey(this.timezone);
        // Can only submit Today? Or Past too? Usually submit is for finishing today.
        // Assuming submit is allowed if currently EDITABLE or UNLOCKED.

        // Check if currently editable
        const currentState = this.getLockState(entry.date, entry);
        if (currentState === LockState.BLOCKED || currentState === LockState.LOCKED) {
            auditLogger.logAction('SUBMIT', entry.date, userEmail, false, 'Cannot submit locked/blocked day');
            throw new Error('Cannot submit: Day is locked or blocked.');
        }

        const updatedEntry = { ...entry, isSubmitted: true };
        auditLogger.logAction('SUBMIT', entry.date, userEmail, true);
        return updatedEntry;
    }

    /**
     * Unlocks a day with a reason.
     */
    unlockDay(entry: DayEntry | null, dateKey: DateKey, request: UnlockRequest): DayEntry {
        // Cannot unlock future
        const today = getTodayDateKey(this.timezone);
        const timeStatus = getDateStatus(dateKey, today);
        if (timeStatus === DateTimeStatus.FUTURE) {
            auditLogger.logAction('UNLOCK', dateKey, request.userEmail, false, 'Cannot unlock future date');
            throw new Error('Cannot unlock future dates.');
        }

        if (!request.reason || request.reason.trim().length < 3) {
            auditLogger.logAction('UNLOCK', dateKey, request.userEmail, false, 'Invalid reason');
            throw new Error('Unlock reason is required.');
        }

        // Create new entry if null (unlocking a past empty day?)
        const baseEntry: DayEntry = entry || {
            date: dateKey,
            isSubmitted: false, // Default state
            data: null
        };

        const updatedEntry: DayEntry = {
            ...baseEntry,
            unlockedAt: request.timestamp,
            unlockReason: request.reason,
            unlockedBy: request.userEmail
        };

        auditLogger.logAction('UNLOCK', dateKey, request.userEmail, true, `Reason: ${request.reason}`);
        return updatedEntry;
    }
}
