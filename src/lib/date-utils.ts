import { DateKey } from './types.js';

export enum DateTimeStatus {
    FUTURE = 'FUTURE',
    PRESENT = 'PRESENT',
    PAST = 'PAST'
}

/**
 * Returns the current date as a YYYY-MM-DD string in the specified timezone.
 * Defaults to system timezone if not provided.
 */
export function getTodayDateKey(timezone?: string): DateKey {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone || undefined,
    };

    // Format parts to ensure reliable YYYY-MM-DD regardless of locale
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    return formatter.format(now);
}

/**
 * Compares a target date against today's date to determine temporal status.
 */
export function getDateStatus(targetDateKey: DateKey, todayDateKey: DateKey): DateTimeStatus {
    if (targetDateKey === todayDateKey) {
        return DateTimeStatus.PRESENT;
    }
    return targetDateKey > todayDateKey ? DateTimeStatus.FUTURE : DateTimeStatus.PAST;
}

/**
 * Validates strictly YYYY-MM-DD format.
 */
export function isValidDateKey(dateKey: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) && !isNaN(Date.parse(dateKey));
}
