import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { Plus, Wallet, PieChart, ChevronLeft, ChevronRight, PiggyBank, ArrowDown, TrendingUp, Undo, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, addMonths } from 'date-fns';
import { useState, useMemo } from 'react';
import AddTransactionModal from './AddTransactionModal';
import UpcomingPayments from './UpcomingPayments';
import BudgetSummary from './BudgetSummary';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useTheme } from '../../context/ThemeContext';

const FinanceDashboard = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    // Lock status bar to Finance header colour while this page is mounted
    useThemeColor(isDark ? '#0f172a' : '#0f172a'); // slate-900 in both modes
    const { t } = useTranslation(); // Enable translations
    const {
        getTotalBalance,
        categories,
        transactions,
        accounts,
        deleteTransaction,
        restoreTransaction
    } = useFinance();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isBudgetOpen, setIsBudgetOpen] = useState(false);
    const [editTransactionId, setEditTransactionId] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [undoToast, setUndoToast] = useState(null); // { id, message }

    // --- Dynamic Calculations based on Selected Month ---
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
        e.stopPropagation(); // Prevent opening edit modal
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

    // Sort transactions by date (newest first)
    const sortedMonthlyTx = [...monthStats.transactions].sort((a, b) =>
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* Status-bar colour strip — fills env(safe-area-inset-top) flush with header bg */}
            <div
                className="fixed top-0 inset-x-0 z-50 bg-slate-900"
                style={{ height: 'env(safe-area-inset-top, 0px)' }}
            />

            {/* Header / Month Context */}
            <header
                className="bg-slate-900 text-white px-6 pb-8 rounded-b-[2.5rem] shadow-2xl shadow-slate-900/20 relative overflow-hidden"
                style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}
            >
                {/* Background Decor */}
                {/* Background Decor - Simplified */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        {/* Month Selector */}
                        <div className="flex items-center gap-3 bg-white/10 rounded-full px-1 p-1">
                            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                <ChevronLeft className="w-4 h-4 text-slate-300" />
                            </button>
                            <span className="text-sm font-bold min-w-[80px] text-center">
                                {format(selectedDate, 'MMM yyyy')}
                            </span>
                            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                <ChevronRight className="w-4 h-4 text-slate-300" />
                            </button>
                        </div>

                        <button
                            onClick={() => navigate('/finance/analytics')}
                            className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                        >
                            <PieChart className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    <div className="text-center mb-8">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{t('finance.total_net_balance', 'Total Net Balance')}</p>
                        <h2 className="text-4xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            <span dir="ltr">₹{totalBalance.toLocaleString()}</span>
                        </h2>
                    </div>

                    {/* Monthly Summary Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* Income */}
                        <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                                <ArrowDown className="w-4 h-4 text-emerald-400" />
                            </div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{t('finance.income', 'Income')}</p>
                            <p className="font-bold text-white text-sm"><span dir="ltr">₹{monthStats.income.toLocaleString()}</span></p>
                        </div>

                        {/* Savings (New) */}
                        <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/5 relative overflow-hidden">
                            {/* Indicator */}
                            {monthStats.savingsRate > 0 && (
                                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                                    {monthStats.savingsRate}%
                                </div>
                            )}
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mb-2">
                                <PiggyBank className="w-4 h-4 text-indigo-400" />
                            </div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{t('finance.savings', 'Savings')}</p>
                            <p className={`font-bold text-sm ${monthStats.savings >= 0 ? 'text-indigo-300' : 'text-red-400'}`}>
                                {monthStats.savings >= 0 ? '+' : ''}<span dir="ltr">₹{Math.abs(monthStats.savings).toLocaleString()}</span>
                            </p>
                        </div>

                        {/* Debts (Global) */}
                        <button
                            onClick={() => navigate('/finance/debts')}
                            className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors text-left"
                        >
                            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center mb-2">
                                <Wallet className="w-4 h-4 text-rose-400" />
                            </div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{t('finance.debts', 'Debts')}</p>
                            <p className="font-bold text-rose-300 text-xs">{t('finance.manage', 'Manage →')}</p>
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-4 py-6 space-y-8 -mt-4 relative z-10">

                {/* Accounts Strip */}
                <section className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide scroll-smooth-x">
                    <div className="flex gap-3 w-max">
                        {/* Budget Button */}
                        <div
                            onClick={() => setIsBudgetOpen(true)}
                            className="min-w-[140px] bg-indigo-500 p-4 rounded-2xl shadow-lg shadow-indigo-500/20 cursor-pointer active:opacity-80 transition-opacity flex flex-col justify-between text-white"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-2">
                                <PieChart className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider mb-1">{t('finance.overview', 'Overview')}</p>
                                <p className="text-lg font-bold">{t('finance.budgets', 'Budgets')}</p>
                            </div>
                        </div>

                        {accounts.filter(a => !a.isArchived).map(acc => (
                            <div
                                key={acc.id}
                                onClick={() => navigate(`/finance/account/${acc.id}`)}
                                className="min-w-[140px] bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 cursor-pointer active:opacity-80 transition-opacity"
                            >
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">{acc.name}</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white"><span dir="ltr">₹{acc.balance.toLocaleString()}</span></p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Upcoming Payments */}
                <section>
                    <UpcomingPayments />
                </section>

                {/* Monthly Transactions */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{t('finance.transactions', 'Transactions')}</h3>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold px-2 py-1 rounded-full">
                                {format(selectedDate, 'MMM')}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {sortedMonthlyTx.length === 0 ? (
                            <div className="text-center py-12 px-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <TrendingUp className="w-8 h-8" />
                                </div>
                                <p className="text-slate-900 dark:text-white font-bold text-lg mb-2">{t('finance.no_expenses', 'No expenses yet')}</p>
                                <p className="text-slate-500 text-sm mb-6 max-w-[240px] mx-auto leading-relaxed">
                                    {t('finance.start_tracking', 'Start tracking where your money goes. Record purchases, bills, or any income.')}
                                </p>
                                <button
                                    onClick={() => {
                                        setEditTransactionId(null);
                                        setIsAddOpen(true);
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-indigo-500/20"
                                >
                                    {t('finance.add_first_record', '+ Add First Record')}
                                </button>
                            </div>
                        ) : (
                            sortedMonthlyTx.map(tx => {
                                const cat = categories.find(c => c.id === tx.categoryId);
                                return (
                                    <div
                                        key={tx.id}
                                        onClick={() => handleEdit(tx.id)}
                                        className="group relative flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${cat?.color ? cat.color + '/20' : 'bg-slate-100'} ${cat?.color?.replace('bg-', 'text-') || 'text-slate-500'}`}>
                                                {cat?.icon === 'Utensils' && '🍽️'}
                                                {cat?.icon === 'Bus' && '🚌'}
                                                {cat?.icon === 'ShoppingBag' && '🛍️'}
                                                {cat?.icon === 'Zap' && '⚡'}
                                                {cat?.icon === 'IndianRupee' && '₹'}
                                                {!cat?.icon && (cat?.name?.[0] || '?')}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{tx.note || cat?.name}</p>
                                                <p className="text-xs text-slate-400">{format(new Date(tx.date || tx.createdAt), 'MMM d, h:mm a')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right relative z-10">
                                            <p className={`font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                                {tx.type === 'income' ? '+' : '-'}<span dir="ltr">₹{Number(tx.amount).toLocaleString()}</span>
                                            </p>
                                            <p className="text-[10px] text-slate-300 font-medium uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                                                {accounts.find(a => a.id === tx.accountId)?.name}
                                            </p>
                                        </div>

                                        {/* Delete Button (Hover) */}
                                        <button
                                            onClick={(e) => handleDelete(e, tx.id)}
                                            className="absolute right-0 top-0 bottom-0 w-16 bg-red-500 text-white flex items-center justify-center translate-x-full group-hover:translate-x-0 transition-transform duration-300 pointer-events-auto hover:bg-red-600 z-50 shadow-[-4px_0_8px_rgba(0,0,0,0.1)]"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>

            {/* Quick Add FAB */}
            <button
                onClick={() => {
                    setEditTransactionId(null);
                    setIsAddOpen(true);
                }}
                className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-600/30 flex items-center justify-center hover:scale-105 transition-transform active:scale-95 z-40"
            >
                <Plus className="w-6 h-6" />
            </button>

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

            {/* Undo Toast */}
            <AnimatePresence>
                {undoToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4"
                    >
                        <span className="text-sm font-medium">{undoToast.message}</span>
                        <button
                            onClick={handleUndo}
                            className="text-indigo-300 hover:text-white text-sm font-bold flex items-center gap-1"
                        >
                            <Undo className="w-4 h-4" />
                            {t('finance.undo', 'Undo')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FinanceDashboard;
