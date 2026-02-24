import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useAuthContext } from '../hooks/useAuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Moon, Sun, Clock, ChevronRight, Download, ShieldCheck, HelpCircle, UserPlus, FileText, ArrowLeft, Monitor } from 'lucide-react';
import { FirestoreService } from '../services/firestore-service';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';


// Shared Row Component matching iOS style
const SettingsRow = ({ icon: Icon, title, subtitle, right, onClick, className, isLast, iconBgClass }) => (
    <div 
        onClick={onClick}
        className={clsx(
            "flex items-center min-h-[44px] sm:min-h-[50px] bg-white dark:bg-[#1C1C1E] active:bg-slate-100 dark:active:bg-[#2C2C2E] transition-colors duration-75 ml-4 pr-4",
            !isLast && "border-b border-slate-200 dark:border-[#38383A]",
            onClick && "cursor-pointer",
            className
        )}
    >
        <div className="flex items-center gap-3.5 py-2.5 flex-1 min-w-0">
            {Icon && (
                <div className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Icon strokeWidth={2} className="w-[18px] h-[18px]" />
                </div>
            )}
            <div className="flex-1 min-w-0 flex items-center justify-between">
                <p className="text-[16px] xl:text-[17px] text-black dark:text-white leading-tight truncate">{title}</p>
                {subtitle && <p className="text-[15px] xl:text-[16px] text-slate-500 dark:text-[#8E8E93] ml-2 truncate">{subtitle}</p>}
            </div>
        </div>
        {right ? (
            <div className="shrink-0 ml-2 flex items-center">
                {right}
            </div>
        ) : onClick ? (
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-[#5C5C5E] ml-2 shrink-0 relative top-[1px]" />
        ) : null}
    </div>
);

// Shared Group Component
const SettingsGroup = ({ children, className }) => (
    <div className={clsx("mb-6 sm:mb-8", className)}>
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-sm dark:shadow-none sm:border sm:border-slate-200 sm:dark:border-[#2C2C2E]">
            {children}
        </div>
    </div>
);

const Settings = () => {
    const { user } = useAuthContext();
    const { theme, themePreference, setThemePreference } = useTheme();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [appSettings, setAppSettings] = useState({
        language: i18n.language || 'en',
        timeFormat: '12h'
    });

    useEffect(() => {
        if (!user) return;
        const unsub = FirestoreService.subscribeToDocument(
            `users/${user.uid}/config`,
            'settings',
            (data) => {
                if (data) {
                    setAppSettings(prev => ({ ...prev, ...data }));
                    if (data.language && data.language !== i18n.language) {
                        i18n.changeLanguage(data.language);
                    }
                }
            }
        );
        return () => unsub();
    }, [user, i18n]);

    const updateSetting = async (key, value) => {
        if (key === 'language') {
            i18n.changeLanguage(value);
        }
        const newSettings = { ...appSettings, [key]: value };
        setAppSettings(newSettings);

        if (user) {
            try {
                await FirestoreService.setItem(`users/${user.uid}/config`, 'settings', { [key]: value }, true);
            } catch (e) {
                console.error("Failed to save setting", e);
            }
        }
    };

    return (
        <div className="pb-12 pt-2 sm:pt-4 bg-[#F2F2F7] dark:bg-black min-h-screen text-black dark:text-white font-sans">
            <div className="max-w-screen-md mx-auto sm:px-4">
                
                {/* Header Title */}
                <div className="px-4 flex items-center gap-3 sm:px-0 mb-4 sm:mb-6 mt-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-transparent hover:bg-black/5 dark:bg-transparent dark:hover:bg-white/10 rounded-full transition-colors active:scale-95 text-black dark:text-white lg:hidden -ml-2 focus:outline-none"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">{t('nav.settings', 'Settings')}</h1>
                    </div>
                </div>

                <div className="px-0 sm:px-0">
                    


                    {/* Preferences Group */}
                    <SettingsGroup>
                        <SettingsRow 
                            icon={FileText} 
                            iconBgClass="bg-red-500"
                            title={t('settings.language', 'Language')} 
                            right={
                                <select
                                    value={i18n.language.split('-')[0]}
                                    onChange={(e) => updateSetting('language', e.target.value)}
                                    className="bg-transparent text-[16px] text-slate-500 dark:text-[#8E8E93] outline-none cursor-pointer pr-1 text-right max-w-[120px]"
                                >
                                    <option value="en">English</option>
                                    <option value="ar">العربية</option>
                                    <option value="kn">ಕನ್ನಡ</option>
                                    <option value="ml">മലയാളം</option>
                                </select>
                            }
                        />
                        <SettingsRow 
                            icon={Clock} 
                            iconBgClass="bg-blue-500"
                            title="Time Format" 
                            isLast
                            right={
                                <div className="flex bg-slate-100 dark:bg-[#2C2C2E] rounded p-[2px]">
                                    <button
                                        onClick={() => updateSetting('timeFormat', '12h')}
                                        className={clsx(
                                            "px-3 py-1 text-[13px] font-medium rounded transition-colors duration-200",
                                            appSettings.timeFormat === '12h' ? "bg-white dark:bg-[#636366] text-black dark:text-white shadow-sm" : "text-slate-500 dark:text-[#8E8E93]"
                                        )}
                                    >12H</button>
                                    <button
                                        onClick={() => updateSetting('timeFormat', '24h')}
                                        className={clsx(
                                            "px-3 py-1 text-[13px] font-medium rounded transition-colors duration-200",
                                            appSettings.timeFormat === '24h' ? "bg-white dark:bg-[#636366] text-black dark:text-white shadow-sm" : "text-slate-500 dark:text-[#8E8E93]"
                                        )}
                                    >24H</button>
                                </div>
                            }
                        />
                    </SettingsGroup>

                    {/* Appearance Group (iOS Toggle style) */}
                    <SettingsGroup>
                        <SettingsRow 
                            icon={themePreference === 'dark' ? Moon : (themePreference === 'light' ? Sun : Monitor)} 
                            iconBgClass={themePreference === 'light' ? "bg-amber-400" : "bg-slate-800 dark:bg-slate-700"}
                            title="Theme" 
                            isLast
                            right={
                                <div className="flex bg-slate-100 dark:bg-[#1C1C1E] p-0.5 rounded-md border border-slate-200 dark:border-[#2C2C2E] overflow-hidden">
                                    <button
                                        onClick={() => setThemePreference('light')}
                                        className={clsx(
                                            "px-3 py-1 text-[13px] font-medium rounded transition-all duration-200",
                                            themePreference === 'light' ? "bg-white dark:bg-[#636366] text-black dark:text-white shadow-sm" : "text-slate-500 dark:text-[#8E8E93]"
                                        )}
                                    >Light</button>
                                    <button
                                        onClick={() => setThemePreference('system')}
                                        className={clsx(
                                            "px-3 py-1 text-[13px] font-medium rounded transition-all duration-200",
                                            themePreference === 'system' ? "bg-white dark:bg-[#636366] text-black dark:text-white shadow-sm" : "text-slate-500 dark:text-[#8E8E93]"
                                        )}
                                    >Auto</button>
                                    <button
                                        onClick={() => setThemePreference('dark')}
                                        className={clsx(
                                            "px-3 py-1 text-[13px] font-medium rounded transition-all duration-200",
                                            themePreference === 'dark' ? "bg-white dark:bg-[#636366] text-black dark:text-white shadow-sm" : "text-slate-500 dark:text-[#8E8E93]"
                                        )}
                                    >Dark</button>
                                </div>
                            }
                        />
                    </SettingsGroup>

                    {/* Support Group */}
                    <SettingsGroup>
                        <SettingsRow 
                            icon={HelpCircle} 
                            iconBgClass="bg-indigo-500"
                            title="Help and feedback" 
                            onClick={() => navigate('/coming-soon?feature=Help')}
                        />
                        <SettingsRow 
                            icon={UserPlus} 
                            iconBgClass="bg-[#34C759]"
                            title="Invite a friend" 
                            onClick={() => navigate('/coming-soon?feature=Invite')}
                        />
                        <SettingsRow 
                            icon={FileText} 
                            iconBgClass="bg-red-500"
                            title="Feedback" 
                            onClick={() => navigate('/coming-soon?feature=Feedback')}
                        />
                    </SettingsGroup>

                </div>

                <p className="text-center text-[12px] text-slate-400 dark:text-[#8E8E93] mt-8 mb-4 tracking-wide font-medium">
                    HUMI AWAKE v1.2.0 • Build ID: 88AF2
                </p>
            </div>
        </div>
    );
};

export default Settings;
