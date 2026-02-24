import { useFinance } from '../../context/FinanceContext';
import { X, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollLock } from '../../hooks/useScrollLock';

const BudgetSummary = ({ isOpen, onClose }) => {
    useScrollLock(isOpen);
    const { categories, getBudgetStats } = useFinance();

    if (!isOpen) return null;

    const expenseCategories = categories
        .filter(c => c.type === 'expense' && Number(c.budget) > 0)
        .map(c => ({ ...c, stats: getBudgetStats(c.id) }))
        .sort((a, b) => b.stats.percent - a.stats.percent);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative max-h-[85vh] overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800"
            >
                <div className="flex justify-between items-center mb-8 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                            <PieChart className="w-5 h-5 text-indigo-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Monthly Budgets</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto space-y-4 pr-1 scrollbar-hide">
                    {expenseCategories.map(cat => {
                        const { stats } = cat;
                        const isDanger = stats.status === 'danger';
                        const isWarning = stats.status === 'warning';

                        return (
                            <div key={cat.id} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-[15px]">{cat.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Budget: ₹{stats.budget.toLocaleString()}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isDanger ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : isWarning ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                                        {stats.percent}%
                                    </div>
                                </div>

                                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden mb-4">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isDanger ? 'bg-rose-500' : isWarning ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(stats.percent, 100)}%` }}
                                    ></div>
                                </div>

                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
                                    <span className="text-slate-400">Spent: ₹{stats.spent.toLocaleString()}</span>
                                    <span className={isDanger ? 'text-rose-500' : 'text-slate-500'}>
                                        {stats.remaining >= 0 ? `Left: ₹${stats.remaining.toLocaleString()}` : `Over: ₹${Math.abs(stats.remaining).toLocaleString()}`}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {expenseCategories.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PieChart className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-slate-400 text-sm">No active budgets found.</p>
                        </div>
                    )}
                </div>

                <div className="pt-8 mt-auto shrink-0">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-lg active:scale-[0.98] transition-all"
                    >Close Summary</button>
                </div>
            </motion.div>
        </div>
    );
};

export default BudgetSummary;
