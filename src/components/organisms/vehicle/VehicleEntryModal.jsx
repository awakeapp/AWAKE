import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Fuel, Settings, Banknote, Car } from 'lucide-react';
import { useVehicle } from '../../../context/VehicleContext';
import { useFinance } from '../../../context/FinanceContext';
import Button from '../../atoms/Button';
import { useScrollLock } from '../../../hooks/useScrollLock';

const ENTRY_TYPES = [
    { id: 'fuel', label: 'Fuel', icon: Fuel, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { id: 'service', label: 'Service', icon: Settings, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'insurance', label: 'Insurance', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { id: 'other', label: 'Other', icon: Car, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' }
];

const VehicleEntryModal = ({ isOpen, onClose, activeVehicle }) => {
    useScrollLock(isOpen);
    const { addServiceRecord } = useVehicle();
    const { accounts } = useFinance();

    const [type, setType] = useState('fuel');
    const [odometer, setOdometer] = useState('');
    const [cost, setCost] = useState('');
    const [liters, setLiters] = useState('');
    const [notes, setNotes] = useState('');
    const [accountId, setAccountId] = useState('acc_cash');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && activeVehicle) {
            setOdometer(activeVehicle.odometer || '');
            setCost('');
            setLiters('');
            setNotes('');
            setType('fuel');
            setAccountId('acc_cash');
        }
    }, [isOpen, activeVehicle]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!activeVehicle || !cost) return;
        if (type === 'fuel' && !odometer) return; // Odometer required for fuel

        setIsSubmitting(true);
        try {
            await addServiceRecord({
                vehicleId: activeVehicle.id,
                type: type.charAt(0).toUpperCase() + type.slice(1), // 'Fuel', 'Service', etc
                odometer: odometer ? Number(odometer) : null,
                cost: Number(cost),
                liters: type === 'fuel' && liters ? Number(liters) : null,
                date: new Date().toISOString(),
                accountId,
                notes: notes.trim()
            });
            onClose();
        } catch (error) {
            console.error("Failed to log entry:", error);
            alert("Failed to save entry. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 z-10"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Vehicle Entry</h2>
                        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Type Selector */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {ENTRY_TYPES.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setType(t.id)}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${type === t.id ? t.bg + ' ' + t.color + ' ring-1 ring-current' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    <t.icon className="w-5 h-5" />
                                    <span className="text-[10px] font-bold uppercase">{t.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                            <input
                                type="number"
                                placeholder="Total Cost"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                autoFocus
                                required
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-4 pl-8 text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>

                        {type === 'fuel' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Current Odo"
                                        value={odometer}
                                        required
                                        onChange={(e) => setOdometer(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Liters (Opt)"
                                        value={liters}
                                        onChange={(e) => setLiters(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>
                        )}

                        <input
                            type="text"
                            placeholder="Notes or Service Details..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />

                        {/* Account Selector */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Paid From</label>
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                                {accounts.filter(a => !a.isArchived).map(acc => (
                                    <button
                                        key={acc.id}
                                        type="button"
                                        onClick={() => setAccountId(acc.id)}
                                        className={`shrink-0 py-2 px-3 text-xs font-bold rounded-lg border transition-all ${accountId === acc.id ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-400' : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                                    >
                                        {acc.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            className="w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 mt-2 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                        >
                            <Check className="w-5 h-5" />
                            Save {type.charAt(0).toUpperCase() + type.slice(1)} Record
                        </Button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default VehicleEntryModal;
