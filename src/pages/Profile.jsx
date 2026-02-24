import React, { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { useAuthContext } from '../hooks/useAuthContext';
import { useLogout } from '../hooks/useLogout';
import {
 Lock, Edit2, Check, X, Download, ShieldCheck, LogOut,
 ChevronRight, ArrowLeft, Trash2, Info, FileText,
 Database, KeyRound, Mail, User, AlertTriangle
} from 'lucide-react';
import EditProfileModal from '../components/organisms/EditProfileModal';
import ExportModal from '../components/organisms/ExportModal';
import ReportModal from '../components/organisms/ReportModal';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* ──────────────────────────────────────────────
 Shared UI components (matching Settings page)
 ────────────────────────────────────────────── */

const SectionLabel = ({ children }) => (
 <h3 className="text-xs font-semibold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest px-2 mb-2">
 {children}
 </h3>
);

const SettingsGroup = ({ children, className }) => (
    <div className={clsx("mb-5", className)}>
        <div className="bg-[#1C1C1E] rounded-xl overflow-hidden shadow-sm">
            {children}
        </div>
    </div>
);

const SettingsRow = ({ icon: Icon, title, subtitle, right, onClick, className, isLast, isDanger }) => (
    <div 
        onClick={onClick}
        className={clsx(
            "flex items-center min-h-[52px] active:bg-[#2C2C2E] transition-colors duration-200 cursor-pointer group",
            !isLast && "ml-12 border-b border-[#2C2C2E]",
            className
        )}
    >
        <div className={clsx("flex items-center py-3 flex-1 min-w-0 pr-4", !isLast ? "" : "ml-4")}>
            {Icon && (
                <div className={clsx(
                    "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-slate-800/50",
                    !isLast ? "-ml-8 mr-4" : "mr-4",
                    isDanger ? "text-rose-500 bg-rose-500/10" : "text-slate-400"
                )}>
                    <Icon strokeWidth={2.5} className="w-5 h-5" />
                </div>
            )}
            <div className="flex-1 min-w-0 flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                    <p className={clsx(
                        "text-[16px] xl:text-[17px] font-medium leading-tight truncate",
                        isDanger ? "text-rose-500" : "text-white"
                    )}>{title}</p>
                    {subtitle && <p className="text-[13px] text-[#8E8E93] mt-1 truncate">{subtitle}</p>}
                </div>
                
                {right ? (
                    <div className="shrink-0 ml-2 flex items-center">{right}</div>
                ) : (
                    <ChevronRight className="w-5 h-5 text-[#5C5C5E] ml-2 shrink-0 group-active:translate-x-0.5 transition-transform" />
                )}
            </div>
        </div>
    </div>
);

/* ──────────────────────────────────────────────
 Toast component for success/error notifications
 ────────────────────────────────────────────── */

