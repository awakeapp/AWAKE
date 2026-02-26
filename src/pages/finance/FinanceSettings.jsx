import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, ChevronRight, FileText } from 'lucide-react';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useTheme } from '../../context/ThemeContext';
import clsx from 'clsx';


// Shared Row Component matching iOS style (cloned from Settings.jsx)
const SettingsRow = ({ icon: Icon, title, subtitle, right, onClick, isLast }) => (
    <div 
        onClick={onClick}
        className={clsx(
            "flex items-center min-h-[48px] bg-white dark:bg-[#1C1C1E] active:bg-slate-100 dark:active:bg-[#2C2C2E] transition-colors duration-75 ml-4 pr-4",
            !isLast && "border-b border-slate-200 dark:border-[#38383A]",
            onClick && "cursor-pointer"
        )}
    >
        <div className="flex items-center gap-3.5 py-3 flex-1 min-w-0">
            {Icon && (
                <div className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Icon strokeWidth={2} className="w-[18px] h-[18px]" />
                </div>
            )}
            <div className="flex-1 min-w-0 flex items-center justify-between">
                <div className="min-w-0">
                    <p className="text-[16px] text-black dark:text-white leading-tight truncate">{title}</p>
                    {subtitle && <p className="text-[13px] text-slate-500 dark:text-[#8E8E93] mt-0.5 truncate">{subtitle}</p>}
                </div>
            </div>
        </div>
        {right ? (
            <div className="shrink-0 ml-2 flex items-center">
                {right}
            </div>
        ) : onClick ? (
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-[#5C5C5E] ml-2 shrink-0" />
        ) : null}
    </div>
);

const SettingsGroup = ({ title, children }) => (
    <div className="mb-6">
        {title && <p className="text-[13px] font-semibold text-slate-500 dark:text-[#8E8E93] uppercase tracking-wider px-5 mb-2">{title}</p>}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden border border-slate-200 dark:border-[#2C2C2E]">
            {children}
        </div>
    </div>
);

const FinanceSettings = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    useThemeColor(isDark ? '#000000' : '#F2F2F7');

    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-black text-black dark:text-white font-sans pb-12">
            {/* Fixed Header */}
            <div 
                className="fixed top-0 left-0 right-0 z-40 bg-[#F2F2F7]/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10"
                style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
                <div className="max-w-screen-md mx-auto px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight">Finance Settings</h1>
                </div>
            </div>

            <div 
                className="max-w-screen-md mx-auto px-4"
                style={{ paddingTop: 'calc(56px + env(safe-area-inset-top) + 20px)' }}
            >
                {/* Support */}
                <SettingsGroup title="Support">
                    <SettingsRow 
                        icon={HelpCircle} 
                        title="Help & Feedback" 
                        onClick={() => navigate('/coming-soon?feature=FinanceHelp')}
                    />
                    <SettingsRow 
                        icon={FileText} 
                        title="About Finance Module" 
                        subtitle="v1.2.0"
                        isLast
                        onClick={() => navigate('/coming-soon?feature=FinanceAbout')}
                    />
                </SettingsGroup>

                <p className="text-center text-[12px] text-slate-400 dark:text-[#8E8E93] mt-8 mb-4 tracking-wide font-medium">
                    AWAKE Finance Module • Scoped Settings
                </p>
            </div>
        </div>
    );
};

export default FinanceSettings;
