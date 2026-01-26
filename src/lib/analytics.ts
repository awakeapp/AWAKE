import { DayEntry, AuditLog, DateKey } from './types';
// import { getDayOfWeek } from './date-utils';

// --- Types ---

export interface DailyHabits {
    junkFood: boolean;
    sugar: boolean;
    coldDrinks: boolean;
    screenTime: number; // Hours
    [key: string]: any;
}

export interface AnalyticsSummary {
    completionRate: number; // 0-1
    currentStreak: number;
    bestTimeOfDay: string; // e.g., "Morning", "Afternoon", "Evening"
    weeklyAverageScreenTime: number;
    monthlyAverageScreenTime: number;
}

export interface HabitCorrelation {
    habitA: string;
    habitB: string;
    correlation: number; // -1 to 1 (Phi coefficient or simple conditional probability)
}

// --- Constants ---

const SCREEN_TIME_THRESHOLDS = {
    GREEN: 2,
    YELLOW: 4
};

// --- Core Functions ---

/**
 * Extract Typed Habits from DayEntry
 */
export function parseHabits(entry: DayEntry): DailyHabits | null {
    if (!entry.data) return null;

    // Safety check / Defaulting
    return {
        junkFood: !!entry.data.junkFood,
        sugar: !!entry.data.sugar,
        coldDrinks: !!entry.data.coldDrinks,
        screenTime: typeof entry.data.screenTime === 'number' ? entry.data.screenTime : 0,
        ...entry.data
    };
}

/**
 * 1. Daily Completion %
 * Logic: 
 * - Junk Food: No (False) = 1 point
 * - Sugar: No (False) = 1 point
 * - Cold Drinks: No (False) = 1 point
 * - Screen Time: < 4h = 1 point (configurable)
 */
export function calculateDailyScore(habits: DailyHabits): number {
    let score = 0;
    const totalMetrics = 4;

    if (!habits.junkFood) score++;
    if (!habits.sugar) score++;
    if (!habits.coldDrinks) score++;
    if (habits.screenTime <= SCREEN_TIME_THRESHOLDS.YELLOW) score++;

    return score / totalMetrics;
}

/**
 * 2. Streak Calculation
 * Count consecutive days with Score >= 70% (0.7)
 * ending at the most recent entry (or specific date).
 */
export function calculateStreak(entries: DayEntry[]): number {
    // Sort by date descending (Newest first)
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

    let streak = 0;
    // Skip today if it's not submitted/scored yet? 
    // Usually streak includes today if done, or yesterday if today not done.
    // For simplicity, we count strict consecutiveness from the latest available block.

    for (const entry of sorted) {
        const habits = parseHabits(entry);
        if (!habits) break; // Break on missing data? Or skip? Streak usually implies no gaps.

        const score = calculateDailyScore(habits);
        if (score >= 0.70) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

/**
 * 3. Best Time-of-Day Performance
 * Uses AuditLogs to find when successful submissions happen.
 * If logs unavailable, returns null.
 */
export function getBestPerformanceTime(entries: DayEntry[], logs: AuditLog[]): string {
    // Filter for "High Performance" days
    const highPerfDates = new Set(
        entries
            .filter(e => {
                const h = parseHabits(e);
                return h && calculateDailyScore(h) >= 0.8;
            })
            .map(e => e.date)
    );

    if (highPerfDates.size === 0) return 'N/A';

    // Find submit times for these dates
    const submitTimes = logs
        .filter(l => l.action === 'SUBMIT' && highPerfDates.has(l.date))
        .map(l => new Date(l.timestamp).getHours());

    if (submitTimes.length === 0) return 'N/A';

    // Bucket times
    const buckets = {
        Morning: 0,   // 5-11
        Afternoon: 0, // 12-17
        Evening: 0,   // 18-22
        Night: 0      // 23-4
    };

    submitTimes.forEach(h => {
        if (h >= 5 && h < 12) buckets.Morning++;
        else if (h >= 12 && h < 18) buckets.Afternoon++;
        else if (h >= 18 && h < 23) buckets.Evening++;
        else buckets.Night++;
    });

    // Find max
    return Object.entries(buckets).reduce((a, b) => a[1] > b[1] ? a : b)[0];
}

/**
 * 4. Habit Correlations
 * "When I eat Sugar, do I also use Screens more?"
 * Simple phi coefficient for two booleans (transformed screen time to boolean > limit).
 */
export function calculateCorrelation(entries: DayEntry[], keyA: keyof DailyHabits, keyB: keyof DailyHabits): number {
    // Implementation of Phi Coefficient
    //         | B=1 | B=0 |
    //    A=1  | n11 | n10 |
    //    A=0  | n01 | n00 |

    let n11 = 0, n10 = 0, n01 = 0, n00 = 0;

    entries.forEach(e => {
        const h = parseHabits(e);
        if (!h) return;

        // Binarize
        const valA = getBinaryValue(h, keyA);
        const valB = getBinaryValue(h, keyB);

        if (valA && valB) n11++;
        if (valA && !valB) n10++;
        if (!valA && valB) n01++;
        if (!valA && !valB) n00++;
    });

    const n1_ = n11 + n10;
    const n0_ = n01 + n00;
    const n_1 = n11 + n01;
    const n_0 = n10 + n00;

    if (n1_ * n0_ * n_1 * n_0 === 0) return 0; // Avoid div by zero

    return (n11 * n00 - n10 * n01) / Math.sqrt(n1_ * n0_ * n_1 * n_0);
}

function getBinaryValue(h: DailyHabits, key: keyof DailyHabits): boolean {
    if (key === 'screenTime') return h.screenTime > 4; // High screen time = 1
    // For habits: "Used Sugar" (true) is the event we track correlation for.
    return !!h[key];
}

/**
 * 5. Weekly/Monthly Summaries
 */
export function generateSummaries(entries: DayEntry[]) {
    // Group by Week/Month logic (simplified for snippet)
    // Returns aggregated stats
    const totalDays = entries.length;
    let totalScreenTime = 0;
    let totalJunkDays = 0;

    entries.forEach(e => {
        const h = parseHabits(e);
        if (h) {
            totalScreenTime += h.screenTime;
            if (h.junkFood) totalJunkDays++;
        }
    });

    return {
        avgScreenTime: totalDays ? totalScreenTime / totalDays : 0,
        junkFoodFrequency: totalDays ? totalJunkDays / totalDays : 0,
        totalEntries: totalDays
    };
}

/**
 * 6. Export Data
 * Flatten to CSV-like structure or JSON
 */
export function exportAnalyticsData(entries: DayEntry[]): string {
    const header = "Date,Score,JunkFood,Sugar,ColdDrinks,ScreenTime";
    const rows = entries.map(e => {
        const h = parseHabits(e);
        if (!h) return `${e.date},0,N/A,N/A,N/A,0`;
        const score = calculateDailyScore(h);
        return `${e.date},${score.toFixed(2)},${h.junkFood},${h.sugar},${h.coldDrinks},${h.screenTime}`;
    });
    return [header, ...rows].join('\n');
}

/**
 * Helper: Screen Time Color
 */
export function getScreenTimeColor(hours: number): string {
    if (hours <= SCREEN_TIME_THRESHOLDS.GREEN) return 'var(--color-success, #10b981)';
    if (hours <= SCREEN_TIME_THRESHOLDS.YELLOW) return 'var(--color-warning, #f59e0b)';
    return 'var(--color-danger, #ef4444)';
}
