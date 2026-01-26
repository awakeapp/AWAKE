import { useMemo } from 'react';
import { useVehicle } from '../context/VehicleContext';
import { useFinance } from '../context/FinanceContext';
import { useTasks } from '../context/TaskContext';
import { useData } from '../context/DataContext';
import { isBefore, addDays, parseISO, differenceInDays } from 'date-fns';

/**
 * Aggregates critical alerts and pending items from all modules
 * to feed into the central Routine flow.
 */
export const useAggregatedData = () => {
    const { getVehicleRisks, followUps } = useVehicle();
    const { recurringRules, subscriptions, getBudgetStats, transactions } = useFinance();
    const { tasks } = useTasks();
    const { dailyData } = useData(); // Routine tasks

    const alerts = useMemo(() => {
        const allAlerts = [];
        const today = new Date();

        // --- VEHICLE ALERTS ---
        // 1. Critical maintenance overdue
        // We can get risks per vehicle, but let's look at followUps directly for global alerts
        const activeFollowUps = followUps.filter(f => f.status === 'pending');

        activeFollowUps.forEach(f => {
            if (f.dueDate) {
                const daysDiff = differenceInDays(parseISO(f.dueDate), today);
                if (daysDiff < 0) {
                    allAlerts.push({
                        id: `veh_overdue_${f.id}`,
                        module: 'vehicle',
                        level: 'critical',
                        title: `${f.type} Overdue`,
                        actionLink: '/vehicle',
                        date: f.dueDate
                    });
                } else if (daysDiff <= 3) {
                    allAlerts.push({
                        id: `veh_soon_${f.id}`,
                        module: 'vehicle',
                        level: 'warning',
                        title: `${f.type} Due Soon`,
                        actionLink: '/vehicle',
                        date: f.dueDate
                    });
                }
            }
        });

        // --- FINANCE ALERTS ---
        // 1. Bills due (Subscriptions & Recurring)
        // Check subscriptions next billing date
        subscriptions.forEach(sub => {
            if (sub.status === 'active' && sub.nextBillingDate) {
                const daysDiff = differenceInDays(parseISO(sub.nextBillingDate), today);
                if (daysDiff <= 2 && daysDiff >= 0) {
                    allAlerts.push({
                        id: `fin_sub_${sub.id}`,
                        module: 'finance',
                        level: 'info',
                        title: `Pay ${sub.name}`,
                        sub: `₹${sub.amount} due`,
                        actionLink: '/finance',
                        date: sub.nextBillingDate
                    });
                }
            }
        });

        // 2. Budget Overruns (e.g., Food > 100%)
        // We'd need categories from context to invoke getBudgetStats, but simpler:
        // Assume context provides a way or we skip for now to avoid complexity in this step.

        return allAlerts.sort((a, b) => (a.level === 'critical' ? -1 : 1));
    }, [followUps, subscriptions]);

    const pendingCounts = useMemo(() => {
        return {
            tasks: tasks.filter(t => t.status === 'pending' && !t.isCompleted).length,
            routine: dailyData.tasks.filter(t => t.status === 'unchecked').length
        };
    }, [tasks, dailyData]);

    return {
        alerts,
        pendingCounts
    };
};
