import { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuthContext } from '../../hooks/useAuthContext';
import { X, ArrowRight, Wallet, ArrowRightLeft, Calendar, FileText, AlertTriangle, Repeat, Split, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FirestoreService } from '../../services/firestore-service';

const AddTransactionModal = ({ isOpen, onClose, editTransactionId = null, onDelete }) => {
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

    // Warning State
    const [duplicateWarning, setDuplicateWarning] = useState(null);

    // Load Last Used Account
    useEffect(() => {
        if (!editTransactionId && user) {
            // Check session storage first for speed, or just fetch? 
            // Better to fetch from user config
            FirestoreService.getDocument(`users/${user.uid}/config/ui`)
                .then(doc => {
                    if (doc && doc.lastUsedAccountId && accounts.some(a => a.id === doc.lastUsedAccountId)) {
                        setAccountId(doc.lastUsedAccountId);
                    }
                });
        }
    }, [accounts, editTransactionId, user]);

    // Pre-fill for Edit Mode
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
                    setReceipt(tx.receipt); // Assuming it's the base64 string
                    setReceiptPreview(tx.receipt);
                }
            }
        }
    }, [editTransactionId, transactions]);

    // Handle Receipt Upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 100 * 1024) { // 100KB limit
            alert("File too large (max 100KB for now)");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setReceipt(reader.result);
            setReceiptPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Split Logic
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

        // Duplicate Check (only for new transactions)
        if (!editTransactionId && !duplicateWarning) {
            const potentialDupe = checkDuplicate({
                amount: numAmount,
                type,
                categoryId,
                toAccountId
            });
            if (potentialDupe) {
                setDuplicateWarning(potentialDupe);
                return;
            }
        }

        // Save Logic
        const txData = {
            amount: numAmount,
            type,
            note,
            date: new Date(date).toISOString(),
            receipt: receipt // Base64 string
        };

        if (type === 'transfer') {
            if (!accountId || !toAccountId || accountId === toAccountId) return;
            // Edit Logic for Transfer needs specific handling in context if fields changed
            // For simplicity, we assume context handles 'edit' generically or we pass specific fields
            if (editTransactionId) {
                editTransaction(editTransactionId, {
                    ...txData,
                    fromAccountId: accountId,
                    toAccountId
                });
            } else {
                addTransfer({ ...txData, fromAccountId: accountId, toAccountId });
            }
        } else {
            if (!categoryId || !accountId) return;
            if (editTransactionId) {
                // ... (Edit logic remains same, but we might want to disable converting to Recurring/Split on edit for simplicity first)
                editTransaction(editTransactionId, {
                    ...txData,
                    categoryId,
                    accountId
                });
            } else {
                if (isRecurring) {
                    addRecurringRule({
                        frequency: recurFrequency,
                        startDate: txData.date, // Use selected date as start
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
                        categoryId: isSplit ? 'cat_split' : categoryId, // Virtual cat for split container
                        accountId,
                        splits: isSplit ? splits : null,
                        mode: 'manual'
                    });
                }
            }
            // Update Last Used
            if (user) {
                FirestoreService.setItem(`users/${user.uid}/config/ui`, { lastUsedAccountId: accountId }, true);
            }
        }
        onClose();
    };

    const activeAccounts = accounts.filter(a => !a.isArchived);
    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');
    const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;

    // Recent Categories based on usage frequency
    const recentCategories = useMemo(() => {
        if (!transactions.length) return currentCategories.slice(0, 4);

        const counts = {};
        transactions.forEach(t => {
            if (t.categoryId) {
                counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
            }
        });

        return currentCategories
            .map(c => ({ ...c, count: counts[c.id] || 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);
    }, [transactions, currentCategories]);

    const QUICK_AMOUNTS = [100, 500, 1000, 2000];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2rem] p-6 shadow-2xl pointer-events-auto relative max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editTransactionId ? 'Edit Transaction' : 'Add Transaction'}
                            </h2>
                            <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {duplicateWarning && (
                            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-orange-800 dark:text-orange-200 text-sm">Potential Duplicate</h4>
                                    <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                                        We found a similar transaction of ₹{duplicateWarning.amount} created recently.
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => setDuplicateWarning(null)}
                                            className="px-3 py-1.5 bg-white dark:bg-slate-800 text-xs font-bold rounded-lg shadow-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={(e) => { setDuplicateWarning(null); handleSubmit(e); }}
                                            className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg shadow-sm"
                                        >
                                            Save Anyway
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Type Toggle & Advanced Toggles */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                            {['expense', 'income', 'transfer'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => { setType(t); setIsSplit(false); setIsRecurring(false); }}
                                    className={`flex-1 py-2 text-sm font-bold capitalize rounded-lg transition-all ${type === t ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {type === 'expense' && !editTransactionId && (
                            <div className="flex gap-4 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setIsRecurring(!isRecurring)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-colors ${isRecurring ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-200 text-slate-500'}`}
                                >
                                    <Repeat className="w-3.5 h-3.5" />
                                    Recurring Rule
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsSplit(!isSplit)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-colors ${isSplit ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-200 text-slate-500'}`}
                                >
                                    <Split className="w-3.5 h-3.5" />
                                    Split Bill
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Amount & Date Row */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">₹</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            placeholder="0"
                                            autoFocus={!editTransactionId}
                                        />
                                    </div>
                                </div>
                                <div className="w-1/3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={e => setDate(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Recurring Options */}
                            {isRecurring && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 block">Frequency</label>
                                            <select
                                                value={recurFrequency}
                                                onChange={e => setRecurFrequency(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl p-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 block">End Date (Optional)</label>
                                            <input
                                                type="date"
                                                value={recurEndDate}
                                                onChange={e => setRecurEndDate(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl p-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quick Amounts */}
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                {QUICK_AMOUNTS.map(amt => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => handleQuickAmount(amt)}
                                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                                    >
                                        + ₹{amt}
                                    </button>
                                ))}
                            </div>

                            {type === 'transfer' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {/* From Account */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">From</label>
                                        <select
                                            value={accountId}
                                            onChange={e => setAccountId(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="">Select...</option>
                                            {activeAccounts.map(a => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* To Account */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">To</label>
                                        <select
                                            value={toAccountId}
                                            onChange={e => setToAccountId(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="">Select...</option>
                                            {activeAccounts.filter(a => a.id !== accountId).map(a => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                !isSplit ? (
                                    <div className="space-y-4">
                                        {/* Category */}
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Category</label>

                                            {/* Recent Categories Chips */}
                                            <div className="flex gap-2 flex-wrap mb-2">
                                                {recentCategories.map(c => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => setCategoryId(c.id)}
                                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${categoryId === c.id ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-200 text-slate-500'}`}
                                                    >
                                                        {c.name}
                                                    </button>
                                                ))}
                                            </div>

                                            <select
                                                value={categoryId}
                                                onChange={e => setCategoryId(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="">Select Category...</option>
                                                {currentCategories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>

                                            {/* Budget Context */}
                                            {categoryId && getBudgetStats(categoryId) && (
                                                <div className="mt-2 text-xs">
                                                    {(() => {
                                                        const stats = getBudgetStats(categoryId);
                                                        const isDanger = stats.status === 'danger';
                                                        const isWarning = stats.status === 'warning';
                                                        return (
                                                            <div className={`p-2 rounded-lg border ${isDanger ? 'bg-red-50 border-red-200' : isWarning ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                                                                <div className="flex justify-between mb-1">
                                                                    <span className={`font-bold ${isDanger ? 'text-red-700' : isWarning ? 'text-orange-700' : 'text-slate-600'}`}>
                                                                        {isDanger ? 'Budget Exceeded' : isWarning ? 'Budget Alert' : 'Monthly Budget'}
                                                                    </span>
                                                                    <span className="text-slate-500">
                                                                        {stats.percent}% used
                                                                    </span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden mb-1">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all ${isDanger ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                                                        style={{ width: `${stats.percent}%` }}
                                                                    ></div>
                                                                </div>
                                                                <p className="text-slate-500">
                                                                    <span className="font-bold text-slate-700">{Math.abs(stats.remaining)}</span> {stats.remaining >= 0 ? 'remaining' : 'over spent'} of {stats.budget}
                                                                </p>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Account */}
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Account</label>
                                            <select
                                                value={accountId}
                                                onChange={e => setAccountId(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="">Select Account...</option>
                                                {activeAccounts.map(a => (
                                                    <option key={a.id} value={a.id}>{a.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    /* Split Logic UI */
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Split Categories</label>
                                        {splits.map((split, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <select
                                                    value={split.categoryId}
                                                    onChange={e => updateSplit(idx, 'categoryId', e.target.value)}
                                                    className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-sm"
                                                >
                                                    <option value="">Category...</option>
                                                    {currentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                                <input
                                                    type="number"
                                                    value={split.amount}
                                                    onChange={e => updateSplit(idx, 'amount', e.target.value)}
                                                    placeholder="0"
                                                    className="w-20 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-sm"
                                                />
                                                {splits.length > 1 && (
                                                    <button type="button" onClick={() => removeSplitRow(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center text-xs font-bold">
                                            <button type="button" onClick={addSplitRow} className="text-indigo-500 hover:underline">+ Add Split</button>
                                            <span className={remainingSplit === 0 ? 'text-emerald-500' : 'text-orange-500'}>
                                                Remaining: {remainingSplit}
                                            </span>
                                        </div>
                                        {/* Account for Split (still needed) */}
                                        <div className="mt-4">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Account</label>
                                            <select
                                                value={accountId}
                                                onChange={e => setAccountId(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="">Select Account...</option>
                                                {activeAccounts.map(a => (
                                                    <option key={a.id} value={a.id}>{a.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Note & Receipt */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Note</label>
                                    <input
                                        type="text"
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="Description..."
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Receipt</label>
                                    <label className="flex items-center justify-center w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative overflow-hidden">
                                        {receiptPreview ? (
                                            <img src={receiptPreview} alt="Receipt" className="w-full h-full object-cover opacity-80" />
                                        ) : (
                                            <FileText className="w-5 h-5 text-slate-500" />
                                        )}
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileChange}
                                            accept="image/*"
                                        />
                                        {receipt && <div className="absolute top-0 right-0 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full"></div>}
                                    </label>
                                    {receipt && (
                                        <button
                                            type="button"
                                            onClick={() => { setReceipt(null); setReceiptPreview(null); }}
                                            className="ml-2 text-[10px] text-red-500 underline"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                {editTransactionId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Simple confirm for safety
                                            if (window.confirm('Delete this transaction?')) {
                                                if (onDelete) {
                                                    onDelete(editTransactionId);
                                                } else {
                                                    deleteTransaction(editTransactionId);
                                                }
                                                onClose();
                                            }
                                        }}
                                        className="flex-none py-4 px-5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                    >
                                        Delete
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="flex-1 bg-slate-900 dark:bg-emerald-500 dark:text-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    {editTransactionId ? 'Update Transaction' : (type === 'transfer' ? 'Transfer Funds' : 'Save Transaction')}
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
