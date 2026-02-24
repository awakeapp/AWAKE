import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useFinance } from '../../context/FinanceContext';
import Button from '../atoms/Button';

import { useScrollLock } from '../../hooks/useScrollLock';

const QuickActionModal = ({ isOpen, onClose }) => {
    useScrollLock(isOpen);
    const [actionType, setActionType] = useState('task'); // 'task' or 'expense'
    const [inputValue, setInputValue] = useState('');
    const [amountValue, setAmountValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { addTask } = useTasks();
    const { addTransaction } = useFinance();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (actionType === 'task' && !inputValue.trim()) return;
        if (actionType === 'expense' && (!inputValue.trim() || !amountValue)) return;

        setIsSubmitting(true);
        try {
            if (actionType === 'task') {
                await addTask(inputValue.trim(), { priority: 'Medium' });
            } else if (actionType === 'expense') {
                await addTransaction({
                    accountId: 'acc_cash', // default
                    type: 'expense',
                    amount: parseFloat(amountValue),
                    categoryId: 'cat_shopping', // default generic
                    note: inputValue.trim()
                });
            }
            setInputValue('');
            setAmountValue('');
            onClose();
        } catch (error) {
            console.error("Quick action failed:", error);
            alert("Failed to save. Please try again.");
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
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick Add</h2>
                        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                        <button
                            type="button"
                            onClick={() => setActionType('task')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${actionType === 'task' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            To-Do Task
                        </button>
                        <button
                            type="button"
                            onClick={() => setActionType('expense')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${actionType === 'expense' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            Expense
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {actionType === 'expense' && (
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={amountValue}
                                    onChange={(e) => setAmountValue(e.target.value)}
                                    autoFocus
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-4 pl-8 text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>
                        )}
                        <input
                            type="text"
                            placeholder={actionType === 'task' ? "What needs to be done?" : "What was this for?"}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            autoFocus={actionType === 'task'}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />

                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            className={`w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 ${actionType === 'task' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'}`}
                        >
                            <Check className="w-5 h-5" />
                            Save {actionType === 'task' ? 'Task' : 'Expense'}
                        </Button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default QuickActionModal;
