import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CreditCard, Calendar, TrendingDown, AlertCircle, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useTheme } from '../../context/ThemeContext';
import { FirestoreService } from '../../services/firestore-service';
import { format, differenceInDays, isBefore } from 'date-fns';

const FinanceEMI = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    useThemeColor(isDark ? '#000000' : '#F2F2F7');

    const { user } = useAuthContext();
    const { accounts } = useFinance();

    const [loans, setLoans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load loans from vehicle module (shared store)
    useEffect(() => {
        if (!user?.uid) return;
        setIsLoading(true);

        const unsub = FirestoreService.subscribeToCollection(
            `users/${user.uid}/vehicleLoans`,
            (data) => {
                setLoans(data || []);
                setIsLoading(false);
            }
        );

        return () => unsub();
    }, [user?.uid]);

    const summary = useMemo(() => {
        let totalEMI = 0;
        let totalOutstanding = 0;
        let overdueCount = 0;
        const now = new Date();

        for (const loan of loans) {
            totalEMI += Number(loan.emiAmount || 0);
            totalOutstanding += Number(loan.remainingPrincipal || 0);
            if (loan.nextDueDate && isBefore(new Date(loan.nextDueDate), now)) {
                overdueCount++;
            }
        }

        return { totalEMI, totalOutstanding, overdueCount, totalLoans: loans.length };
    }, [loans]);

    const getLoanStatus = (loan) => {
        if (Number(loan.remainingPrincipal) <= 0) return { label: 'Cleared', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
        if (loan.nextDueDate && isBefore(new Date(loan.nextDueDate), new Date())) return { label: 'Overdue', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' };
        return { label: 'Active', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' };
    };

    const getDaysInfo = (loan) => {
        if (!loan.nextDueDate) return '';
        const days = differenceInDays(new Date(loan.nextDueDate), new Date());
        if (days < 0) return `${Math.abs(days)}d overdue`;
        if (days === 0) return 'Due today';
        return `${days}d left`;
    };

    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-black text-black dark:text-white font-sans pb-12">
            {/* Fixed Header */}
            <div 
                className="fixed top-0 left-0 right-0 z-40 bg-[#F2F2F7]/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10"
                style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
                <div className="max-w-screen-md mx-auto px-4 pt-4 pb-5 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight">EMI Manager</h1>
                </div>
            </div>

            <div 
                className="max-w-screen-md mx-auto px-4"
                style={{ paddingTop: 'calc(76px + env(safe-area-inset-top))' }}
            >
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 border border-slate-200 dark:border-[#2C2C2E]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly EMI</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">₹{summary.totalEMI.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 border border-slate-200 dark:border-[#2C2C2E]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding</p>
                        <p className="text-2xl font-black text-rose-500">₹{summary.totalOutstanding.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 border border-slate-200 dark:border-[#2C2C2E]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Loans</p>
                        <p className="text-2xl font-black text-indigo-500">{summary.totalLoans}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 border border-slate-200 dark:border-[#2C2C2E]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overdue</p>
                        <p className={`text-2xl font-black ${summary.overdueCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {summary.overdueCount > 0 ? summary.overdueCount : '✓'}
                        </p>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[13px] font-bold text-indigo-900 dark:text-indigo-300">Synced with Vehicle Module</p>
                        <p className="text-[12px] text-indigo-700/70 dark:text-indigo-400/60 mt-0.5">
                            EMI data is automatically synced from your Vehicle loans. Any changes made in Vehicle → Loans will reflect here instantly.
                        </p>
                    </div>
                </div>

                {/* Loans List */}
                <div className="mb-4">
                    <p className="text-[13px] font-semibold text-slate-500 dark:text-[#8E8E93] uppercase tracking-wider px-1 mb-3">Your Loans</p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                ) : loans.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200 dark:border-[#2C2C2E]">
                        <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-900 dark:text-white font-bold mb-1">No EMI Loans Found</p>
                        <p className="text-[13px] text-slate-500 max-w-[240px] mx-auto mb-6">
                            Add a vehicle loan in the Vehicle module to see your EMI details here.
                        </p>
                        <button
                            onClick={() => navigate('/vehicle')}
                            className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-6 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all"
                        >
                            Go to Vehicle Module
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {loans.map(loan => {
                            const status = getLoanStatus(loan);
                            const daysInfo = getDaysInfo(loan);
                            const progress = loan.loanAmount > 0 ? Math.round(((loan.loanAmount - loan.remainingPrincipal) / loan.loanAmount) * 100) : 0;

                            return (
                                <div 
                                    key={loan.id} 
                                    className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border border-slate-200 dark:border-[#2C2C2E] active:scale-[0.98] transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.bg}`}>
                                                <CreditCard className={`w-5 h-5 ${status.color}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">{loan.lender || 'Loan'}</h3>
                                                <p className="text-[12px] text-slate-500 mt-0.5">{loan.vehicleName || 'Vehicle'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${status.bg} ${status.color}`}>
                                                {status.label}
                                            </span>
                                            {daysInfo && (
                                                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-end gap-1">
                                                    <Clock className="w-3 h-3" /> {daysInfo}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">EMI</p>
                                            <p className="text-[15px] font-bold text-slate-900 dark:text-white">₹{Number(loan.emiAmount || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Remaining</p>
                                            <p className="text-[15px] font-bold text-rose-500">₹{Number(loan.remainingPrincipal || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rate</p>
                                            <p className="text-[15px] font-bold text-slate-900 dark:text-white">{loan.interestRate || '—'}%</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex justify-between mb-1.5">
                                            <p className="text-[10px] font-bold text-slate-400">Repayment Progress</p>
                                            <p className="text-[10px] font-black text-indigo-500">{progress}%</p>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <p className="text-center text-[12px] text-slate-400 dark:text-[#8E8E93] mt-8 mb-4 tracking-wide font-medium">
                    Synced from Vehicle Module • Central EMI Store
                </p>
            </div>
        </div>
    );
};

export default FinanceEMI;
