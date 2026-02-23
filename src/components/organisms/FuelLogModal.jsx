import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Fuel, IndianRupee } from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';
import { useFinance } from '../../context/FinanceContext';
import Button from '../atoms/Button';

const FuelLogModal = ({ isOpen, onClose }) => {
    const { vehicles, getActiveVehicle, addServiceRecord } = useVehicle();
    const { accounts } = useFinance();

    const activeVehicle = getActiveVehicle() || vehicles[0];

    const [vehicleId, setVehicleId] = useState(activeVehicle?.id || '');
    const [odometer, setOdometer] = useState(activeVehicle?.odometer || '');
    const [cost, setCost] = useState('');
    const [liters, setLiters] = useState('');
    const [accountId, setAccountId] = useState('acc_cash');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && activeVehicle) {
            setVehicleId(activeVehicle.id);
            setOdometer(activeVehicle.odometer || '');
            setCost('');
            setLiters('');
            setAccountId('acc_cash');
        }
    }, [isOpen, activeVehicle]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!vehicleId || !odometer || !cost) return;

        setIsSubmitting(true);
        try {
            await addServiceRecord({
                vehicleId,
                type: 'Fuel',
                odometer: Number(odometer),
                cost: Number(cost),
                liters: Number(liters),
                date: new Date().toISOString(),
                accountId,
                note: `Fuel fill-up: ${liters}L`
            });
            onClose();
        } catch (error) {
            console.error("Failed to log fuel:", error);
            alert("Failed to save fuel log. Please try again.");
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
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-xl text-orange-600 dark:text-orange-400">
                                <Fuel className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Fuel Log</h2>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {vehicles.length > 1 && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Vehicle</label>
                                <select 
                                    value={vehicleId} 
                                    onChange={(e) => setVehicleId(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                >
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Cost</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        value={cost}
                                        onChange={(e) => setCost(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl px-3 py-3 pl-7 text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Amount (Liters)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g. 5.5"
                                    value={liters}
                                    onChange={(e) => setLiters(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-3 text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Odometer</label>
                            <input
                                type="number"
                                required
                                value={odometer}
                                onChange={(e) => setOdometer(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Paid From</label>
                            <div className="grid grid-cols-3 gap-2">
                                {accounts.filter(a => !a.isArchived).slice(0, 3).map(acc => (
                                    <button
                                        key={acc.id}
                                        type="button"
                                        onClick={() => setAccountId(acc.id)}
                                        className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all truncate ${accountId === acc.id ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/20 dark:border-orange-500/30 dark:text-orange-400' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                                    >
                                        {acc.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            className="w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 mt-2 bg-orange-600 hover:bg-orange-700 shadow-orange-500/20"
                        >
                            <Check className="w-5 h-5" />
                            Save Log
                        </Button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default FuelLogModal;
