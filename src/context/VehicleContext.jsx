import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { useFinance } from './FinanceContext';
import { useGlobalError } from './GlobalErrorContext';
import { addDays, addMonths, addYears } from 'date-fns';
import { FirestoreService } from '../services/firestore-service';
import { orderBy, limit } from 'firebase/firestore';
import { normalizeError } from '../utils/error-utils';

const VehicleContext = createContext();

export const MAINTENANCE_TEMPLATES = [
    { type: 'Oil Change', frequencyValue: 6, frequencyUnit: 'months', frequencyType: 'both', odometerValue: 10000, category: 'mandatory' },
    { type: 'Engine Oil Filter', frequencyValue: 6, frequencyUnit: 'months', frequencyType: 'both', odometerValue: 10000, category: 'mandatory' },
    { type: 'Air Filter', frequencyValue: 12, frequencyUnit: 'months', frequencyType: 'both', odometerValue: 20000, category: 'mandatory' },
    { type: 'Brake Check', frequencyValue: 6, frequencyUnit: 'months', frequencyType: 'both', odometerValue: 10000, category: 'mandatory' },
    { type: 'Chain Lubrication', frequencyValue: 1, frequencyUnit: 'months', frequencyType: 'both', odometerValue: 500, category: 'optional', applicable: ['bike', 'scooter'] },
    { type: 'Coolant Check', frequencyValue: 6, frequencyUnit: 'months', frequencyType: 'both', odometerValue: 10000, category: 'mandatory' },
    { type: 'Battery Health', frequencyValue: 12, frequencyUnit: 'months', frequencyType: 'date', category: 'mandatory' },
    { type: 'Tyre Pressure', frequencyValue: 1, frequencyUnit: 'months', frequencyType: 'date', category: 'mandatory' },
    { type: 'Tyre Rotation', frequencyValue: 12, frequencyUnit: 'months', frequencyType: 'both', odometerValue: 10000, category: 'optional' },
    { type: 'Wheel Alignment', frequencyValue: 12, frequencyUnit: 'months', frequencyType: 'both', odometerValue: 10000, category: 'optional' },
    { type: 'General Service', frequencyValue: 12, frequencyUnit: 'months', frequencyType: 'both', odometerValue: 10000, category: 'mandatory' },
    { type: 'Accident Repair', frequencyType: 'none', category: 'optional' }, // Ad-hoc only
    { type: 'Accessories Maintenance', frequencyValue: 12, frequencyUnit: 'months', frequencyType: 'date', category: 'optional' },
    { type: 'Insurance Renewal', frequencyValue: 12, frequencyUnit: 'months', frequencyType: 'date', category: 'mandatory' },
    { type: 'Pollution Certificate', frequencyValue: 6, frequencyUnit: 'months', frequencyType: 'date', category: 'mandatory' },
    { type: 'Registration Renewal', frequencyValue: 15, frequencyUnit: 'years', frequencyType: 'date', category: 'mandatory' },
    { type: 'Fitness Certificate', frequencyValue: 1, frequencyUnit: 'years', frequencyType: 'date', category: 'optional', applicable: ['commercial'] }
];

export const useVehicle = () => {
    const context = useContext(VehicleContext);
    if (!context) throw new Error('useVehicle must be used within VehicleContextProvider');
    return context;
};