const Toast = ({ message, isError, isVisible }) => {
    if (!isVisible) return null;
    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className={clsx(
                    "fixed top-12 left-4 right-4 z-[100] mx-auto max-w-md px-4 py-3 rounded-xl shadow-lg text-center text-[15px] font-semibold",
                    isError ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                )}
            >
                <div className="flex items-center justify-center gap-2">
                    {isError ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    {message}
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

/* ──────────────────────────────────────────────
 Confirmation Dialog
 ────────────────────────────────────────────── */

const ConfirmDialog = ({ isOpen, title, message, confirmLabel, isDanger, onConfirm, onCancel }) => {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-[320px] bg-[#1C1C1E] rounded-3xl border border-white/5 shadow-2xl overflow-hidden z-10"
                >
                    <div className="px-6 pt-8 pb-6 text-center">
                        <div className={clsx(
                            "w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center",
                            isDanger ? "bg-rose-500/10" : "bg-slate-800/50"
                        )}>
                            <AlertTriangle className={clsx("w-7 h-7", isDanger ? "text-rose-500" : "text-slate-400")} />
                        </div>
                        <h3 className="text-[19px] font-bold text-white mb-2">{title}</h3>
                        <p className="text-[14px] text-[#8E8E93] leading-relaxed">{message}</p>
                    </div>
                    <div className="flex border-t border-white/5">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-4 text-[16px] font-bold text-[#8E8E93] active:bg-white/5 transition-colors border-r border-white/5"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={clsx(
                                "flex-1 py-4 text-[16px] font-bold active:bg-white/5 transition-colors",
                                isDanger ? "text-rose-500" : "text-white"
                            )}
                        >
                            {confirmLabel || 'Confirm'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

/* ──────────────────────────────────────────────
 Profile Page (Account Center)
 ────────────────────────────────────────────── */

const Profile = () => {
    const { user } = useAuthContext();
    const { logout } = useLogout();
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Modal states
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Password state
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });

    // Toast state
    const [toast, setToast] = useState({ visible: false, message: '', isError: false });

    const showToast = useCallback((message, isError = false) => {
        setToast({ visible: true, message, isError });
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
    }, []);

    const handleSavePassword = async () => {
        setPasswordError('');
        setPasswordSuccess('');
        setIsPasswordLoading(true);

        if (!currentPassword || !newPassword) {
            setPasswordError('All fields are required');
            setIsPasswordLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters');
            setIsPasswordLoading(false);
            return;
        }

        try {
            if (!auth.currentUser) throw new Error('No user logged in');

            const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);

            setPasswordSuccess('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            showToast('Password updated successfully');
            setTimeout(() => {
                setIsEditingPassword(false);
                setPasswordSuccess('');
            }, 1500);
        } catch (e) {
            console.error('Password Update Error', e);
            if (e.code === 'auth/wrong-password') {
                setPasswordError('Incorrect current password');
            } else if (e.code === 'auth/requires-recent-login') {
                setPasswordError('Please log in again before changing password');
            } else {
                setPasswordError('Failed to update password: ' + e.message);
            }
        } finally {
            setIsPasswordLoading(false);
        }
    };

    const handleClearData = async () => {
        try {
            await logout();
            localStorage.clear();
            window.location.reload();
        } catch (e) {
            console.error('Clear data error', e);
        }
    };

    const handleSignOut = async () => {
        try {
            await logout();
        } catch (e) {
            console.error('Sign out error', e);
        }
    };

    const memberId = `AWK-${user?.uid?.slice(-4).toUpperCase() || 'GUEST'}`;

    return (
        <div className="pb-24 pt-4 bg-black min-h-screen text-white font-sans selection:bg-indigo-500/30">
            {/* Modals */}
            <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onSuccess={(msg, isErr) => showToast(msg, isErr)}
            />
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSuccess={(msg, isErr) => showToast(msg, isErr)}
            />
            <ConfirmDialog
                isOpen={confirmDialog.open}
                title={confirmDialog.action === 'cache' ? 'Reset Local Cache' : 'Sign Out'}
                message={confirmDialog.action === 'cache'
                    ? 'This will sign you out and clear all local data. Your cloud data will not be deleted.'
                    : 'Are you sure you want to sign out of your account?'
                }
                confirmLabel={confirmDialog.action === 'cache' ? 'Reset' : 'Sign Out'}
                isDanger
                onConfirm={() => {
                    setConfirmDialog({ open: false, action: null });
                    if (confirmDialog.action === 'cache') handleClearData();
                    else handleSignOut();
                }}
                onCancel={() => setConfirmDialog({ open: false, action: null })}
            />
            <Toast message={toast.message} isError={toast.isError} isVisible={toast.visible} />

            <div className="max-w-screen-md mx-auto px-4">

                {/* Header */}
                <div className="flex items-center gap-4 mb-4 mt-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1 -ml-1 text-white hover:opacity-70 transition-opacity lg:hidden"
                    >
                        <ArrowLeft className="w-7 h-7" />
                    </button>
                    <h1 className="text-[32px] font-bold tracking-tight text-white">Account</h1>
                </div>

                <div className="mt-8">

                    {/* ────── SECTION 1: IDENTITY ────── */}
                    <div className="mb-8">
                        <div className="bg-[#1C1C1E] rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
                           {/* Subtle background glow */}
                           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700" />
                           
                           <div className="flex items-center gap-5 relative z-10">
                                {/* Avatar */}
                                <div
                                    className="w-[84px] h-[84px] rounded-[28px] bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-400 overflow-hidden shrink-0 border border-white/10 cursor-pointer active:scale-95 transition-all shadow-xl"
                                    onClick={() => setIsEditProfileOpen(true)}
                                >
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt={user?.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="uppercase text-slate-400">
                                            {user?.name?.charAt(0) || 'U'}
                                        </span>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-[22px] font-bold text-white leading-tight truncate">
                                        {user?.name || user?.displayName || 'User'}
                                    </h2>
                                    <div className="mt-1.5 flex flex-col gap-0.5">
                                        <span className="text-[13px] font-bold text-indigo-400 uppercase tracking-wider">
                                            {memberId}
                                        </span>
                                        <span className="text-[14px] text-[#8E8E93] truncate">
                                            {user?.email}
                                        </span>
                                    </div>
                                </div>

                                {/* Edit button */}
                                <button
                                    onClick={() => setIsEditProfileOpen(true)}
                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[#2C2C2E] text-[#8E8E93] active:scale-90 transition-all border border-white/5"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ────── SECTION 2: PASSWORD & SECURITY ────── */}
                    <SettingsGroup>
                        <SettingsRow
                            icon={ShieldCheck}
                            title="Update Password"
                            subtitle={isEditingPassword ? "Editing security settings" : "Change your account password"}
                            onClick={() => {
                                setIsEditingPassword(!isEditingPassword);
                                setPasswordError('');
                                setPasswordSuccess('');
                            }}
                        />
                        
                        {/* Password editing drawer */}
                        {isEditingPassword && (
                            <div className="px-5 py-5 bg-[#1C1C1E] border-t border-[#2C2C2E] animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full bg-[#2C2C2E] border border-white/5 rounded-2xl px-5 py-4 text-[16px] font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-[#48484A] text-white"
                                            placeholder="Current password"
                                        />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-[#2C2C2E] border border-white/5 rounded-2xl px-5 py-4 text-[16px] font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-[#48484A] text-white"
                                            placeholder="New password (min. 6 chars)"
                                        />
                                    </div>

                                    {passwordError && (
                                        <div className="p-3 bg-rose-500/10 text-rose-500 text-[13px] font-bold rounded-xl border border-rose-500/20 flex items-center gap-2">
                                            <X size={14} /> {passwordError}
                                        </div>
                                    )}
                                    {passwordSuccess && (
                                        <div className="p-3 bg-emerald-500/10 text-emerald-500 text-[13px] font-bold rounded-xl border border-emerald-500/20 flex items-center gap-2">
                                            <Check size={14} /> {passwordSuccess}
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-1">
                                        <button
                                            onClick={() => {
                                                setIsEditingPassword(false);
                                                setPasswordError('');
                                                setPasswordSuccess('');
                                                setCurrentPassword('');
                                                setNewPassword('');
                                            }}
                                            className="flex-1 py-4 bg-[#2C2C2E] text-white text-[15px] font-bold rounded-2xl transition-all active:scale-[0.97]"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSavePassword}
                                            disabled={isPasswordLoading}
                                            className="flex-1 py-4 bg-white text-black text-[15px] font-bold rounded-2xl transition-all disabled:opacity-50 active:scale-[0.97]"
                                        >
                                            {isPasswordLoading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <SettingsRow
                            icon={Mail}
                            title={user?.email || 'No email set'}
                            subtitle="Primary email address"
                            isLast={true}
                            right={<span className="text-[12px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">VERIFIED</span>}
                        />
                    </SettingsGroup>

                    {/* ────── SECTION 3: DATA & REPORTS ────── */}
                    <SettingsGroup>
                        <SettingsRow
                            icon={Download}
                            title="Export Data"
                            subtitle="Download your activity records as CSV"
                            onClick={() => setIsExportModalOpen(true)}
                        />
                        <SettingsRow
                            icon={FileText}
                            title="Performance Report"
                            subtitle="Generate a detailed PDF summary"
                            onClick={() => setIsReportModalOpen(true)}
                            isLast={true}
                        />
                    </SettingsGroup>

                    {/* ────── SECTION 4: SYSTEM & SESSION ────── */}
                    <SettingsGroup>
                        <SettingsRow
                            icon={Trash2}
                            title="Reset Local Cache"
                            subtitle="Clear synced files and images"
                            isDanger
                            onClick={() => setConfirmDialog({ open: true, action: 'cache' })}
                        />
                        <SettingsRow
                            icon={LogOut}
                            title="Sign Out"
                            subtitle="End your current session"
                            isDanger
                            onClick={() => setConfirmDialog({ open: true, action: 'signout' })}
                            isLast={true}
                        />
                    </SettingsGroup>

                    {/* App version info footer */}
                    <div className="mt-12 mb-12 flex flex-col items-center gap-1 opacity-50">
                        <p className="text-[11px] font-bold text-[#48484A] tracking-widest uppercase">
                            HUMI AWAKE v1.2.0 • Build ID: 88AF2
                        </p>
                        <p className="text-[10px] text-[#48484A]">
                            Secure encryption enabled for all cloud data
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;
