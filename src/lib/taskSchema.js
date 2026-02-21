export const TASK_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    MISSED: 'missed',
};

export const migrateStatus = (legacy) => ({
    checked: TASK_STATUS.COMPLETED,
    unchecked: TASK_STATUS.PENDING,
    missed: TASK_STATUS.MISSED,
    pending: TASK_STATUS.PENDING,
    completed: TASK_STATUS.COMPLETED,
})[legacy] ?? TASK_STATUS.PENDING;
