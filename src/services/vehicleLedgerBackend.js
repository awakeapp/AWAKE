import { collection, query, where, getAggregateFromServer, sum, count } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const VehicleLedgerBackend = {
    /**
     * Compute dashboard stats dynamically on the Firestore backend
     */
    getDashboardStats: async (userId, vehicleId) => {
        if (!db || !userId || !vehicleId) return null;

        try {
            const path = `users/${userId}/ledgerEntries`;
            const ref = collection(db, path);
            
            // 1. Total Ownership Cost
            const qTotal = query(ref, where('vehicleId', '==', vehicleId));
            const totalSnap = await getAggregateFromServer(qTotal, {
                totalSpend: sum('amount')
            });
            const totalSpend = totalSnap.data().totalSpend || 0;

            // 2. This Month Cost (Rolling 30 days or Calendar month)
            // Sticking to "current month entries" as calendar month for simplicity
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            
            const qMonth = query(ref, where('vehicleId', '==', vehicleId), where('date', '>=', startOfMonth));
            const monthSnap = await getAggregateFromServer(qMonth, {
                monthSpend: sum('amount')
            });
            const monthSpend = monthSnap.data().monthSpend || 0;

            // 3. 6-Month Trend
            const trendData = [];
            // We loop from oldest (now - 5 months) to current month to keep chronological order
            for (let i = 5; i >= 0; i--) {
                const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
                
                const qTrend = query(
                    ref, 
                    where('vehicleId', '==', vehicleId), 
                    where('date', '>=', targetMonth.toISOString()), 
                    where('date', '<', nextMonth.toISOString())
                );
                
                const trendSnap = await getAggregateFromServer(qTrend, { cost: sum('amount') });
                
                trendData.push({
                    label: targetMonth.toLocaleString('en-US', { month: 'short' }),
                    cost: trendSnap.data().cost || 0
                });
            }

            // 4. Breakdown By Type
            const types = ['fuel', 'service', 'emi', 'insurance'];
            const breakdown = { fuel: 0, service: 0, emi: 0, insurance: 0 };
            
            await Promise.all(types.map(async (t) => {
                const qType = query(ref, where('vehicleId', '==', vehicleId), where('type', '==', t));
                const snap = await getAggregateFromServer(qType, { cost: sum('amount') });
                breakdown[t] = snap.data().cost || 0;
            }));

            // Optional: calculate cost per km
            // Cost per KM would require the vehicle's odometer which we don't have here, so we let the context attach it.

            return {
                totalSpend,
                monthSpend,
                trendData,
                breakdown
            };

        } catch (error) {
            console.error("Backend compute failed:", error);
            return null;
        }
    },

    /**
     * Compute loan status and EMI schedule dynamically
     */
    getLoanSummary: async (userId, vehicleId, loan) => {
        if (!db || !userId || !vehicleId || !loan) return null;

        try {
            const path = `users/${userId}/ledgerEntries`;
            const ref = collection(db, path);
            
            // 1. Fetch all EMI payments from ledger
            const qEmi = query(ref, where('vehicleId', '==', vehicleId), where('type', '==', 'emi'));
            const emiSnap = await getAggregateFromServer(qEmi, {
                totalPaid: sum('amount'),
                countPaid: count()
            });
            
            const totalPaid = emiSnap.data().totalPaid || 0;
            const installmentsPaid = emiSnap.data().countPaid || 0;

            // 2. EMI Calculation (Structured Logic)
            const p = Number(loan.principal || loan.totalLoanAmount);
            const r = (Number(loan.interest_rate || loan.interestRate) / 12) / 100;
            const n = Number(loan.tenure_months || loan.tenureMonths);
            
            let emi = 0;
            let totalPayable = 0;
            
            if (loan.interestType === 'reducing') {
                emi = Math.round(p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
                totalPayable = emi * n;
            } else {
                const totalInterest = p * (Number(loan.interest_rate || loan.interestRate) / 100) * (n / 12);
                totalPayable = Math.round(p + totalInterest);
                emi = Math.round(totalPayable / n);
            }

            // 3. Status logic
            const now = new Date();
            const start = new Date(loan.start_date || loan.startDate);
            const monthsSinceStart = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
            
            // Should have paid at least this many installments by now
            // If today is past the dueDateDay, the current month also counts as "should be paid"
            const currentDay = now.getDate();
            const dueDateDay = Number(loan.dueDateDay || 1);
            const shouldHavePaid = currentDay >= dueDateDay ? monthsSinceStart + 1 : monthsSinceStart;
            
            const isOverdue = installmentsPaid < Math.min(shouldHavePaid, n);
            const remainingBalance = Math.max(0, totalPayable - totalPaid);

            return {
                emi,
                totalPayable,
                totalPaid,
                installmentsPaid,
                remainingBalance,
                isOverdue,
                nextInstallmentDate: new Date(now.getFullYear(), now.getMonth() + (installmentsPaid > monthsSinceStart ? 1 : 0), loan.dueDateDay).toISOString(),
                status: remainingBalance <= 0 ? 'closed' : (isOverdue ? 'overdue' : 'active')
            };

        } catch (error) {
            console.error("Loan backend compute failed:", error);
            return null;
        }
    }
};
