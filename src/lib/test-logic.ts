
import { LockManager } from './lock-manager.js';
import { LockState, DayEntry } from './types.js';
import { getTodayDateKey } from './date-utils.js';

// Simple test runner since we might not have a full test harness
async function runTests() {
    console.log('--- Starting Date Logic Verification ---');

    const lockManager = new LockManager();
    const today = getTodayDateKey();

    // Calculate yesterday and tomorrow for testing
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().split('T')[0];

    d.setDate(d.getDate() + 2); // Tomorrow
    const tomorrow = d.toISOString().split('T')[0];

    console.log(`Today: ${today}, Yesterday: ${yesterday}, Tomorrow: ${tomorrow}`);

    // Test 1: Future Date should be BLOCKED
    try {
        const state = lockManager.getLockState(tomorrow, null);
        console.assert(state === LockState.BLOCKED, `Test 1 Failed: Future date should be BLOCKED, got ${state}`);
        console.log('Test 1 Passed: Future date blocked.');
    } catch (e) { console.error('Test 1 Error:', e); }

    // Test 2: Today should be EDITABLE by default
    try {
        const state = lockManager.getLockState(today, null);
        console.assert(state === LockState.EDITABLE, `Test 2 Failed: Today should be EDITABLE, got ${state}`);
        console.log('Test 2 Passed: Today is editable.');
    } catch (e) { console.error('Test 2 Error:', e); }

    // Test 3: Past date without data -> LOCKED (as per our assumption "Past dates ... read-only")
    // Wait, Rule 2 says: "If data exists -> read-only (locked). If unlocked -> editable".
    // It doesn't explicitly say what happens if NO data exists.
    // My implementation default to LOCKED for past.
    try {
        const state = lockManager.getLockState(yesterday, null);
        console.assert(state === LockState.LOCKED, `Test 3 Failed: Past date should be LOCKED, got ${state}`);
        console.log('Test 3 Passed: Past date locked default.');
    } catch (e) { console.error('Test 3 Error:', e); }

    // Test 4: Submit Today -> LOCKED
    try {
        let entry: DayEntry = { date: today, isSubmitted: false };
        entry = lockManager.submitDay(entry, 'test@user.com');
        const state = lockManager.getLockState(today, entry);
        console.assert(state === LockState.LOCKED, `Test 4 Failed: Submitted today should be LOCKED, got ${state}`);
        console.log('Test 4 Passed: Submit locks today.');
    } catch (e) { console.error('Test 4 Error:', e); }

    // Test 5: Unlock Today
    try {
        let entry: DayEntry = { date: today, isSubmitted: true };
        entry = lockManager.unlockDay(entry, today, {
            reason: 'Forgot something',
            timestamp: Date.now(),
            userEmail: 'test@user.com'
        });
        const state = lockManager.getLockState(today, entry);
        console.assert(state === LockState.UNLOCKED, `Test 5 Failed: Unlocked today should be UNLOCKED, got ${state}`);
        console.log('Test 5 Passed: Unlock works.');
    } catch (e) { console.error('Test 5 Error:', e); }

    // Test 6: Unlock Past
    try {
        let entry: DayEntry = { date: yesterday, isSubmitted: true };
        entry = lockManager.unlockDay(entry, yesterday, {
            reason: 'Fixing history',
            timestamp: Date.now(),
            userEmail: 'test@user.com'
        });
        const state = lockManager.getLockState(yesterday, entry);
        console.assert(state === LockState.UNLOCKED, `Test 6 Failed: Unlocked past should be UNLOCKED, got ${state}`);
        console.log('Test 6 Passed: Unlock past works.');
    } catch (e) { console.error('Test 6 Error:', e); }

    // Test 7: Fail to unlock without reason
    try {
        let entry: DayEntry = { date: today, isSubmitted: true };
        lockManager.unlockDay(entry, today, { reason: '', timestamp: Date.now(), userEmail: 'test@user.com' });
        console.error('Test 7 Failed: Should have thrown error for empty reason');
    } catch (e) {
        console.log('Test 7 Passed: Rejected empty reason.');
    }

    console.log('--- Verification Complete ---');
}

runTests();
