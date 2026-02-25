import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { ArrowLeft, Plus, MoreVertical, Trash2, RotateCcw, AlertTriangle, Calendar, Lock, CreditCard, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { format } from 'date-fns';
import JumpDateModal from '../../components/organisms/JumpDateModal';
import { useScrollLock } from '../../hooks/useScrollLock';
import { motion, AnimatePresence } from 'framer-motion';

const TRANSACTION_TYPES = [
    { id: 'you_gave', label: 'You Gave', color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400', sign: '+' },
    { id: 'you_received', label: 'You Received', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', sign: '-' },
    { id: 'you_borrowed', label: 'You Borrowed', color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400', sign: '-' },
    { id: 'you_repaid', label: 'You Repaid', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', sign: '+' },
    { id: 'adjustment', label: 'Adjustment', color: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400', sign: '' },
    { id: 'write_off', label: 'Write-off', color: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400', sign: '0' },
];

const STATUS_BADGE = {
    active: { label: 'Active', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' },
    cleared: { label: 'Cleared', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
    overdue: { label: 'Overdue', cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' },
};

const PartyDetail = () => {
    const { partyId } = useParams();
    const navigate = useNavigate();
    const context = useFinance();

    if (!context || !context.debtParties) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
            </div>
        );
    }

    const {
        debtParties,
        getPartyTransactions,
        getPartyBalance,
        addDebtTransaction,
        softDeleteDebtTransaction,
        reverseDebtTransaction,
        isEntryLocked,
        getPendingEntries,
        addSettlementPayment,
        getPartyStatus,
        getEntrySettledAmount
    } = context;

    const party = debtParties.find(p => p.id === partyId && !p.is_deleted);
    if (!party) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-slate-400 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Party Not Found</h2>
                <p className="text-slate-500 mb-6">This party may have been deleted.</p>
                <button onClick={() => navigate(-1)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Go Back</button>
            </div>
        );
    }

    const transactions = getPartyTransactions(partyId);
    const balance = getPartyBalance(partyId);
    const isReceivable = balance > 0;
    const isPayable = balance < 0;
    const partyStatus = getPartyStatus(partyId);
    const statusBadge = STATUS_BADGE[partyStatus] || STATUS_BADGE.active;
    const pendingEntries = getPendingEntries(partyId);

    // --- New Entry / Payment states ---
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);
    const [txType, setTxType] = useState('you_gave');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [dueDate, setDueDate] = useState('');
    const [note, setNote] = useState('');
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [dueDatePickerOpen, setDueDatePickerOpen] = useState(false);

    // --- Settlement states ---
    const [isSettleOpen, setIsSettleOpen] = useState(false);
    const [settleAmount, setSettleAmount] = useState('');
    const [settleOldest, setSettleOldest] = useState(true);
    const [selectedSettleEntries, setSelectedSettleEntries] = useState({}); // { [entry_id]: amount_string }
    const [settleNote, setSettleNote] = useState('');

    useScrollLock(isSettleOpen);

    // Dropdown
    const [dropdownOpen, setDropdownOpen] = useState(null);

    const isSettlementType = txType === 'you_received' || txType === 'you_repaid';

    // Total that can be settled across selected entries
    const totalSelectedAllocation = useMemo(() => {
        if (settleOldest) return 0;
        return Object.values(selectedSettleEntries).reduce((sum, v) => sum + (Number(v) || 0), 0);
    }, [selectedSettleEntries, settleOldest]);

    const maxSettleAmount = useMemo(() => {
        return pendingEntries.reduce((sum, e) => sum + e.remaining, 0);
    }, [pendingEntries]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return;

        if (isSettlementType && pendingEntries.length > 0) {
            // Open settlement flow instead
            setSettleAmount(amount);
            setIsAddCardOpen(false);
            setIsSettleOpen(true);
            return;
        }

        // For non-settlement types (you_gave, you_borrowed, adjustment, write_off): normal add
        await addDebtTransaction({
            party_id: party.id,
            type: txType,
            amount: Number(amount),
            date: new Date(date + 'T12:00:00').toISOString(),
            due_date: dueDate ? new Date(dueDate + 'T12:00:00').toISOString() : null,
            notes: note
        });

        resetForm();
    };

    const handleSettleSubmit = async () => {
        const amt = Number(settleAmount);
        if (amt <= 0) return;

        const settleTxType = isReceivable ? 'you_received' : 'you_repaid';

        if (settleOldest) {
            await addSettlementPayment(partyId, amt, {
                settleOldestFirst: true,
                txType: settleTxType,
                date: new Date(date + 'T12:00:00').toISOString(),
                notes: settleNote || 'Payment — oldest first'
            });
        } else {
            const entries = Object.entries(selectedSettleEntries)
                .filter(([, v]) => Number(v) > 0)
                .map(([entry_id, amount]) => ({ entry_id, amount: Number(amount) }));

            await addSettlementPayment(partyId, amt, {
                settleOldestFirst: false,
                selectedEntries: entries,
                txType: settleTxType,
                date: new Date(date + 'T12:00:00').toISOString(),
                notes: settleNote || 'Payment — selected entries'
            });
        }

        resetForm();
        setIsSettleOpen(false);
        setSelectedSettleEntries({});
        setSettleOldest(true);
        setSettleNote('');
    };

    const resetForm = () => {
        setIsAddCardOpen(false);
        setAmount('');
        setNote('');
        setDueDate('');
        setTxType('you_gave');
    };

    const toggleEntrySelection = (entryId, entryRemaining) => {
        setSelectedSettleEntries(prev => {
            const copy = { ...prev };
            if (copy[entryId] !== undefined) {
                delete copy[entryId];
            } else {
                copy[entryId] = String(entryRemaining);
            }
            return copy;
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 6rem)' }}>
            {/* Header */}
            <header className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-900 dark:text-white -ml-2 focus:outline-none shadow-sm border border-slate-100 dark:border-slate-800">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">{party.name}</h1>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadge.cls}`}>{statusBadge.label}</span>
                    </div>
                    <button className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-900 dark:text-white -mr-2 shadow-sm border border-slate-100 dark:border-slate-800">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Net Balance</p>
                    <h2 className={`text-4xl font-black ${isReceivable ? 'text-emerald-500' : isPayable ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                        {balance === 0 ? '₹0' : `${isReceivable ? '+' : '-'}₹${Math.abs(balance).toLocaleString()}`}
                    </h2>
                    <p className="text-sm font-medium text-slate-400 mt-2">
                        {isReceivable ? 'They owe you' : isPayable ? 'You owe them' : 'Settled up'}
                    </p>
                </div>
            </header>

            <div className="px-6 flex-1 flex flex-col space-y-4">
                {/* Quick action: Record Payment */}
                {balance !== 0 && (
                    <button
                        onClick={() => {
                            setTxType(isReceivable ? 'you_received' : 'you_repaid');
                            setIsAddCardOpen(true);
                        }}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all text-sm"
                    >
                        <CreditCard className="w-4 h-4" />
                        Record Payment
                    </button>
                )}

                {/* Ledger header */}
                <div className="flex items-center justify-between mt-2 mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">Timeline</h3>
                    <button onClick={() => setIsAddCardOpen(true)} className="text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
                        <Plus className="w-4 h-4" /> Entry
                    </button>
                </div>

                {/* Timeline */}
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                    {transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-400 font-medium">No transactions yet.</p>
                        </div>
                    ) : (
                        transactions.map((tx) => {
                            const locked = isEntryLocked(tx);
                            const typeDef = TRANSACTION_TYPES.find(t => t.id === tx.type) || TRANSACTION_TYPES[0];
                            const isReversal = tx.is_reversal;
                            const isOutstandingEntry = tx.type === 'you_gave' || tx.type === 'you_borrowed';
                            const settled = isOutstandingEntry ? getEntrySettledAmount(tx.id) : 0;
                            const entryRemaining = isOutstandingEntry ? Number(tx.amount) - settled : 0;
                            const hasSettlements = tx.settlements && tx.settlements.length > 0;

                            return (
                                <div key={tx.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 shadow z-10 ${typeDef.color} border-4 border-slate-50 dark:border-slate-950`}>
                                        {locked ? <Lock className="w-4 h-4" /> : <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                                    </div>

                                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 flex-wrap">
                                                {format(new Date(tx.date), 'MMM d, yyyy')}
                                                {isReversal && <span className="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Reversal</span>}
                                                {hasSettlements && <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Settlement</span>}
                                            </span>

                                            <div className="relative">
                                                <button onClick={() => setDropdownOpen(dropdownOpen === tx.id ? null : tx.id)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                <AnimatePresence>
                                                    {dropdownOpen === tx.id && (
                                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden z-20">
                                                            {!locked && (
                                                                <button onClick={() => { softDeleteDebtTransaction(tx.id); setDropdownOpen(null); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2">
                                                                    <Trash2 className="w-4 h-4" /> Delete
                                                                </button>
                                                            )}
                                                            <button onClick={() => { reverseDebtTransaction(tx.id); setDropdownOpen(null); }} className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                                                <RotateCcw className="w-4 h-4" /> Reverse
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{typeDef.label}</p>
                                                {tx.notes && <p className="text-xs text-slate-500 mt-1">{tx.notes}</p>}
                                            </div>
                                            <p className={`font-black ${typeDef.color.split(' ')[1]}`}>
                                                {typeDef.sign}₹{Number(tx.amount).toLocaleString()}
                                            </p>
                                        </div>

                                        {/* Settlement progress bar for outstanding entries */}
                                        {isOutstandingEntry && (
                                            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                                    <span>Settled ₹{settled.toLocaleString()}</span>
                                                    <span>Remaining ₹{entryRemaining.toLocaleString()}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${entryRemaining <= 0 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                        style={{ width: `${Math.min((settled / Number(tx.amount)) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ========== New Entry Modal ========== */}
            <AnimatePresence>
                {isAddCardOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-24 sm:p-6 sm:items-center">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddCardOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                        <motion.form
                            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onSubmit={handleSubmit}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10 max-h-[85vh] overflow-y-auto"
                        >
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">New Entry</h3>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Transaction Type</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                        {TRANSACTION_TYPES.map(type => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setTxType(type.id)}
                                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${txType === type.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-400/50'}`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Hint when selecting payment type with pending entries */}
                                {isSettlementType && pendingEntries.length > 0 && (
                                    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                        <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                                            {pendingEntries.length} pending {pendingEntries.length === 1 ? 'entry' : 'entries'} available for settlement. Enter amount and tap Save to allocate.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">₹</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-10 pr-4 text-2xl font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            autoFocus
                                        />
                                    </div>
                                    {isSettlementType && pendingEntries.length > 0 && Number(amount) > maxSettleAmount && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">Max settleable: ₹{maxSettleAmount.toLocaleString()}. Excess will be capped.</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Date</label>
                                        <button type="button" onClick={() => setDatePickerOpen(true)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 text-left flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                            {format(new Date(date + 'T00:00:00'), 'MMM d, yyyy')}
                                        </button>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Due Date (Opt)</label>
                                        <button type="button" onClick={() => setDueDatePickerOpen(true)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 text-left flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                            {dueDate ? format(new Date(dueDate + 'T00:00:00'), 'MMM d, yyyy') : 'No Date'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Notes</label>
                                    <input
                                        type="text"
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="Reason..."
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button type="button" onClick={() => setIsAddCardOpen(false)} className="flex-1 py-3.5 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={!amount} className="flex-[2] py-3.5 bg-indigo-600 disabled:bg-indigo-400 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition-transform">
                                    {isSettlementType && pendingEntries.length > 0 ? 'Allocate →' : 'Save Entry'}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>

            {/* ========== Settlement Allocation Modal ========== */}
            <AnimatePresence>
                {isSettleOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-24 sm:p-6 sm:items-center">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettleOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                        <motion.div
                            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10 max-h-[85vh] overflow-y-auto"
                        >
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">Allocate ₹{Number(settleAmount).toLocaleString()}</h3>

                            {/* Toggle */}
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-5">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">Settle Oldest First</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Auto-allocate starting from the oldest entry</p>
                                </div>
                                <button type="button" onClick={() => { setSettleOldest(!settleOldest); setSelectedSettleEntries({}); }}>
                                    {settleOldest
                                        ? <ToggleRight className="w-10 h-10 text-indigo-600" />
                                        : <ToggleLeft className="w-10 h-10 text-slate-400" />
                                    }
                                </button>
                            </div>

                            {/* Entry list for manual selection */}
                            {!settleOldest && (
                                <div className="space-y-3 mb-5">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select entries to settle</p>
                                    {pendingEntries.length === 0 ? (
                                        <p className="text-sm text-slate-500">No pending entries.</p>
                                    ) : (
                                        pendingEntries.map(entry => {
                                            const isSelected = selectedSettleEntries[entry.id] !== undefined;
                                            return (
                                                <div key={entry.id} className={`p-4 rounded-2xl border transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <button type="button" onClick={() => toggleEntrySelection(entry.id, entry.remaining)} className="flex items-center gap-3">
                                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                                                {isSelected && <Check className="w-4 h-4 text-white" />}
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{entry.type === 'you_gave' ? 'You Gave' : 'You Borrowed'}</p>
                                                                <p className="text-[10px] text-slate-400">{format(new Date(entry.date), 'MMM d, yyyy')} • Remaining ₹{entry.remaining.toLocaleString()}</p>
                                                            </div>
                                                        </button>
                                                        <p className="font-black text-slate-900 dark:text-white text-sm">₹{Number(entry.amount).toLocaleString()}</p>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-400 shrink-0">Allocate:</span>
                                                            <div className="relative flex-1">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                                                                <input
                                                                    type="number"
                                                                    value={selectedSettleEntries[entry.id] || ''}
                                                                    onChange={e => {
                                                                        const val = Math.min(Number(e.target.value) || 0, entry.remaining);
                                                                        setSelectedSettleEntries(prev => ({ ...prev, [entry.id]: String(val) }));
                                                                    }}
                                                                    max={entry.remaining}
                                                                    placeholder="0"
                                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-8 pr-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                />
                                                            </div>
                                                            <button type="button" onClick={() => setSelectedSettleEntries(prev => ({ ...prev, [entry.id]: String(entry.remaining) }))} className="text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg shrink-0">
                                                                Max
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}

                                    {!settleOldest && totalSelectedAllocation > 0 && (
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <span>Total allocated</span>
                                            <span className={totalSelectedAllocation > Number(settleAmount) ? 'text-red-500' : 'text-emerald-500'}>
                                                ₹{totalSelectedAllocation.toLocaleString()} / ₹{Number(settleAmount).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Preview when oldest-first */}
                            {settleOldest && pendingEntries.length > 0 && (
                                <div className="space-y-2 mb-5">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Allocation Preview</p>
                                    {(() => {
                                        let rem = Number(settleAmount);
                                        return pendingEntries.map(entry => {
                                            if (rem <= 0) return null;
                                            const allocate = Math.min(entry.remaining, rem);
                                            rem -= allocate;
                                            return (
                                                <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm">
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">{entry.type === 'you_gave' ? 'You Gave' : 'You Borrowed'}</p>
                                                        <p className="text-[10px] text-slate-400">{format(new Date(entry.date), 'MMM d, yyyy')}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-indigo-600 dark:text-indigo-400">₹{allocate.toLocaleString()}</p>
                                                        <p className="text-[10px] text-slate-400">of ₹{entry.remaining.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            );
                                        }).filter(Boolean);
                                    })()}
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Note (Optional)</label>
                                <input type="text" value={settleNote} onChange={e => setSettleNote(e.target.value)} placeholder="Payment note..." className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 text-sm outline-none" />
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button type="button" onClick={() => { setIsSettleOpen(false); setSelectedSettleEntries({}); }} className="flex-1 py-3.5 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSettleSubmit}
                                    disabled={!settleOldest && totalSelectedAllocation <= 0}
                                    className="flex-[2] py-3.5 bg-indigo-600 disabled:bg-indigo-400 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition-transform"
                                >
                                    Confirm Payment
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <JumpDateModal isOpen={datePickerOpen} onClose={() => setDatePickerOpen(false)} initialDate={new Date(date + 'T00:00:00')} onSelect={(d) => { if (d) setDate(format(d, 'yyyy-MM-dd')); setDatePickerOpen(false); }} />
            <JumpDateModal isOpen={dueDatePickerOpen} onClose={() => setDueDatePickerOpen(false)} initialDate={dueDate ? new Date(dueDate + 'T00:00:00') : new Date()} onSelect={(d) => { if (d) { setDueDate(format(d, 'yyyy-MM-dd')); } else { setDueDate(''); } setDueDatePickerOpen(false); }} />
        </div>
    );
};

export default PartyDetail;
