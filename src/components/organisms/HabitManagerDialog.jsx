import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Clock, ToggleLeft } from 'lucide-react';
import clsx from 'clsx';
import { inferIcon, getIconComponent } from '../../utils/iconInference';

import { useScrollLock } from '../../hooks/useScrollLock';
import Pressable from '../atoms/Pressable';

const HabitManagerDialog = ({ isOpen, onClose, onAdd }) => {
    useScrollLock(isOpen);
    const [name, setName] = useState('');
    const [type, setType] = useState('toggle'); // 'toggle' | 'number'
    const [unit, setUnit] = useState('hrs'); // 'hrs' | 'mins'

    // Smart Icon Inference
    const derivedIconName = useMemo(() => {
        if (!name.trim()) return null;
        return inferIcon(name.trim()).icon;
    }, [name]);

    const DerivedIconComponent = derivedIconName ? getIconComponent(derivedIconName) : CheckCircle;

    const handleSubmit = () => {
        if (!name.trim()) return;
        onAdd(name.trim(), type, unit, derivedIconName);
        handleClose();
    };

    const handleClose = () => {
        // Delay resetting state slightly so animation works cleanly, or reset on open
        // For now, reset immediately is fine
        onClose();
        setTimeout(() => {
            setName('');
            setType('toggle');
            setUnit('hrs');
        }, 300);
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-32 sm:pb-6"
                        style={{ zIndex: 9999999 }}
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ y: 100, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 100, opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85dvh]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add New Habit</h2>
                                <Pressable
                                    onClick={handleClose}
                                    scaleDown={0.9}
                                    className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </Pressable>
                            </div>

                            {/* Scrollable Body */}
                            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                                {/* 1. Name Input with Icon Preview */}
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="shrink-0 w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 border border-indigo-100 dark:border-indigo-500/30">
                                            <DerivedIconComponent className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                                Habit Name
                                            </label>
                                            <input
                                                autoFocus
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g. Read Books"
                                                className="w-full text-base font-semibold bg-transparent border-b-2 border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-none px-0 py-1 outline-none transition-colors dark:text-white placeholder:font-normal placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Type Selection */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Tracking Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Pressable
                                            onClick={() => setType('toggle')}
                                            scaleDown={0.96}
                                            className={clsx(
                                                "p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-200 w-full",
                                                type === 'toggle'
                                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                                                    : "border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                                            )}
                                        >
                                            <ToggleLeft className="w-5 h-5" />
                                            <span className="font-semibold text-xs">Yes / No</span>
                                        </Pressable>
                                        <Pressable
                                            onClick={() => setType('number')}
                                            scaleDown={0.96}
                                            className={clsx(
                                                "p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-200 w-full",
                                                type === 'number'
                                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                                                    : "border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                                            )}
                                        >
                                            <Clock className="w-5 h-5" />
                                            <span className="font-semibold text-xs">Time / Duration</span>
                                        </Pressable>
                                    </div>
                                </div>

                                {/* 3. Detail Selection (If Time) */}
                                <AnimatePresence>
                                    {type === 'number' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-2 pb-1">
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                    Track In
                                                </label>
                                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                                    <Pressable
                                                        onClick={() => setUnit('hrs')}
                                                        scaleDown={0.96}
                                                        className={clsx(
                                                            "flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center",
                                                            unit === 'hrs'
                                                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                                                : "text-slate-500 hover:text-slate-700"
                                                        )}
                                                    >
                                                        Hours
                                                    </Pressable>
                                                    <Pressable
                                                        onClick={() => setUnit('mins')}
                                                        scaleDown={0.96}
                                                        className={clsx(
                                                            "flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center",
                                                            unit === 'mins'
                                                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                                                : "text-slate-500 hover:text-slate-700"
                                                        )}
                                                    >
                                                        Minutes
                                                    </Pressable>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer - Pinned to bottom */}
                            <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 pb-10 sm:pb-6">
                                <Pressable
                                    onClick={handleSubmit}
                                    disabled={!name.trim()}
                                    scaleDown={0.96}
                                    block
                                    className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[14px] font-bold text-base shadow-lg transition-all disabled:opacity-50 flex justify-center items-center"
                                >
                                    Create Habit
                                </Pressable>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default HabitManagerDialog;
