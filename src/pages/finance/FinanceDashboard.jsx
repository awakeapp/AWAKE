import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import * as LucideIcons from 'lucide-react';
import { Plus, ChevronLeft, ChevronRight, TrendingUp, PieChart, MoreHorizontal } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, addMonths } from 'date-fns';
import { useState, useMemo } from 'react';
import AddTransactionModal from './AddTransactionModal';
import BudgetSummary from './BudgetSummary';
import AnalyticsModal from './AnalyticsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { useAuthContext } from '../../hooks/useAuthContext';
import FinanceBottomNav from '../../components/finance/FinanceBottomNav';
import { useToast } from '../../context/ToastContext';
import PageLayout from '../../components/layout/PageLayout';

const FinanceDashboard = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const { timeFormat } = useSettings();
    const { user } = useAuthContext();
    useThemeColor(isDark ? '#0f172a' : '#f8fafc');
    const { t } = useTranslation(); 
    const {
        getTotalBalance,
        categories,
        transactions,
        accounts,
        subscriptions,
        deleteTransaction,
        restoreTransaction,
    } = useFinance();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [addType, setAddType] = useState('expense');
    const [isBudgetOpen, setIsBudgetOpen] = useState(false);
    const [editTransactionId, setEditTransactionId] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [undoToast, setUndoToast] = useState(null); // { id, message }
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const { showToast } = useToast();

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

        const savings = monthlyTx
            .filter(t => t.type === 'savings')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const netBalance = income - expense;
        const availableBalance = netBalance - savings;
        
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
        showToast('Transaction deleted', 'info');
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
        <PageLayout
            bottomNav={<FinanceBottomNav />}
            renderFloating={
                <>
                    <div className="fixed right-6 z-40" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)' }}>
                        <button
                            onClick={() => {
                                setEditTransactionId(null);
                                setAddType('expense');
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
                            initialType={addType}
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
                                className="fixed left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 text-sm font-medium border border-white/10"
                                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)' }}
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
                </>
            }
            title={t('finance.title', 'Finance')}
            rightNode={
                <div className="flex items-center">
                    <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors shadow-sm">
                            <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-widest min-w-[70px] text-center text-slate-700 dark:text-slate-200">
                            {format(selectedDate, 'MMM yy')}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors shadow-sm">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col space-y-6">
                    
                    {/* Total Balance Card (Reduced Height & Vertical Padding) */}
                    <motion.div 
                        whileTap={{ scale: 0.98 }}
                        className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-800 rounded-[2.5rem] p-6 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden"
                    >
                        {/* Decorative blobs */}
                        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>
                        
                        <div className="relative z-10">
                            <div className="mb-4 w-full flex flex-col items-center">
                                <div className="space-y-1 flex flex-col items-center">
                                    <p className="text-indigo-100/70 text-[10px] font-black uppercase tracking-[0.2em]">{t('finance.total_balance', 'Total Balance')}</p>
                                    <h2 className="text-[44px] sm:text-[48px] font-black tracking-tightest leading-tight flex items-center justify-center gap-1.5">
                                        <span className="text-2xl opacity-40 font-bold">₹</span>
                                        <span dir="ltr">{totalBalance.toLocaleString()}</span>
                                    </h2>
                                </div>
                            </div>

                            <div className="w-full h-px bg-white/10 mb-5" />

                            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 w-full mb-5 max-w-[90%] mx-auto">
                                <div className="flex items-center gap-1.5 font-bold text-[10px] min-[380px]:text-[11px] tracking-tight">
                                    <span className="text-emerald-300 uppercase tracking-wider">Income</span>
                                    <span className="text-white">₹{monthStats.income.toLocaleString()}</span>
                                </div>
                                <span className="text-white/20 select-none text-[10px] hidden min-[360px]:block">|</span>
                                <div className="flex items-center gap-1.5 font-bold text-[10px] min-[380px]:text-[11px] tracking-tight">
                                    <span className="text-rose-300 uppercase tracking-wider">Expense</span>
                                    <span className="text-white">₹{monthStats.expense.toLocaleString()}</span>
                                </div>
                                <span className="text-white/20 select-none text-[10px] hidden min-[360px]:block">|</span>
                                <div className="flex items-center gap-1.5 font-bold text-[10px] min-[380px]:text-[11px] tracking-tight">
                                    <span className="text-slate-300 uppercase tracking-wider">Recurring</span>
                                    <span className="text-white">₹{recurringTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex justify-center w-full">
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setEditTransactionId(null); 
                                        setAddType('savings'); 
                                        setIsAddOpen(true); 
                                    }} 
                                    className="px-5 py-2 rounded-full border border-white/20 bg-transparent hover:bg-white/10 active:scale-95 transition-all text-[10px] font-black tracking-widest uppercase text-white flex items-center gap-2 shadow-sm"
                                >
                                    <span>Savings</span>
                                    <div className="w-1 h-1 rounded-full bg-white/30" />
                                    <span className="text-teal-300 tracking-tight">₹{monthStats.savings.toLocaleString()}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>


                {/* Quick Actions — Analytics & Budget */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setIsAnalyticsOpen(true)}
                        className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 active:scale-[0.97] transition-all shadow-sm"
                    >
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                            <PieChart className="w-[18px] h-[18px] text-emerald-500" strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                            <p className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">Analytics</p>
                            <p className="text-[10px] text-slate-400 font-medium">Spending insights</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setIsBudgetOpen(true)}
                        className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 active:scale-[0.97] transition-all shadow-sm"
                    >
                        <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-[18px] h-[18px] text-rose-500" strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                            <p className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">Budget</p>
                            <p className="text-[10px] text-slate-400 font-medium">Category limits</p>
                        </div>
                    </button>
                </div>

                {/* Transactions List */}
                <section className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">{t('finance.transactions', 'Transactions')}</h3>
                        <button 
                            onClick={() => navigate('/finance/monthly')}
                            className="text-slate-400 text-sm font-medium hover:text-indigo-500 transition-colors"
                        >
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
                                        setAddType('expense');
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
                                                {(() => {
                                                    let iconName = cat?.icon;
                                                    if (!iconName) {
                                                        if (cat?.name === 'Food & Dining') iconName = 'Utensils';
                                                        else if (cat?.name === 'Transport') iconName = 'Bus';
                                                        else if (cat?.name === 'Shopping') iconName = 'ShoppingBag';
                                                        else if (cat?.name === 'Bills & Utilities') iconName = 'Zap';
                                                        else if (cat?.name === 'Salary') iconName = 'IndianRupee';
                                                        else if (cat?.name === 'Savings Allocation') iconName = 'Wallet';
                                                        else iconName = 'HelpCircle';
                                                    }
                                                    const IconComponent = LucideIcons[iconName];
                                                    if (IconComponent) return <IconComponent className="w-5 h-5 opacity-90" />;
                                                    return cat?.name?.[0] || '?';
                                                })()}
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
        </PageLayout>
    );
};



export default FinanceDashboard;
