import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useAuthContext } from '../hooks/useAuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Moon, Sun, Clock, ChevronRight } from 'lucide-react';
import { FirestoreService } from '../services/firestore-service';
import { useTranslation } from 'react-i18next';

// Shared Row Component
const SettingsRow = ({ icon: Icon, title, subtitle, right, onClick, className }) => (
    <div 
        onClick={onClick}
        className={clsx(
            "flex items-center justify-between px-4 min-h-[56px] bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/50 last:border-0",
            onClick && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
            className
        )}
    >
        <div className="flex items-center gap-4">
            {Icon && (
                <div className="text-slate-400 shrink-0">
                    <Icon strokeWidth={2} className="w-5 h-5 flex-shrink-0" />
                </div>
            )}
            <div className="text-left py-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">{title}</p>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
        </div>
        {right && (
            <div className="shrink-0 ml-4 flex items-center">
                {right}
            </div>
        )}
    </div>
);

// Shared Section Component
const SettingsSection = ({ title, children }) => (
    <div className="mb-8 p-4 pt-0 sm:p-0">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-4 sm:px-0 mb-2">
            {title}
        </h3>
        <div className="border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden">
            {children}
        </div>
    </div>
);

const Settings = () => {
    const { user } = useAuthContext();
    const { theme, toggleTheme } = useTheme();
    const { t, i18n } = useTranslation();

    const [appSettings, setAppSettings] = useState({
        language: i18n.language || 'en',
        timeFormat: '12h',
        appLock: false,
        biometrics: false,
        notifications: true
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
        <div className="pb-24 pt-6 animate-in slide-in-from-right-4 duration-300">
            <div className="max-w-screen-md mx-auto sm:px-4">
                <div className="px-4 sm:px-0 mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage app preferences and display.</p>
                </div>

                {/* PREFERENCES */}
                <SettingsSection title="Preferences">
                    <SettingsRow 
                        icon={User} 
                        title={t('settings.language', 'Language')} 
                        subtitle={t('settings.language_desc', 'System default language')} 
                        right={
                            <select
                                value={i18n.language.split('-')[0]}
                                onChange={(e) => updateSetting('language', e.target.value)}
                                className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 outline-none cursor-pointer pr-1"
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
                        title="Time Format" 
                        subtitle="Display preference" 
                        right={
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded p-1">
                                <button
                                    onClick={() => updateSetting('timeFormat', '12h')}
                                    className={clsx(
                                        "px-3 py-1 text-xs font-semibold rounded transition-colors duration-200",
                                        appSettings.timeFormat === '12h' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500"
                                    )}
                                >12H</button>
                                <button
                                    onClick={() => updateSetting('timeFormat', '24h')}
                                    className={clsx(
                                        "px-3 py-1 text-xs font-semibold rounded transition-colors duration-200",
                                        appSettings.timeFormat === '24h' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500"
                                    )}
                                >24H</button>
                            </div>
                        }
                    />
                </SettingsSection>

                {/* APPEARANCE */}
                <SettingsSection title="Appearance">
                    <SettingsRow 
                        icon={theme === 'dark' ? Moon : Sun} 
                        title="Dark Mode" 
                        subtitle="Adjust application appearance" 
                        right={
                            <button
                                onClick={() => {
                                    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
                                    toggleTheme();
                                }}
                                className={clsx(
                                    "relative w-12 h-6 rounded-full transition-colors duration-150 ease-in-out border border-transparent",
                                    theme === 'dark' ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
                                )}
                            >
                                <span
                                    className={clsx(
                                        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-150 ease-in-out",
                                        theme === 'dark' ? "translate-x-6" : "translate-x-0"
                                    )}
                                />
                            </button>
                        }
                    />
                </SettingsSection>

                <p className="text-center text-[10px] font-semibold text-slate-400 mt-10 mb-4">
                    AWAKE v1.2.0 • Build ID: 88AF2
                </p>
            </div>
        </div>
    );
};

export default Settings;