export const VehicleContextProvider = ({ children }) => {
    const { user, authIsReady } = useAuthContext();
    const { addTransaction, categories } = useFinance(); // Integrate Finance
    const { showError } = useGlobalError();

    const [vehicles, setVehicles] = useState([]);
    const [followUps, setFollowUps] = useState([]);
    const [serviceRecords, setServiceRecords] = useState([]);
    const [recordLimit, setRecordLimit] = useState(20);
    const [loans, setLoans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sync local error to global error
    useEffect(() => {
        if (error) {
            showError(error);
        }
    }, [error, showError]);

    // --- Persistence: Firestore Subscriptions ---
    useEffect(() => {
        if (!authIsReady) return;

        if (!user) {
            setVehicles([]);
            setFollowUps([]);
            setServiceRecords([]);
            setLoans([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        // Subscribe to Vehicles
        const unsubVehicles = FirestoreService.subscribeToCollection(
            `users/${user.uid}/vehicles`,
            (data) => {
                setError(null);
                setVehicles(data);
                setIsLoading(false);
            },
            orderBy('createdAt', 'desc'),
            (err) => {
                const normalized = normalizeError(err);
                console.error(normalized);
                setError(normalized);
                setIsLoading(false);
            }
        );

        // Subscribe to Followups
        const unsubFollowups = FirestoreService.subscribeToCollection(
            `users/${user.uid}/followUps`,
            (data) => {
                setError(null);
                setFollowUps(data);
            },
            (err) => {
                const normalized = normalizeError(err);
                console.error(normalized);
                setError(normalized);
            }
        );

        // Subscribe to Service Records
        const unsubRecords = FirestoreService.subscribeToCollection(
            `users/${user.uid}/serviceRecords`,
            (data) => {
                setError(null);
                setServiceRecords(data);
            },
            orderBy('date', 'desc'),
            limit(recordLimit),
            (err) => {
                const normalized = normalizeError(err);
                console.error(normalized);
                setError(normalized);
            }
        );

        // Subscribe to Loans
        const unsubLoans = FirestoreService.subscribeToCollection(
            `users/${user.uid}/vehicleLoans`,
            (data) => {
                setError(null);
                setLoans(data);
            },
            (err) => {
                const normalized = normalizeError(err);
                console.error(normalized);
                setError(normalized);
            }
        );

        return () => {
            unsubVehicles();
            unsubFollowups();
            unsubRecords();
            unsubLoans();
        };
    }, [user, authIsReady, recordLimit]);

    // --- Helpers (Firestore Writes) ---
    // Note: We write directly to subcollections.

    // --- Vehicle Actions ---

    const deleteVehicle = useCallback(async (vehicleId) => {
        try {
            if (!user?.uid) return;
            setError(null);

            await FirestoreService.deleteItem(`users/${user.uid}/vehicles/${vehicleId}`);
        } catch (error) {
            const normalized = normalizeError(error);
            console.error("Error deleting vehicle:", normalized);
            setError(normalized);
            throw normalized;
        }
    }, [user]);

    const addVehicle = useCallback(async (vehicleData) => {
        try {
            if (!user) return;
            setError(null);

            const newVehicle = {
                createdAt: Date.now(),
                isArchived: false,
                isActive: vehicles.length === 0,
                ...vehicleData
            };

            const docRef = await FirestoreService.addItem(`users/${user.uid}/vehicles`, newVehicle);
            const vehicleId = docRef.id;

            // Seed standard maintenance follow-ups
            const seedFollowUps = MAINTENANCE_TEMPLATES
                .filter(t => !t.applicable || t.applicable.includes(vehicleData.type))
                .filter(t => t.frequencyType !== 'none')
                .map(t => {
                    const baseDate = new Date();
                    let dueDate = null;
                    if (t.frequencyType === 'date' || t.frequencyType === 'both') {
                        if (t.frequencyUnit === 'days') dueDate = addDays(baseDate, t.frequencyValue).toISOString();
                        if (t.frequencyUnit === 'months') dueDate = addMonths(baseDate, t.frequencyValue).toISOString();
                        if (t.frequencyUnit === 'years') dueDate = addYears(baseDate, t.frequencyValue).toISOString();
                    }

                    let dueOdometer = null;
                    if (t.frequencyType === 'odometer' || t.frequencyType === 'both') {
                        dueOdometer = (Number(vehicleData.odometer) || 0) + (t.odometerValue || 0);
                    }

                    return {
                        vehicleId: vehicleId,
                        type: t.type,
                        frequencyType: t.frequencyType,
                        frequencyValue: t.frequencyValue,
                        frequencyUnit: t.frequencyUnit,
                        odometerValue: t.odometerValue,
                        dueDate,
                        dueOdometer,
                        isRecurring: true,
                        isStandard: true,
                        status: 'pending'
                    };
                });

            // Batch add followups (using Promise.all for now)
            await Promise.all(seedFollowUps.map(fu => FirestoreService.addItem(`users/${user.uid}/followUps`, fu)));
        } catch (err) {
            const normalized = normalizeError(err);
            console.error(normalized);
            setError(normalized);
            throw normalized;
        }
    }, [user, vehicles]);

    const updateVehicle = useCallback(async (id, updates) => {
        try {
            if (!user) return;
            setError(null);
            await FirestoreService.updateItem(`users/${user.uid}/vehicles`, id, updates);
        } catch (err) {
            const normalized = normalizeError(err);
            console.error(normalized);
            setError(normalized);
            throw normalized;
        }
    }, [user]);

    const toggleArchiveVehicle = useCallback(async (id) => {
        try {
            if (!user) return;
            setError(null);
            const vehicle = vehicles.find(v => v.id === id);
            if (!vehicle) return;

            let updates = { isArchived: !vehicle.isArchived };
            if (!vehicle.isArchived && vehicle.isActive) {
                updates.isActive = false;
            }

            await updateVehicle(id, updates);
        } catch (err) {
            const normalized = normalizeError(err);
            console.error(normalized);
            setError(normalized);
            throw normalized;
        }
    }, [user, vehicles, updateVehicle]);

    const setVehicleActive = useCallback(async (id) => {
        try {
            if (!user) return;
            setError(null);
            const promises = vehicles.map(v => {
                if (v.id === id && !v.isActive) return FirestoreService.updateItem(`users/${user.uid}/vehicles`, v.id, { isActive: true });
                if (v.id !== id && v.isActive) return FirestoreService.updateItem(`users/${user.uid}/vehicles`, v.id, { isActive: false });
                return Promise.resolve();
            });
            await Promise.all(promises);
        } catch (err) {
            const normalized = normalizeError(err);
            console.error(normalized);
            setError(normalized);
            throw normalized;
        }
    }, [user, vehicles]);

    const getActiveVehicle = useCallback(() => {
        return vehicles.find(v => v.isActive && !v.isArchived);
    }, [vehicles]);

    // --- Follow Up Actions ---

    const addFollowUp = useCallback(async (followUp) => {
        try {
            if (!user) return;
            setError(null);
            const newFollowUp = {
                status: 'pending',
                ...followUp
            };
            await FirestoreService.addItem(`users/${user.uid}/followUps`, newFollowUp);
        } catch (err) {
            const normalized = normalizeError(err);
            console.error(normalized);
            setError(normalized);
            throw normalized;
        }
    }, [user]);

    const deleteFollowUp = useCallback(async (id) => {
        try {
            if (!user) return;
            setError(null);
            await FirestoreService.deleteItem(`users/${user.uid}/followUps`, id);
        } catch (err) {
            const normalized = normalizeError(err);
            console.error(normalized);
            setError(normalized);
            throw normalized;
        }
    }, [user]);

    const completeFollowUp = useCallback(async (id, completionDetails) => {
        try {
            if (!user) return;
            setError(null);
            // completionDetails: { date, cost, odometer, notes, accountId }
            const followUp = followUps.find(f => f.id === id);
            if (!followUp) return;

            const vehicle = vehicles.find(v => v.id === followUp.vehicleId);

            // 1. Create Service Record
            let newRecord = {
                vehicleId: followUp.vehicleId,
                followUpId: id,
                type: followUp.type,
                ...completionDetails
            };

            // 2. Handle Finance
            if (completionDetails.cost > 0 && completionDetails.accountId) {
                let catId = 'cat_vehicle';
                const existingCat = categories.find(c => c.name === 'Vehicle' || c.id === 'cat_vehicle');
                if (existingCat) catId = existingCat.id;
                else {
                    catId = categories.find(c => c.name === 'Transport')?.id || categories.find(c => c.type === 'expense')?.id;
                }

                const tx = {
                    amount: completionDetails.cost,
                    type: 'expense',
                    categoryId: catId,
                    accountId: completionDetails.accountId,
                    note: `Vehicle: ${vehicle?.name} - ${followUp.type}`,
                    date: completionDetails.date
                };
                await addTransaction(tx);
                newRecord.financeTxId = true; // Just flag it was logged
            }

            // Add Service Record
            await FirestoreService.addItem(`users/${user.uid}/serviceRecords`, newRecord);

            // 3. Update Vehicle Odometer if higher
            if (Number(completionDetails.odometer) > Number(vehicle?.odometer || 0)) {
                await updateVehicle(vehicle.id, { odometer: completionDetails.odometer });
            }

            // 4. Handle Recurring
            await deleteFollowUp(id); // Remove current pending

            if (followUp.isRecurring) {
                const nextFollowUp = { ...followUp };
                delete nextFollowUp.id; // clear ID for new insertion

                // Calculate next due
                if (followUp.frequencyType === 'date' || followUp.frequencyType === 'both') {
                    const baseDate = new Date(completionDetails.date);
                    let nextDate = baseDate;
                    if (followUp.frequencyUnit === 'days') nextDate = addDays(baseDate, followUp.frequencyValue);
                    if (followUp.frequencyUnit === 'months') nextDate = addMonths(baseDate, followUp.frequencyValue);
                    if (followUp.frequencyUnit === 'years') nextDate = addYears(baseDate, followUp.frequencyValue);
                    nextFollowUp.dueDate = nextDate.toISOString();
                }

                if (followUp.frequencyType === 'odometer' || followUp.frequencyType === 'both') {
                    const currentOdo = Number(completionDetails.odometer);
                    nextFollowUp.dueOdometer = currentOdo + Number(followUp.odometerValue || followUp.frequencyValue);
                }

                await addFollowUp(nextFollowUp);
            }
        } catch (err) {
            const normalized = normalizeError(err);
            console.error(normalized);
            setError(normalized);
            throw normalized;
        }
    }, [user, followUps, vehicles, categories, addTransaction, updateVehicle, deleteFollowUp, addFollowUp]);

    // New: Helper to log ad-hoc service record (without a follow-up)
    const addServiceRecord = useCallback(async (recordDetails) => {
        try {
            if (!user) return;
            setError(null);
            const newRecord = { ...recordDetails };

            // Handle Finance
            if (recordDetails.cost > 0 && recordDetails.accountId) {
                let catId = categories.find(c => c.name === 'Transport')?.id || categories.find(c => c.type === 'expense')?.id;
                const vehicle = vehicles.find(v => v.id === recordDetails.vehicleId);

                const tx = {
                    amount: recordDetails.cost,
                    type: 'expense',
                    categoryId: catId,
                    accountId: recordDetails.accountId,
                    note: `Vehicle: ${vehicle?.name} - ${recordDetails.type}`,
                    date: recordDetails.date
                };
                await addTransaction(tx);
                newRecord.financeTxId = true;
            }

            await FirestoreService.addItem(`users/${user.uid}/serviceRecords`, newRecord);

            // Update Odo
            const vehicle = vehicles.find(v => v.id === recordDetails.vehicleId);
            if (vehicle && Number(recordDetails.odometer) > Number(vehicle.odometer || 0)) {
                await updateVehicle(vehicle.id, { odometer: recordDetails.odometer });
            }
        } catch (err) {
            const normalized = normalizeError(err);
            console.error(normalized);
            setError(normalized);
            throw normalized;
        }
    }, [user, categories, vehicles, addTransaction, updateVehicle]);

    const getLatestRecord = useCallback((vehicleId, type) => {
        return serviceRecords
            .filter(r => r.vehicleId === vehicleId && r.type === type)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    }, [serviceRecords]);

    const toggleMaintenanceItem = useCallback(async (vehicleId, template) => {
        try {
            if (!user) return;
            setError(null);
            const existing = followUps.find(f => f.vehicleId === vehicleId && f.type === template.type && f.status !== 'completed');
            const vehicle = vehicles.find(v => v.id === vehicleId);

            if (existing) {
                await deleteFollowUp(existing.id);
            } else {
                // Add it
                const baseDate = new Date();
                let dueDate = null;
                if (template.frequencyType === 'date' || template.frequencyType === 'both') {
                    if (template.frequencyUnit === 'days') dueDate = addDays(baseDate, template.frequencyValue).toISOString();
                    if (template.frequencyUnit === 'months') dueDate = addMonths(baseDate, template.frequencyValue).toISOString();
                    if (template.frequencyUnit === 'years') dueDate = addYears(baseDate, template.frequencyValue).toISOString();
                }

                let dueOdometer = null;
                if (vehicle && (template.frequencyType === 'odometer' || template.frequencyType === 'both')) {
                    dueOdometer = (Number(vehicle.odometer) || 0) + (template.odometerValue || 0);
                }

                const newFollowUp = {
                    vehicleId: vehicleId,
                    type: template.type,
                    frequencyType: template.frequencyType,
                    frequencyValue: template.frequencyValue,
                    frequencyUnit: template.frequencyUnit,
                    odometerValue: template.odometerValue,
                    dueDate,
                    dueOdometer,
                    isRecurring: true,
                    isStandard: true,
                    status: 'pending'
                };
                await addFollowUp(newFollowUp);
            }
        } catch (err) {
            const normalized = normalizeError(err);
            console.error(normalized);
            setError(normalized);
            throw normalized;
        }
    }, [user, followUps, vehicles, deleteFollowUp, addFollowUp]);

    // --- Loan & EMI Actions ---

    const addLoan = useCallback(async (loanData) => {
        try {
            if (!user) return;
            setError(null);
            const newLoan = {
                status: 'active',
                history: [],
                remainingPrincipal: Number(loanData.totalLoanAmount),
                ...loanData
            };
            await FirestoreService.addItem(`users/${user.uid}/vehicleLoans`, newLoan);
        } catch (err) {
            const normalized = normalizeError(err);
            console.error(normalized);
            setError(normalized);
            throw normalized;
        }
    }, [user]);

    const payEMI = useCallback(async (loanId, payment) => {
        try {
            if (!user) return;
            setError(null);
            const loan = loans.find(l => l.id === loanId);
            if (!loan) return;
            const vehicle = vehicles.find(v => v.id === loan.vehicleId);

            // 2. Update Loan State
            let newRemainingPrincipal = Number(loan.remainingPrincipal) - Number(payment.principal);
            if (newRemainingPrincipal < 0) newRemainingPrincipal = 0;

            // 3. Handle Finance
            if (payment.amount > 0 && payment.accountId) {
                let catId = 'cat_vehicle';
                const existingCat = categories.find(c => c.name === 'Vehicle' || c.id === 'cat_vehicle');
                if (existingCat) catId = existingCat.id;
                else catId = categories.find(c => c.name === 'Transport')?.id || categories.find(c => c.type === 'expense')?.id;

                const tx = {
                    amount: payment.amount,
                    type: 'expense',
                    categoryId: catId,
                    accountId: payment.accountId,
                    note: `Vehicle: ${vehicle?.name} - Loan EMI (${payment.type}) - ${loan.lender}`,
                    date: payment.date
                };
                await addTransaction(tx);
            }

            // Update Loan Document
            await FirestoreService.updateItem(`users/${user.uid}/vehicleLoans`, loanId, {
                remainingPrincipal: newRemainingPrincipal,
                history: [...(loan.history || []), payment],
                status: newRemainingPrincipal <= 0 ? 'closed' : 'active'
            });
        } catch (err) {
            const normalized = normalizeError(err);
            console.error(normalized);
            setError(normalized);
            throw normalized;
        }
    }, [user, loans, vehicles, categories, addTransaction]);

    const getLoanForVehicle = useCallback((vehicleId) => {
        return loans.find(l => l.vehicleId === vehicleId && l.status !== 'closed');
    }, [loans]);

    // --- Insights & Helpers ---
    const getLoanDetailedStatus = useCallback((loanId) => {
        const loan = loans.find(l => l.id === loanId);
        if (!loan) return null;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const dueDate = new Date(currentYear, currentMonth, loan.dueDateDay);

        // Find if any EMI payment made this cycle
        const hasPaidThisMonth = loan.history?.some(p => {
            const pDate = new Date(p.date);
            return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth && p.type === 'EMI';
        });

        let nextDueDate = new Date(dueDate);
        if (hasPaidThisMonth) {
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }

        const isOverdue = !hasPaidThisMonth && now > dueDate;
        const status = isOverdue ? 'overdue' : (hasPaidThisMonth ? 'paid' : 'pending');

        // Interest Balance (Simplified for Flat vs Reducing)
        let interestBalance = 0;
        if (loan.interestType === 'reducing') {
            const monthlyRate = (loan.interestRate / 100) / 12;
            interestBalance = Math.max(0, loan.remainingPrincipal * monthlyRate);
        } else {
            // Flat: Total Interest / Tenure (Rough estimate per month)
            const totalInterest = loan.totalLoanAmount * (loan.interestRate / 100) * (loan.tenureMonths / 12);
            interestBalance = totalInterest / loan.tenureMonths;
        }

        return {
            status,
            dueDate: nextDueDate.toISOString(),
            isPastDue: isOverdue,
            interestBalance: Math.round(interestBalance),
            daysLate: isOverdue ? Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)) : 0
        };
    }, [loans]);

    const getVehicleStats = useCallback((vehicleId) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return null;

        const records = serviceRecords.filter(r => r.vehicleId === vehicleId);
        const vFollowUps = followUps.filter(f => f.vehicleId === vehicleId && f.status !== 'completed');
        const loan = loans.find(l => l.vehicleId === vehicleId && l.status !== 'closed');
        const loanPayments = loan ? (loan.history || []) : [];

        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        // Breakdown & Financials
        let totalFuel = 0;
        let totalService = 0;
        let totalInsurance = 0;

        records.forEach(r => {
            const cost = Number(r.cost) || 0;
            const type = (r.type || '').toLowerCase();
            if (type.includes('fuel')) totalFuel += cost;
            else if (type.includes('insurance')) totalInsurance += cost;
            else totalService += cost;
        });

        const totalEMI = loanPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const totalSpend = totalFuel + totalService + totalInsurance + totalEMI;

        // Rolling 30 Days (Month Spend)
        const recentRecords = records.filter(r => new Date(r.date) >= thirtyDaysAgo);
        const recentLoans = loanPayments.filter(p => new Date(p.date) >= thirtyDaysAgo);

        const monthSpend = recentRecords.reduce((sum, r) => sum + (Number(r.cost) || 0), 0) + 
                           recentLoans.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        // Approximate ownership duration in months for ownership cost
        const purchaseDate = new Date(vehicle.purchaseDate);
        const monthsOwned = Math.max(1, (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth()));
        const costPerMonth = Math.round(totalSpend / monthsOwned);

        // Cost per km
        const odometer = Number(vehicle.odometer) || 0;
        const costPerKm = odometer > 0 ? (totalSpend / odometer).toFixed(2) : 0;

        const breakdown = {
            fuel: totalFuel,
            service: totalService,
            emi: totalEMI,
            insurance: totalInsurance
        };

        // Overdue & Soon calculation
        const alerts = vFollowUps.filter(f => {
            let isOverdue = false;
            if ((f.frequencyType === 'date' || f.frequencyType === 'both') && f.dueDate && new Date(f.dueDate) < now) isOverdue = true;
            if ((f.frequencyType === 'odometer' || f.frequencyType === 'both') && f.dueOdometer && odometer >= Number(f.dueOdometer)) isOverdue = true;
            return isOverdue;
        });

        const overdueCount = alerts.length;

        // Health Score
        let healthScore = 100 - (overdueCount * 10);
        if (healthScore < 0) healthScore = 0;

        // Last Service
        const lastService = records.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        return {
            totalSpend,
            monthSpend,
            costPerMonth,
            costPerKm,
            breakdown,
            overdueCount,
            healthScore,
            lastServiceDate: lastService?.date,
            lastServiceType: lastService?.type
        };
    }, [vehicles, serviceRecords, followUps, loans]);

    const getVehicleRisks = useCallback((vehicleId) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return [];

        const risks = [];
        const loan = getLoanForVehicle(vehicleId);

        // 1. EMI & Loan Risks
        if (loan) {
            const loanStatus = getLoanDetailedStatus(loan.id);
            if (loanStatus.isPastDue) {
                risks.push({
                    type: 'critical',
                    title: `EMI Overdue by ${loanStatus.daysLate} days`,
                    detail: 'Immediate payment required to avoid penalties.'
                });
            } else if (loanStatus.status === 'active') {
                risks.push({
                    type: 'info',
                    title: `Interest Remaining: ₹${loanStatus.interestBalance.toLocaleString()}`,
                    detail: `${loan.interestType === 'reducing' ? 'Reducing Balance' : 'Flat Rate'} Interest`
                });
            }
        }

        // 2. Critical Maintenance (Insurance & Oil)
        const vFollowUps = followUps.filter(f => f.vehicleId === vehicleId && f.status !== 'completed');

        const insuranceTask = vFollowUps.find(f => (f.name || f.type || '').toLowerCase().includes('insurance'));
        if (insuranceTask) {
            const daysLeft = insuranceTask.dueDate ? Math.ceil((new Date(insuranceTask.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : 999;
            if (daysLeft < 0) {
                risks.push({ type: 'critical', title: 'Insurance Expired', detail: ` expired ${Math.abs(daysLeft)} days ago. Do not drive.` });
            } else if (daysLeft <= 15) {
                risks.push({ type: 'warning', title: 'Insurance Expiring Soon', detail: `Renew within ${daysLeft} days.` });
            }
        }

        const oilTask = vFollowUps.find(f => (f.name || f.type || '').toLowerCase().includes('oil'));
        if (oilTask) {
            if (oilTask.dueOdometer && Number(vehicle.odometer) >= Number(oilTask.dueOdometer)) {
                const overKm = Number(vehicle.odometer) - Number(oilTask.dueOdometer);
                risks.push({ type: 'warning', title: `Oil Change Overdue by ${overKm} km`, detail: 'Engine health at risk.' });
            }
        }

        // 3. Financial Insights
        const stats = getVehicleStats(vehicleId);
        if (stats) {
            risks.push({
                type: 'info',
                title: `Monthly Cost: ₹${stats.costPerMonth.toLocaleString()}`,
                detail: 'Average cost of ownership per month.'
            });

            if (stats.monthSpend > stats.costPerMonth * 1.5 && stats.monthSpend > 2000) {
                risks.push({
                    type: 'warning',
                    title: 'Rising Monthly Cost',
                    detail: `This month's spend (₹${stats.monthSpend}) is 50% higher than average.`
                });
            }
        }

        return risks;
    }, [vehicles, followUps, getLoanForVehicle, getLoanDetailedStatus, getVehicleStats]);

    const loadMoreServiceRecords = useCallback(() => setRecordLimit(prev => prev + 20), []);

    const value = useMemo(() => ({
        vehicles,
        followUps,
        serviceRecords,
        addVehicle,
        updateVehicle,
        toggleArchiveVehicle,
        setVehicleActive,
        getActiveVehicle,
        addFollowUp,
        deleteFollowUp,
        completeFollowUp,
        addServiceRecord,
        getVehicleStats,
        getLatestRecord,
        toggleMaintenanceItem,
        loans,
        addLoan,
        payEMI,
        getLoanForVehicle,
        getLoanDetailedStatus,

        getVehicleRisks,

        deleteVehicle,
        error,
        isLoading, // Expose loading status
        loadMoreServiceRecords
    }), [
        vehicles, followUps, serviceRecords, loans, isLoading,
        addVehicle, updateVehicle, toggleArchiveVehicle, setVehicleActive, getActiveVehicle, deleteVehicle,
        addFollowUp, deleteFollowUp, completeFollowUp, addServiceRecord, getVehicleStats, getLatestRecord, toggleMaintenanceItem,
        addLoan, payEMI, getLoanForVehicle, getLoanDetailedStatus, getVehicleRisks,
        loadMoreServiceRecords
    ]);

    return (
        <VehicleContext.Provider value={value}>
            {children}
        </VehicleContext.Provider>
    );
};
