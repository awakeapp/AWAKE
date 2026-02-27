import React, { useMemo } from 'react';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
    CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { AppCard as Card, AppCardContent } from '../ui/AppCard';
import { TrendingUp, TrendingDown, Wallet, IndianRupee, PieChart as PieIcon, BarChart3 } from 'lucide-react';

const FinancialAnalytics = () => {
    const { transactions, categories } = useFinance();

    const stats = useMemo(() => {
        const income = transactions
            .filter(t => !t.isDeleted && t.type === 'income')
            .reduce((acc, t) => acc + Number(t.amount), 0);
        const expense = transactions
            .filter(t => !t.isDeleted && t.type === 'expense')
            .reduce((acc, t) => acc + Number(t.amount), 0);
        const savings = transactions
            .filter(t => !t.isDeleted && t.type === 'savings')
            .reduce((acc, t) => acc + Number(t.amount), 0);
        
        return { income, expense, savings, net: income - expense };
    }, [transactions]);

    // Group expenses by category
    const categoryData = useMemo(() => {
        const groups = {};
        transactions
            .filter(t => !t.isDeleted && t.type === 'expense')
            .forEach(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                const name = cat ? cat.name : 'Other';
                groups[name] = (groups[name] || 0) + Number(t.amount);
            });
        
        return Object.entries(groups)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5
    }, [transactions, categories]);

    // Monthly Trend (Last 6 months)
    const trendData = useMemo(() => {
        const months = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleString('default', { month: 'short' });
            months[key] = { name: key, income: 0, expense: 0 };
        }

        transactions.filter(t => !t.isDeleted).forEach(t => {
            const d = new Date(t.date || t.createdAt);
            const key = d.toLocaleString('default', { month: 'short' });
            if (months[key]) {
                if (t.type === 'income') months[key].income += Number(t.amount);
                if (t.type === 'expense') months[key].expense += Number(t.amount);
            }
        });

        return Object.values(months);
    }, [transactions]);

    const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

    return (
        <div className="space-y-6">
            {/* Overview Summary */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Income</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">₹{stats.income.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-3">
                        <TrendingDown className="w-5 h-5 text-rose-500" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Expense</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">₹{stats.expense.toLocaleString()}</p>
                </div>
            </div>

            {/* Income vs Expense Trend */}
            <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900 rounded-[32px]">
                <div className="p-6 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                    <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                        <BarChart3 className="w-4 h-4 text-indigo-500" />
                        Cash Flow Trend
                    </h3>
                </div>
                <div className="h-64 w-full p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: '#fff' }}
                                itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                            />
                            <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                            <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Category Breakdown */}
            <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900 rounded-[32px]">
                <div className="p-6 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                    <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                        <PieIcon className="w-4 h-4 text-pink-500" />
                        Top Expenses
                    </h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {categoryData.map((item, index) => {
                            const percent = Math.round((item.value / stats.expense) * 100);
                            return (
                                <div key={item.name} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-slate-600 dark:text-slate-400 uppercase tracking-widest">{item.name}</span>
                                        <span className="text-slate-900 dark:text-white">₹{item.value.toLocaleString()} <span className="ml-1 text-slate-400 font-medium">({percent}%)</span></span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{ 
                                                width: `${percent}%`, 
                                                backgroundColor: COLORS[index % COLORS.length] 
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default FinancialAnalytics;
