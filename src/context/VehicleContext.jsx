import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { useFinance } from './FinanceContext';
import { useGlobalError } from './GlobalErrorContext';
import { addDays, addMonths, addYears } from 'date-fns';
import { FirestoreService } from '../services/firestore-service';
import { orderBy, limit, where } from 'firebase/firestore';
import { normalizeError } from '../utils/error-utils';
import { VehicleLedgerBackend } from '../services/vehicleLedgerBackend';

const VehicleContext = createContext();

export const MAINTENANCE_TEMPLATES = [
    { name: 'Oil Change', interval_months: 6, interval_km: 10000, interval_type: 'both', category: 'mandatory' },
    { name: 'Engine Oil Filter', interval_months: 6, interval_km: 10000, interval_type: 'both', category: 'mandatory' },
    { name: 'Air Filter', interval_months: 12, interval_km: 20000, interval_type: 'both', category: 'mandatory' },
    { name: 'Brake Check', interval_months: 6, interval_km: 10000, interval_type: 'both', category: 'mandatory' },
    { name: 'Chain Lubrication', interval_months: 1, interval_km: 500, interval_type: 'both', category: 'optional', applicable: ['bike', 'scooter'] },
    { name: 'Coolant Check', interval_months: 6, interval_km: 10000, interval_type: 'both', category: 'mandatory' },
    { name: 'Battery Health', interval_months: 12, interval_type: 'months', category: 'mandatory' },
    { name: 'Tyre Pressure', interval_months: 1, interval_type: 'months', category: 'mandatory' },
    { name: 'Tyre Rotation', interval_months: 12, interval_km: 10000, interval_type: 'both', category: 'optional' },
    { name: 'Wheel Alignment', interval_months: 12, interval_km: 10000, interval_type: 'both', category: 'optional' },
    { name: 'General Service', interval_months: 12, interval_km: 10000, interval_type: 'both', category: 'mandatory' },
    { name: 'Accident Repair', interval_type: 'none', category: 'optional' }, 
    { name: 'Accessories Maintenance', interval_months: 12, interval_type: 'months', category: 'optional' },
    { name: 'Insurance Renewal', interval_months: 12, interval_type: 'months', category: 'mandatory' },
    { name: 'Pollution Certificate', interval_months: 6, interval_type: 'months', category: 'mandatory' },
    { name: 'Registration Renewal', interval_months: 180, interval_type: 'months', category: 'mandatory' }, 
    { name: 'Fitness Certificate', interval_months: 12, interval_type: 'months', category: 'optional', applicable: ['commercial'] }
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
    const [ledgerStats, setLedgerStats] = useState(null);
    const [loanStats, setLoanStats] = useState(null);

    // Sync local error to global error
    useEffect(() => {
        if (error) {
            showError(error);
        }
    }, [error, showError]);

    // Deduce Active Vehicle synchronously
    const activeVehicle = useMemo(() => vehicles.find(v => v.isActive && !v.isArchived) || null, [vehicles]);
    const activeVehicleId = activeVehicle?.id;

    // --- Fetch Backend Dashboard Stats ---
    useEffect(() => {
        if (!user || !activeVehicleId) {
            setLedgerStats(null);
            setLoanStats(null);
            return;
        }
        VehicleLedgerBackend.getDashboardStats(user.uid, activeVehicleId).then(setLedgerStats);
        
        // Find active loan for this vehicle
        const activeLoan = loans.find(l => l.vehicleId === activeVehicleId && l.status !== 'closed');
        if (activeLoan) {
            VehicleLedgerBackend.getLoanSummary(user.uid, activeVehicleId, activeLoan).then(setLoanStats);
        } else {
            setLoanStats(null);
        }
    }, [user, activeVehicleId, serviceRecords, loans]); // refresh when records or loans change

    // --- Persistence: Firestore Subscriptions for Vehicles ---
    useEffect(() => {
        if (!authIsReady) return;

        if (!user) {
            setVehicles([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

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

        return () => {
            unsubVehicles();
        };
    }, [user, authIsReady]);

    // --- Persistence: Firestore Subscriptions for isolated activeVehicle data ---
    useEffect(() => {
        if (!authIsReady || !user) return;

        if (!activeVehicleId) {
            setFollowUps([]);
            setServiceRecords([]);
            setLoans([]);
            return;
        }

        // Subscribe to Followups specific to Active Vehicle
        const unsubFollowups = FirestoreService.subscribeToCollection(
            `users/${user.uid}/followUps`,
            (data) => { setError(null); setFollowUps(data); },
            where('vehicleId', '==', activeVehicleId),
            (err) => {
                const normalized = normalizeError(err);
                console.error(normalized);
                setError(normalized);
            }
        );

        // Subscribe to Ledger Entries specific to Active Vehicle
        const unsubRecords = FirestoreService.subscribeToCollection(
            `users/${user.uid}/ledgerEntries`,
            (data) => { setError(null); setServiceRecords(data); },
            where('vehicleId', '==', activeVehicleId),
            orderBy('date', 'asc'),
            limit(recordLimit),
            (err) => {
                const normalized = normalizeError(err);
                console.error(normalized);
                setError(normalized);
            }
        );

        // Subscribe to Loans specific to Active Vehicle
        const unsubLoans = FirestoreService.subscribeToCollection(
            `users/${user.uid}/vehicleLoans`,
            (data) => { setError(null); setLoans(data); },
            where('vehicleId', '==', activeVehicleId),
            (err) => {
                const normalized = normalizeError(err);
                console.error(normalized);
                setError(normalized);
            }
        );

        return () => {
            unsubFollowups();
            unsubRecords();
            unsubLoans();
        };
    }, [user, authIsReady, activeVehicleId, recordLimit]);

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
                .filter(t => t.interval_type !== 'none')
                .map(t => {
                    const baseDate = new Date();
                    let dueDate = null;
                    if (t.interval_type === 'months' || t.interval_type === 'both') {
                        dueDate = addMonths(baseDate, t.interval_months).toISOString();
                    }

                    let dueOdometer = null;
                    if (t.interval_type === 'km' || t.interval_type === 'both') {
                        dueOdometer = (Number(vehicleData.odometer) || 0) + (t.interval_km || 0);
                    }

                    return {
                        vehicleId: vehicleId,
                        name: t.name,
                        interval_type: t.interval_type,
                        interval_months: t.interval_months || null,
                        interval_km: t.interval_km || null,
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
            let typeMap = 'other';
            const lowType = (followUp.type || '').toLowerCase();
            if(lowType.includes('fuel')) typeMap = 'fuel';
            else if(lowType.includes('insurance')) typeMap = 'insurance';
            else typeMap = 'service';

            let newRecord = {
                vehicleId: followUp.vehicleId,
                followUpId: id,
                type: typeMap,
                amount: Number(completionDetails.cost || 0),
                date: completionDetails.date,
                odometer: Number(completionDetails.odometer || 0),
                notes: `Follow-up completed: ${followUp.type}`,
                attachment: completionDetails.attachment || null
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

            // Add Service Record to Standardized Ledger
            await FirestoreService.addItem(`users/${user.uid}/ledgerEntries`, newRecord);

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
                if (followUp.interval_type === 'months' || followUp.interval_type === 'both') {
                    const baseDate = new Date(completionDetails.date);
                    nextFollowUp.dueDate = addMonths(baseDate, followUp.interval_months).toISOString();
                }

                if (followUp.interval_type === 'km' || followUp.interval_type === 'both') {
                    const currentOdo = Number(completionDetails.odometer);
                    nextFollowUp.dueOdometer = currentOdo + Number(followUp.interval_km || 0);
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
            let typeMap = 'other';
            const lowType = (recordDetails.type || '').toLowerCase();
            if(lowType.includes('fuel')) typeMap = 'fuel';
            else if(lowType.includes('insurance')) typeMap = 'insurance';
            else typeMap = 'service';
            
            let newRecord = {
                vehicleId: recordDetails.vehicleId,
                type: typeMap,
                amount: Number(recordDetails.cost || 0),
                date: recordDetails.date,
                odometer: Number(recordDetails.odometer || 0),
                notes: recordDetails.notes || recordDetails.type,
                attachment: recordDetails.attachment || null
            };

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

            await FirestoreService.addItem(`users/${user.uid}/ledgerEntries`, newRecord);

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

    const deleteServiceRecord = useCallback(async (id) => {
        try {
            if (!user) return;
            setError(null);
            await FirestoreService.deleteItem(`users/${user.uid}/ledgerEntries`, id);
        } catch (err) {
            const normalized = normalizeError(err);
            console.error(normalized);
            setError(normalized);
            throw normalized;
        }
    }, [user]);

    const updateServiceRecord = useCallback(async (id, updates) => {
        try {
            if (!user) return;
            setError(null);
            await FirestoreService.updateItem(`users/${user.uid}/ledgerEntries`, id, updates);
        } catch (err) {
            const normalized = normalizeError(err);
            console.error(normalized);
            setError(normalized);
            throw normalized;
        }
    }, [user]);

    const getLatestRecord = useCallback((vehicleId, type) => {
        return serviceRecords
            .filter(r => r.vehicleId === vehicleId && r.type === type)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    }, [serviceRecords]);

    const toggleMaintenanceItem = useCallback(async (vehicleId, template) => {
        try {
            if (!user) return;
            setError(null);
            const existing = followUps.find(f => f.vehicleId === vehicleId && (f.name === template.name || f.type === template.name) && f.status !== 'completed');
            const vehicle = vehicles.find(v => v.id === vehicleId);

            if (existing) {
                await deleteFollowUp(existing.id);
            } else {
                // Add it
                const baseDate = new Date();
                let dueDate = null;
                if (template.interval_type === 'months' || template.interval_type === 'both') {
                    dueDate = addMonths(baseDate, template.interval_months).toISOString();
                }

                let dueOdometer = null;
                if (vehicle && (template.interval_type === 'km' || template.interval_type === 'both')) {
                    dueOdometer = (Number(vehicle.odometer) || 0) + (template.interval_km || 0);
                }

                const newFollowUp = {
                    vehicleId: vehicleId,
                    name: template.name,
                    interval_type: template.interval_type,
                    interval_months: template.interval_months || null,
                    interval_km: template.interval_km || null,
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

            // Write Standardized Ledger Entry to Backend
            let emiRecord = {
                vehicleId: loan.vehicleId,
                type: 'emi',
                amount: Number(payment.amount || 0),
                date: payment.date,
                notes: `EMI Payment - ${loan.lender}`,
            };
            if(payment.amount > 0) {
                 await FirestoreService.addItem(`users/${user.uid}/ledgerEntries`, emiRecord);
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
        if (!loanStats) return null;
        
        return {
            status: loanStats.status,
            dueDate: loanStats.nextInstallmentDate,
            isPastDue: loanStats.isOverdue,
            remainingBalance: loanStats.remainingBalance,
            totalPaid: loanStats.totalPaid,
            installmentsPaid: loanStats.installmentsPaid,
            emi: loanStats.emi,
            daysLate: loanStats.isOverdue ? Math.floor((new Date() - new Date(loanStats.nextInstallmentDate)) / (1000 * 60 * 60 * 24)) : 0
        };
    }, [loanStats]);

    const getVehicleStats = useCallback((vehicleId) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return null;

        const vFollowUps = followUps.filter(f => f.vehicleId === vehicleId && f.status !== 'completed');
        
        // Fetch Aggregates directly from backend states perfectly eliminating frontend calculations bounds
        const totalSpend = ledgerStats?.totalSpend || 0;
        const monthSpend = ledgerStats?.monthSpend || 0;
        const trendData = ledgerStats?.trendData || [];
        const breakdown = ledgerStats?.breakdown || { fuel: 0, service: 0, emi: 0, insurance: 0 };

        const now = new Date();
        // Approximate ownership duration in months for ownership cost
        const purchaseDate = new Date(vehicle.purchaseDate);
        const monthsOwned = Math.max(1, (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth()));
        const costPerMonth = Math.round(totalSpend / monthsOwned);

        // Cost per km
        const odometer = Number(vehicle.odometer) || 0;
        const costPerKm = odometer > 0 ? (totalSpend / odometer).toFixed(2) : 0;

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

        // Last Service (Local memory based is fine here since it only demands latest 1 entry, and records cap natively provides it)
        const lastService = serviceRecords.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        return {
            totalSpend,
            monthSpend,
            costPerMonth,
            costPerKm,
            breakdown,
            trendData,
            overdueCount,
            healthScore,
            lastServiceDate: lastService?.date,
            lastServiceType: lastService?.notes || 'Service'
        };
    }, [vehicles, followUps, ledgerStats, serviceRecords]);

    const getVehicleRisks = useCallback((vehicleId) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return [];

        const risks = [];
        const loan = getLoanForVehicle(vehicleId);

        // 1. EMI & Loan Risks
        if (loan) {
            const loanStatus = getLoanDetailedStatus(loan.id);
            if (loanStatus && loanStatus.isPastDue) {
                risks.push({
                    type: 'critical',
                    title: `EMI Overdue by ${loanStatus.daysLate} days`,
                    detail: 'Immediate payment required to avoid penalties.'
                });
            } else if (loanStatus && loanStatus.status === 'active') {
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
        deleteServiceRecord,
        updateServiceRecord,
        error,
        isLoading, // Expose loading status
        loadMoreServiceRecords
    }), [
        vehicles, followUps, serviceRecords, loans, isLoading,
        addVehicle, updateVehicle, toggleArchiveVehicle, setVehicleActive, getActiveVehicle, deleteVehicle,
        addFollowUp, deleteFollowUp, completeFollowUp, addServiceRecord, deleteServiceRecord, updateServiceRecord, getVehicleStats, getLatestRecord, toggleMaintenanceItem,
        addLoan, payEMI, getLoanForVehicle, getLoanDetailedStatus, getVehicleRisks,
        loadMoreServiceRecords
    ]);

    return (
        <VehicleContext.Provider value={value}>
            {children}
        </VehicleContext.Provider>
    );
};
