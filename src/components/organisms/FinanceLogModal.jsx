import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, IndianRupee } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import Button from '../atoms/Button';

const FinanceLogModal = ({ isOpen, onClose }) => {
    const { addTransaction, categories, accounts } = useFinance();

    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Sort categories alphabetically but keep prominent ones near top
    const expenseCategories = categories.filter(c => c.type === 'expense').sort((a,b) => a.name.localeCompare(b.name));

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setNote('');
            setCategoryId(categories.find(c => c.type === 'expense')?.id || '');
            setAccountId(accounts.find(a => !a.isArchived)?.id || 'acc_cash');
        }
    }, [isOpen, categories, accounts]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !note || !categoryId || !accountId) return;

        setIsSubmitting(true);
        try {
            await addTransaction({
                accountId,
                type: 'expense',
                amount: parseFloat(amount),
                categoryId,
                note: note.trim()
            });
            onClose();
        } catch (error) {
            console.error("Finance log failed:", error);
            alert("Failed to save transaction. Please try again.");
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
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 z-10"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                                <IndianRupee className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Expense Log</h2>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                           <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">₹</span>
                                <input
                                    type="number"
                                    required
                                    placeholder="Amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    autoFocus
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-4 pl-9 text-xl font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <input
                                type="text"
                                required
                                placeholder="What was this for?"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                                <select 
                                    value={categoryId} 
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl px-3 py-3 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                >
                                    {expenseCategories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Paid From</label>
                                <select 
                                    value={accountId} 
                                    onChange={(e) => setAccountId(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl px-3 py-3 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                >
                                    {accounts.filter(a => !a.isArchived).map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            className="w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 mt-2 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                        >
                            <Check className="w-5 h-5" />
                            Save Expense
                        </Button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default FinanceLogModal;
