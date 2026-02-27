import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PieChart, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { useScrollLock } from '../../hooks/useScrollLock';

const AnalyticsModal = ({ isOpen, onClose, monthStats, categories, selectedDate }) => {
    const navigate = useNavigate();
    useScrollLock(isOpen);
    const { income, expense, transactions } = monthStats || { income: 0, expense: 0, transactions: [] };

    // Calculate Category Breakdown for Expenses
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    // Group by Category
    const categoryTotals = expenseTransactions.reduce((acc, t) => {
        const catId = t.categoryId || 'uncategorized';
        acc[catId] = (acc[catId] || 0) + Number(t.amount);
        return acc;
    }, {});

    // Sort categories by amount
    const sortedCategories = Object.keys(categoryTotals)
        .map(catId => ({
            id: catId,
            amount: categoryTotals[catId]
        }))
        .sort((a, b) => b.amount - a.amount);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
                        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl pointer-events-auto relative max-h-[90vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom,20px)+1.5rem)] scrollbar-hide"
                    >
                        {/* Drag Handle for Mobile */}
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6 sm:hidden"></div>

                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Analytics</h2>
                                <p className="text-sm text-slate-500 font-medium">{format(selectedDate || new Date(), 'MMMM yyyy')}</p>
                            </div>
                            <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Income vs Expense Bar */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] p-5 mb-8 border border-slate-100 dark:border-slate-800">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Cash Flow</h3>
                            
                            <div className="flex justify-between text-sm mb-2 font-bold">
                                <span className="text-emerald-500">₹{income.toLocaleString()} In</span>
                                <span className="text-rose-500">₹{expense.toLocaleString()} Out</span>
                            </div>

                            {/* Progress Bar representation */}
                            {income + expense > 0 ? (
                                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full flex overflow-hidden">
                                    <div className="bg-emerald-500 h-full" style={{ width: `${(income / (income + expense)) * 100}%` }}></div>
                                    <div className="bg-rose-500 h-full" style={{ width: `${(expense / (income + expense)) * 100}%` }}></div>
                                </div>
                            ) : (
                                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full flex overflow-hidden"></div>
                            )}
                            
                            <p className="text-xs text-slate-500 mt-4 text-center">
                                {income >= expense && income > 0 ? (
                                    <span className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold"><TrendingUp className="w-4 h-4"/> Net Positive</span>
                                ) : expense > income ? (
                                    <span className="flex items-center justify-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold"><TrendingDown className="w-4 h-4"/> Net Negative</span>
                                ) : (
                                    <span className="flex items-center justify-center gap-1.5 text-slate-500 font-bold">No Activity</span>
                                )}
                            </p>
                        </div>

                        {/* Category Breakdown */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Top Expenses</h3>
                            
                            {sortedCategories.length > 0 ? (
                                <div className="space-y-5">
                                    {sortedCategories.map(cat => {
                                        const c = categories?.find(c => c.id === cat.id);
                                        const percent = Math.round((cat.amount / expense) * 100) || 0;
                                        return (
                                            <div key={cat.id}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${c?.color ? c.color + '/10' : 'bg-slate-100 dark:bg-slate-800'} ${c?.color?.replace('bg-', 'text-') || 'text-slate-500'}`}>
                                                            {c?.icon === 'Utensils' && '🍽️'}
                                                            {c?.icon === 'Bus' && '🚌'}
                                                            {c?.icon === 'ShoppingBag' && '🛍️'}
                                                            {c?.icon === 'Zap' && '⚡'}
                                                            {c?.icon === 'IndianRupee' && '₹'}
                                                            {!c?.icon && (c?.name?.[0] || '?')}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{c?.name || 'Uncategorized'}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white"><span dir="ltr">₹{cat.amount.toLocaleString()}</span></p>
                                                        <p className="text-xs font-medium text-slate-500">{percent}%</p>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${c?.color || 'bg-slate-400'}`} style={{ width: `${percent}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
                                    <PieChart className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-slate-500">No expenses this month</p>
                                </div>
                            )}
                        </div>

                        {/* Full Report Link */}
                        <div className="mt-10">
                            <button 
                                onClick={() => {
                                    onClose();
                                    navigate('/analytics');
                                }}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                            >
                                Detailed Analytics Report
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AnalyticsModal;
