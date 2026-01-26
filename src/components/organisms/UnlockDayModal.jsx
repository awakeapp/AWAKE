import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { LockOpen, X } from 'lucide-react';

const UnlockDayModal = ({ isOpen, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError('Please provide a reason');
            return;
        }
        onConfirm(reason);
        setReason(''); // Reset
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden"
                >
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unlock Day</h2>
                            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center justify-center py-4 mb-2">
                            <div className="bg-orange-100 p-4 rounded-full mb-3 dark:bg-orange-900/30">
                                <LockOpen className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                            </div>
                            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                                This day is locked. To make changes, please tell us why you need to reopen it.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Input
                                    placeholder="e.g. Forgot to add a task..."
                                    value={reason}
                                    onChange={(e) => {
                                        setReason(e.target.value);
                                        setError('');
                                    }}
                                    autoFocus
                                />
                                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button
                                    type="submit"
                                    className="w-full"
                                >
                                    Unlock Day
                                </Button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default UnlockDayModal;
