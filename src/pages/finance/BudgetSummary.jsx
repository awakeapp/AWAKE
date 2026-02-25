import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, PieChart, Edit3, Settings2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '../../hooks/useScrollLock';

const BudgetSummary = ({ isOpen, onClose }) => {
    const { categories, getBudgetStats, updateCategoryBudget } = useFinance();
    const [isAllocating, setIsAllocating] = useState(false);
    const [editingBudgets, setEditingBudgets] = useState({}); // catId -> amount

    useScrollLock(isOpen);

    if (!isOpen) return null;

    const expenseCategories = categories
        .filter(c => c.type === 'expense')
        .map(c => ({ ...c, stats: getBudgetStats(c.id) }))
        .sort((a, b) => (b.stats?.percent || 0) - (a.stats?.percent || 0));

    const handleStartAllocation = () => {
        const initial = {};
        expenseCategories.forEach(c => {
            initial[c.id] = c.budget || 0;
        });
        setEditingBudgets(initial);
        setIsAllocating(true);
    };

    const handleSaveBudgets = async () => {
        for (const catId in editingBudgets) {
            await updateCategoryBudget(catId, Number(editingBudgets[catId]));
        }
        setIsAllocating(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                onClick={onClose}
            />

            <motion.div 
                initial={{ y: '100%', opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 pointer-events-auto"
            >
                {/* Drag Handle for Mobile */}
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6 sm:hidden shrink-0"></div>

                <div className="flex justify-between items-center mb-8 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
                            <PieChart className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Budgets</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isAllocating ? 'Configure Limits' : 'Monthly Summary'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500 hover:rotate-90 transition-transform">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 space-y-4 pr-1 scrollbar-hide pb-6">
                    <AnimatePresence mode="wait">
                        {!isAllocating ? (
                            <motion.div 
                                key="summary"
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                {expenseCategories.filter(c => Number(c.budget) > 0).map(cat => {
                                    const { stats } = cat;
                                    const isDanger = stats.status === 'danger';
                                    const isWarning = stats.status === 'warning';

                                    return (
                                        <div key={cat.id} className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${cat.color} text-white`}>
                                                        {cat.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white text-[15px]">{cat.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Budget: ₹{stats.budget.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter ${isDanger ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : isWarning ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                                                    {stats.percent}%
                                                </div>
                                            </div>

                                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden mb-5">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ease-out ${isDanger ? 'bg-rose-500' : isWarning ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min(stats.percent, 100)}%` }}
                                                ></div>
                                            </div>

                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-slate-400">Spent ₹{stats.spent.toLocaleString()}</span>
                                                <span className={isDanger ? 'text-rose-500' : 'text-slate-500'}>
                                                    {stats.remaining >= 0 ? `Left ₹${stats.remaining.toLocaleString()}` : `Over ₹${Math.abs(stats.remaining).toLocaleString()}`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {expenseCategories.filter(c => Number(c.budget) > 0).length === 0 && (
                                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                                        <PieChart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-400 text-sm font-bold">No active budgets found.</p>
                                        <button onClick={handleStartAllocation} className="mt-4 text-indigo-500 font-black uppercase text-[10px] tracking-widest">+ Allocate Now</button>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="allocate"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                {expenseCategories.map(cat => (
                                    <div key={cat.id} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${cat.color} text-white`}>
                                                {cat.name[0]}
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                                            <span className="text-slate-400 font-bold text-xs">₹</span>
                                            <input 
                                                type="number"
                                                value={editingBudgets[cat.id]}
                                                onChange={(e) => setEditingBudgets({...editingBudgets, [cat.id]: e.target.value})}
                                                className="w-20 bg-transparent border-none p-0 text-sm font-black text-slate-900 dark:text-white focus:ring-0 text-right"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="pt-6 shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    {!isAllocating ? (
                        <button 
                            onClick={handleStartAllocation}
                            className="w-full py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-[1.5rem] shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-3"
                        >
                            <Settings2 className="w-4 h-4" />
                            Allocate Budgets
                        </button>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <button 
                                onClick={() => setIsAllocating(false)}
                                className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-xs tracking-widest rounded-2xl active:scale-[0.98] transition-all"
                            >Cancel</button>
                            <button 
                                onClick={handleSaveBudgets}
                                className="py-4 bg-emerald-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Save Limits
                            </button>
                        </div>
                    )}
                    <button 
                        onClick={onClose}
                        className="w-full py-4 text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] hover:text-slate-600 transition-colors"
                    >Dismiss</button>
                </div>
            </motion.div>
        </div>
    );
};

export default BudgetSummary;
