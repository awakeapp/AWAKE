import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/atoms/Card';
import { useAuthContext } from '../hooks/useAuthContext';
import { useLogout } from '../hooks/useLogout';
import { User, Lock, Edit2, Check, X, Download, ShieldCheck, LogOut } from 'lucide-react';
import Button from '../components/atoms/Button';
import { getReportData, generateCredentialPDF } from '../utils/reportUtils';

const Settings = () => {
    const { user, dispatch } = useAuthContext();
    const { logout } = useLogout();
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');

    // Password state
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Report state
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (user) {
            setNewName(user.displayName || '');
            const reportStats = getReportData(user.uid);
            setStats(reportStats);
        }
    }, [user]);

    const handleSaveName = () => {
        if (!newName.trim()) return;

        // Update local state (context)
        const updatedUser = { ...user, displayName: newName };
        dispatch({ type: 'LOGIN', payload: updatedUser });

        // Update in localStorage 'awake_session'
        localStorage.setItem('awake_session', JSON.stringify(updatedUser)); // Fix: Update session too or it reverts on reload if checking raw session

        // Update in "database" (awake_users)
        try {
            const users = JSON.parse(localStorage.getItem('awake_users') || '[]');
            const updatedUsers = users.map(u => u.uid === user.uid ? { ...u, displayName: newName } : u);
            localStorage.setItem('awake_users', JSON.stringify(updatedUsers));
        } catch (e) {
            console.error("Failed to update user database", e);
        }

        setIsEditingName(false);
    };

    const handleSavePassword = () => {
        setPasswordError('');
        setPasswordSuccess('');

        if (!currentPassword || !newPassword) {
            setPasswordError("All fields are required");
            return;
        }

        try {
            const users = JSON.parse(localStorage.getItem('awake_users') || '[]');
            const foundIndex = users.findIndex(u => u.uid === user.uid);

            if (foundIndex === -1) {
                setPasswordError("User record not found");
                return;
            }

            const foundUser = users[foundIndex];

            if (foundUser.password !== currentPassword) {
                setPasswordError("Incorrect current password");
                return;
            }

            // Update password
            users[foundIndex] = { ...foundUser, password: newPassword };
            localStorage.setItem('awake_users', JSON.stringify(users));

            // Update current user object if it contains password (usually shouldn't, but our mock might)
            const updatedUser = { ...user, password: newPassword };
            dispatch({ type: 'LOGIN', payload: updatedUser });
            localStorage.setItem('awake_session', JSON.stringify(updatedUser));

            setPasswordSuccess("Password updated successfully");
            setCurrentPassword('');
            setNewPassword('');
            setTimeout(() => {
                setIsEditingPassword(false);
                setPasswordSuccess('');
            }, 1500);

        } catch (e) {
            setPasswordError("Failed to update password");
        }
    };

    const handleDownloadReport = () => {
        if (!user || !stats) return;
        generateCredentialPDF(user, stats);
    };

    // --- App Settings States ---
    const [appSettings, setAppSettings] = useState(() => {
        const stored = localStorage.getItem('awake_settings');
        return stored ? JSON.parse(stored) : {
            language: 'English',
            timeFormat: '12h',
            appLock: false,
            biometrics: false,
            notifications: true
        };
    });

    const updateSetting = (key, value) => {
        const newSettings = { ...appSettings, [key]: value };
        setAppSettings(newSettings);
        localStorage.setItem('awake_settings', JSON.stringify(newSettings));
    };

    const handleClearData = () => {
        if (window.confirm("Are you sure? This will wipe ALL your local routine and finance data. This cannot be undone.")) {
            const keysToRemove = Object.keys(localStorage).filter(key =>
                key.startsWith('awake_data_') ||
                key.startsWith('awake_finance_data_') ||
                key.startsWith('awake_settings')
            );
            keysToRemove.forEach(k => localStorage.removeItem(k));
            window.location.reload();
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-24">
            {/* Header / Letterhead Style */}
            <div className="relative overflow-hidden rounded-[2rem] bg-indigo-600 text-white shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <ShieldCheck size={180} />
                </div>

                <div className="relative z-10 p-10 text-center space-y-4">
                    <div className="w-24 h-24 mx-auto bg-white text-indigo-600 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-indigo-200/50 shadow-lg">
                        {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <div className="space-y-1">
                        {isEditingName ? (
                            <div className="flex items-center justify-center gap-2">
                                <input
                                    data-testid="name-input"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="bg-indigo-700/50 border border-indigo-400 rounded-xl px-4 py-1 text-center text-lg font-bold outline-none focus:ring-2 focus:ring-white/50"
                                    autoFocus
                                />
                                <button onClick={handleSaveName} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"><Check size={18} /></button>
                                <button onClick={() => { setIsEditingName(false); setNewName(user?.displayName || ''); }} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"><X size={18} /></button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 group">
                                <h2 className="text-2xl font-black tracking-tight">{user?.displayName || 'User'}</h2>
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-white/20 rounded-full"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        )}
                        <p className="text-indigo-200 text-sm font-medium">{user?.email}</p>
                    </div>

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
                                        <p className="text-xs text-slate-500">Last changed: 30 days ago</p>
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
                                                placeholder="Min. 8 characters"
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
                                        <Button className="flex-1 rounded-xl h-11 shadow-lg shadow-indigo-100 dark:shadow-none" onClick={handleSavePassword}>Save Changes</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Data Management */}
            <section className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">Storage & Privacy</h3>
                <Card className="border-none shadow-premium bg-rose-50/30 dark:bg-rose-950/10">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl">
                                <Download className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Clear All Data</p>
                                <p className="text-xs text-slate-500">Permanently wipe local storage</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClearData}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-lg transition-transform active:scale-95 shadow-lg shadow-rose-200 dark:shadow-none"
                        >WIPE DATA</button>
                    </CardContent>
                </Card>
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
        </div>
    );
};

export default Settings;
