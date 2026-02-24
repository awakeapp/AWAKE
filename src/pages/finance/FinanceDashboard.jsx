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
import { useSettings } from '../../context/SettingsContext';

const FinanceDashboard = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const { timeFormat } = useSettings();
    useThemeColor(isDark ? '#0f172a' : '#0f172a'); 
    const { t } = useTranslation(); 
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
    const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);

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
    const sortedMonthlyTx = [...monthStats.transactions].sort((a, b) =>
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            <div
                className="fixed top-0 inset-x-0 z-50 bg-slate-900"
                style={{ height: 'env(safe-area-inset-top, 0px)' }}
            />

            <header className="bg-slate-900 text-white px-6 pb-12 pt-8">
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
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
                            onClick={() => setIsComingSoonOpen(true)}
                            className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                        >
                            <PieChart className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    <div className="text-center mb-10">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{t('finance.total_net_balance', 'Total Net Balance')}</p>
                        <h2 className="text-4xl font-bold tracking-tight text-white">
                            <span dir="ltr">₹{totalBalance.toLocaleString()}</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                                <ArrowDown className="w-4 h-4 text-emerald-400" />
                            </div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">{t('finance.income', 'Income')}</p>
                            <p className="font-bold text-white text-[15px]"><span dir="ltr">₹{monthStats.income.toLocaleString()}</span></p>
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-3">
                                <PiggyBank className="w-4 h-4 text-indigo-400" />
                            </div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">{t('finance.savings', 'Savings')}</p>
                            <p className={`font-bold text-[15px] ${monthStats.savings >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                                {monthStats.savings >= 0 ? '+' : ''}<span dir="ltr">₹{Math.abs(monthStats.savings).toLocaleString()}</span>
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/finance/debts')}
                            className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 hover:bg-slate-800 transition-colors text-left"
                        >
                            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center mb-3">
                                <Wallet className="w-4 h-4 text-rose-400" />
                            </div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">{t('finance.debts', 'Debts')}</p>
                            <p className="font-bold text-rose-400 text-[13px]">{t('finance.manage', 'Manage')}</p>
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-4 py-6 space-y-8 -mt-6 rounded-t-[2.5rem] bg-slate-50 dark:bg-slate-950 relative z-10 transition-colors">
                <section className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide scroll-smooth-x">
                    <div className="flex gap-3 w-max">
                        <div
                            onClick={() => setIsBudgetOpen(true)}
                            className="min-w-[140px] bg-indigo-600 p-5 rounded-2xl shadow-lg shadow-indigo-500/20 cursor-pointer transition-all active:scale-95 flex flex-col justify-between text-white"
                        >
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                                <PieChart className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mb-1">{t('finance.overview', 'Overview')}</p>
                                <p className="text-lg font-bold">{t('finance.budgets', 'Budgets')}</p>
                            </div>
                        </div>

                        {accounts.filter(a => !a.isArchived).map(acc => (
                            <div
                                key={acc.id}
                                onClick={() => navigate(`/finance/account/${acc.id}`)}
                                className="min-w-[160px] bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer transition-all active:scale-95"
                            >
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 leading-none">{acc.name}</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white"><span dir="ltr">₹{acc.balance.toLocaleString()}</span></p>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <UpcomingPayments />
                </section>

                <section>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{t('finance.transactions', 'Transactions')}</h3>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg">
                                {format(selectedDate, 'MMM')}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {sortedMonthlyTx.length === 0 ? (
                            <div className="text-center py-16 px-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                    <TrendingUp className="w-10 h-10" />
                                </div>
                                <p className="text-slate-900 dark:text-white font-bold text-xl mb-2">{t('finance.no_expenses', 'No expenses yet')}</p>
                                <p className="text-slate-500 text-sm mb-8 max-w-[240px] mx-auto leading-relaxed">
                                    {t('finance.start_tracking', 'Start tracking where your money goes. Record purchases, bills, or any income.')}
                                </p>
                                <button
                                    onClick={() => {
                                        setEditTransactionId(null);
                                        setIsAddOpen(true);
                                    }}
                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all"
                                >
                                    {t('finance.add_first_record', '+ Add Record')}
                                </button>
                            </div>
                        ) : (
                            sortedMonthlyTx.map(tx => {
                                const cat = categories.find(c => c.id === tx.categoryId);
                                return (
                                    <div
                                        key={tx.id}
                                        onClick={() => handleEdit(tx.id)}
                                        className="group relative flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all cursor-pointer overflow-hidden shadow-sm"
                                    >
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${cat?.color ? cat.color + '/20' : 'bg-slate-100'} ${cat?.color?.replace('bg-', 'text-') || 'text-slate-500'}`}>
                                                {cat?.icon === 'Utensils' && '🍽️'}
                                                {cat?.icon === 'Bus' && '🚌'}
                                                {cat?.icon === 'ShoppingBag' && '🛍️'}
                                                {cat?.icon === 'Zap' && '⚡'}
                                                {cat?.icon === 'IndianRupee' && '₹'}
                                                {!cat?.icon && (cat?.name?.[0] || '?')}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-[15px]">{tx.note || cat?.name}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{format(new Date(tx.date || tx.createdAt), timeFormat === '24h' ? 'MMM d, HH:mm' : 'MMM d, h:mm a')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right relative z-10">
                                            <p className={`text-[17px] font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                                {tx.type === 'income' ? '+' : '-'}<span dir="ltr">₹{Number(tx.amount).toLocaleString()}</span>
                                            </p>
                                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                {accounts.find(a => a.id === tx.accountId)?.name}
                                            </p>
                                        </div>

                                        <button
                                            onClick={(e) => handleDelete(e, tx.id)}
                                            className="absolute right-0 top-0 bottom-0 w-16 bg-rose-500 text-white flex items-center justify-center translate-x-full group-hover:translate-x-0 transition-transform duration-300 z-50 shadow-[-10px_0_20px_rgba(0,0,0,0.1)]"
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

            <button
                onClick={() => {
                    setEditTransactionId(null);
                    setIsAddOpen(true);
                }}
                className="fixed bottom-8 right-8 w-16 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-40"
            >
                <Plus className="w-8 h-8" />
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

            <AnimatePresence>
                {undoToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/10"
                    >
                        <span className="text-sm font-bold">{undoToast.message}</span>
                        <button
                            onClick={handleUndo}
                            className="text-indigo-400 hover:text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"
                        >
                            <Undo className="w-4 h-4" />
                            {t('finance.undo', 'Undo')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isComingSoonOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsComingSoonOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl border border-slate-100 dark:border-slate-800"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
                                <TrendingUp className="w-10 h-10 text-indigo-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Analytics</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed text-sm">
                                Deep financial insights and spending trends are coming soon to your dashboard.
                            </p>
                            <button
                                onClick={() => setIsComingSoonOpen(false)}
                                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-lg active:scale-95 transition-all uppercase text-xs tracking-widest"
                            >
                                Stay Tuned
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FinanceDashboard;
