import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { 
    Wallet, CreditCard, Settings, Download, Loader2, ArrowLeft 
} from 'lucide-react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useTranslation } from 'react-i18next';
import FinanceBottomNav from '../../components/finance/FinanceBottomNav';
import PageLayout from '../../components/layout/PageLayout';
import { SettingsList, SettingsSection, SettingsRow } from '../../components/ui/SettingsList';

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
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <PageLayout
            bottomNav={<FinanceBottomNav />}
            header={
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-900 dark:text-white -ml-2">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Finance More</h1>
                </div>
            }
        >
            <SettingsList>
                <SettingsSection title="Tools">
                    <SettingsRow 
                        icon={Wallet} 
                        title="Wallets" 
                        subtitle={`${activeAccounts.length} active accounts`} 
                        onClick={() => navigate('/finance/wallets')} 
                    />
                    <SettingsRow 
                        icon={CreditCard} 
                        title="EMI's" 
                        subtitle="Loan & repayment tracker" 
                        onClick={() => navigate('/finance/emi')} 
                        isLast
                    />
                </SettingsSection>

                <SettingsSection title="Preferences">
                    <SettingsRow 
                        icon={Download} 
                        title="Export Finance Data" 
                        subtitle="Download as JSON" 
                        onClick={handleExportFinance}
                        rightElement={isExporting ? <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /> : null}
                    />
                    <SettingsRow 
                        icon={Settings} 
                        title="Finance Settings" 
                        subtitle="Calculation & display preferences" 
                        onClick={() => navigate('/finance/settings')} 
                        isLast
                    />
                </SettingsSection>
            </SettingsList>
        </PageLayout>
    );
};

export default FinanceMore;
