import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Card, CardContent } from '../components/atoms/Card';
import { useAuthContext } from '../hooks/useAuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLogout } from '../hooks/useLogout';
import { User, Lock, Edit2, Check, X, Download, ShieldCheck, LogOut, Moon, Sun } from 'lucide-react';
import Button from '../components/atoms/Button';
import { getReportData, generateUserReportPDF } from '../utils/reportUtils';
import EditProfileModal from '../components/organisms/EditProfileModal';
import { FirestoreService } from '../services/firestore-service';
import LegacyMigrator from '../components/molecules/LegacyMigrator'; // Added
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

const Settings = () => {
    const { user } = useAuthContext();
    const { logout } = useLogout();
    const { theme, toggleTheme } = useTheme();
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
            setPasswordError("All fields are required");
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

            // Re-authenticate
            const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);

            // Update Password
            await updatePassword(auth.currentUser, newPassword);

            setPasswordSuccess("Password updated successfully");
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

    // --- App Settings States ---
    const [appSettings, setAppSettings] = useState({
        language: 'English',
        timeFormat: '12h',
        appLock: false,
        biometrics: false,
        notifications: true
    });

    // Load Settings from Firestore
    useEffect(() => {
        if (!user) return;
        const unsub = FirestoreService.subscribeToDocument(
            `users/${user.uid}/config`,
            'settings',
            (data) => {
                if (data) {
                    setAppSettings(prev => ({ ...prev, ...data }));
                }
            }
        );
        return () => unsub();
    }, [user]);

    const updateSetting = async (key, value) => {
        // Optimistic update
        const newSettings = { ...appSettings, [key]: value };
        setAppSettings(newSettings);

        if (user) {
            try {
                // Merge update
                await FirestoreService.setItem(`users/${user.uid}/config`, 'settings', { [key]: value }, true);
            } catch (e) {
                console.error("Failed to save setting", e);
                // Revert? (Complex without previous state history, but typically safe to ignore strict revert for settings)
            }
        }
    };

    const handleClearData = async () => {
        if (window.confirm("Are you sure you want to sign out and clear local cache? This will NOT delete your cloud data.")) {
            // We just logout and clear localStorage. 
            // Firestore data persists.
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
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-24">

            <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />

            {/* Header / Letterhead Style */}
            <div className="relative overflow-hidden rounded-[2rem] bg-cyan-500 text-white shadow-2xl">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <ShieldCheck size={180} />
                </div>

                {/* Edit Button (Top Right) */}
                <div className="absolute top-6 right-6 z-20">
                    <button
                        onClick={() => setIsEditProfileOpen(true)}
                        className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-md text-white shadow-lg"
                        title="Edit Profile"
                    >
                        <Edit2 size={20} />
                    </button>
                </div>

                <div className="relative z-10 p-10 text-center space-y-6">
                    {/* Avatar */}
                    <div className="relative w-32 h-32 mx-auto">
                        <div className={`w-full h-full backdrop-blur-sm rounded-full p-2 border-4 border-white/30 shadow-2xl overflow-hidden flex items-center justify-center ${user?.profileColor || 'bg-cyan-400'}`}>
                            {user?.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user?.name}
                                    className="w-full h-full object-cover rounded-full bg-slate-100"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full flex items-center justify-center text-4xl font-black !text-white uppercase tracking-wider">
                                    {user?.initials || user?.name?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name & Info */}
                    <div className="space-y-1">
                        <h2 className="text-4xl font-black tracking-tight">{user?.name}</h2>
                        <p className="text-white/80 text-lg font-medium">{user?.email}</p>
                    </div>

                    {/* Status Badges */}
                    <div className="pt-2 flex justify-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold tracking-widest uppercase">
                            <ShieldCheck size={10} /> Verified ID
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold tracking-widest uppercase text-emerald-300">
                            Active
                        </span>
                    </div>
                </div>
            </div>

            {/* Application Settings */}
            <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">Global Preferences</h3>

                <Card className="border-none shadow-premium overflow-hidden">
                    <CardContent className="p-0 divide-y divide-slate-50 dark:divide-slate-800">
                        {/* Language */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Language</p>
                                    <p className="text-xs text-slate-500">System default language</p>
                                </div>
                            </div>
                            <select
                                value={appSettings.language}
                                onChange={(e) => updateSetting('language', e.target.value)}
                                className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-xs font-bold px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option>English</option>
                                <option>Spanish</option>
                                <option>French</option>
                                <option>German</option>
                            </select>
                        </div>

                        {/* Time Format */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Time Format</p>
                                    <p className="text-xs text-slate-500">Display preference</p>
                                </div>
                            </div>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button
                                    onClick={() => updateSetting('timeFormat', '12h')}
                                    className={clsx(
                                        "px-3 py-1 text-[10px] font-black rounded-md transition-all",
                                        appSettings.timeFormat === '12h' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-500"
                                    )}
                                >12H</button>
                                <button
                                    onClick={() => updateSetting('timeFormat', '24h')}
                                    className={clsx(
                                        "px-3 py-1 text-[10px] font-black rounded-md transition-all",
                                        appSettings.timeFormat === '24h' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-500"
                                    )}
                                >24H</button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Appearance */}
            <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">Appearance</h3>
                <Card className="border-none shadow-premium overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-sky-50 dark:bg-sky-900/20 text-sky-600 rounded-xl">
                                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Dark Mode</p>
                                <p className="text-xs text-slate-500">Adjust app appearance</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={clsx(
                                "relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
                                theme === 'dark' ? "bg-indigo-600" : "bg-slate-200"
                            )}
                        >
                            <span
                                className={clsx(
                                    "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300",
                                    theme === 'dark' ? "translate-x-6" : "translate-x-0"
                                )}
                            />
                        </button>
                    </CardContent>
                </Card>
            </section>

            {/* Security */}
            <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">Security & Access</h3>
                <Card className="border-none shadow-premium overflow-hidden">
                    <CardContent className="p-0 divide-y divide-slate-50 dark:divide-slate-800">
                        {/* Manage Password */}
                        <div className="p-4">
                            <button
                                onClick={() => setIsEditingPassword(!isEditingPassword)}
                                className="w-full flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-600 transition-colors">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Update Password</p>
                                        <p className="text-xs text-slate-500">Last changed: --</p>
                                    </div>
                                </div>
                                <Edit2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            </button>

                            {isEditingPassword && (
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="grid gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Current Password</label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">New Password</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                placeholder="Min. 6 characters"
                                            />
                                        </div>
                                    </div>

                                    {passwordError && (
                                        <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-[11px] font-bold p-3 rounded-lg flex items-center gap-2">
                                            <X size={14} /> {passwordError}
                                        </div>
                                    )}
                                    {passwordSuccess && (
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[11px] font-bold p-3 rounded-lg flex items-center gap-2">
                                            <Check size={14} /> {passwordSuccess}
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setIsEditingPassword(false)}>Cancel</Button>
                                        <Button
                                            className="flex-1 rounded-xl h-11 shadow-lg shadow-indigo-100 dark:shadow-none"
                                            onClick={handleSavePassword}
                                            isLoading={isPasswordLoading}
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Data Management & Reports */}
            <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">Storage & Reports</h3>

                <div className="grid gap-4">
                    {/* Download Report */}
                    <Card className="border-none shadow-premium bg-indigo-50/30 dark:bg-indigo-950/10">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                                    <Download className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Download Report</p>
                                    <p className="text-xs text-slate-500">Get your performance as PDF</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDownloadReport}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition-transform active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none"
                            >DOWNLOAD</button>
                        </CardContent>
                    </Card>

                    {/* Clear Configuration */}
                    <Card className="border-none shadow-premium bg-amber-50/30 dark:bg-amber-950/10">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Reset Cache</p>
                                    <p className="text-xs text-slate-500">Fix sync issues by clearing local cache</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClearData}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black rounded-lg transition-transform active:scale-95 shadow-lg shadow-amber-200 dark:shadow-none"
                            >RESET</button>
                        </CardContent>
                    </Card>

                    {/* Migration Tool */}
                    <LegacyMigrator />
                </div>
            </section>

            {/* Logout Section */}
            <div className="pt-4 px-2">
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-sm shadow-xl transition-all hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.98]"
                >
                    <LogOut className="w-5 h-5" />
                    SIGN OUT
                </button>
                <p className="text-center text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] mt-6">
                    Humi Awake v1.2.0 • Build ID: 88AF2
                </p>
            </div>
        </div >
    );
};

export default Settings;
