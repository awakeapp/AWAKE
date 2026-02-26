import { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuthContext } from '../../hooks/useAuthContext';
import { X, ArrowRight, Wallet, ArrowRightLeft, Calendar, FileText, AlertTriangle, Repeat, Split, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FirestoreService } from '../../services/firestore-service';
import JumpDateModal from '../../components/organisms/JumpDateModal';
import { useScrollLock } from '../../hooks/useScrollLock';

const AddTransactionModal = ({ isOpen, onClose, editTransactionId = null, onDelete, initialType = 'expense' }) => {
    useScrollLock(isOpen);
    const { addTransaction, addTransfer, editTransaction, deleteTransaction, checkDuplicate, categories, accounts, transactions, addRecurringRule, getBudgetStats } = useFinance();
    const { user } = useAuthContext();
    const [amount, setAmount] = useState('');
    const [type, setType] = useState(initialType); // expense | income | transfer | savings
    const [categoryId, setCategoryId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState(''); // Only for transfer
    const [note, setNote] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState(null);

    useEffect(() => {
        if (isOpen && !editTransactionId) {
            setType(initialType);
        }
    }, [isOpen, initialType, editTransactionId]);

    useEffect(() => {
        if (!editTransactionId && user) {
            FirestoreService.getDocument(`users/${user.uid}/config`, 'ui')
                .then(doc => {
                    if (doc && doc.lastUsedAccountId && accounts.some(a => a.id === doc.lastUsedAccountId)) {
                        setAccountId(doc.lastUsedAccountId);
                    }
                });
        }
    }, [accounts, editTransactionId, user]);

    useEffect(() => {
        if (editTransactionId) {
            const tx = transactions.find(t => (t.transactionId === editTransactionId || t.id === editTransactionId));
            if (tx) {
                setAmount(tx.amount.toString());
                setType(tx.type);
                setAccountId(tx.accountId || '');
                if (tx.type === 'transfer') {
                    setToAccountId(tx.toAccountId || '');
                } else {
                    setCategoryId(tx.categoryId || '');
                }
                setNote(tx.description || tx.note || '');
                if (tx.date) setDate(format(new Date(tx.date), 'yyyy-MM-dd'));
            }
        }
    }, [editTransactionId, transactions]);

    const handleQuickAmount = (val) => setAmount(val.toString());

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const numAmount = Number(amount);
        if (!amount || isNaN(numAmount)) return;

        const txData = {
            amount: numAmount,
            type,
            note,
            date: new Date(date).toISOString(),
        };

        if (type === 'transfer') {
            if (!accountId || !toAccountId || accountId === toAccountId) return;
            if (editTransactionId) {
                await editTransaction(editTransactionId, { ...txData, fromAccountId: accountId, toAccountId });
            } else {
                await addTransfer({ ...txData, fromAccountId: accountId, toAccountId });
            }
        } else {
            if (!categoryId || !accountId) return;
            if (editTransactionId) {
                await editTransaction(editTransactionId, { ...txData, categoryId, accountId });
            } else {
                await addTransaction({
                    ...txData,
                    categoryId,
                    accountId,
                    mode: 'manual'
                });
            }
            if (user) {
                FirestoreService.setItem(`users/${user.uid}/config`, 'ui', { lastUsedAccountId: accountId }, true);
            }
        }
        onClose();
    };

    const activeAccounts = accounts.filter(a => !a.isArchived);
    const currentCategories = type === 'income' ? categories.filter(c => c.type === 'income') 
        : type === 'savings' ? categories.filter(c => c.type === 'savings') 
        : categories.filter(c => c.type === 'expense');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md pointer-events-auto"
                    />

                    <motion.div
                        initial={{ y: '100%' }} 
                        animate={{ y: 0 }} 
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl pointer-events-auto relative max-h-[92vh] flex flex-col overflow-hidden border border-white/20 dark:border-slate-800"
                    >
                        {/* Header Section */}
                        <div className="p-8 pb-0 shrink-0">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
                                        {type === 'expense' ? <Trash className="w-6 h-6 text-indigo-500" /> : type === 'income' ? <ArrowRight className="w-6 h-6 text-indigo-500" /> : type === 'savings' ? <Wallet className="w-6 h-6 text-indigo-500" /> : <ArrowRightLeft className="w-6 h-6 text-indigo-500" />}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            {editTransactionId ? 'Edit Entry' : 'New Record'}
                                        </h2>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Finance Center</p>
                                            <div className="w-1 h-1 rounded-full bg-indigo-500/30"></div>
                                            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{type}</p>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={onClose} 
                                    className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
                                >
                                    <X className="w-5 h-5 font-bold" />
                                </button>
                            </div>

                            {/* Type Selection - High Priority Hierarchy */}
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/10 rounded-2xl mb-8">
                                {['income', 'expense', 'savings'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === t ? 'bg-white dark:bg-slate-700 shadow-lg text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}
                                    >{t}</button>
                                ))}
                            </div>

                             <div className="text-center mb-10">
                                <div className="inline-flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-slate-300 dark:text-slate-700">₹</span>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="bg-transparent border-none text-[72px] font-black text-slate-900 dark:text-white placeholder:text-slate-100 dark:placeholder:text-slate-800 focus:ring-0 p-0 w-full max-w-[280px] text-center leading-none"
                                        placeholder="0"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Configurable Section */}
                        <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6 scrollbar-hide">
                            <div className="grid grid-cols-2 gap-4">
                                {type !== 'transfer' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Category</label>
                                        <div className="relative group">
                                            <select
                                                value={categoryId}
                                                onChange={e => setCategoryId(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/30 rounded-2xl p-4 text-xs font-bold text-slate-900 dark:text-white appearance-none transition-all cursor-pointer"
                                            >
                                                <option value="" disabled>Select Goal</option>
                                                {currentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                                <ArrowRight className="w-4 h-4 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                        {type === 'transfer' ? 'Source' : 'Account'}
                                    </label>
                                    <select
                                        value={accountId}
                                        onChange={e => setAccountId(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/30 rounded-2xl p-4 text-xs font-bold text-slate-900 dark:text-white appearance-none transition-all cursor-pointer"
                                    >
                                        <option value="" disabled>Select Wallet</option>
                                        {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>

                                {type === 'transfer' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Destination</label>
                                        <select
                                            value={toAccountId}
                                            onChange={e => setToAccountId(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/30 rounded-2xl p-4 text-xs font-bold text-slate-900 dark:text-white appearance-none transition-all cursor-pointer"
                                        >
                                            <option value="" disabled>Select Target</option>
                                            {activeAccounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Date</label>
                                    <button
                                        type="button"
                                        onClick={() => setDatePickerOpen(true)}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/30 rounded-2xl p-4 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between text-left transition-all"
                                    >
                                        <span>{format(new Date(date + 'T00:00:00'), 'MMM dd, yyyy')}</span>
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                    </button>
                                    <JumpDateModal
                                        isOpen={datePickerOpen}
                                        onClose={() => setDatePickerOpen(false)}
                                        initialDate={new Date(date + 'T00:00:00')}
                                        onSelect={(d) => { setDate(format(d, 'yyyy-MM-dd')); setDatePickerOpen(false); }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Reference</label>
                                    <input
                                        type="text"
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="Note..."
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/30 rounded-2xl p-4 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Quick Select Chips */}
                            <div className="pt-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-3 block">Quick Add</label>
                                <div className="flex gap-2 shrink-0">
                                    {[100, 500, 1000, 2000].map(amt => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => handleQuickAmount(amt)}
                                            className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-400 hover:border-indigo-500 transition-all"
                                        >+ ₹{amt}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="p-8 pt-0 border-t border-slate-50 dark:border-slate-800/50">
                            <div className="flex gap-4 mt-6">
                                {editTransactionId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (window.confirm('Erase this record from history?')) {
                                                onDelete ? onDelete(editTransactionId) : deleteTransaction(editTransactionId);
                                                onClose();
                                            }
                                        }}
                                        className="w-16 h-16 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-2xl flex items-center justify-center active:scale-95 transition-all"
                                    ><Trash className="w-6 h-6" /></button>
                                )}
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-xs tracking-[0.2em] py-5 rounded-2xl shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    {editTransactionId ? 'Commit Changes' : 'Record Transaction'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};


export default AddTransactionModal;
