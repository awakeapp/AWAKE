import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useAuthContext } from '../hooks/useAuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLogout } from '../hooks/useLogout';
import { User, Lock, Edit2, Check, X, Download, ShieldCheck, LogOut, Moon, Sun, Clock, ChevronRight, FileDown } from 'lucide-react';
import Button from '../components/atoms/Button';
import { getReportData, generateUserReportPDF } from '../utils/reportUtils';
import EditProfileModal from '../components/organisms/EditProfileModal';
import { FirestoreService } from '../services/firestore-service';
import LegacyMigrator from '../components/molecules/LegacyMigrator';
import DataExportSection from '../components/organisms/DataExportSection';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useTranslation } from 'react-i18next';

// Shared Row Component
const SettingsRow = ({ icon: Icon, title, subtitle, right, onClick, className }) => (
    <div 
        onClick={onClick}
        className={clsx(
            "flex items-center justify-between px-4 min-h-[56px] bg-white dark:bg-slate-900",
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
    <div className="mb-8">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-4 mb-2">
            {title}
        </h3>
        <div className="border-y sm:border sm:rounded-2xl border-slate-200 dark:border-slate-800/60 overflow-hidden divide-y divide-slate-200 dark:divide-slate-800/60">
            {children}
        </div>
    </div>
);

const Settings = () => {
    const { user } = useAuthContext();
    const { logout } = useLogout();
    const { theme, toggleTheme } = useTheme();
    const { t, i18n } = useTranslation();
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

    // Password state
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    // Report state
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (user) {
            getReportData(user.uid).then(reportStats => {
                setStats(reportStats);
            });
        }
    }, [user]);

    const handleSavePassword = async () => {
        setPasswordError('');
        setPasswordSuccess('');
        setIsPasswordLoading(true);

        if (!currentPassword || !newPassword) {
            setPasswordError(t('common.error_general', "All fields are required"));
            setIsPasswordLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters");
            setIsPasswordLoading(false);
            return;
        }

        try {
            if (!auth.currentUser) throw new Error("No user logged in");

            const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);

            setPasswordSuccess(t('common.success_saved', "Password updated successfully"));
            setCurrentPassword('');
            setNewPassword('');
            setTimeout(() => {
                setIsEditingPassword(false);
                setPasswordSuccess('');
            }, 1500);
        } catch (e) {
            console.error("Password Update Error", e);
            if (e.code === 'auth/wrong-password') {
                setPasswordError("Incorrect current password");
            } else if (e.code === 'auth/requires-recent-login') {
                setPasswordError("Please log in again before changing password");
            } else {
                setPasswordError("Failed to update password: " + e.message);
            }
        } finally {
            setIsPasswordLoading(false);
        }
    };

    const handleDownloadReport = () => {
        if (!user || !stats) return;
        generateUserReportPDF(user, stats);
    };

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

    const handleClearData = async () => {
        if (window.confirm(t('common.confirm_reset', "Are you sure you want to sign out and clear local cache? This will NOT delete your cloud data."))) {
            try {
                await logout();
                localStorage.clear();
                window.location.reload();
            } catch (e) {
                console.error("Clear data error", e);
            }
        }
    };

    return (
        <div className="pb-24 animate-in slide-in-from-right-4 duration-300">
            <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />

            {/* 1. PROFILE HEADER */}
            <div className="flex flex-col items-center pt-8 pb-10">
                <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-400 overflow-hidden">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt={user?.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="uppercase">{user?.initials || user?.name?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    <button 
                        onClick={() => setIsEditProfileOpen(true)}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-slate-700 border flex items-center justify-center border-slate-200 dark:border-slate-600 rounded-full text-slate-600 dark:text-slate-300 shadow-sm hover:scale-105 transition-transform"
                    >
                        <Edit2 strokeWidth={2} className="w-4 h-4" />
                    </button>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white leading-tight">{user?.name}</h2>
                <p className="text-sm text-slate-500 mt-1">{user?.email}</p>
            </div>

            <div className="max-w-screen-md mx-auto sm:px-4">
                {/* 2. PREFERENCES */}
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
                    <SettingsRow 
                        icon={Moon} 
                        title="Ramadan Hub" 
                        subtitle="Manage fasts & prayers" 
                        onClick={() => {}} 
                        right={<ChevronRight className="w-5 h-5 text-slate-300" />} 
                    />
                    <SettingsRow 
                        icon={Check} 
                        title="Daily Routine" 
                        subtitle="Configure habit tracking" 
                        onClick={() => {}} 
                        right={<ChevronRight className="w-5 h-5 text-slate-300" />} 
                    />
                </SettingsSection>

                {/* 3. APPEARANCE */}
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

                {/* 4. SECURITY */}
                <SettingsSection title="Security">
                    <div className="bg-white dark:bg-slate-900 flex flex-col">
                        <SettingsRow 
                            icon={Lock} 
                            title="Update Password" 
                            subtitle="Manage security credentials" 
                            onClick={() => setIsEditingPassword(!isEditingPassword)}
                            right={<ChevronRight className={clsx("w-5 h-5 text-slate-300 transition-transform duration-200", isEditingPassword && "rotate-90")} />} 
                            className="bg-transparent"
                        />
                        {isEditingPassword && (
                            <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="space-y-3 pt-2">
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 py-3 text-sm font-medium outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600 transition-all placeholder:text-slate-400"
                                        placeholder="Current password"
                                    />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 py-3 text-sm font-medium outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600 transition-all placeholder:text-slate-400"
                                        placeholder="New password (min. 6 chars)"
                                    />
                                    {passwordError && (
                                        <p className="text-rose-500 text-xs font-semibold px-1 flex items-center gap-1.5"><X size={14} /> {passwordError}</p>
                                    )}
                                    {passwordSuccess && (
                                        <p className="text-emerald-500 text-xs font-semibold px-1 flex items-center gap-1.5"><Check size={14} /> {passwordSuccess}</p>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        <button 
                                            onClick={handleSavePassword}
                                            disabled={isPasswordLoading}
                                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {isPasswordLoading ? 'Saving...' : 'Save Password'}
                                        </button>
                                        <button 
                                            onClick={() => setIsEditingPassword(false)}
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </SettingsSection>

                {/* 5. STORAGE */}
                <SettingsSection title="Storage">
                    <DataExportSection />
                    <SettingsRow 
                        icon={Download} 
                        title="Download Report" 
                        subtitle="Get your performance as PDF" 
                        right={
                            <button
                                onClick={handleDownloadReport}
                                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded transition-colors whitespace-nowrap"
                            >PDF</button>
                        }
                    />
                </SettingsSection>

                {/* 6. DANGER ZONE */}
                <SettingsSection title="Danger Zone">
                    <SettingsRow 
                        icon={ShieldCheck} 
                        title={<span className="text-rose-600">Reset Cache</span>} 
                        subtitle={<span className="text-rose-500/80">Fix sync issues (Local only)</span>} 
                        onClick={handleClearData}
                    />
                    <SettingsRow 
                        icon={LogOut} 
                        title={<span className="text-rose-600">Sign Out</span>} 
                        subtitle={<span className="text-rose-500/80">End current session</span>} 
                        onClick={logout}
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
