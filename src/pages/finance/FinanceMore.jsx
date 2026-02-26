import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { ArrowLeft, Wallet, CreditCard, Settings, ChevronRight, Download, Loader2 } from 'lucide-react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useTranslation } from 'react-i18next';
import FinanceBottomNav from '../../components/finance/FinanceBottomNav';

const FinanceMore = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { accounts, transactions, categories, subscriptions, debtParties, debtTransactions } = useFinance();
    const { user } = useAuthContext();
    const [isExporting, setIsExporting] = useState(false);

    const activeAccounts = accounts.filter(a => !a.isArchived);

    const handleExportFinance = async () => {
        setIsExporting(true);
        try {
            const data = {
                exportDate: new Date().toISOString(),
                user: user?.displayName || 'User',
                transactions: transactions.filter(t => !t.isDeleted),
                categories,
                accounts,
                subscriptions,
                debtParties: (debtParties || []).filter(p => !p.is_deleted),
                debtTransactions: (debtTransactions || []).filter(t => !t.is_deleted),
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Awake_Finance_Export_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Export failed.');
        } finally {
            setIsExporting(false);
        }
    };

    const menuSections = [
        {
            title: 'Tools',
            items: [
                { icon: Wallet, label: 'Wallets', desc: `${activeAccounts.length} active accounts`, onClick: () => navigate('/finance/wallets'), color: 'bg-blue-500/10 text-blue-500' },
                { icon: CreditCard, label: "EMI's", desc: 'Loan & repayment tracker', onClick: () => navigate('/finance/emi'), color: 'bg-violet-500/10 text-violet-500' },
            ]
        },
        {
            title: 'Preferences',
            items: [
                {
                    icon: Download,
                    label: 'Export Data',
                    desc: 'Download all finance data as JSON',
                    onClick: handleExportFinance,
                    color: 'bg-indigo-500/10 text-indigo-500',
                    rightOverride: isExporting ? <Loader2 className="w-5 h-5 text-slate-400 animate-spin" /> : null,
                },
                { icon: Settings, label: 'Settings', desc: 'Finance preferences', onClick: () => navigate('/finance/settings'), color: 'bg-slate-500/10 text-slate-500' },
            ]
        }
    ];

    return (
        <div
            className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-[env(safe-area-inset-top)]"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
        >
            {/* Header */}
            <header className="px-5 pt-6 pb-4">
                <div className="flex items-center gap-3 mb-1">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-900 dark:text-white -ml-1">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">More</h1>
                        <p className="text-[11px] text-slate-400 font-medium">Tools & settings</p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="px-5 flex-1 space-y-5">
                {menuSections.map(section => (
                    <div key={section.title}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2">{section.title}</p>
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
                                    {item.rightOverride ?? <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <FinanceBottomNav />
        </div>
    );
};

export default FinanceMore;
