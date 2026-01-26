import { StorageService } from './storage-service';
import { DateKey, SyncMutation } from '../types';

// Placeholder for Google Apps Script URL - to be configured
const API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// Import Mock for dev environment (Conditional logic could be added)
import { GoogleScriptMock } from './google-script-mock';

const USE_MOCK = true; // Flag to toggle between Real API and Mock

export const SyncManager = {

    async submitDay(date: DateKey) {
        console.log(`[SyncManager] Submitting day: ${date}`);

        // 1. Offline Check
        if (!navigator.onLine && !USE_MOCK) {
            console.warn('[SyncManager] Offline. Action queued.');
            StorageService.logAction('SUBMIT_DAY_OFFLINE', { date });
            return { status: 'OFFLINE', message: 'Saved to offline queue.' };
        }

        // 2. Prepare Batch
        const queue = StorageService.getQueue();
        const logs = StorageService.getLogs();
        const userId = StorageService.getConfig()?.userId || 'anon_user'; // Should be from Auth

        if (queue.length === 0 && logs.length === 0) {
            console.log('[SyncManager] Nothing to sync.');
            return { status: 'NO_CHANGES', message: 'Nothing to sync.' };
        }

        const payload = {
            userId,
            submitDate: date,
            mutations: queue,
            logs: logs
        };

        try {
            // 3. Send to Server
            let result;
            if (USE_MOCK) {
                // Simulate async network delay
                await new Promise(r => setTimeout(r, 800));
                result = GoogleScriptMock.doPost(payload);
            } else {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                result = await response.json();
            }

            // 4. Handle Result
            if (result.success) {
                this._handleSuccess(result);
                return { status: 'SUCCESS', message: 'Sync complete.' };
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('[SyncManager] Sync failed:', error);
            this._handleFailure(queue);
            return { status: 'ERROR', message: 'Sync failed. Retry scheduled.' };
        }
    },

    _handleSuccess(serverResult: any) {
        console.log('[SyncManager] Sync Success:', serverResult);

        // A. Remove Synced Items
        const successIds = new Set(serverResult.syncedMutationIds);
        const existingQueue = StorageService.getQueue();
        const remaining = existingQueue.filter(m => !successIds.has(m.mutationId));
        StorageService.setQueue(remaining);

        // B. Clear Logs
        StorageService.clearLogs();

        // C. Update Locked Dates
        if (serverResult.lockedDates) {
            StorageService.setLockedDates(serverResult.lockedDates);
        }

        // D. Conflict Resolution (Rejections)
        if (serverResult.rejectedMutations && serverResult.rejectedMutations.length > 0) {
            serverResult.rejectedMutations.forEach((rejection: any) => {
                console.warn(`[SyncManager] Mutation Rejected: ${rejection.reason}`, rejection);
                if (rejection.reason === 'DATE_LOCKED') {
                    this._revertMutation(rejection.mutationId);
                }
            });
        }
    },

    _handleFailure(attemptedQueue: SyncMutation[]) {
        // Increment retry counts
        const currentQueue = StorageService.getQueue();
        const updated = currentQueue.map(item => ({
            ...item,
            retryCount: item.retryCount + 1
        }));
        StorageService.setQueue(updated);
    },

    _revertMutation(mutationId: string) {
        // Logic to find what the mutation did and undo it.
        // This is complex. For now, we will just log it.
        // Ideal: Store 'previousValue' in mutation to allow rollback.
        console.error(`[SyncManager] Should revert mutation ${mutationId} but rollback not fully implemented.`);
        // Rudimentary fix: Reload page or fetch fresh state (if we had a 'fetch' feature)
    }
};
