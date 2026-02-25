import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { Plus, Wallet, PieChart, ChevronLeft, ChevronRight, PiggyBank, ArrowDown, TrendingUp, Undo, X, Menu, Clock, BookOpen, CreditCard, Settings, MoreHorizontal } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, addMonths, isBefore } from 'date-fns';
import { useState, useMemo } from 'react';
import AddTransactionModal from './AddTransactionModal';
import UpcomingPayments from './UpcomingPayments';
import BudgetSummary from './BudgetSummary';
import AnalyticsModal from './AnalyticsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { useAuthContext } from '../../hooks/useAuthContext';

const FinanceDashboard = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const { timeFormat } = useSettings();
    const { user } = useAuthContext();
    useThemeColor(isDark ? '#0f172a' : '#0f172a'); 
    const { t } = useTranslation(); 
    const {
        getTotalBalance,
        categories,
        transactions,
        accounts,
        subscriptions,
        deleteTransaction,
        restoreTransaction,
        debtParties,
        debtTransactions,
        getPartyBalance,
        getEntrySettledAmount,
        getPendingEntries
    } = useFinance();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isBudgetOpen, setIsBudgetOpen] = useState(false);
    const [editTransactionId, setEditTransactionId] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [undoToast, setUndoToast] = useState(null); // { id, message }
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

    const monthStats = useMemo(() => {
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);

        const monthlyTx = transactions.filter(t =>
            !t.isDeleted && isWithinInterval(new Date(t.date || t.createdAt), { start, end })
        );

        const income = monthlyTx
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const expense = monthlyTx
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const savings = income - expense;
        const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

        return {
            transactions: monthlyTx,
            income,
            expense,
            savings,
            savingsRate
        };
    }, [selectedDate, transactions]);

    const changeMonth = (offset) => {
        setSelectedDate(prev => offset > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
    };

    const handleDelete = (e, id) => {
        e.stopPropagation(); 
        deleteTransaction(id);
        setUndoToast({ id, message: 'Transaction deleted.' });
        setTimeout(() => setUndoToast(null), 4000);
    };

    const handleUndo = () => {
        if (undoToast) {
            restoreTransaction(undoToast.id);
            setUndoToast(null);
        }
    };

    const handleEdit = (id) => {
        setEditTransactionId(id);
        setIsAddOpen(true);
    };

    const totalBalance = getTotalBalance();
    const activeAccounts = accounts.filter(a => !a.isArchived);
    const recurringTotal = useMemo(() => 
        subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + Number(s.amount), 0),
    [subscriptions]);
    const sortedMonthlyTx = [...monthStats.transactions].sort((a, b) =>
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );

    // --- Debt Summary ---
    const debtSummary = useMemo(() => {
        const now = new Date();
        const monthStart = startOfMonth(selectedDate);
        const monthEnd = endOfMonth(selectedDate);
        let totalReceivable = 0;
        let totalPayable = 0;
        let overdueTotal = 0;

        const activeParties = (debtParties || []).filter(p => !p.is_deleted);
        for (const party of activeParties) {
            const bal = getPartyBalance(party.id);
            if (bal > 0) totalReceivable += bal;
            if (bal < 0) totalPayable += Math.abs(bal);

            // Overdue: sum remaining on entries past due
            const pending = getPendingEntries(party.id);
            for (const entry of pending) {
                if (entry.due_date && isBefore(new Date(entry.due_date), now)) {
                    overdueTotal += entry.remaining;
                }
            }
        }

        // This month recovery: sum of you_received + you_repaid in selected month
        const monthRecovery = (debtTransactions || [])
            .filter(t => !t.is_deleted && (t.type === 'you_received' || t.type === 'you_repaid'))
            .filter(t => {
                const d = new Date(t.date);
                return isWithinInterval(d, { start: monthStart, end: monthEnd });
            })
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const netPosition = totalReceivable - totalPayable;

        return { totalReceivable, totalPayable, netPosition, overdueTotal, monthRecovery };
    }, [debtParties, debtTransactions, selectedDate, getPartyBalance, getPendingEntries]);

    return (
        <div 
            className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 6rem)' }}
        >
            {/* Header Area */}
            <header className="px-6 pt-6 pb-4">
                <div className="grid grid-cols-3 items-center mb-6">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Finance</h1>
                    
                    <div className="flex items-center justify-self-center gap-1 bg-white dark:bg-slate-900 rounded-full p-1 shadow-sm border border-slate-100 dark:border-slate-800">
                        <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-widest min-w-[70px] text-center text-slate-700 dark:text-slate-200">
                            {format(selectedDate, 'MMM yyyy')}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                    </div>

                    <div className="relative justify-self-end">
                        <button 
                            onClick={() => setShowAccounts(!showAccounts)}
                            className={`p-2 rounded-xl transition-all ${showAccounts ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500'}`}
                        >
                            {showAccounts ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                        <AnimatePresence>
                            {showAccounts && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowAccounts(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                        className="absolute top-12 right-0 w-48 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-50 flex flex-col gap-1 overflow-hidden"
                                    >
                                        <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-800 mb-1">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Your Wallets</p>
                                        </div>
                                        {activeAccounts.map(acc => (
                                            <div
                                                key={acc.id}
                                                onClick={() => { navigate(`/finance/account/${acc.id}`); setShowAccounts(false); }}
                                                className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl cursor-pointer flex flex-col transition-colors active:scale-[0.98]"
                                            >
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{acc.name}</p>
                                                <p className="font-black text-slate-900 dark:text-white text-sm mt-0.5">₹{acc.balance.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                </div>

                {/* Total Balance Card (Clickable to reveal accounts) */}
                <motion.div 
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden"
                >
                    {/* Decorative blobs */}
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-10">
                            <div className="space-y-1">
                                <p className="text-indigo-100/70 text-[11px] font-black uppercase tracking-[0.2em]">{t('finance.total_balance', 'Total Balance')}</p>
                                <h2 className="text-[44px] font-black tracking-tightest leading-tight flex items-baseline gap-1.5">
                                    <span className="text-2xl opacity-40 font-bold">₹</span>
                                    <span dir="ltr">{totalBalance.toLocaleString()}</span>
                                </h2>
                            </div>
                            <div className="shrink-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate('/finance/debts'); }}
                                    className="w-[92px] h-[108px] bg-white/10 hover:bg-white/20 backdrop-blur-3xl border border-white/20 rounded-[2rem] flex flex-col items-center justify-center gap-3 shadow-2xl shadow-black/20 active:scale-95 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                                        <BookOpen className="w-6 h-6 text-white" strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col items-center space-y-0.5">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Debt</span>
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Ledger</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="w-full h-px bg-white/10 mb-8" />

                        <div className="flex items-end justify-between gap-4">
                            <div className="flex flex-col">
                                <p className="text-[8px] font-black text-indigo-100/60 uppercase tracking-widest mb-1.5">{t('finance.income', 'Income')}</p>
                                <p className="font-extrabold text-sm tracking-tight text-white/90">₹{monthStats.income.toLocaleString()}</p>
                            </div>
                            
                            <div className="flex flex-col items-center flex-1">
                                <div className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-md mb-2 flex items-center gap-2 border border-white/5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]"></div>
                                    <p className="text-[8px] font-black text-white uppercase tracking-[0.15em]">{t('finance.expenses', 'Expenses')}</p>
                                </div>
                                <p className="font-black text-2xl tracking-tight">₹{monthStats.expense.toLocaleString()}</p>
                            </div>

                            <div className="flex flex-col items-end">
                                <p className="text-[8px] font-black text-indigo-100/60 uppercase tracking-widest mb-1.5">Recurring</p>
                                <p className="font-extrabold text-sm tracking-tight text-white/90">₹{recurringTotal.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </header>

            <div className="px-6 flex-1 flex flex-col space-y-6">
                
                {/* More Options */}
                <button
                    onClick={() => navigate('/finance/more')}
                    className="w-full flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                            <MoreHorizontal className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="text-left">
                            <p className="text-[14px] font-bold text-slate-900 dark:text-white leading-tight">More Options</p>
                            <p className="text-[11px] text-slate-400 font-medium">Wallets, EMI, Analytics, Settings</p>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                </button>

                {/* Debt Summary Blocks */}
                {(debtParties || []).filter(p => !p.is_deleted).length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Debt Overview</p>
                        <div className="grid grid-cols-3 gap-2">
                            <DebtCell label="Receivable" value={`₹${debtSummary.totalReceivable.toLocaleString()}`} color="text-emerald-600 dark:text-emerald-400" />
                            <DebtCell label="Payable" value={`₹${debtSummary.totalPayable.toLocaleString()}`} color="text-red-500 dark:text-red-400" />
                            <DebtCell
                                label="Net Position"
                                value={`${debtSummary.netPosition >= 0 ? '+' : '-'}₹${Math.abs(debtSummary.netPosition).toLocaleString()}`}
                                color={debtSummary.netPosition >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <DebtCell label="Overdue" value={debtSummary.overdueTotal > 0 ? `₹${debtSummary.overdueTotal.toLocaleString()}` : '—'} color={debtSummary.overdueTotal > 0 ? 'text-red-500' : 'text-slate-400'} />
                            <DebtCell label="This Month Recovery" value={`₹${debtSummary.monthRecovery.toLocaleString()}`} color="text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                )}

                <section>
                    <UpcomingPayments />
                </section>



                {/* Transactions List */}
                <section className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">{t('finance.transactions', 'Transactions')}</h3>
                        <button className="text-slate-400 text-sm font-medium hover:text-indigo-500 transition-colors">
                            View all
                        </button>
                    </div>

                    <div className="space-y-3">
                        {sortedMonthlyTx.length === 0 ? (
                            <div className="text-center py-12 px-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <TrendingUp className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-900 dark:text-white font-bold mb-1">{t('finance.no_expenses', 'No expenses yet')}</p>
                                <p className="text-slate-500 text-sm mb-6 max-w-[200px] mx-auto">
                                    {t('finance.start_tracking', 'Start tracking where your money goes.')}
                                </p>
                                <button
                                    onClick={() => {
                                        setEditTransactionId(null);
                                        setIsAddOpen(true);
                                    }}
                                    className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-6 py-2.5 rounded-xl font-bold active:scale-95 transition-all text-sm"
                                >
                                    {t('finance.add_first_record', '+ Add Record')}
                                </button>
                            </div>
                        ) : (
                            sortedMonthlyTx.map(tx => {
                                const cat = categories.find(c => c.id === tx.categoryId);
                                const isIncome = tx.type === 'income';
                                return (
                                    <div
                                        key={tx.id}
                                        onClick={() => handleEdit(tx.id)}
                                        className="relative flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 active:scale-[0.98] transition-all cursor-pointer overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4 relative z-10 w-full">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${cat?.color ? cat.color + '/10' : 'bg-slate-50 dark:bg-slate-800'} ${cat?.color?.replace('bg-', 'text-') || 'text-slate-500'}`}>
                                                {cat?.icon === 'Utensils' && '🍽️'}
                                                {cat?.icon === 'Bus' && '🚌'}
                                                {cat?.icon === 'ShoppingBag' && '🛍️'}
                                                {cat?.icon === 'Zap' && '⚡'}
                                                {cat?.icon === 'IndianRupee' && '₹'}
                                                {!cat?.icon && (cat?.name?.[0] || '?')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 dark:text-white text-[15px] truncate">{tx.description || tx.note || cat?.name || 'Transaction'}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{format(new Date(tx.date || tx.createdAt), timeFormat === '24h' ? 'dd MMM, HH:mm' : 'dd MMM, h:mm a')} • {accounts.find(a => a.id === tx.accountId)?.name || 'Account'}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`text-[16px] font-bold ${isIncome ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                                    {isIncome ? '+' : '-'}<span dir="ltr">₹{Number(tx.amount).toLocaleString()}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-24 right-6 z-40">
                <button
                    onClick={() => {
                        setEditTransactionId(null);
                        setIsAddOpen(true);
                    }}
                    className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-600/30 flex items-center justify-center active:scale-95 transition-transform"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>

            {isAddOpen && (
                <AddTransactionModal
                    isOpen={true}
                    onClose={() => setIsAddOpen(false)}
                    editTransactionId={editTransactionId}
                    onDelete={(id) => {
                        deleteTransaction(id);
                        setUndoToast({ id, message: 'Transaction deleted.' });
                        setTimeout(() => setUndoToast(null), 4000);
                    }}
                />
            )}

            <BudgetSummary isOpen={isBudgetOpen} onClose={() => setIsBudgetOpen(false)} />

            <AnimatePresence>
                {undoToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 text-sm font-medium border border-white/10"
                    >
                        <span>{undoToast.message}</span>
                        <button
                            onClick={handleUndo}
                            className="text-indigo-400 hover:text-indigo-300 font-bold uppercase text-xs"
                        >
                            {t('finance.undo', 'Undo')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnalyticsModal
                isOpen={isAnalyticsOpen}
                onClose={() => setIsAnalyticsOpen(false)}
                monthStats={monthStats}
                categories={categories}
                selectedDate={selectedDate}
            />
        </div>
    );
};

// --- Summary Cell Component ---
const DebtCell = ({ label, value, color }) => (
    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-sm">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-tight">{label}</p>
        <p className={`text-sm font-black tracking-tight ${color}`}>{value}</p>
    </div>
);

export default FinanceDashboard;
