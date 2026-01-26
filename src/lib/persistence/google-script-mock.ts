import { DateKey } from "../types";

export const GoogleScriptMock = {
    // In-Memory 'Server' Database
    _db: {
        lockedDates: [] as DateKey[],
        routines: {} as Record<string, any>,
        habits: {} as Record<string, any>,
        logs: [] as any[]
    },

    // Allows test setup
    _setLockedDates(dates: DateKey[]) {
        this._db.lockedDates = dates;
    },

    doPost(payload: any) {
        console.log('[GoogleMock] Received Payload:', payload);

        const response = {
            success: true,
            syncedMutationIds: [] as string[],
            rejectedMutations: [] as any[],
            lockedDates: this._db.lockedDates
        };

        // Process Mutations
        if (payload.mutations) {
            payload.mutations.forEach((m: any) => {
                // Check Lock
                if (this._db.lockedDates.includes(m.date)) {
                    response.rejectedMutations.push({
                        mutationId: m.mutationId,
                        date: m.date,
                        reason: 'DATE_LOCKED'
                    });
                    return;
                }

                // "Write" to DB
                if (m.type === 'UPDATE_ROUTINE') {
                    // key = date_routineId
                    this._db.routines[`${m.date}_${m.data.routineId}`] = m.data;
                }

                response.syncedMutationIds.push(m.mutationId);
            });
        }

        // Append Logs
        if (payload.logs) {
            this._db.logs.push(...payload.logs);
        }

        // Simulate Locking the Day after submission (Optional logic)
        // For now, we just return the existing locks.

        console.log('[GoogleMock] Returning:', response);
        return response;
    }
};
