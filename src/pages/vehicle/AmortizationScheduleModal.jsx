import { X, Calendar, DollarSign, TrendingDown } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { format, addMonths } from 'date-fns';

const AmortizationScheduleModal = ({ isOpen, onClose, loan }) => {
    useScrollLock(isOpen);

    if (!isOpen || !loan) return null;

    const generateSchedule = () => {
        const schedule = [];
        let balance = loan.totalLoanAmount;
        const rate = (loan.interestRate / 100) / 12; // Monthly rate
        const emi = loan.emiAmount;
        const startDate = loan.startDate ? new Date(loan.startDate) : new Date();
        const dueDay = loan.dueDateDay || startDate.getDate();

        // Check flat vs reducing calculation
        const isReducing = loan.interestType !== 'flat';

        for (let i = 1; i <= loan.tenureMonths; i++) {
            let interest = 0;
            let principal = 0;

            if (isReducing) {
                interest = balance * rate;
                principal = emi - interest;
            } else {
                interest = (loan.totalLoanAmount * (loan.interestRate / 100) * (loan.tenureMonths / 12)) / loan.tenureMonths;
                principal = emi - interest;
            }

            if (balance - principal < 0 || i === loan.tenureMonths) {
                principal = balance;
                if (!isReducing) interest = emi - principal; // slight adjustment for flat end
            }

            balance -= principal;

            const paymentDate = addMonths(startDate, i - 1);
            if (dueDay <= 28) paymentDate.setDate(dueDay);

            schedule.push({
                month: i,
                date: paymentDate,
                emi: principal + interest,
                principal,
                interest,
                balance: Math.max(0, balance)
            });

            if (balance <= 0) break;
        }

        return schedule;
    };

    const schedule = generateSchedule();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-900 text-white rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-indigo-400" />
                            Amortization Schedule
                        </h2>
                        <p className="text-xs text-slate-400">{loan.lender} - ₹{loan.totalLoanAmount.toLocaleString()} @ {loan.interestRate}% ({loan.interestType})</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
                    <div className="grid grid-cols-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 sticky top-0 bg-white dark:bg-slate-900 py-2 z-10 border-b dark:border-slate-800">
                        <span>Date</span>
                        <span className="text-right">EMI</span>
                        <span className="text-right text-indigo-500">Principal</span>
                        <span className="text-right text-red-400">Interest</span>
                        <span className="text-right">Balance</span>
                    </div>
                    {schedule.map((row) => (
                        <div key={row.month} className="grid grid-cols-5 text-xs p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors items-center">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                <span className="text-[10px] text-slate-400 block mb-0.5">Month {row.month}</span>
                                {format(row.date, 'MMM yyyy')}
                            </span>
                            <span className="text-right font-bold dark:text-white">₹{Math.round(row.emi).toLocaleString()}</span>
                            <span className="text-right text-indigo-600 dark:text-indigo-400">₹{Math.round(row.principal).toLocaleString()}</span>
                            <span className="text-right text-red-500 dark:text-red-400">₹{Math.round(row.interest).toLocaleString()}</span>
                            <span className="text-right font-bold text-slate-500 dark:text-slate-400">₹{Math.round(row.balance).toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AmortizationScheduleModal;
