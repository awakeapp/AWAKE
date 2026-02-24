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
    <div className={clsx("mb-7 sm:mb-8", className)}>
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-sm dark:shadow-none border border-slate-200 dark:border-[#2C2C2E]">
            {children}
        </div>
    </div>
);

const SettingsRow = ({ icon: Icon, title, subtitle, right, onClick, className, isLast, isDanger }) => (
    <div
        onClick={onClick}
        className={clsx(
            "flex items-center min-h-[50px] sm:min-h-[54px] bg-white dark:bg-[#1C1C1E] active:bg-slate-100 dark:active:bg-[#2C2C2E] transition-colors duration-75 ml-4 pr-4",
            !isLast && "border-b border-slate-100 dark:border-[#38383A]",
            onClick && "cursor-pointer",
            className
        )}
    >
        <div className="flex items-center gap-3.5 py-3 flex-1 min-w-0">
            {Icon && (
                <div className={clsx(
                    "w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center",
                    isDanger
                        ? "bg-rose-50 dark:bg-rose-900/20 text-rose-500"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                )}>
                    <Icon strokeWidth={2} className="w-[18px] h-[18px]" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className={clsx(
                    "text-[16px] xl:text-[17px] leading-tight truncate font-medium",
                    isDanger ? "text-rose-500" : "text-black dark:text-white"
                )}>
                    {title}
                </p>
                {subtitle && (
                    <p className="text-[13px] text-slate-500 dark:text-[#8E8E93] mt-0.5 truncate">{subtitle}</p>
                )}
            </div>
        </div>
        {right ? (
            <div className="shrink-0 ml-2 flex items-center">{right}</div>
        ) : onClick ? (
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-[#5C5C5E] ml-2 shrink-0" />
        ) : null}
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
                    isError
                        ? "bg-rose-500 text-white"
                        : "bg-emerald-500 text-white"
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
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40"
                    onClick={onCancel}
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    className="relative w-full max-w-[300px] bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl overflow-hidden z-10"
                >
                    <div className="px-5 pt-5 pb-4 text-center">
                        <div className={clsx(
                            "w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center",
                            isDanger ? "bg-rose-50 dark:bg-rose-900/20" : "bg-slate-100 dark:bg-slate-800"
                        )}>
                            <AlertTriangle className={clsx(
                                "w-6 h-6",
                                isDanger ? "text-rose-500" : "text-slate-500"
                            )} />
                        </div>
                        <h3 className="text-[17px] font-semibold text-black dark:text-white mb-1">{title}</h3>
                        <p className="text-[14px] text-slate-500 dark:text-[#8E8E93] leading-relaxed">{message}</p>
                    </div>
                    <div className="border-t border-slate-200 dark:border-[#3A3A3C] flex">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3.5 text-[16px] font-medium text-blue-500 active:bg-slate-100 dark:active:bg-[#3A3A3C] transition-colors border-r border-slate-200 dark:border-[#3A3A3C]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={clsx(
                                "flex-1 py-3.5 text-[16px] font-semibold active:bg-slate-100 dark:active:bg-[#3A3A3C] transition-colors",
                                isDanger ? "text-rose-500" : "text-blue-500"
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
        <div className="pb-24 pt-2 sm:pt-4 bg-[#F2F2F7] dark:bg-black min-h-screen text-black dark:text-white font-sans">
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

            <div className="max-w-screen-md mx-auto sm:px-4">

                {/* Header */}
                <div className="px-4 flex items-center gap-3 sm:px-0 mb-4 sm:mb-6 mt-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-transparent hover:bg-black/5 dark:bg-transparent dark:hover:bg-white/10 rounded-full transition-colors active:scale-95 text-black dark:text-white lg:hidden -ml-2 focus:outline-none"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Account</h1>
                    </div>
                </div>

                <div className="px-0 sm:px-0">

                    {/* ────── SECTION 1: IDENTITY ────── */}
                    <SectionLabel>Identity</SectionLabel>
                    <div className="mb-7 sm:mb-8">
                        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-sm dark:shadow-none border border-slate-200 dark:border-[#2C2C2E] p-5">
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div
                                    className="w-[72px] h-[72px] rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400 overflow-hidden shrink-0 border border-slate-200 dark:border-[#3A3A3C] cursor-pointer active:scale-[0.97] transition-transform"
                                    onClick={() => setIsEditProfileOpen(true)}
                                >
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt={user?.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="uppercase text-slate-500 dark:text-slate-400">
                                            {user?.initials || user?.name?.charAt(0) || 'U'}
                                        </span>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <h2 className="text-[20px] font-bold text-black dark:text-white leading-tight truncate">
                                        {user?.name || user?.displayName || 'User'}
                                    </h2>
                                    <p className="text-[13px] text-slate-500 dark:text-[#8E8E93] mt-1 truncate">
                                        {memberId}
                                    </p>
                                    <p className="text-[14px] text-slate-500 dark:text-[#8E8E93] mt-0.5 truncate">
                                        {user?.email}
                                    </p>
                                </div>

                                {/* Edit button */}
                                <button
                                    onClick={() => setIsEditProfileOpen(true)}
                                    className="mt-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors shrink-0"
                                >
                                    <Edit2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ────── SECTION 2: ACCOUNT & SECURITY ────── */}
                    <SectionLabel>Account &amp; Security</SectionLabel>
                    <SettingsGroup>
                        <SettingsRow
                            icon={ShieldCheck}
                            title="Manage Security"
                            subtitle={isEditingPassword ? "Editing" : undefined}
                            onClick={() => {
                                setIsEditingPassword(!isEditingPassword);
                                setPasswordError('');
                                setPasswordSuccess('');
                            }}
                        />
                        {!isEditingPassword && (
                            <SettingsRow
                                icon={KeyRound}
                                title="Update Password"
                                onClick={() => {
                                    setIsEditingPassword(true);
                                    setPasswordError('');
                                    setPasswordSuccess('');
                                }}
                            />
                        )}
                        <SettingsRow
                            icon={Mail}
                            title={user?.email || 'No email'}
                            subtitle="Email address"
                            isLast={!isEditingPassword}
                        />

                        {/* Password editing panel */}
                        {isEditingPassword && (
                            <div className="px-4 py-4 bg-[#F2F2F7] dark:bg-black/40 border-t border-slate-100 dark:border-[#38383A]">
                                <div className="space-y-3">
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-xl px-4 py-3 text-[16px] font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-[#8E8E93] text-black dark:text-white"
                                        placeholder="Current password"
                                    />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-xl px-4 py-3 text-[16px] font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-[#8E8E93] text-black dark:text-white"
                                        placeholder="New password (min. 6 chars)"
                                    />
                                    {passwordError && (
                                        <p className="text-rose-500 text-[13px] font-medium px-1 flex items-center gap-1.5">
                                            <X size={14} /> {passwordError}
                                        </p>
                                    )}
                                    {passwordSuccess && (
                                        <p className="text-emerald-500 text-[13px] font-medium px-1 flex items-center gap-1.5">
                                            <Check size={14} /> {passwordSuccess}
                                        </p>
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
                                            className="flex-1 py-3 bg-slate-200 dark:bg-[#2C2C2E] text-black dark:text-white text-[15px] font-semibold rounded-xl transition-colors active:scale-[0.98]"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSavePassword}
                                            disabled={isPasswordLoading}
                                            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[15px] font-semibold rounded-xl transition-colors disabled:opacity-50 active:scale-[0.98]"
                                        >
                                            {isPasswordLoading ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </SettingsGroup>

                    {/* ────── SECTION 3: DATA & REPORTS ────── */}
                    <SectionLabel>Data &amp; Reports</SectionLabel>
                    <SettingsGroup>
                        <SettingsRow
                            icon={Download}
                            title="Export Data"
                            subtitle="CSV, XLSX export"
                            onClick={() => setIsExportModalOpen(true)}
                        />
                        <SettingsRow
                            icon={FileText}
                            title="Performance Report"
                            subtitle="Download as PDF"
                            onClick={() => setIsReportModalOpen(true)}
                            isLast
                        />
                    </SettingsGroup>

                    {/* ────── SECTION 4: SYSTEM & SESSION ────── */}
                    <SectionLabel>System &amp; Session</SectionLabel>
                    <SettingsGroup>
                        <SettingsRow
                            icon={Trash2}
                            title="Reset Local Cache"
                            isDanger
                            onClick={() => setConfirmDialog({ open: true, action: 'cache' })}
                        />
                        <SettingsRow
                            icon={LogOut}
                            title="Sign Out"
                            isDanger
                            onClick={() => setConfirmDialog({ open: true, action: 'signout' })}
                            isLast
                        />
                    </SettingsGroup>

                    {/* App version */}
                    <p className="text-center text-[12px] text-slate-400 dark:text-[#8E8E93] mt-4 mb-4 tracking-wide font-medium">
                        HUMI AWAKE v1.2.0 • Build ID: 88AF2
                    </p>

                </div>
            </div>
        </div>
    );
};

export default Profile;
