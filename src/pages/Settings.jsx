import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    User, Moon, Sun, Monitor, Bell, Database, Shield, Info, LogOut, 
    Trash2, ChevronRight, ArrowLeft, Edit2, KeyRound, Mail, Globe, 
    Clock, Smartphone, UserPlus, Heart, Handshake, Car, Download
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../hooks/useAuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useLogout } from '../hooks/useLogout';
import { AppHeader } from '../components/ui/AppHeader';
import { SettingsList, SettingsSection, SettingsRow } from '../components/ui/SettingsList';
import { AppToggle } from '../components/ui/AppToggle';
import ConfirmDialog from '../components/organisms/ConfirmDialog';
import PageLayout from '../components/layout/PageLayout';
import { motion, AnimatePresence } from 'framer-motion';
import ActionButton from '../components/atoms/ActionButton';

const Settings = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuthContext();
    const { themePreference, setThemePreference } = useTheme();
    const { appSettings, updateSetting } = useSettings();
    const { logout } = useLogout();

    const [isConfirmSignOutOpen, setIsConfirmSignOutOpen] = useState(false);
    const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
    const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    const handleSignOut = async () => {
        try {
            await logout();
            navigate('/');
        } catch (e) {
            console.error('Sign out error', e);
        }
    };

    const handleResetCache = () => {
        localStorage.clear();
        window.location.reload();
    };

    const toggleNotification = (key) => {
        const current = appSettings.notifications || {};
        updateSetting('notifications', {
            ...current,
            [key]: !current[key]
        });
    };

    const memberId = `AWK-${user?.uid?.slice(-4).toUpperCase() || 'GUEST'}`;

    return (
        <PageLayout
            title={t('nav.settings', 'Settings')}
            showBack
            renderFloating={
                <>
                    <ConfirmDialog 
                        isOpen={isConfirmSignOutOpen}
                        onClose={() => setIsConfirmSignOutOpen(false)}
                        onConfirm={handleSignOut}
                        title="Sign Out"
                        message="Are you sure you want to sign out? You will need to log in again to access your data."
                        confirmText="Sign Out"
                        isDestructive
                    />

                    <ConfirmDialog 
                        isOpen={isConfirmResetOpen}
                        onClose={() => setIsConfirmResetOpen(false)}
                        onConfirm={handleResetCache}
                        title="Reset Cache"
                        message="This will clear all local data and reload the app. Your cloud data is safe."
                        confirmText="Reset"
                        isDestructive
                    />

                    {/* PWA Install Guide */}
                    <AnimatePresence>
                        {isInstallGuideOpen && (
                            <div className="fixed inset-0 z-[100] flex items-end justify-center">
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    onClick={() => setIsInstallGuideOpen(false)}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                />
                                <motion.div 
                                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] p-8 shadow-2xl z-10 border-t border-white/5"
                                >
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Install AWAKE</h3>
                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                                                <Smartphone className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">Full Screen Mode</p>
                                                <p className="text-sm text-slate-500">Run AWAKE as a standalone app without the browser bar.</p>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                                            <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-3">How to Install</p>
                                            {isIOS ? (
                                                <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-3 font-medium">
                                                    <li className="flex gap-3">
                                                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] shrink-0">1</span>
                                                        <span>Tap the <strong className="text-indigo-500">Share</strong> button in Safari.</span>
                                                    </li>
                                                    <li className="flex gap-3">
                                                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] shrink-0">2</span>
                                                        <span>Select <strong className="text-indigo-500">Add to Home Screen</strong>.</span>
                                                    </li>
                                                </ol>
                                            ) : (
                                                <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-3 font-medium">
                                                    <li className="flex gap-3">
                                                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] shrink-0">1</span>
                                                        <span>Tap the <strong className="text-indigo-500">Three Dots</strong> in Chrome.</span>
                                                    </li>
                                                    <li className="flex gap-3">
                                                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] shrink-0">2</span>
                                                        <span>Select <strong className="text-indigo-500">Install App</strong>.</span>
                                                    </li>
                                                </ol>
                                            )}
                                        </div>
                                    </div>
                                    <ActionButton
                                        variant="primary"
                                        onClick={() => setIsInstallGuideOpen(false)}
                                        label="Got it"
                                        iconOnly={false}
                                        fullWidth
                                        className="mt-8 py-4"
                                    />
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </>
            }
        >
            <SettingsList>
                    {/* Identity Card */}
                    <div className="px-4 mb-8">
                        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-slate-200/50 dark:border-white/5 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700" />
                            
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="w-20 h-20 rounded-[24px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-400 dark:text-slate-500 overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 shadow-sm">
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt={user?.displayName} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="uppercase">{user?.displayName?.[0] || 'U'}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-[20px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                                        {user?.displayName || 'User'}
                                    </h2>
                                    <div className="mt-1 flex flex-col">
                                        <span className="text-[12px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                                            {memberId}
                                        </span>
                                        <span className="text-[14px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                            {user?.email}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 active:scale-90 transition-all border border-slate-200/50 dark:border-white/5"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Appearance */}
                    <SettingsSection title="Appearance">
                        <SettingsRow 
                            icon={themePreference === 'dark' ? Moon : themePreference === 'light' ? Sun : Monitor}
                            title="Theme"
                            subtitle={themePreference.charAt(0).toUpperCase() + themePreference.slice(1)}
                            rightElement={
                                <select 
                                    value={themePreference}
                                    onChange={(e) => setThemePreference(e.target.value)}
                                    className="appearance-none bg-slate-100 dark:bg-slate-800 text-[14px] font-semibold text-slate-700 dark:text-white px-3 py-1.5 rounded-lg outline-none cursor-pointer max-w-[120px]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="system">System</option>
                                </select>
                            }
                        />
                        <SettingsRow 
                            icon={Globe}
                            title="Language"
                            subtitle={appSettings.language === 'en' ? 'English' : appSettings.language === 'ar' ? 'Arabic' : 'Regional'}
                            rightElement={
                                <select 
                                    value={appSettings.language}
                                    onChange={(e) => updateSetting('language', e.target.value)}
                                    className="appearance-none bg-slate-100 dark:bg-slate-800 text-[14px] font-semibold text-slate-700 dark:text-white px-3 py-1.5 rounded-lg outline-none cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <option value="en">English</option>
                                    <option value="ar">العربية</option>
                                    <option value="kn">ಕನ್ನಡ</option>
                                    <option value="ml">മലയാളಂ</option>
                                </select>
                            }
                        />
                        <SettingsRow 
                            icon={Clock}
                            title="Time Format"
                            isLast
                            rightElement={
                                <select 
                                    value={appSettings.timeFormat}
                                    onChange={(e) => updateSetting('timeFormat', e.target.value)}
                                    className="appearance-none bg-slate-100 dark:bg-slate-800 text-[14px] font-semibold text-slate-700 dark:text-white px-3 py-1.5 rounded-lg outline-none cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <option value="12h">12-hour</option>
                                    <option value="24h">24-hour</option>
                                </select>
                            }
                        />
                    </SettingsSection>

                    {/* Notifications */}
                    <SettingsSection title="Notifications">
                        <SettingsRow 
                            icon={Bell}
                            title="Global Notifications"
                            subtitle="All alerts and reminders"
                            rightElement={
                                <AppToggle 
                                    checked={appSettings.notifications?.global} 
                                    onChange={() => toggleNotification('global')}
                                />
                            }
                        />
                        <SettingsRow 
                            icon={Heart}
                            title="Ramadan Alerts"
                            rightElement={
                                <AppToggle 
                                    checked={appSettings.notifications?.ramadan} 
                                    onChange={() => toggleNotification('ramadan')}
                                />
                            }
                        />
                        <SettingsRow 
                            icon={Handshake}
                            title="Finance Reminders"
                            rightElement={
                                <AppToggle 
                                    checked={appSettings.notifications?.finance} 
                                    onChange={() => toggleNotification('finance')}
                                />
                            }
                        />
                        <SettingsRow 
                            icon={Car}
                            title="Vehicle Maintenance"
                            isLast
                            rightElement={
                                <AppToggle 
                                    checked={appSettings.notifications?.vehicle} 
                                    onChange={() => toggleNotification('vehicle')}
                                />
                            }
                        />
                    </SettingsSection>

                    {/* Security & Data */}
                    <SettingsSection title="Security & Data">
                        <SettingsRow 
                            icon={KeyRound}
                            title="Update Password"
                            onClick={() => navigate('/profile')}
                        />
                        <SettingsRow 
                            icon={Database}
                            title="Export All Data"
                            subtitle="JSON summary"
                            onClick={() => navigate('/profile')}
                            isLast
                        />
                    </SettingsSection>

                    {/* About */}
                    <SettingsSection title="Mobile App">
                        <SettingsRow 
                            icon={Smartphone}
                            title="PWA Status"
                            subtitle={isStandalone ? 'Running as standalone App' : 'Running in browser'}
                            rightElement={
                                isStandalone ? (
                                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">Standlone</span>
                                ) : (
                                    <ActionButton
                                        variant="primary"
                                        onClick={() => setIsInstallGuideOpen(true)}
                                        label="Install Now"
                                        iconOnly={false}
                                        size="sm"
                                        className="text-[11px] font-bold px-3 py-1.5"
                                    />
                                )
                            }
                        />
                        <SettingsRow 
                            icon={Info}
                            title="App Version"
                            subtitle="v1.3.0 (Stable)"
                        />
                        <SettingsRow 
                            icon={Smartphone}
                            title="Device Info"
                            isLast
                            subtitle={navigator.platform}
                        />
                    </SettingsSection>

                    {/* Actions */}
                    <SettingsSection title="Actions">
                        <SettingsRow 
                            icon={Trash2}
                            title="Reset Local Cache"
                            isDanger
                            onClick={() => setIsConfirmResetOpen(true)}
                        />
                        <SettingsRow 
                            icon={LogOut}
                            title="Sign Out"
                            isDanger
                            isLast
                            onClick={() => setIsConfirmSignOutOpen(true)}
                        />
                    </SettingsSection>

                    <p className="text-center text-[12px] text-slate-400 dark:text-slate-600 mt-2 font-medium tracking-tight">
                        HUMI AWAKE • BUILD 88AF2
                    </p>
                </SettingsList>
        </PageLayout>
    );
};

export default Settings;
