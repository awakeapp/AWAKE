import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Car, Plus, Settings, Archive, CheckCircle, Trash2 } from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';

const ManageVehiclesModal = ({ isOpen, onClose, setEditingVehicle, setIsAddOpen, setDeleteConfirmId }) => {
    const { vehicles, setVehicleActive, toggleArchiveVehicle } = useVehicle();
    const [showArchived, setShowArchived] = useState(false);

    if (!isOpen) return null;

    const visibleVehicles = vehicles;
    const sortedVehicles = [...visibleVehicles].sort((a, b) => {
        if (a.isActive) return -1;
        if (b.isActive) return 1;
        return 0;
    });

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
                >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                                <Car className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Manage Vehicles</h3>
                                <p className="text-[10px] text-slate-500">{vehicles.length} Vehicles in Fleet</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className={`p-2 rounded-xl transition-colors ${showArchived ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-500'}`}
                            >
                                <Archive className="w-4 h-4" />
                            </button>
                            <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto p-4 space-y-3 flex-1">
                        {sortedVehicles.filter(v => showArchived ? true : !v.isActive).map(vehicle => (
                            <div
                                key={vehicle.id}
                                className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border ${vehicle.isActive ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-100 dark:border-slate-800'} shadow-sm relative overflow-hidden`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${vehicle.isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        <Car className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 cursor-pointer" onClick={() => { if (!showArchived) { setVehicleActive(vehicle.id); onClose(); } }}>
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{vehicle.name}</h4>
                                            {vehicle.isActive && <CheckCircle className="w-4 h-4 text-indigo-500" />}
                                        </div>
                                        <p className="text-xs text-slate-500">{vehicle.brandModel}</p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingVehicle(vehicle);
                                            setIsAddOpen(true);
                                            onClose();
                                        }}
                                        className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 transition-colors"
                                    >
                                        <Settings className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                        onClick={() => toggleArchiveVehicle(vehicle.id)}
                                        className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 transition-colors"
                                    >
                                        <Archive className="w-3 h-3" /> {vehicle.isArchived ? 'Unarchive' : 'Archive'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDeleteConfirmId(vehicle.id);
                                            onClose();
                                        }}
                                        className="text-red-400 hover:text-red-600 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <button
                            onClick={() => {
                                setEditingVehicle(null);
                                setIsAddOpen(true);
                                onClose();
                            }}
                            className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" /> Add New Vehicle
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ManageVehiclesModal;
