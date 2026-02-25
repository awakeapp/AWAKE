import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { Plus, Wallet, PieChart, ChevronLeft, ChevronRight, PiggyBank, ArrowDown, TrendingUp, Undo, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, addMonths } from 'date-fns';
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
        restoreTransaction
    } = useFinance();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isBudgetOpen, setIsBudgetOpen] = useState(false);
    const [editTransactionId, setEditTransactionId] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [undoToast, setUndoToast] = useState(null); // { id, message }
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const [showAccounts, setShowAccounts] = useState(false);

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

                    <button 
                        onClick={() => setShowAccounts(!showAccounts)}
                        className={`justify-self-end flex items-center gap-2 px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-[0.2em] transition-all ${showAccounts ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800'}`}
                    >
                        {showAccounts ? 'Close' : 'More'}
                        <Plus className={`w-3.5 h-3.5 transition-transform duration-500 ${showAccounts ? 'rotate-45' : ''}`} />
                    </button>
                </div>

                {/* Total Balance Card (Clickable to reveal accounts) */}
                <motion.div 
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-800 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden"
                >
                    {/* Decorative blobs */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1">{t('finance.total_balance', 'Total Balance')}</p>
                                <h2 className="text-4xl font-black tracking-tight flex items-baseline gap-1">
                                    <span className="text-xl opacity-60">₹</span>
                                    <span dir="ltr">{totalBalance.toLocaleString()}</span>
                                </h2>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsAnalyticsOpen(true); }}
                                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors backdrop-blur-md"
                                >
                                    <PieChart className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10 gap-2">
                            <div className="flex flex-col items-start">
                                <p className="text-[7px] font-black text-indigo-100 uppercase tracking-widest mb-1">{t('finance.income', 'Income')}</p>
                                <p className="font-black text-xs">₹{monthStats.income.toLocaleString()}</p>
                            </div>
                            
                            <div className="flex flex-col items-center flex-1">
                                <div className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-md mb-1.5 flex items-center gap-1.5 border border-white/5">
                                    <div className="w-1 h-1 rounded-full bg-rose-400"></div>
                                    <p className="text-[7px] font-black text-indigo-100 uppercase tracking-widest">{t('finance.expenses', 'Expenses')}</p>
                                </div>
                                <p className="font-black text-lg">₹{monthStats.expense.toLocaleString()}</p>
                            </div>

                            <div className="flex flex-col items-end">
                                <p className="text-[7px] font-black text-indigo-100 uppercase tracking-widest mb-1">Recurring</p>
                                <p className="font-black text-xs">₹{recurringTotal.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </header>

            <div className="px-6 flex-1 flex flex-col space-y-6">
                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => navigate('/finance/debts')}
                        className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                        <Undo className="w-4 h-4 text-indigo-500" />
                        Debt Manager
                    </button>
                    <button 
                        onClick={() => setIsBudgetOpen(true)}
                        className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        {t('finance.budgets', 'Budgets')}
                    </button>
                </div>

                <section>
                    <UpcomingPayments />
                </section>

                {/* Toggleable Accounts Grid */}
                <AnimatePresence>
                    {showAccounts && (
                        <motion.section
                            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-3 gap-2 p-1">
                                {activeAccounts.map(acc => (
                                    <motion.div
                                        key={acc.id}
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        onClick={() => navigate(`/finance/account/${acc.id}`)}
                                        className="bg-white dark:bg-slate-900 p-3.5 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer active:scale-95 transition-all flex flex-col items-center justify-center text-center hover:border-indigo-500/30"
                                    >
                                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1.5 truncate max-w-full">{acc.name}</p>
                                        <p className="font-black text-slate-900 dark:text-white text-xs truncate w-full">₹{acc.balance.toLocaleString()}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

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
                                                <p className="font-bold text-slate-900 dark:text-white text-[15px] truncate">{tx.note || cat?.name || 'Transfer'}</p>
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

export default FinanceDashboard;
