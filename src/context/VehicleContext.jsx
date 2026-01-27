import { createContext, useContext, useState, useEffect } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { useFinance } from './FinanceContext';
import { addDays, addMonths, addYears } from 'date-fns';

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
    const { user } = useAuthContext();
    const { addTransaction, categories, addCategory } = useFinance(); // Integrate Finance

    const [vehicles, setVehicles] = useState([]);
    const [followUps, setFollowUps] = useState([]);
    const [serviceRecords, setServiceRecords] = useState([]);
    const [loans, setLoans] = useState([]);

    // --- Persistence ---
    useEffect(() => {
        const uid = user ? user.uid : 'guest';
        try {
            const storedData = localStorage.getItem(`awake_vehicle_data_${uid}`);
            if (storedData) {
                const data = JSON.parse(storedData);
                setVehicles(data.vehicles || []);
                setFollowUps(data.followUps || []);
                setServiceRecords(data.serviceRecords || []);
                setLoans(data.loans || []);
            } else {
                setVehicles([]);
                setFollowUps([]);
                setServiceRecords([]);
                setLoans([]);
            }
        } catch (e) {
            console.error("Vehicle Load Error", e);
        }
    }, [user]);

    const saveData = (newVehicles, newFollowUps, newServiceRecords, newLoans) => {
        const uid = user ? user.uid : 'guest';
        const data = {
            vehicles: newVehicles ?? vehicles,
            followUps: newFollowUps ?? followUps,
            serviceRecords: newServiceRecords ?? serviceRecords,
            loans: newLoans ?? loans
        };

        if (newVehicles) setVehicles(newVehicles);
        if (newFollowUps) setFollowUps(newFollowUps);
        if (newServiceRecords) setServiceRecords(newServiceRecords);
        if (newLoans) setLoans(newLoans);

        localStorage.setItem(`awake_vehicle_data_${uid}`, JSON.stringify(data));

        // SYNC TO GOOGLE SHEET
        if (user) {
            api.sync({
                mutations: [{
                    mutationId: `veh_${Date.now()}`,
                    type: 'UPDATE_MODULE',
                    uid: user.uid,
                    moduleName: 'vehicle',
                    data: data
                }]
            }).then(res => console.log("Synced Vehicle:", res));
        }
    };

    // --- Vehicle Actions ---

    const addVehicle = (vehicleData) => {
        const vehicleId = `veh_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newVehicle = {
            id: vehicleId,
            createdAt: Date.now(),
            isArchived: false,
            isActive: vehicles.length === 0,
            ...vehicleData
        };

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
                    id: `fu_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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

        saveData([...vehicles, newVehicle], [...followUps, ...seedFollowUps], undefined);
    };

    const updateVehicle = (id, updates) => {
        const newVehicles = vehicles.map(v => v.id === id ? { ...v, ...updates } : v);
        saveData(newVehicles, undefined, undefined);
    };

    const toggleArchiveVehicle = (id) => {
        const vehicle = vehicles.find(v => v.id === id);
        if (!vehicle) return;

        let updates = { isArchived: !vehicle.isArchived };
        if (!vehicle.isArchived && vehicle.isActive) {
            updates.isActive = false;
        }

        updateVehicle(id, updates);
    };

    const setVehicleActive = (id) => {
        const newVehicles = vehicles.map(v => ({
            ...v,
            isActive: v.id === id
        }));
        saveData(newVehicles, undefined, undefined);
    };

    const getActiveVehicle = () => {
        return vehicles.find(v => v.isActive && !v.isArchived);
    };

    // --- Follow Up Actions ---

    const addFollowUp = (followUp) => {
        const newFollowUp = {
            id: `fu_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            status: 'pending',
            ...followUp
        };
        saveData(undefined, [...followUps, newFollowUp], undefined);
    };

    const deleteFollowUp = (id) => {
        const newFollowUps = followUps.filter(f => f.id !== id);
        saveData(undefined, newFollowUps, undefined);
    };

    const completeFollowUp = (id, completionDetails) => {
        // completionDetails: { date, cost, odometer, notes, accountId }
        const followUp = followUps.find(f => f.id === id);
        if (!followUp) return;

        const vehicle = vehicles.find(v => v.id === followUp.vehicleId);

        // 1. Create Service Record
        const newRecord = {
            id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            vehicleId: followUp.vehicleId,
            followUpId: id,
            type: followUp.type,
            ...completionDetails
        };

        // 2. Handle Finance
        if (completionDetails.cost > 0 && completionDetails.accountId) {
            // Ensure 'Vehicle' category exists
            let catId = 'cat_vehicle';
            const existingCat = categories.find(c => c.name === 'Vehicle' || c.id === 'cat_vehicle');

            if (!existingCat) {
                // Creating category on the fly might be risky in render, but safe in event handler
                // However, addCategory is likely async or state update. 
                // Ideally we assume 'cat_transport' if 'cat_vehicle' fails or use generic.
                // For now, let's use 'cat_transport' which we know exists from default, 
                // OR check if we can add one.
                // Let's rely on 'Transport' for safety or 'cat_vehicle' if the user added it.
                // Actually, better: check if 'Transport' exists, else use first expense category.
                catId = categories.find(c => c.name === 'Transport')?.id || categories.find(c => c.type === 'expense')?.id;
            } else {
                catId = existingCat.id;
            }

            const tx = {
                amount: completionDetails.cost,
                type: 'expense',
                categoryId: catId,
                accountId: completionDetails.accountId,
                note: `Vehicle: ${vehicle?.name} - ${followUp.type}`,
                date: completionDetails.date
            };
            addTransaction(tx);
            newRecord.financeTxId = true; // Just flag it was logged
        }

        // 3. Update Vehicle Odometer if higher
        let newVehicles = undefined;
        if (Number(completionDetails.odometer) > Number(vehicle?.odometer || 0)) {
            newVehicles = vehicles.map(v => v.id === vehicle.id ? { ...v, odometer: completionDetails.odometer } : v);
        }

        // 4. Handle Recurring
        let newFollowUps = followUps.filter(f => f.id !== id); // Remove current pending

        if (followUp.isRecurring) {
            const nextFollowUp = { ...followUp, id: `fu_${Date.now()}_next` };

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

            newFollowUps.push(nextFollowUp);
        }

        saveData(newVehicles, newFollowUps, [...serviceRecords, newRecord]);
    };

    // New: Helper to log ad-hoc service record (without a follow-up)
    const addServiceRecord = (recordDetails) => {
        const newRecord = {
            id: `rec_${Date.now()}_adhoc`,
            ...recordDetails
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
            addTransaction(tx);
            newRecord.financeTxId = true;
        }

        // Update Odo
        let newVehicles = undefined;
        const vehicle = vehicles.find(v => v.id === recordDetails.vehicleId);
        if (Number(recordDetails.odometer) > Number(vehicle?.odometer || 0)) {
            newVehicles = vehicles.map(v => v.id === vehicle.id ? { ...v, odometer: recordDetails.odometer } : v);
        }

        saveData(newVehicles, undefined, [...serviceRecords, newRecord]);
    };

    const getLatestRecord = (vehicleId, type) => {
        return serviceRecords
            .filter(r => r.vehicleId === vehicleId && r.type === type)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    };

    const toggleMaintenanceItem = (vehicleId, template) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;

        const existing = followUps.find(f => f.vehicleId === vehicleId && f.type === template.type && f.status !== 'completed');

        if (existing) {
            // Remove it
            saveData(undefined, followUps.filter(f => f.id !== existing.id), undefined);
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
            if (template.frequencyType === 'odometer' || template.frequencyType === 'both') {
                dueOdometer = (Number(vehicle.odometer) || 0) + (template.odometerValue || 0);
            }

            const newFollowUp = {
                id: `fu_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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

            saveData(undefined, [...followUps, newFollowUp], undefined);
        }
    };

    // --- Loan & EMI Actions ---

    const addLoan = (loanData) => {
        const newLoan = {
            id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            status: 'active',
            history: [],
            remainingPrincipal: Number(loanData.totalLoanAmount),
            ...loanData
        };
        saveData(undefined, undefined, undefined, [...loans, newLoan]);
    };

    const payEMI = (loanId, payment) => {
        // payment: { date, amount, principal, interest, penalty, type, accountId }
        const loan = loans.find(l => l.id === loanId);
        if (!loan) return;

        const vehicle = vehicles.find(v => v.id === loan.vehicleId);

        // 1. Create Payment Record
        const newPayment = {
            id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            ...payment
        };

        // 2. Update Loan State
        let newRemainingPrincipal = Number(loan.remainingPrincipal) - Number(payment.principal);
        if (newRemainingPrincipal < 0) newRemainingPrincipal = 0;

        const updatedLoan = {
            ...loan,
            remainingPrincipal: newRemainingPrincipal,
            history: [...loan.history, newPayment],
            status: newRemainingPrincipal <= 0 ? 'closed' : 'active'
        };

        const newLoans = loans.map(l => l.id === loanId ? updatedLoan : l);

        // 3. Handle Finance
        if (payment.amount > 0 && payment.accountId) {
            let catId = 'cat_vehicle';
            const existingCat = categories.find(c => c.name === 'Vehicle' || c.id === 'cat_vehicle');

            if (!existingCat) {
                catId = categories.find(c => c.name === 'Transport')?.id || categories.find(c => c.type === 'expense')?.id;
            } else {
                catId = existingCat.id;
            }

            const tx = {
                amount: payment.amount,
                type: 'expense',
                categoryId: catId,
                accountId: payment.accountId,
                note: `Vehicle: ${vehicle?.name} - Loan EMI (${payment.type}) - ${loan.lender}`,
                date: payment.date
            };
            addTransaction(tx);
        }

        saveData(undefined, undefined, undefined, newLoans);
    };

    const getLoanForVehicle = (vehicleId) => {
        return loans.find(l => l.vehicleId === vehicleId && l.status !== 'closed');
    };

    // --- Insights & Helpers ---
    const getLoanDetailedStatus = (loanId) => {
        const loan = loans.find(l => l.id === loanId);
        if (!loan) return null;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const dueDate = new Date(currentYear, currentMonth, loan.dueDateDay);

        // Find if any EMI payment made this month
        const hasPaidThisMonth = loan.history.some(p => {
            const pDate = new Date(p.date);
            return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth && p.type === 'EMI';
        });

        let status = 'paid';
        if (!hasPaidThisMonth) {
            status = now > dueDate ? 'overdue' : 'pending';
        }

        // Interest Balance (Simplified for Flat vs Reducing)
        let interestBalance = 0;
        if (loan.interestType === 'reducing') {
            const monthlyRate = (loan.interestRate / 100) / 12;
            interestBalance = loan.remainingPrincipal * monthlyRate;
        } else {
            // Flat: Total Interest / Tenure (Rough estimate per month)
            const totalInterest = loan.totalLoanAmount * (loan.interestRate / 100) * (loan.tenureMonths / 12);
            interestBalance = totalInterest / loan.tenureMonths;
        }

        return {
            status,
            dueDate: dueDate.toISOString(),
            isPastDue: !hasPaidThisMonth && now > dueDate,
            interestBalance: Math.round(interestBalance),
            daysLate: !hasPaidThisMonth && now > dueDate ? Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)) : 0
        };
    };

    const getVehicleRisks = (vehicleId) => {
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
    };

    const getVehicleStats = (vehicleId) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return null;

        const records = serviceRecords.filter(r => r.vehicleId === vehicleId);
        const vFollowUps = followUps.filter(f => f.vehicleId === vehicleId && f.status !== 'completed');

        // Financials
        const totalSpend = records.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

        const now = new Date();
        const thisMonth = records.filter(r => new Date(r.date) > new Date(now.getFullYear(), now.getMonth(), 1));
        const monthSpend = thisMonth.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

        // Approximate ownership duration in months for ownership cost
        const purchaseDate = new Date(vehicle.purchaseDate);
        const monthsOwned = Math.max(1, (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth()));
        const costPerMonth = Math.round(totalSpend / monthsOwned);

        // Overdue & Soon calculation
        const alerts = vFollowUps.filter(f => {
            let isOverdue = false;
            if ((f.frequencyType === 'date' || f.frequencyType === 'both') && f.dueDate && new Date(f.dueDate) < now) isOverdue = true;
            if ((f.frequencyType === 'odometer' || f.frequencyType === 'both') && f.dueOdometer && Number(vehicle.odometer) >= Number(f.dueOdometer)) isOverdue = true;
            return isOverdue;
        });

        const overdueCount = alerts.length;

        // Last Service
        const lastService = records.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        return {
            totalSpend,
            monthSpend,
            costPerMonth,
            overdueCount,
            lastServiceDate: lastService?.date,
            lastServiceType: lastService?.type
        };
    };

    const value = {
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
        getVehicleRisks
    };

    return (
        <VehicleContext.Provider value={value}>
            {children}
        </VehicleContext.Provider>
    );
};
