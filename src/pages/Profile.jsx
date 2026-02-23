import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useAuthContext } from '../hooks/useAuthContext';
import { useLogout } from '../hooks/useLogout';
import { Lock, Edit2, Check, X, Download, ShieldCheck, LogOut, ChevronRight, ChevronLeft } from 'lucide-react';
import { getReportData, generateUserReportPDF } from '../utils/reportUtils';
import EditProfileModal from '../components/organisms/EditProfileModal';
import DataExportSection from '../components/organisms/DataExportSection';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/atoms/BackButton';

// Shared Row Component matching new style
const ProfileRow = ({ title, value, onClick, className, isDefaultActions, isDanger, isAction }) => (
    <div 
        onClick={onClick}
        className={clsx(
            "px-4 py-3.5 bg-white dark:bg-[#1C1C1E] active:bg-slate-100 dark:active:bg-[#2C2C2E] transition-colors rounded-xl border border-slate-200 dark:border-[#2C2C2E] shadow-sm dark:shadow-none mb-4",
            onClick && "cursor-pointer",
            className
        )}
    >
        <p className="text-[13px] font-medium text-slate-500 dark:text-[#8E8E93] mb-1">{title}</p>
        <div className="flex items-center justify-between">
            {isAction ? (
                <p className={clsx("text-[16px] xl:text-[17px] leading-tight font-medium", isDanger ? "text-rose-500" : "text-emerald-500")}>
                    {value}
                </p>
            ) : (
                <p className={clsx("text-[16px] xl:text-[17px] text-black dark:text-white leading-tight font-medium truncate", !value && "text-slate-400 dark:text-slate-500 italic")}>
                    {value || 'Not set'}
                </p>
            )}
            
            {(onClick && !isDefaultActions) && <ChevronRight className="w-5 h-5 text-slate-300 dark:text-[#5C5C5E] shrink-0" />}
        </div>
    </div>
);

const Profile = () => {
    const { user } = useAuthContext();
    const { logout } = useLogout();
    const { t } = useTranslation();
    const navigate = useNavigate();
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
        <div className="pb-24 pt-4 sm:pt-8 bg-[#F2F2F7] dark:bg-black min-h-screen">
            <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />

            <div className="max-w-screen-md mx-auto sm:px-4">
                
                {/* Header */}
                <div className="px-4 flex items-center justify-between sm:px-0 mb-6 mt-2 relative">
                    <div className="w-10 z-10 flex items-center justify-center -ml-2">
                        <BackButton className="bg-transparent hover:bg-black/5 dark:bg-transparent dark:hover:bg-white/10 text-black dark:text-white" />
                    </div>
                    <h1 className="text-[17px] font-semibold tracking-tight text-black dark:text-white absolute left-0 right-0 text-center pointer-events-none">Profile</h1>
                    <div className="w-10"></div> {/* Spacer for symmetry */}
                </div>

                {/* Concentric Avatar Header */}
                <div className="flex flex-col items-center pt-4 pb-8">
                    <div className="relative mb-6">
                        {/* Concentric Circles Background */}
                        <div className="absolute inset-0 m-auto w-[180px] h-[180px] rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] opacity-50 blur-[2px] scale-110"></div>
                        <div className="absolute inset-0 m-auto w-[160px] h-[160px] rounded-full bg-[#D1D1D6] dark:bg-[#3A3A3C] opacity-70 blur-[1px] scale-105"></div>
                        
                        <div className="relative w-[140px] h-[140px] rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-4xl font-bold text-slate-400 overflow-hidden border-2 border-[#F2F2F7] dark:border-black shadow-lg z-10">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt={user?.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="uppercase">{user?.initials || user?.name?.charAt(0) || 'U'}</span>
                            )}
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setIsEditProfileOpen(true)}
                        className="text-[17px] font-medium text-emerald-500 active:text-emerald-600 transition-colors"
                    >
                        Edit
                    </button>
                </div>

                {/* Profile Fields Grouped Blocks */}
                <div className="px-4 sm:px-0 mt-2">
                    
                    <ProfileRow title="About" value={user?.email} />
                    <ProfileRow title="Name" value={user?.name} />
                    <ProfileRow title="Member ID" value={`AWK-${user?.uid?.slice(-4).toUpperCase() || 'GUEST'}`} />

                    {/* Security Sub-section */}
                    <div className="mt-8 mb-4">
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest px-2 mb-2">Account Security</h3>
                        <ProfileRow 
                            title="Update Password" 
                            value={isEditingPassword ? "Cancel Editing" : "Manage Security"} 
                            onClick={() => setIsEditingPassword(!isEditingPassword)}
                            isDefaultActions
                        />
                        {isEditingPassword && (
                            <div className="px-4 py-4 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-xl mb-6 shadow-sm dark:shadow-none animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="space-y-3">
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full bg-[#F2F2F7] dark:bg-black border-none rounded-lg px-4 py-3 text-[16px] font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-[#8E8E93] text-black dark:text-white"
                                        placeholder="Current password"
                                    />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-[#F2F2F7] dark:bg-black border-none rounded-lg px-4 py-3 text-[16px] font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-[#8E8E93] text-black dark:text-white"
                                        placeholder="New password (min. 6 chars)"
                                    />
                                    {passwordError && (
                                        <p className="text-rose-500 text-[13px] font-medium px-1 flex items-center gap-1.5"><X size={14} /> {passwordError}</p>
                                    )}
                                    {passwordSuccess && (
                                        <p className="text-emerald-500 text-[13px] font-medium px-1 flex items-center gap-1.5"><Check size={14} /> {passwordSuccess}</p>
                                    )}
                                    <div className="pt-2">
                                        <button 
                                            onClick={handleSavePassword}
                                            disabled={isPasswordLoading}
                                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[16px] font-semibold rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {isPasswordLoading ? 'Saving...' : 'Save Password'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Data Sub-section */}
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest px-2 mb-2">Storage & Data</h3>
                        <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-xl mb-4 p-4 shadow-sm dark:shadow-none">
                            <DataExportSection />
                        </div>
                        <ProfileRow 
                            title="Reports" 
                            value="Download Performance PDF" 
                            onClick={handleDownloadReport} 
                            isAction
                        />
                    </div>

                    {/* Danger Sub-section */}
                    <div className="mt-8">
                        <ProfileRow 
                            title="Troubleshooting" 
                            value="Reset Local Cache" 
                            onClick={handleClearData} 
                            isAction
                            isDanger
                        />
                        <ProfileRow 
                            title="Session" 
                            value="Sign Out" 
                            onClick={logout} 
                            isAction
                            isDanger
                        />
                    </div>

                </div>

            </div>
        </div>
    );
};

export default Profile;
