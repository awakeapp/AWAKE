import { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuthContext } from '../../hooks/useAuthContext';
import { X, ArrowRight, Wallet, ArrowRightLeft, Calendar, FileText, AlertTriangle, Repeat, Split, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FirestoreService } from '../../services/firestore-service';
import JumpDateModal from '../../components/organisms/JumpDateModal';
import { useScrollLock } from '../../hooks/useScrollLock';

const AddTransactionModal = ({ isOpen, onClose, editTransactionId = null, onDelete }) => {
    useScrollLock(isOpen);
    const { addTransaction, addTransfer, editTransaction, deleteTransaction, checkDuplicate, categories, accounts, transactions, addRecurringRule, getBudgetStats } = useFinance();
    const { user } = useAuthContext();
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense'); // expense | income | transfer
    const [categoryId, setCategoryId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState(''); // Only for transfer
    const [note, setNote] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [receipt, setReceipt] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState(null);

    // Advanced Features State
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurFrequency, setRecurFrequency] = useState('monthly');
    const [recurEndDate, setRecurEndDate] = useState('');

    const [isSplit, setIsSplit] = useState(false);
    const [splits, setSplits] = useState([{ categoryId: '', amount: '' }]);

    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [recurDatePickerOpen, setRecurDatePickerOpen] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState(null);

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
            const tx = transactions.find(t => t.id === editTransactionId);
            if (tx) {
                setAmount(tx.amount);
                setType(tx.type);
                setAccountId(tx.type === 'transfer' ? tx.fromAccountId : tx.accountId);
                if (tx.type === 'transfer') {
                    setToAccountId(tx.toAccountId);
                } else {
                    setCategoryId(tx.categoryId);
                }
                setNote(tx.note);
                if (tx.date) setDate(format(new Date(tx.date), 'yyyy-MM-dd'));
                if (tx.receipt) {
                    setReceipt(tx.receipt);
                    setReceiptPreview(tx.receipt);
                }
            }
        }
    }, [editTransactionId, transactions]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 200 * 1024) { 
            alert("File too large (max 200KB)");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setReceipt(reader.result);
            setReceiptPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const addSplitRow = () => setSplits([...splits, { categoryId: '', amount: '' }]);
    const removeSplitRow = (idx) => {
        const newSplits = [...splits];
        newSplits.splice(idx, 1);
        setSplits(newSplits);
    };
    const updateSplit = (idx, field, val) => {
        const newSplits = [...splits];
        newSplits[idx][field] = val;
        setSplits(newSplits);
    };
    const totalSplitAmount = splits.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
    const remainingSplit = Number(amount) - totalSplitAmount;

    const handleQuickAmount = (val) => setAmount(val.toString());

    const handleSubmit = (e) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if (!amount || isNaN(numAmount)) return;

        if (!editTransactionId && !duplicateWarning) {
            const potentialDupe = checkDuplicate({ amount: numAmount, type, categoryId, toAccountId });
            if (potentialDupe) {
                setDuplicateWarning(potentialDupe);
                return;
            }
        }

        const txData = {
            amount: numAmount,
            type,
            note,
            date: new Date(date).toISOString(),
            receipt: receipt
        };

        if (type === 'transfer') {
            if (!accountId || !toAccountId || accountId === toAccountId) return;
            if (editTransactionId) {
                editTransaction(editTransactionId, { ...txData, fromAccountId: accountId, toAccountId });
            } else {
                addTransfer({ ...txData, fromAccountId: accountId, toAccountId });
            }
        } else {
            if (!categoryId || !accountId) return;
            if (editTransactionId) {
                editTransaction(editTransactionId, { ...txData, categoryId, accountId });
            } else {
                if (isRecurring) {
                    addRecurringRule({
                        frequency: recurFrequency,
                        startDate: txData.date,
                        endDate: recurEndDate || null,
                        transactionTemplate: {
                            ...txData,
                            categoryId: isSplit ? null : categoryId,
                            accountId,
                            splits: isSplit ? splits : null
                        }
                    });
                } else {
                    addTransaction({
                        ...txData,
                        categoryId: isSplit ? 'cat_split' : categoryId,
                        accountId,
                        splits: isSplit ? splits : null,
                        mode: 'manual'
                    });
                }
            }
            if (user) {
                FirestoreService.setItem(`users/${user.uid}/config`, 'ui', { lastUsedAccountId: accountId }, true);
            }
        }
        onClose();
    };

    const activeAccounts = accounts.filter(a => !a.isArchived);
    const currentCategories = type === 'income' ? categories.filter(c => c.type === 'income') : categories.filter(c => c.type === 'expense');

    const recentCategories = useMemo(() => {
        if (!transactions.length) return currentCategories.slice(0, 4);
        const counts = {};
        transactions.forEach(t => { if (t.categoryId) counts[t.categoryId] = (counts[t.categoryId] || 0) + 1; });
        return currentCategories
            .map(c => ({ ...c, count: counts[c.id] || 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);
    }, [transactions, currentCategories]);

    const QUICK_AMOUNTS = [100, 500, 1000, 2000];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                    />

                    <motion.div
                        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
                        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl pointer-events-auto relative max-h-[90vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom,20px)+1.5rem)] scrollbar-hide"
                    >
                        {/* Drag Handle for Mobile */}
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6 sm:hidden"></div>

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editTransactionId ? 'Edit Transaction' : 'New Transaction'}
                            </h2>
                            <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Type Selection (Pill Toggle) */}
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                                {['expense', 'income', 'transfer'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => { setType(t); setIsSplit(false); setIsRecurring(false); }}
                                        className={`flex-1 py-2 text-sm font-semibold capitalize rounded-lg transition-all ${type === t ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >{t}</button>
                                ))}
                            </div>

                            {/* Amount Input */}
                            <div className="text-center py-4">
                                <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Amount</p>
                                <div className="flex items-center justify-center gap-1.5 border-b-2 border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 pb-2 transition-colors mx-auto w-fit min-w-[150px]">
                                    <span className="text-3xl font-bold text-slate-400">₹</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="bg-transparent border-none text-5xl font-bold text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-800 focus:ring-0 p-0 w-[180px] text-center"
                                        placeholder="0"
                                        autoFocus={!editTransactionId}
                                    />
                                </div>
                            </div>

                            {/* Quick Amount Chips */}
                            <div className="flex gap-2 justify-center flex-wrap">
                                {QUICK_AMOUNTS.map(amt => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => handleQuickAmount(amt)}
                                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >+ ₹{amt}</button>
                                ))}
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4 pt-2">
                                {/* Account / Category Selection */}
                                <div className="grid grid-cols-2 gap-3">
                                    {type !== 'transfer' && (
                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 transition-colors">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Category</label>
                                            <select
                                                value={categoryId}
                                                onChange={e => setCategoryId(e.target.value)}
                                                className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-900 dark:text-white focus:ring-0"
                                            >
                                                <option value="" disabled>Select</option>
                                                {currentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    
                                    {type === 'transfer' ? (
                                        <>
                                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 transition-colors">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">From</label>
                                                <select
                                                    value={accountId}
                                                    onChange={e => setAccountId(e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-900 dark:text-white focus:ring-0"
                                                >
                                                    <option value="" disabled>Account</option>
                                                    {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 transition-colors">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">To</label>
                                                <select
                                                    value={toAccountId}
                                                    onChange={e => setToAccountId(e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-900 dark:text-white focus:ring-0"
                                                >
                                                    <option value="" disabled>Account</option>
                                                    {activeAccounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                </select>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 transition-colors">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Account</label>
                                            <select
                                                value={accountId}
                                                onChange={e => setAccountId(e.target.value)}
                                                className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-900 dark:text-white focus:ring-0"
                                            >
                                                <option value="" disabled>Select</option>
                                                {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Date & Note */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 transition-colors">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Date</label>
                                        <button
                                            type="button"
                                            onClick={() => setDatePickerOpen(true)}
                                            className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-900 dark:text-white flex items-center justify-between text-left"
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
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 transition-colors">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Note (Optional)</label>
                                        <input
                                            type="text"
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            placeholder="What was this for?"
                                            className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Section */}
                            <div className="flex gap-3 pt-6">
                                {editTransactionId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (window.confirm('Delete entry?')) {
                                                onDelete ? onDelete(editTransactionId) : deleteTransaction(editTransactionId);
                                                onClose();
                                            }
                                        }}
                                        className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                                    ><Trash className="w-5 h-5" /></button>
                                )}
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    {editTransactionId ? 'Save Changes' : 'Confirm'}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddTransactionModal;
