import { AuditLog } from './types.js';

export class AuditLogger {
    private logs: AuditLog[] = [];

    log(entry: AuditLog): void {
        this.logs.push(entry);
        // In a real app, this would persist to a backend/storage.
        console.log(`[AUDIT] ${entry.timestamp} | ${entry.action} | ${entry.date} | ${entry.userEmail} | ${entry.success ? 'OK' : 'FAIL'} | ${entry.details || ''}`);
    }

    getLogs(): AuditLog[] {
        return [...this.logs];
    }

    // Helper for quick action logging
    logAction(
        action: AuditLog['action'],
        date: string,
        userEmail: string,
        success: boolean,
        details?: string
    ) {
        this.log({
            action,
            date,
            timestamp: Date.now(),
            userEmail,
            success,
            details
        });
    }
}

export const auditLogger = new AuditLogger();
