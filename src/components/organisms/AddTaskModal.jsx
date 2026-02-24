import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Type } from 'lucide-react';

import { useScrollLock } from '../../hooks/useScrollLock';

const AddTaskModal = ({ isOpen, onClose, onSave }) => {
    useScrollLock(isOpen);
    const [name, setName] = useState('');
    const [time, setTime] = useState('');

    const handleSave = () => {
        if (!name.trim() || !time) return;

        const newTask = {
            id: `task_${Date.now()}`,
            name: name.trim(),
            time,
            icon: '✨', // Default icon
            status: 'unchecked'
        };

        onSave(newTask);
        // Reset form
        setName('');
        setTime('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
                />

                {/* Modal */}
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full sm:max-w-sm bg-[#FAFAFA] dark:bg-slate-900 rounded-t-[24px] sm:rounded-2xl shadow-2xl overflow-hidden pointer-events-auto ring-1 ring-black/5"
                >
                    {/* Header - Compact & Clean */}
                    <div className="px-6 pt-5 pb-2 flex items-center justify-between">
                        <h3 className="text-slate-900 dark:text-white font-medium text-base tracking-tight">Add New Task</h3>
                        <button
                            onClick={onClose}
                            className="p-1.5 -mr-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 stroke-[1.5]" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 pt-2 pb-6 space-y-5">
                        {/* Name Input - Open & Calm */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                Task Name
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Morning Yoga"
                                    maxLength={25}
                                    className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-white placeholder:text-slate-300 shadow-sm focus:ring-0 focus:shadow-md transition-shadow"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Time Picker - Row Style */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                Time
                            </label>
                            <div className="relative group">
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                />
                                <div className="w-full bg-white dark:bg-slate-800 rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm group-active:scale-[0.99] transition-transform">
                                    <span className={`text-base font-medium ${time ? 'text-slate-900 dark:text-white' : 'text-slate-300'}`}>
                                        {time ? (
                                            /* Simple format for display if user selected, or placeholder */
                                            new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                                        ) : (
                                            'Set Time'
                                        )}
                                    </span>
                                    <Clock className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Quiet & Confident */}
                        <div className="pt-4 flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!name.trim() || !time}
                                className="flex-[2] py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:shadow-none transition-all transform active:scale-[0.98]"
                            >
                                Save Task
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AddTaskModal;
