import { useFinance } from '../../context/FinanceContext';
import { X } from 'lucide-react';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Monthly Budgets</h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto space-y-4 pr-2 -mr-2">
                    {expenseCategories.map(cat => {
                        const { stats } = cat;
                        const isDanger = stats.status === 'danger';
                        const isWarning = stats.status === 'warning';

                        return (
                            <div key={cat.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${cat.color ? cat.color + '/20' : 'bg-slate-200'} ${cat.color?.replace('bg-', 'text-') || 'text-slate-500'}`}>
                                        {cat.icon === 'Utensils' && '🍽️'}
                                        {cat.icon === 'Bus' && '🚌'}
                                        {cat.icon === 'ShoppingBag' && '🛍️'}
                                        {cat.icon === 'Zap' && '⚡'}
                                        {!cat.icon && (cat.name[0])}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{cat.name}</p>
                                        <p className="text-[10px] text-slate-400">Budget: ₹{stats.budget.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-sm ${isDanger ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-emerald-500'}`}>
                                            {stats.percent}%
                                        </p>
                                    </div>
                                </div>

                                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1 relative">
                                    <div
                                        className={`h-full rounded-full transition-all ${isDanger ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${stats.percent}%` }}
                                    ></div>
                                </div>

                                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                    <span>Spent: ₹{stats.spent.toLocaleString()}</span>
                                    <span className={isDanger ? 'text-red-500' : 'text-slate-400'}>
                                        {stats.remaining >= 0 ? `Left: ₹${stats.remaining.toLocaleString()}` : `Over: ₹${Math.abs(stats.remaining).toLocaleString()}`}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {expenseCategories.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                            No active budgets found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BudgetSummary;
