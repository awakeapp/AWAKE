import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { ArrowLeft, Wallet, PieChart, CreditCard, TrendingUp, Settings, ChevronRight, BarChart3, BookOpen } from 'lucide-react';
import BudgetSummary from './BudgetSummary';
import AnalyticsModal from './AnalyticsModal';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useTranslation } from 'react-i18next';

const FinanceMore = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { accounts, transactions, categories } = useFinance();
    const [isBudgetOpen, setIsBudgetOpen] = useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

    const activeAccounts = accounts.filter(a => !a.isArchived);

    const monthStats = React.useMemo(() => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        const monthlyTx = transactions.filter(t =>
            !t.isDeleted && isWithinInterval(new Date(t.date || t.createdAt), { start, end })
        );
        const income = monthlyTx.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = monthlyTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
        return { transactions: monthlyTx, income, expense, savings: income - expense, savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0 };
    }, [transactions]);

    const menuSections = [
        {
            title: 'Tools',
            items: [
                { icon: Wallet, label: 'Wallets', desc: `${activeAccounts.length} active accounts`, onClick: () => navigate('/finance/wallets'), color: 'bg-blue-500/10 text-blue-500' },
                { icon: CreditCard, label: "EMI's", desc: 'Loan & repayment tracker', onClick: () => navigate('/finance/emi'), color: 'bg-violet-500/10 text-violet-500' },
                { icon: BookOpen, label: 'Debt Ledger', desc: 'Lending & borrowing', onClick: () => navigate('/finance/debts'), color: 'bg-amber-500/10 text-amber-500' },
            ]
        },
        {
            title: 'Insights',
            items: [
                { icon: PieChart, label: 'Analytics', desc: 'Charts & spending insights', onClick: () => setIsAnalyticsOpen(true), color: 'bg-emerald-500/10 text-emerald-500' },
                { icon: TrendingUp, label: t('finance.budgets', 'Budgets'), desc: 'Category-wise budget tracking', onClick: () => setIsBudgetOpen(true), color: 'bg-rose-500/10 text-rose-500' },
            ]
        },
        {
            title: 'Preferences',
            items: [
                { icon: Settings, label: 'Settings', desc: 'Finance preferences & export', onClick: () => navigate('/finance/settings'), color: 'bg-slate-500/10 text-slate-500' },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 6rem)' }}>
            {/* Header */}
            <header className="px-5 pt-5 pb-4">
                <div className="flex items-center gap-3 mb-1">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-900 dark:text-white -ml-1">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Finance</h1>
                        <p className="text-[11px] text-slate-400 font-medium">All tools & settings</p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="px-5 flex-1 space-y-6">
                {menuSections.map(section => (
                    <div key={section.title}>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 mb-2">{section.title}</p>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800/50">
                            {section.items.map(item => (
                                <button
                                    key={item.label}
                                    onClick={item.onClick}
                                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.color}`}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[14px] font-bold text-slate-900 dark:text-white leading-tight">{item.label}</p>
                                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <BudgetSummary isOpen={isBudgetOpen} onClose={() => setIsBudgetOpen(false)} />
            <AnalyticsModal
                isOpen={isAnalyticsOpen}
                onClose={() => setIsAnalyticsOpen(false)}
                monthStats={monthStats}
                categories={categories}
                selectedDate={new Date()}
            />
        </div>
    );
};

export default FinanceMore;
