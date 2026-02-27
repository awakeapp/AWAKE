import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, AlertCircle, Award, ArrowLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, addMonths } from 'date-fns';
import PageLayout from '../../components/layout/PageLayout';

const MonthlyOverview = () => {
  const navigate = useNavigate();
  const { transactions, categories } = useFinance();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getMonthStats = (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const monthTx = transactions.filter(t =>
      !t.isDeleted && isWithinInterval(new Date(t.date), { start, end })
    );

    const income = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const savings = income - expense;

    // Category Breakdown
    const categoryMap = {};
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      const catId = t.categoryId;
      if (t.splits) {
        t.splits.forEach(s => {
          categoryMap[s.categoryId] = (categoryMap[s.categoryId] || 0) + Number(s.amount);
        });
      } else if (catId) {
        categoryMap[catId] = (categoryMap[catId] || 0) + Number(t.amount);
      }
    });

    const topCategories = Object.entries(categoryMap)
      .map(([id, amount]) => ({
        id,
        amount,
        name: categories.find(c => c.id === id)?.name || 'Unknown',
        icon: categories.find(c => c.id === id)?.icon,
        color: categories.find(c => c.id === id)?.color
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5

    const largestExpense = monthTx
      .filter(t => t.type === 'expense')
      .sort((a, b) => Number(b.amount) - Number(a.amount))[0];

    return { income, expense, savings, topCategories, largestExpense, count: monthTx.length };
  };

  const currentStats = useMemo(() => getMonthStats(selectedDate), [selectedDate, transactions]);
  const prevStats = useMemo(() => getMonthStats(subMonths(selectedDate, 1)), [selectedDate, transactions]);

  const changeMonth = (offset) => {
    setSelectedDate(prev => offset > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const expenseDiff = currentStats.expense - prevStats.expense;
  const expenseDiffPercent = prevStats.expense > 0 ? Math.round((expenseDiff / prevStats.expense) * 100) : 0;

  return (
    <PageLayout
      headerBgClass="bg-slate-900 text-white shadow-2xl shadow-slate-900/20"
      headerBorderClass="border-none"
      headerPadClass="p-0"
      header={
        <div className="w-full">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-transparent hover:bg-white/20 rounded-full transition-colors text-white -ml-2 focus:outline-none"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 bg-white/10 rounded-full p-1 border border-white/5">
              <button onClick={() => changeMonth(-1)} className="p-1 px-1.5 hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest min-w-[70px] text-center">
                {format(selectedDate, 'MMM yyyy')}
              </span>
              <button onClick={() => changeMonth(1)} className="p-1 px-1.5 hover:bg-white/10 rounded-full transition-colors">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </button>
            </div>
            
            <div className="w-9" />
          </div>

          <div className="text-center px-6 pb-6 pt-2">
            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Net Savings</p>
            <h2 className={`text-4xl font-black tracking-tightest leading-tight ${currentStats.savings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentStats.savings >= 0 ? '+' : ''}₹{currentStats.savings.toLocaleString()}
            </h2>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
          {/* Summary Cards */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
            <div className="space-y-4">
              {/* Income Bar */}
              <div>
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span className="text-slate-500">Income</span>
                  <span className="text-emerald-500">₹{currentStats.income.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              {/* Expense Bar */}
              <div>
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span className="text-slate-500">Expense</span>
                  <span className="text-red-500">₹{currentStats.expense.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${currentStats.income > 0 ? Math.min((currentStats.expense / currentStats.income) * 100, 100) : 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-indigo-500 text-white p-6 rounded-3xl shadow-xl shadow-indigo-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-200" />
              Insights
            </h3>

            <div className="space-y-3 relative z-10">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <p className="text-sm font-medium">
                  You spent <span className="font-bold">{Math.abs(expenseDiffPercent)}% {expenseDiff > 0 ? 'more' : 'less'}</span> than last month.
                </p>
              </div>
              {currentStats.largestExpense && (
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <p className="text-xs text-indigo-200 uppercase font-bold mb-1">Largest Expense</p>
                  <p className="font-bold text-sm truncate">{currentStats.largestExpense.note || 'Unknow Expense'}</p>
                  <p className="text-xs text-indigo-100">₹{Number(currentStats.largestExpense.amount).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Categories */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 pl-2">Top Spending</h3>
            <div className="space-y-3">
              {currentStats.topCategories.map(cat => {
                let iconName = cat.icon;
                if (!iconName) {
                  if (cat.name === 'Food & Dining') iconName = 'Utensils';
                  else if (cat.name === 'Transport') iconName = 'Bus';
                  else if (cat.name === 'Shopping') iconName = 'ShoppingBag';
                  else if (cat.name === 'Bills & Utilities') iconName = 'Zap';
                  else if (cat.name === 'Salary') iconName = 'IndianRupee';
                  else if (cat.name === 'Savings Allocation') iconName = 'Wallet';
                  else iconName = 'HelpCircle';
                }
                const IconComponent = LucideIcons[iconName];
                return (
                  <div key={cat.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${cat.color ? cat.color + '/20' : 'bg-slate-100'} ${cat.color?.replace('bg-', 'text-') || 'text-slate-500'}`}>
                        {IconComponent ? <IconComponent className="w-5 h-5 opacity-90" /> : cat.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{cat.name}</p>
                        <p className="text-xs text-slate-400">{Math.round((cat.amount / currentStats.expense) * 100)}% of total</p>
                      </div>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">₹{cat.amount.toLocaleString()}</p>
                  </div>
                );
              })}
              {currentStats.topCategories.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-4">No spending data for this month.</p>
              )}
            </div>
          </div>
      </div>
    </PageLayout>
  );
};

export default MonthlyOverview;
