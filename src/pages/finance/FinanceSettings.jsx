import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, FileText } from 'lucide-react';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useTheme } from '../../context/ThemeContext';
import { AppHeader } from '../../components/ui/AppHeader';
import { SettingsList, SettingsSection, SettingsRow } from '../../components/ui/SettingsList';
import PageLayout from '../../components/layout/PageLayout';

const FinanceSettings = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    useThemeColor(isDark ? '#000000' : '#F2F2F7');

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

                <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 mt-8 font-bold tracking-widest uppercase">
                    AWAKE Finance Scoped Settings
                </p>
            </SettingsList>
        </PageLayout>
    );
};

export default FinanceSettings;
