import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, PieChart, Edit3, Settings2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '../../hooks/useScrollLock';

const BudgetSummary = ({ isOpen, onClose }) => {
    const { categories, getBudgetStats, updateCategoryBudget, addCategory } = useFinance();
    const [isAllocating, setIsAllocating] = useState(false);
    const [editingBudgets, setEditingBudgets] = useState({}); // catId -> amount
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCatName, setNewCatName] = useState('');

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
        try {
            for (const catId in editingBudgets) {
                await updateCategoryBudget(catId, Number(editingBudgets[catId]));
            }
            setIsAllocating(false);
        } catch (error) {
            console.error("Failed to save budgets:", error);
            alert("Error saving budgets. Please try again.");
        }
    };

    const handleAddCategory = async () => {
        if (!newCatName.trim()) return;
        try {
            await addCategory({
                name: newCatName,
                type: 'expense',
                budget: 0,
                color: 'bg-indigo-500',
                icon: 'IndianRupee'
            });
            setNewCatName('');
            setIsAddingCategory(false);
        } catch (error) {
            console.error("Failed to add category:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center pointer-events-none">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-md pointer-events-auto"
                onClick={onClose}
            />

            <motion.div 
                initial={{ y: '100%' }} 
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-hidden flex flex-col border border-white/10 pointer-events-auto"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-8 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
                            <PieChart className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Budgets</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isAllocating ? 'Allocation Mode' : 'Monthly Summary'}</p>
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
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-4"
                            >
                                {expenseCategories.filter(c => Number(c.budget) > 0).map(cat => {
                                    const { stats } = cat;
                                    const isDanger = stats.status === 'danger';
                                    const isWarning = stats.status === 'warning';

                                    return (
                                        <div key={cat.id} className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-white/5 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${cat.color} text-white font-black`}>
                                                        {cat.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white text-[15px]">{cat.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Limit: ₹{stats.budget.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter ${isDanger ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : isWarning ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                                                    {stats.percent}%
                                                </div>
                                            </div>

                                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden mb-5">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ease-out ${isDanger ? 'bg-rose-500' : isWarning ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min(stats.percent, 100)}%` }}
                                                ></div>
                                            </div>

                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-slate-400">Spent ₹{stats.spent.toLocaleString()}</span>
                                                <span className={isDanger ? 'text-rose-500' : 'text-emerald-500'}>
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
                                        <button onClick={handleStartAllocation} className="mt-4 text-indigo-500 font-black uppercase text-[10px] tracking-widest">+ Start Allocating</button>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="allocate"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-4"
                            >
                                {expenseCategories.map(cat => (
                                    <div key={cat.id} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl flex items-center justify-between border border-white/5 group hover:border-indigo-500/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${cat.color} text-white`}>
                                                {cat.name[0]}
                                            </div>
                                            <span className="font-black text-slate-700 dark:text-slate-200 text-xs uppercase tracking-tight">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-white/5 shadow-sm shrink-0">
                                            <span className="text-slate-300 font-black text-[10px]">₹</span>
                                            <input 
                                                type="number"
                                                value={editingBudgets[cat.id]}
                                                onChange={(e) => setEditingBudgets({...editingBudgets, [cat.id]: e.target.value})}
                                                className="w-24 bg-transparent border-none p-0 text-xs font-black text-slate-900 dark:text-white focus:ring-0 text-right"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                ))}

                                {isAddingCategory ? (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/30"
                                    >
                                        <input 
                                            type="text"
                                            value={newCatName}
                                            onChange={(e) => setNewCatName(e.target.value)}
                                            placeholder="Enter Label..."
                                            className="w-full bg-transparent border-none p-0 mb-3 text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest placeholder:opacity-40 focus:ring-0"
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsAddingCategory(false)} className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-400 font-bold text-[10px] uppercase rounded-lg">Cancel</button>
                                            <button onClick={handleAddCategory} className="flex-1 py-2 bg-indigo-600 text-white font-black text-[10px] uppercase rounded-lg">Confirm Label</button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <button 
                                        onClick={() => setIsAddingCategory(true)}
                                        className="w-full py-4 border-2 border-dashed border-slate-100 dark:border-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:border-indigo-500/30 hover:text-indigo-500 transition-all"
                                    >
                                        + New Spend Label
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="pt-6 shrink-0 bg-white dark:bg-slate-900">
                    {!isAllocating ? (
                        <button 
                            onClick={handleStartAllocation}
                            className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-3"
                        >
                            <Settings2 className="w-4 h-4" />
                            Edit Budget Limits
                        </button>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <button 
                                onClick={() => setIsAllocating(false)}
                                className="py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-[0.1em] rounded-2xl active:scale-[0.98] transition-all"
                            >Discard</button>
                            <button 
                                onClick={async () => {
                                    await handleSaveBudgets();
                                    onClose();
                                }}
                                className="py-5 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.1em] rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Commit
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default BudgetSummary;
