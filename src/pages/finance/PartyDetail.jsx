import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { ArrowLeft, Plus, MoreVertical, Trash2, RotateCcw, AlertTriangle, Calendar, Lock, CreditCard, ToggleLeft, ToggleRight, Check, ChevronDown, Clock, Bell } from 'lucide-react';
import { format, isBefore, isAfter, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import JumpDateModal from '../../components/organisms/JumpDateModal';
import { useScrollLock } from '../../hooks/useScrollLock';
import { AnimatePresence, motion } from 'framer-motion';

const TRANSACTION_TYPES = [
    { id: 'you_gave', label: 'You Gave', color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400', sign: '+' },
    { id: 'you_received', label: 'You Received', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', sign: '-' },
    { id: 'you_borrowed', label: 'You Borrowed', color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400', sign: '-' },
    { id: 'you_repaid', label: 'You Repaid', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', sign: '+' },
    { id: 'adjustment', label: 'Adjustment', color: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400', sign: '±' },
    { id: 'write_off', label: 'Write-off', color: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400', sign: '0' },
];

const STATUS_BADGE = {
    active: { label: 'Active', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' },
    cleared: { label: 'Cleared', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
    overdue: { label: 'Overdue', cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' },
};

const FILTERS = ['All', 'Pending', 'Settled', 'Overdue'];

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

    const allTransactions = getPartyTransactions(partyId);
    const balance = getPartyBalance(partyId);
    const isReceivable = balance > 0;
    const isPayable = balance < 0;
    const partyStatus = getPartyStatus(partyId);
    const statusBadge = STATUS_BADGE[partyStatus] || STATUS_BADGE.active;
    const pendingEntries = getPendingEntries(partyId);

    // --- Computed summary ---
    const summary = useMemo(() => {
        let totalReceivable = 0;
        let totalPayable = 0;
        let overdueAmount = 0;
        const now = new Date();

        for (const tx of allTransactions) {
            if (tx.type === 'you_gave' || tx.type === 'you_borrowed') {
                const settled = getEntrySettledAmount(tx.id);
                const remaining = Number(tx.amount) - settled;
                if (remaining > 0) {
                    if (tx.type === 'you_gave') totalReceivable += remaining;
                    if (tx.type === 'you_borrowed') totalPayable += remaining;
                    if (tx.due_date && isBefore(new Date(tx.due_date), now)) {
                        overdueAmount += remaining;
                    }
                }
            }
        }

        const lastTxDate = allTransactions.length > 0 ? allTransactions[0].date : null;
        const lastReminder = party.last_reminder_sent_at || null;

        return { totalReceivable, totalPayable, overdueAmount, lastTxDate, lastReminder };
    }, [allTransactions, party, getEntrySettledAmount]);

    // --- Filter + date range state ---
    const [activeFilter, setActiveFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [dateFromPickerOpen, setDateFromPickerOpen] = useState(false);
    const [dateToPickerOpen, setDateToPickerOpen] = useState(false);

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
    const [selectedSettleEntries, setSelectedSettleEntries] = useState({});
    const [settleNote, setSettleNote] = useState('');

    useScrollLock(isSettleOpen);

    // Collapsible notes
    const [expandedNotes, setExpandedNotes] = useState({});
    const toggleNotes = (id) => setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));

    // Dropdown
    const [dropdownOpen, setDropdownOpen] = useState(null);

    const isSettlementType = txType === 'you_received' || txType === 'you_repaid';

    const totalSelectedAllocation = useMemo(() => {
        if (settleOldest) return 0;
        return Object.values(selectedSettleEntries).reduce((sum, v) => sum + (Number(v) || 0), 0);
    }, [selectedSettleEntries, settleOldest]);

    const maxSettleAmount = useMemo(() => {
        return pendingEntries.reduce((sum, e) => sum + e.remaining, 0);
    }, [pendingEntries]);

    // --- Filtered transactions ---
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        let txs = [...allTransactions];

        // Date range
        if (dateFrom) {
            const from = startOfDay(new Date(dateFrom + 'T00:00:00'));
            txs = txs.filter(t => !isBefore(new Date(t.date), from));
        }
        if (dateTo) {
            const to = endOfDay(new Date(dateTo + 'T00:00:00'));
            txs = txs.filter(t => !isAfter(new Date(t.date), to));
        }

        // Filter tabs
        if (activeFilter === 'Pending') {
            const pendingIds = new Set(pendingEntries.map(e => e.id));
            txs = txs.filter(t => pendingIds.has(t.id));
        } else if (activeFilter === 'Settled') {
            txs = txs.filter(t => {
                if (t.type !== 'you_gave' && t.type !== 'you_borrowed') return false;
                const settled = getEntrySettledAmount(t.id);
                return settled >= Number(t.amount);
            });
        } else if (activeFilter === 'Overdue') {
            txs = txs.filter(t => {
                if (t.type !== 'you_gave' && t.type !== 'you_borrowed') return false;
                const settled = getEntrySettledAmount(t.id);
                const remaining = Number(t.amount) - settled;
                return remaining > 0 && t.due_date && isBefore(new Date(t.due_date), now);
            });
        }

        return txs;
    }, [allTransactions, activeFilter, dateFrom, dateTo, pendingEntries, getEntrySettledAmount]);

    // --- Running balance computation (oldest first) ---
    const runningBalances = useMemo(() => {
        const oldest = [...allTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const map = {};
        let bal = 0;
        for (const t of oldest) {
            const amt = Number(t.amount);
            switch (t.type) {
                case 'you_gave': bal += amt; break;
                case 'you_received': bal -= amt; break;
                case 'you_borrowed': bal -= amt; break;
                case 'you_repaid': bal += amt; break;
                case 'adjustment': bal += amt; break;
                case 'write_off': bal = 0; break;
            }
            map[t.id] = bal;
        }
        return map;
    }, [allTransactions]);

    // --- Handlers ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return;

        if (isSettlementType && pendingEntries.length > 0) {
            setSettleAmount(amount);
            setIsAddCardOpen(false);
            setIsSettleOpen(true);
            return;
        }

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
            if (copy[entryId] !== undefined) delete copy[entryId];
            else copy[entryId] = String(entryRemaining);
            return copy;
        });
    };

    // --- Render ---
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 6rem)' }}>

            {/* ===== STICKY HEADER + SUMMARY ===== */}
            <header className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
                {/* Top bar */}
                <div className="px-6 pt-5 pb-3 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-900 dark:text-white -ml-2 shadow-sm border border-slate-100 dark:border-slate-800">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{party.name}</h1>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadge.cls}`}>{statusBadge.label}</span>
                    </div>
                    <button className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-900 dark:text-white -mr-2 shadow-sm border border-slate-100 dark:border-slate-800">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>

                {/* Summary grid */}
                <div className="px-6 pb-4">
                    <div className="grid grid-cols-3 gap-2">
                        <SummaryCell label="Receivable" value={`₹${summary.totalReceivable.toLocaleString()}`} color="text-emerald-600 dark:text-emerald-400" />
                        <SummaryCell label="Payable" value={`₹${summary.totalPayable.toLocaleString()}`} color="text-red-500 dark:text-red-400" />
                        <SummaryCell
                            label="Net Position"
                            value={`${balance >= 0 ? '+' : '-'}₹${Math.abs(balance).toLocaleString()}`}
                            color={balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        <SummaryCell label="Overdue" value={summary.overdueAmount > 0 ? `₹${summary.overdueAmount.toLocaleString()}` : '—'} color={summary.overdueAmount > 0 ? 'text-red-500' : 'text-slate-400'} icon={<Clock className="w-3 h-3" />} />
                        <SummaryCell label="Last Txn" value={summary.lastTxDate ? format(new Date(summary.lastTxDate), 'dd MMM') : '—'} color="text-slate-600 dark:text-slate-300" icon={<Calendar className="w-3 h-3" />} />
                        <SummaryCell label="Reminder" value={summary.lastReminder ? format(new Date(summary.lastReminder), 'dd MMM') : 'Never'} color="text-slate-600 dark:text-slate-300" icon={<Bell className="w-3 h-3" />} />
                    </div>
                </div>
            </header>

            {/* ===== BODY ===== */}
            <div className="px-6 flex-1 flex flex-col space-y-4 mt-4">

                {/* Quick action */}
                {balance !== 0 && (
                    <button
                        onClick={() => { setTxType(isReceivable ? 'you_received' : 'you_repaid'); setIsAddCardOpen(true); }}
                        className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all text-sm"
                    >
                        <CreditCard className="w-4 h-4" /> Record Payment
                    </button>
                )}

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${activeFilter === f ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'}`}
                        >
                            {f}
                        </button>
                    ))}
                    {/* Date from/to */}
                    <button onClick={() => setDateFromPickerOpen(true)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${dateFrom ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}>
                        {dateFrom ? format(new Date(dateFrom + 'T00:00:00'), 'dd MMM') : 'From'}
                    </button>
                    <button onClick={() => setDateToPickerOpen(true)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${dateTo ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}>
                        {dateTo ? format(new Date(dateTo + 'T00:00:00'), 'dd MMM') : 'To'}
                    </button>
                    {(dateFrom || dateTo) && (
                        <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="px-2 py-1.5 text-xs font-bold text-red-500">✕</button>
                    )}
                </div>

                {/* Timeline header */}
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Ledger <span className="text-slate-400 font-medium text-sm ml-1">({filteredTransactions.length})</span></h3>
                    <button onClick={() => setIsAddCardOpen(true)} className="text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
                        <Plus className="w-4 h-4" /> Entry
                    </button>
                </div>

                {/* ===== TIMELINE ===== */}
                <div className="space-y-2 pb-8">
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-slate-400 font-medium">No entries match this filter.</p>
                        </div>
                    ) : (
                        filteredTransactions.map((tx) => {
                            const locked = isEntryLocked(tx);
                            const typeDef = TRANSACTION_TYPES.find(t => t.id === tx.type) || TRANSACTION_TYPES[0];
                            const isReversal = tx.is_reversal;
                            const isOutstandingEntry = tx.type === 'you_gave' || tx.type === 'you_borrowed';
                            const settled = isOutstandingEntry ? getEntrySettledAmount(tx.id) : 0;
                            const entryRemaining = isOutstandingEntry ? Number(tx.amount) - settled : 0;
                            const hasSettlements = tx.settlements && tx.settlements.length > 0;
                            const runBal = runningBalances[tx.id];
                            const hasNotes = tx.notes && tx.notes.length > 0;
                            const notesExpanded = expandedNotes[tx.id];
                            const isPositive = tx.type === 'you_gave' || tx.type === 'you_repaid';

                            return (
                                <div key={tx.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                                    {/* Main row */}
                                    <div className="p-4">
                                        <div className="flex items-start gap-3">
                                            {/* Type indicator */}
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${typeDef.color}`}>
                                                {locked ? <Lock className="w-3.5 h-3.5" /> : (
                                                    <span className="text-sm font-black">{isPositive ? '+' : '−'}</span>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{typeDef.label}</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 flex-wrap">
                                                            {format(new Date(tx.date), 'dd MMM yyyy')}
                                                            {isReversal && <span className="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 px-1 py-px rounded text-[8px] uppercase tracking-wider font-bold">Rev</span>}
                                                            {hasSettlements && <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-1 py-px rounded text-[8px] uppercase tracking-wider font-bold">Stl</span>}
                                                        </p>
                                                    </div>
                                                    <div className="text-right shrink-0 ml-3">
                                                        <p className={`text-base font-black ${isPositive ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                            {isPositive ? '+' : '−'}₹{Number(tx.amount).toLocaleString()}
                                                        </p>
                                                        {/* Running balance */}
                                                        <p className={`text-[10px] font-bold mt-0.5 ${runBal >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            Bal: {runBal >= 0 ? '+' : '−'}₹{Math.abs(runBal).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Settlement progress */}
                                                {isOutstandingEntry && (
                                                    <div className="mt-2.5">
                                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                                            <span>Settled ₹{settled.toLocaleString()}</span>
                                                            <span>{entryRemaining <= 0 ? 'Fully Paid' : `₹${entryRemaining.toLocaleString()} left`}</span>
                                                        </div>
                                                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${entryRemaining <= 0 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                                style={{ width: `${Math.min((settled / Number(tx.amount)) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Collapsible notes */}
                                                {hasNotes && (
                                                    <button onClick={() => toggleNotes(tx.id)} className="flex items-center gap-1 text-[11px] text-slate-400 mt-2 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                                        <ChevronDown className={`w-3 h-3 transition-transform ${notesExpanded ? 'rotate-180' : ''}`} />
                                                        {notesExpanded ? 'Hide note' : 'Show note'}
                                                    </button>
                                                )}
                                                {notesExpanded && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 pl-0.5 border-l-2 border-slate-200 dark:border-slate-700 ml-0.5 leading-relaxed">{tx.notes}</p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="relative shrink-0">
                                                <button onClick={() => setDropdownOpen(dropdownOpen === tx.id ? null : tx.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                <AnimatePresence>
                                                    {dropdownOpen === tx.id && (
                                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden z-20">
                                                            {!locked && (
                                                                <button onClick={() => { softDeleteDebtTransaction(tx.id); setDropdownOpen(null); }} className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2">
                                                                    <Trash2 className="w-4 h-4" /> Delete
                                                                </button>
                                                            )}
                                                            <button onClick={() => { reverseDebtTransaction(tx.id); setDropdownOpen(null); }} className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                                                <RotateCcw className="w-4 h-4" /> Reverse
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
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
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Type</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                        {TRANSACTION_TYPES.map(type => (
                                            <button key={type.id} type="button" onClick={() => setTxType(type.id)}
                                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${txType === type.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-400/50'}`}
                                            >{type.label}</button>
                                        ))}
                                    </div>
                                </div>
                                {isSettlementType && pendingEntries.length > 0 && (
                                    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                        <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">{pendingEntries.length} pending {pendingEntries.length === 1 ? 'entry' : 'entries'} for settlement.</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">₹</span>
                                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" autoFocus
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-10 pr-4 text-2xl font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    {isSettlementType && pendingEntries.length > 0 && Number(amount) > maxSettleAmount && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">Max: ₹{maxSettleAmount.toLocaleString()}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Date</label>
                                        <button type="button" onClick={() => setDatePickerOpen(true)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium text-left flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />{format(new Date(date + 'T00:00:00'), 'MMM d, yyyy')}
                                        </button>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Due (Opt)</label>
                                        <button type="button" onClick={() => setDueDatePickerOpen(true)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium text-left flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />{dueDate ? format(new Date(dueDate + 'T00:00:00'), 'MMM d, yyyy') : 'No Date'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Notes</label>
                                    <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Reason..."
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium text-sm outline-none" />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button type="button" onClick={() => setIsAddCardOpen(false)} className="flex-1 py-3.5 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
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
                                    <p className="text-xs text-slate-500 mt-0.5">Auto-allocate from oldest</p>
                                </div>
                                <button type="button" onClick={() => { setSettleOldest(!settleOldest); setSelectedSettleEntries({}); }}>
                                    {settleOldest ? <ToggleRight className="w-10 h-10 text-indigo-600" /> : <ToggleLeft className="w-10 h-10 text-slate-400" />}
                                </button>
                            </div>
                            {/* Manual selection */}
                            {!settleOldest && (
                                <div className="space-y-3 mb-5">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select entries</p>
                                    {pendingEntries.length === 0 ? (
                                        <p className="text-sm text-slate-500">No pending entries.</p>
                                    ) : (
                                        pendingEntries.map(entry => {
                                            const isSelected = selectedSettleEntries[entry.id] !== undefined;
                                            return (
                                                <div key={entry.id} className={`p-4 rounded-2xl border transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <button type="button" onClick={() => toggleEntrySelection(entry.id, entry.remaining)} className="flex items-center gap-3">
                                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                                                {isSelected && <Check className="w-4 h-4 text-white" />}
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{entry.type === 'you_gave' ? 'You Gave' : 'You Borrowed'}</p>
                                                                <p className="text-[10px] text-slate-400">{format(new Date(entry.date), 'MMM d, yyyy')} • Rem ₹{entry.remaining.toLocaleString()}</p>
                                                            </div>
                                                        </button>
                                                        <p className="font-black text-slate-900 dark:text-white text-sm">₹{Number(entry.amount).toLocaleString()}</p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-400 shrink-0">Allocate:</span>
                                                            <div className="relative flex-1">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                                                                <input type="number" value={selectedSettleEntries[entry.id] || ''} onChange={e => { const val = Math.min(Number(e.target.value) || 0, entry.remaining); setSelectedSettleEntries(prev => ({ ...prev, [entry.id]: String(val) })); }} max={entry.remaining} placeholder="0"
                                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-8 pr-3 text-sm font-bold text-slate-900 dark:text-white outline-none" />
                                                            </div>
                                                            <button type="button" onClick={() => setSelectedSettleEntries(prev => ({ ...prev, [entry.id]: String(entry.remaining) }))} className="text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg shrink-0">Max</button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                    {totalSelectedAllocation > 0 && (
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <span>Total allocated</span>
                                            <span className={totalSelectedAllocation > Number(settleAmount) ? 'text-red-500' : 'text-emerald-500'}>₹{totalSelectedAllocation.toLocaleString()} / ₹{Number(settleAmount).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Oldest-first preview */}
                            {settleOldest && pendingEntries.length > 0 && (
                                <div className="space-y-2 mb-5">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Preview</p>
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
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Note</label>
                                <input type="text" value={settleNote} onChange={e => setSettleNote(e.target.value)} placeholder="Payment note..."
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium text-sm outline-none" />
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button type="button" onClick={() => { setIsSettleOpen(false); setSelectedSettleEntries({}); }} className="flex-1 py-3.5 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
                                <button type="button" onClick={handleSettleSubmit} disabled={!settleOldest && totalSelectedAllocation <= 0}
                                    className="flex-[2] py-3.5 bg-indigo-600 disabled:bg-indigo-400 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition-transform">
                                    Confirm Payment
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <JumpDateModal isOpen={datePickerOpen} onClose={() => setDatePickerOpen(false)} initialDate={new Date(date + 'T00:00:00')} onSelect={(d) => { if (d) setDate(format(d, 'yyyy-MM-dd')); setDatePickerOpen(false); }} />
            <JumpDateModal isOpen={dueDatePickerOpen} onClose={() => setDueDatePickerOpen(false)} initialDate={dueDate ? new Date(dueDate + 'T00:00:00') : new Date()} onSelect={(d) => { if (d) { setDueDate(format(d, 'yyyy-MM-dd')); } else { setDueDate(''); } setDueDatePickerOpen(false); }} />
            <JumpDateModal isOpen={dateFromPickerOpen} onClose={() => setDateFromPickerOpen(false)} initialDate={dateFrom ? new Date(dateFrom + 'T00:00:00') : new Date()} onSelect={(d) => { if (d) setDateFrom(format(d, 'yyyy-MM-dd')); setDateFromPickerOpen(false); }} />
            <JumpDateModal isOpen={dateToPickerOpen} onClose={() => setDateToPickerOpen(false)} initialDate={dateTo ? new Date(dateTo + 'T00:00:00') : new Date()} onSelect={(d) => { if (d) setDateTo(format(d, 'yyyy-MM-dd')); setDateToPickerOpen(false); }} />
        </div>
    );
};

// --- Summary Cell Component ---
const SummaryCell = ({ label, value, color, icon }) => (
    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center justify-center gap-1">
            {icon}{label}
        </p>
        <p className={`text-sm font-black ${color}`}>{value}</p>
    </div>
);

export default PartyDetail;
