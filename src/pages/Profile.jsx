import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    User, Mail, ShieldCheck, KeyRound, Download, FileText, 
    Trash2, LogOut, Edit2, Check, X, AlertTriangle, ArrowLeft 
} from 'lucide-react';
import { useAuthContext } from '../hooks/useAuthContext';
import { useLogout } from '../hooks/useLogout';
import { auth } from '../lib/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { AppHeader } from '../components/ui/AppHeader';
import { SettingsList, SettingsSection, SettingsRow } from '../components/ui/SettingsList';
import ConfirmDialog from '../components/organisms/ConfirmDialog';
import EditProfileModal from '../components/organisms/EditProfileModal';
import ExportModal from '../components/organisms/ExportModal';
import ReportModal from '../components/organisms/ReportModal';
import { useToast } from '../context/ToastContext';

const Profile = () => {
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const { logout } = useLogout();
    const { showToast } = useToast();

    // Modals
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isConfirmSignOutOpen, setIsConfirmSignOutOpen] = useState(false);
    const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

    // Password State
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    const handleSavePassword = async () => {
        if (!currentPassword || !newPassword) {
            showToast('All fields are required', 'error');
            return;
        }
        setIsPasswordLoading(true);
        try {
            const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            showToast('Password updated successfully', 'success');
            setIsEditingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setIsPasswordLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await logout();
            navigate('/');
        } catch (e) {
            console.error(e);
        }
    };

    const handleResetCache = () => {
        localStorage.clear();
        window.location.reload();
    };

    const memberId = `AWK-${user?.uid?.slice(-4).toUpperCase() || 'GUEST'}`;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black pb-24">
            <AppHeader title="Account" showBack onBack={() => navigate(-1)} />

            <div className="pt-[calc(56px+env(safe-area-inset-top))]">
                <SettingsList>
                    {/* Identity */}
                    <SettingsSection title="Identity">
                        <div className="px-5 py-6 flex items-center gap-5">
                            <div className="w-20 h-20 rounded-[24px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-white/10 overflow-hidden shrink-0">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold uppercase text-slate-400">{user?.displayName?.[0] || 'U'}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-[20px] font-bold text-slate-900 dark:text-white truncate">{user?.displayName || 'User'}</h2>
                                <p className="text-[12px] font-bold text-primary-600 uppercase tracking-widest mt-1">{memberId}</p>
                                <p className="text-[14px] text-slate-500 mt-0.5 truncate">{user?.email}</p>
                            </div>
                            <button 
                                onClick={() => setIsEditOpen(true)}
                                className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all border border-slate-200/50 dark:border-white/5"
                            >
                                <Edit2 size={18} />
                            </button>
                        </div>
                    </SettingsSection>

                    {/* Security */}
                    <SettingsSection title="Security">
                        <SettingsRow 
                            icon={KeyRound} 
                            title="Update Password" 
                            subtitle="Change your account credential"
                            onClick={() => setIsEditingPassword(!isEditingPassword)}
                        />
                        {isEditingPassword && (
                            <div className="p-4 bg-slate-50 dark:bg-[#1C1C1E] border-t border-slate-100 dark:border-white/5 flex flex-col gap-3">
                                <input 
                                    type="password" 
                                    placeholder="Current Password" 
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/50 text-[15px]" 
                                />
                                <input 
                                    type="password" 
                                    placeholder="New Password" 
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/50 text-[15px]" 
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setIsEditingPassword(false)}
                                        className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm"
                                    >Cancel</button>
                                    <button 
                                        onClick={handleSavePassword}
                                        disabled={isPasswordLoading}
                                        className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl text-sm disabled:opacity-50"
                                    >{isPasswordLoading ? 'Saving...' : 'Save'}</button>
                                </div>
                            </div>
                        )}
                        <SettingsRow 
                            icon={Mail} 
                            title="Email Address"
                            subtitle={user?.email}
                            isLast
                            rightElement={<span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">VERIFIED</span>}
                        />
                    </SettingsSection>

                    {/* Data */}
                    <SettingsSection title="Data & Activity">
                        <SettingsRow 
                            icon={Download} 
                            title="Export Activity Data" 
                            subtitle="JSON summary of your entries"
                            onClick={() => setIsExportOpen(true)}
                        />
                        <SettingsRow 
                            icon={FileText} 
                            title="Performance Report" 
                            subtitle="Generate detailed PDF summary"
                            isLast
                            onClick={() => setIsReportOpen(true)}
                        />
                    </SettingsSection>

                    {/* Session */}
                    <SettingsSection title="Session">
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
                </SettingsList>
            </div>

            <EditProfileModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
            <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} onSuccess={(msg, err) => showToast(msg, err ? 'error' : 'success')} />
            <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} onSuccess={(msg, err) => showToast(msg, err ? 'error' : 'success')} />
            
            <ConfirmDialog 
                isOpen={isConfirmSignOutOpen} 
                onClose={() => setIsConfirmSignOutOpen(false)} 
                onConfirm={handleSignOut} 
                title="Sign Out" 
                message="End current session?" 
                confirmText="Sign Out" 
                isDestructive 
            />
            <ConfirmDialog 
                isOpen={isConfirmResetOpen} 
                onClose={() => setIsConfirmResetOpen(false)} 
                onConfirm={handleResetCache} 
                title="Reset Cache" 
                message="Clear all local data?" 
                confirmText="Reset" 
                isDestructive 
            />
        </div>
    );
};

export default Profile;
