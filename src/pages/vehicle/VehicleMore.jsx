import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicle } from '../../context/VehicleContext';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useToast } from '../../context/ToastContext';
import {
    Car, ShieldAlert, Settings, Download, Archive, Trash2, List,
    ArrowLeft, FileText, Upload, Loader2, ZoomIn, X, CheckCircle2,
    AlertCircle, Eye
} from 'lucide-react';
import { SettingsList, SettingsSection, SettingsRow } from '../../components/ui/SettingsList';
import PageLayout from '../../components/layout/PageLayout';
import { AnimatePresence, motion } from 'framer-motion';
import { StorageService } from '../../services/storageService';

// Document definitions — what a vehicle owner needs
const DOCUMENT_TYPES = [
    {
        id: 'rc_book',
        label: 'RC Book',
        subtitle: 'Registration Certificate',
        icon: FileText,
        color: 'indigo'
    },
    {
        id: 'insurance',
        label: 'Insurance',
        subtitle: 'Policy certificate',
        icon: ShieldAlert,
        color: 'emerald'
    },
    {
        id: 'pollution',
        label: 'PUC Certificate',
        subtitle: 'Pollution Under Control',
        icon: CheckCircle2,
        color: 'amber'
    },
    {
        id: 'service_book',
        label: 'Service Book',
        subtitle: 'Manufacturer service record',
        icon: Settings,
        color: 'blue'
    },
];

const COLOR_MAP = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

// Individual document card
const DocumentCard = ({ doc, vehicleId, currentUrl, userId, onUpdate }) => {
    const { showToast } = useToast();
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [lightbox, setLightbox] = useState(false);
    const Icon = doc.icon;
    const colorClass = COLOR_MAP[doc.color] || COLOR_MAP.indigo;
    const hasDoc = !!currentUrl;

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const path = `users/${userId}/vehicles/${vehicleId}/docs/${doc.id}.jpg`;
            const { url } = await StorageService.uploadImage(file, path);
            await onUpdate({ [`docs.${doc.id}`]: url });
            showToast(`${doc.label} uploaded!`, 'success');
        } catch (e) {
            showToast(`Upload failed: ${e.message}`, 'error');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleRemove = async () => {
        try {
            await StorageService.deleteImage(`users/${userId}/vehicles/${vehicleId}/docs/${doc.id}.jpg`);
            await onUpdate({ [`docs.${doc.id}`]: null });
            showToast(`${doc.label} removed.`, 'info');
        } catch (e) {
            showToast(`Remove failed.`, 'error');
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-3 p-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 dark:text-white text-sm">{doc.label}</p>
                        <p className="text-[11px] text-slate-400">{doc.subtitle}</p>
                    </div>
                    {hasDoc ? (
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5"/> Saved
                            </span>
                        </div>
                    ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">None</span>
                    )}
                </div>

                {/* Thumbnail + Actions */}
                {hasDoc ? (
                    <div className="px-4 pb-4 space-y-2">
                        <div
                            className="relative rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 cursor-pointer group"
                            onClick={() => setLightbox(true)}
                        >
                            <img src={currentUrl} alt={doc.label} className="w-full h-32 object-cover group-hover:brightness-90 transition-all" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                <ZoomIn className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                            >
                                <Upload className="w-3.5 h-3.5"/> Replace
                            </button>
                            <button
                                onClick={handleRemove}
                                className="flex-1 py-2.5 border border-red-100 dark:border-red-500/20 rounded-xl text-[11px] font-black uppercase tracking-wider text-rose-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                            >
                                <X className="w-3.5 h-3.5"/> Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="px-4 pb-4">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-indigo-400/60 hover:text-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 transition-all text-[11px] font-black uppercase tracking-widest active:scale-[0.98] disabled:opacity-50"
                        >
                            {isUploading
                                ? <><Loader2 className="w-4 h-4 animate-spin"/> Uploading...</>
                                : <><Upload className="w-4 h-4"/> Upload Photo</>
                            }
                        </button>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
                        onClick={() => setLightbox(false)}
                    >
                        <button
                            className="absolute top-5 right-5 p-2 bg-white/10 rounded-full text-white"
                            onClick={() => setLightbox(false)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="text-center" onClick={e => e.stopPropagation()}>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-3">{doc.label}</p>
                            <img
                                src={currentUrl}
                                alt={doc.label}
                                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// ====================== Main Page ======================
const VehicleMore = () => {
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const {
        vehicles,
        getActiveVehicle,
        toggleArchiveVehicle,
        deleteVehicle,
        updateVehicle
    } = useVehicle();

    const activeVehicle = getActiveVehicle();

    const handleExportCSV = () => {
        if (!activeVehicle) return;
        alert("Exporting " + activeVehicle.name + " data as CSV...");
    };

    const handleDocUpdate = async (updates) => {
        if (!activeVehicle) return;
        await updateVehicle(activeVehicle.id, updates);
    };

    return (
        <PageLayout
            header={
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Vehicle More</h1>
                </div>
            }
        >
            <SettingsList>
                <SettingsSection title="Management">
                    <SettingsRow
                        icon={List}
                        title="Manage Vehicles"
                        subtitle={`${vehicles.length} Total Vehicles`}
                        onClick={() => navigate('/vehicle/dashboard?manage=true')}
                    />
                    <SettingsRow
                        icon={Settings}
                        title="Maintenance Templates"
                        subtitle="Service intervals & checklists"
                        onClick={() => alert("Templates module coming soon")}
                        isLast
                    />
                </SettingsSection>

                {/* === Vehicle Documents Section === */}
                {activeVehicle && (
                    <SettingsSection title={`${activeVehicle.name} — Documents`}>
                        <div className="px-4 py-3 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Store your vehicle documents securely. Photos are auto-compressed and stored privately.
                            </p>
                            {DOCUMENT_TYPES.map(doc => (
                                <DocumentCard
                                    key={doc.id}
                                    doc={doc}
                                    vehicleId={activeVehicle.id}
                                    currentUrl={activeVehicle?.docs?.[doc.id] || null}
                                    userId={user?.uid}
                                    onUpdate={handleDocUpdate}
                                />
                            ))}
                        </div>
                    </SettingsSection>
                )}

                {/* Danger Zone */}
                {activeVehicle && (
                    <SettingsSection title={`${activeVehicle.name} — Danger Zone`}>
                        <SettingsRow
                            icon={Download}
                            title="Export Vehicle Data"
                            subtitle="Download ledger as CSV"
                            onClick={handleExportCSV}
                        />
                        <SettingsRow
                            icon={Archive}
                            title="Archive This Vehicle"
                            isDanger
                            onClick={() => {
                                if (window.confirm("Archive " + activeVehicle.name + "?")) {
                                    toggleArchiveVehicle(activeVehicle.id);
                                    navigate(-1);
                                }
                            }}
                        />
                        <SettingsRow
                            icon={Trash2}
                            title="Delete Vehicle"
                            isDanger
                            isLast
                            onClick={() => {
                                if (window.confirm("Are you sure? This is permanent.")) {
                                    deleteVehicle(activeVehicle.id);
                                    navigate('/vehicle');
                                }
                            }}
                        />
                    </SettingsSection>
                )}

                <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 mt-8 font-bold tracking-widest uppercase">
                    AWAKE Vehicle Module
                </p>
            </SettingsList>
        </PageLayout>
    );
};

export default VehicleMore;
