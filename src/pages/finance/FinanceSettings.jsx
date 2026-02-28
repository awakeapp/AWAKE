import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, FileText } from 'lucide-react';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useTheme } from '../../context/ThemeContext';
import { AppHeader } from '../../components/ui/AppHeader';
import { SettingsList, SettingsSection, SettingsRow } from '../../components/ui/SettingsList';
import PageLayout from '../../components/layout/PageLayout';
import { useFinance } from '../../context/FinanceContext';
import { useState, useEffect } from 'react';
import { CreditCard, Check, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const FinanceSettings = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    useThemeColor(isDark ? '#000000' : '#F2F2F7');
    const { financeConfig, updateFinanceConfig } = useFinance();
    const { showToast } = useToast();

    const [isEditingUpi, setIsEditingUpi] = useState(false);
    const [upiId, setUpiId] = useState('');

    useEffect(() => {
        if (financeConfig?.upiId) {
            setUpiId(financeConfig.upiId);
        }
    }, [financeConfig?.upiId]);

    const handleSaveUpi = async () => {
        try {
            await updateFinanceConfig({ upiId: upiId.trim() });
            showToast('UPI ID saved successfully!', 'success');
            setIsEditingUpi(false);
        } catch (error) {
            showToast('Failed to save UPI ID', 'error');
        }
    };

    return (
        <PageLayout
            title="Finance Settings"
            showBack
        >
            <SettingsList>
                <SettingsSection title="Module Support">
                    <SettingsRow 
                        icon={HelpCircle} 
                        title="Finance Help & Feedback" 
                        onClick={() => navigate('/coming-soon?feature=FinanceHelp')}
                    />
                    <SettingsRow 
                        icon={FileText} 
                        title="About Finance Module" 
                        subtitle="Version 1.2.0"
                        isLast
                        onClick={() => navigate('/coming-soon?feature=FinanceAbout')}
                    />
                </SettingsSection>

                <SettingsSection title="Payment Integration">
                    {/* Inline edit row for UPI */}
                    <div className="bg-white dark:bg-slate-900 overflow-hidden mx-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                        <div className="flex items-center p-4 gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                <CreditCard className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-[13px] text-slate-900 dark:text-white">My UPI ID</p>
                                {isEditingUpi ? (
                                    <input 
                                        type="text"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        placeholder="e.g. yourname@okhdfcbank"
                                        className="w-full text-[13px] text-slate-500 dark:text-slate-400 bg-transparent outline-none mt-1 font-medium"
                                        autoFocus
                                    />
                                ) : (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5" onClick={() => setIsEditingUpi(true)}>
                                        {financeConfig?.upiId ? financeConfig.upiId : 'Tap to add your UPI ID...'}
                                    </p>
                                )}
                            </div>
                            {isEditingUpi ? (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { setIsEditingUpi(false); setUpiId(financeConfig?.upiId || ''); }} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                        <X className="w-4 h-4" />
                                    </button>
                                    <button onClick={handleSaveUpi} className="p-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-lg font-bold">
                                        <Check className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => setIsEditingUpi(true)} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                                    {financeConfig?.upiId ? 'Edit' : 'Add'}
                                </button>
                            )}
                        </div>
                    </div>
                </SettingsSection>

                <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 mt-8 font-bold tracking-widest uppercase">
                    AWAKE Finance Scoped Settings
                </p>
            </SettingsList>
        </PageLayout>
    );
};

export default FinanceSettings;
