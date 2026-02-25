import React, { useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { ArrowLeft, Plus, MoreVertical, Trash2, RotateCcw, AlertTriangle, Calendar, Lock, CreditCard, ToggleLeft, ToggleRight, Check, ChevronDown, Clock, Bell, MessageCircle, Copy, Send, Wallet, FileText, Image as ImageIcon, Download, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import { format, isBefore, isAfter, startOfDay, endOfDay, differenceInDays, addDays } from 'date-fns';
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
        getEntrySettledAmount,
        updateDebtParty,
        addTransaction,
        accounts
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

        // Find oldest due date from pending entries
        let oldestDueDate = null;
        for (const tx of allTransactions) {
            if ((tx.type === 'you_gave' || tx.type === 'you_borrowed') && tx.due_date) {
                const settled = getEntrySettledAmount(tx.id);
                if (Number(tx.amount) - settled > 0) {
                    if (!oldestDueDate || isBefore(new Date(tx.due_date), new Date(oldestDueDate))) {
                        oldestDueDate = tx.due_date;
                    }
                }
            }
        }

        return { totalReceivable, totalPayable, overdueAmount, lastTxDate, lastReminder, oldestDueDate };
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
    const [dueDate, setDueDate] = useState(format(addDays(new Date(), 10), 'yyyy-MM-dd'));
    const [note, setNote] = useState('');
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [dueDatePickerOpen, setDueDatePickerOpen] = useState(false);
    const [dueDateManuallySet, setDueDateManuallySet] = useState(false);

    // --- Settlement states ---
    const [isSettleOpen, setIsSettleOpen] = useState(false);
    const [settleAmount, setSettleAmount] = useState('');
    const [settleOldest, setSettleOldest] = useState(true);
    const [selectedSettleEntries, setSelectedSettleEntries] = useState({});
    const [settleNote, setSettleNote] = useState('');
    const [createFinanceEntry, setCreateFinanceEntry] = useState(false);

    // --- Reminder states ---
    const [isReminderOpen, setIsReminderOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const canRemind = party.phone_number && balance !== 0;
    const totalPending = Math.abs(balance);
    const reminderMethod = party.preferred_reminder_method || 'whatsapp';
    const fullPhone = `${(party.country_code || '+91').replace('+', '')}${party.phone_number || ''}`;

    const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
    const [reminderMessage, setReminderMessage] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isSendingWithImage, setIsSendingWithImage] = useState(false);
    const hiddenImageRef = useRef(null);

    const templates = useMemo(() => {
        const amtStr = totalPending.toLocaleString();
        const dStr = format(new Date(), 'dd MMM yyyy');
        const dueStr = summary.oldestDueDate ? format(new Date(summary.oldestDueDate), 'dd MMM yyyy') : '';

        return [
            {
                id: 'friendly', label: 'Friendly',
                text: `Hi ${party.name},\n\nHope this message finds you well.\n\nThis is a friendly reminder regarding the pending balance of ₹${amtStr} as of ${dStr}.${dueStr ? ` The oldest due date was ${dueStr}.` : ''}\n\nPlease settle at your earliest convenience.\n\nThank you.`
            },
            {
                id: 'formal', label: 'Formal',
                text: `Dear ${party.name},\n\nThis is a formal reminder that an amount of ₹${amtStr} is currently outstanding on your account as of ${dStr}.\n\nWe would appreciate it if you could process this payment promptly to keep your account current.\n\nThank you for your business.`
            },
            {
                id: 'urgent', label: 'Urgent',
                text: `Attn: ${party.name},\n\nPlease be advised that your payment of ₹${amtStr} is now overdue.\n\nWe urge you to settle this balance immediately${dueStr ? ` (originally due on ${dueStr})` : ''} to avoid any disruption or further action.\nLet us know if you have already processed the payment.\n\nRegards.`
            }
        ];
    }, [party.name, totalPending, summary.oldestDueDate]);

    const openReminderModal = () => {
        setSelectedTemplateIndex(0);
        setReminderMessage(templates[0].text);
        setCopied(false);
        setIsReminderOpen(true);
    };

    const handleTemplateChange = (index) => {
        setSelectedTemplateIndex(index);
        setReminderMessage(templates[index].text);
    };

    const handleCopyMessage = async () => {
        try {
            await navigator.clipboard.writeText(reminderMessage);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* fallback: ignore */ }
    };

    const generatePDFInvoice = async () => {
        setIsGeneratingPdf(true);
        try {
            const { jsPDF } = await import("jspdf");
            const doc = new jsPDF();
            const width = doc.internal.pageSize.getWidth();
            const isReceiv = balance > 0;
            
            // Header BG
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, width, 120, "F");

            // Header Text
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(28);
            doc.text("AWAKE INVOICE", 20, 25);

            doc.setFontSize(12);
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text(`DATE: ${format(new Date(), 'dd MMM yyyy')}`, 20, 35);

            // Details Card
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(20, 50, width - 40, 60, 4, 4, "F");

            doc.setTextColor(15, 23, 42);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("PREPARED FOR:", 25, 65);
            
            doc.setFontSize(18);
            doc.text(party.name, 25, 75);

            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.text(`${party.country_code || '+91'} ${party.phone_number}`, 25, 83);

            doc.setFont("helvetica", "bold");
            doc.text("TOTAL OUTSTANDING:", 25, 100);
            
            doc.setFontSize(20);
            if (isReceiv) doc.setTextColor(16, 185, 129); // emerald
            else doc.setTextColor(244, 63, 94); // rose
            doc.text(`Rs ${totalPending.toLocaleString()}`, 80, 100);

            // Message Body
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            const splitMessage = doc.splitTextToSize(reminderMessage, width - 50);
            doc.text(splitMessage, 25, 130);
            
            // Footer
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184);
            doc.text("Generated automatically via AWAKE", width / 2, doc.internal.pageSize.getHeight() - 15, { align: "center" });

            doc.save(`${party.name.replace(/\s+/g, '_')}_Invoice.pdf`);
        } catch (e) {
            console.error(e);
            alert("Error generating PDF");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const normalizePhone = (code, num) => {
        const cleanCode = (code || '+91').replace(/[^+\d]/g, '');
        const cleanNum = (num || '').replace(/[\s\-\(\)\.]/g, '');
        return `${cleanCode.replace('+', '')}${cleanNum}`;
    };

    const handleSendReminder = async () => {
        if (!party.phone_number) {
            alert("No phone number is attached to this party. Please enter a valid number to send direct messages.");
            return;
        }

        const phone = normalizePhone(party.country_code, party.phone_number);
        if (!phone || phone.length < 8) {
            alert("Invalid phone number. Please verify the party's contact details.");
            return;
        }

        const encoded = encodeURIComponent(reminderMessage);

        // IMMEDIATELY redirect to WhatsApp/SMS — no delay
        if (reminderMethod === 'whatsapp') {
            window.location.href = `https://wa.me/${phone}?text=${encoded}`;
        } else {
            window.location.href = `sms:${phone}?body=${encoded}`;
        }

        // Update reminder timestamp (non-blocking)
        updateDebtParty(partyId, { last_reminder_sent_at: new Date().toISOString() }).catch(() => {});
        setIsReminderOpen(false);
    };

    const handleShareWithImage = async () => {
        if (!party.phone_number) {
            alert("No phone number is attached to this party.");
            return;
        }

        setIsSendingWithImage(true);
        try {
            let file = null;
            if (hiddenImageRef.current) {
                const canvas = await html2canvas(hiddenImageRef.current, { scale: 2, backgroundColor: '#0f172a' });
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
                file = new File([blob], `${party.name.replace(/\s+/g, '_')}_Overview.jpg`, { type: 'image/jpeg' });
            }

            if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Account Overview',
                    text: reminderMessage
                });
            } else if (file) {
                // Fallback: download file, then redirect
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                a.click();
                URL.revokeObjectURL(url);

                const phone = normalizePhone(party.country_code, party.phone_number);
                const encoded = encodeURIComponent(reminderMessage);
                setTimeout(() => {
                    window.location.href = reminderMethod === 'whatsapp'
                        ? `https://wa.me/${phone}?text=${encoded}`
                        : `sms:${phone}?body=${encoded}`;
                }, 600);
            } else {
                // No image, just redirect
                handleSendReminder();
                return;
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                // If share fails, still redirect
                handleSendReminder();
                return;
            }
        }
        setIsSendingWithImage(false);
        updateDebtParty(partyId, { last_reminder_sent_at: new Date().toISOString() }).catch(() => {});
        setIsReminderOpen(false);
    };

    const lastReminderDaysAgo = useMemo(() => {
        if (!summary.lastReminder) return null;
        return differenceInDays(new Date(), new Date(summary.lastReminder));
    }, [summary.lastReminder]);

    useScrollLock(isAddCardOpen || isSettleOpen || isReminderOpen);

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

        if (createFinanceEntry) {
            const activeAccount = accounts.find(a => !a.isArchived) || accounts[0];
            if (activeAccount) {
                await addTransaction({
                    type: settleTxType === 'you_received' ? 'income' : 'expense',
                    amount: amt,
                    accountId: activeAccount.id,
                    categoryId: '', // Custom note covers it
                    date: new Date(date + 'T12:00:00').toISOString(),
                    note: `Debt Settlement: ${party.name}${settleNote ? ` - ${settleNote}` : ''}`
                });
            }
        }

        resetForm();
        setIsSettleOpen(false);
        setSelectedSettleEntries({});
        setSettleOldest(true);
        setSettleNote('');
        setCreateFinanceEntry(false);
    };

    const resetForm = () => {
        setIsAddCardOpen(false);
        setAmount('');
        setNote('');
        setDueDate(format(addDays(new Date(), 10), 'yyyy-MM-dd'));
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setTxType('you_gave');
        setDueDateManuallySet(false);
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
            <header className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl">
                {/* Top bar */}
                <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-900 dark:text-white -ml-1">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-lg font-black text-slate-900 dark:text-white truncate max-w-[180px] tracking-tight">{party.name}</h1>
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full mt-0.5 ${statusBadge.cls}`}>{statusBadge.label}</span>
                    </div>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-900 dark:text-white -mr-1">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>

                {/* Balance Card */}
                <div className="px-5 pb-4">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-600 dark:to-indigo-900 rounded-[1.5rem] p-5 text-white relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl" />
                        <div className="relative z-10">
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="text-center">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-200/70 mb-1">Receivable</p>
                                    <p className="text-base font-black text-emerald-300">₹{summary.totalReceivable.toLocaleString()}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-200/70 mb-1">Payable</p>
                                    <p className="text-base font-black text-red-300">₹{summary.totalPayable.toLocaleString()}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-200/70 mb-1">Net</p>
                                    <p className={`text-base font-black ${balance >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{balance >= 0 ? '+' : '-'}₹{Math.abs(balance).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="h-px bg-white/10 my-3" />
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col items-center">
                                    <Clock className="w-3 h-3 text-indigo-200/60 mb-1" />
                                    <p className="text-[7px] font-black uppercase tracking-[0.15em] text-indigo-200/50">Overdue</p>
                                    <p className={`text-[11px] font-bold mt-0.5 ${summary.overdueAmount > 0 ? 'text-red-300' : 'text-white/50'}`}>{summary.overdueAmount > 0 ? `₹${summary.overdueAmount.toLocaleString()}` : '—'}</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Calendar className="w-3 h-3 text-indigo-200/60 mb-1" />
                                    <p className="text-[7px] font-black uppercase tracking-[0.15em] text-indigo-200/50">Last Txn</p>
                                    <p className="text-[11px] font-bold mt-0.5 text-white/80">{summary.lastTxDate ? format(new Date(summary.lastTxDate), 'dd MMM') : '—'}</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Bell className="w-3 h-3 text-indigo-200/60 mb-1" />
                                    <p className="text-[7px] font-black uppercase tracking-[0.15em] text-indigo-200/50">Reminder</p>
                                    <p className="text-[11px] font-bold mt-0.5 text-white/80">{summary.lastReminder ? format(new Date(summary.lastReminder), 'dd MMM') : 'Never'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ===== BODY ===== */}
            <div className="px-6 flex-1 flex flex-col space-y-4 mt-4">

                {/* Quick actions */}
                <div className="flex gap-2">
                    {balance !== 0 && (
                        <button
                            onClick={() => { setTxType(isReceivable ? 'you_received' : 'you_repaid'); setIsAddCardOpen(true); }}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all text-sm"
                        >
                            <CreditCard className="w-4 h-4" /> Record Payment
                        </button>
                    )}
                    <button
                        onClick={openReminderModal}
                        disabled={!canRemind}
                        className={`py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] ${
                            balance !== 0 ? 'px-4' : 'flex-1 px-4'
                        } ${
                            canRemind
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <MessageCircle className="w-4 h-4" />
                        {balance === 0 ? 'Settled' : !party.phone_number ? 'No Phone' : 'Remind'}
                    </button>
                </div>
                {lastReminderDaysAgo !== null && (
                    <p className="text-[11px] text-slate-400 font-medium text-center -mt-1">
                        Last reminder sent {lastReminderDaysAgo === 0 ? 'today' : `${lastReminderDaysAgo} day${lastReminderDaysAgo === 1 ? '' : 's'} ago`}
                    </p>
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

                {/* Ledger header */}
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight">Ledger <span className="text-slate-400 font-bold text-sm ml-1">({filteredTransactions.length})</span></h3>
                    <button onClick={() => setIsAddCardOpen(true)} className="text-white text-[11px] font-black flex items-center gap-1.5 bg-indigo-600 px-4 py-2 rounded-xl active:scale-95 transition-transform shadow-md shadow-indigo-500/20 uppercase tracking-wider">
                        <Plus className="w-3.5 h-3.5" /> Entry
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
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${typeDef.color}`}>
                                                {locked ? <Lock className="w-4 h-4" /> : (
                                                    isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />
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
                    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => resetForm()} className="absolute inset-0 bg-black/50 backdrop-blur-md" />
                        <motion.form
                            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            onSubmit={handleSubmit}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-white/10 dark:border-slate-800 relative z-10 max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="px-7 pt-7 pb-0 shrink-0">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">New Entry</h3>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{party.name}</p>
                                    </div>
                                    <button type="button" onClick={() => resetForm()} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-all">
                                        <Plus className="w-5 h-5 rotate-45" />
                                    </button>
                                </div>

                                {/* Type Selection — Given / Received only */}
                                <div className="flex gap-3 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setTxType('you_gave')}
                                        className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all border-2 flex items-center justify-center gap-2.5 ${
                                            txType === 'you_gave'
                                                ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-500/10'
                                                : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <ArrowUpRight className="w-5 h-5" /> Given
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTxType('you_received')}
                                        className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all border-2 flex items-center justify-center gap-2.5 ${
                                            txType === 'you_received'
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10'
                                                : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <ArrowDownLeft className="w-5 h-5" /> Received
                                    </button>
                                </div>

                                {isSettlementType && pendingEntries.length > 0 && (
                                    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/20 mb-5">
                                        <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">{pendingEntries.length} pending {pendingEntries.length === 1 ? 'entry' : 'entries'} for settlement.</p>
                                    </div>
                                )}

                                {/* Amount — Hero Size */}
                                <div className="text-center py-4 mb-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Amount</p>
                                    <div className="inline-flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-slate-300 dark:text-slate-600">₹</span>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            placeholder="0"
                                            autoFocus
                                            className="bg-transparent border-none text-[72px] leading-none font-black text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700 focus:ring-0 p-0 w-full max-w-[280px] text-center outline-none"
                                        />
                                    </div>
                                    {isSettlementType && pendingEntries.length > 0 && Number(amount) > maxSettleAmount && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-bold">Max: ₹{maxSettleAmount.toLocaleString()}</p>
                                    )}
                                </div>
                            </div>

                            {/* Configurable Section */}
                            <div className="flex-1 overflow-y-auto px-7 pb-4 space-y-4 scrollbar-hide">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Date</label>
                                        <button type="button" onClick={() => setDatePickerOpen(true)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white font-bold text-left flex items-center gap-2.5 text-[13px] transition-all hover:border-indigo-400/50">
                                            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />{format(new Date(date + 'T00:00:00'), 'MMM d, yyyy')}
                                        </button>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Due Date</label>
                                        <button type="button" onClick={() => setDueDatePickerOpen(true)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white font-bold text-left flex items-center gap-2.5 text-[13px] transition-all hover:border-indigo-400/50">
                                            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />{dueDate ? format(new Date(dueDate + 'T00:00:00'), 'MMM d, yyyy') : 'No Date'}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Note</label>
                                    <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Reason or reference..."
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white font-bold text-[13px] outline-none focus:border-indigo-400/50 transition-all placeholder:text-slate-400" />
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="px-7 py-5 border-t border-slate-100 dark:border-slate-800/50 shrink-0">
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => resetForm()} className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-sm">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!amount || Number(amount) <= 0}
                                        className="flex-[2] py-4 bg-indigo-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:shadow-none text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all text-sm uppercase tracking-wider"
                                    >
                                        {isSettlementType && pendingEntries.length > 0 ? 'Allocate →' : 'Save Entry'}
                                    </button>
                                </div>
                            </div>

                            <JumpDateModal
                                isOpen={datePickerOpen}
                                onClose={() => setDatePickerOpen(false)}
                                initialDate={new Date(date + 'T00:00:00')}
                                onSelect={(d) => {
                                    const newDate = format(d, 'yyyy-MM-dd');
                                    setDate(newDate);
                                    if (!dueDateManuallySet) {
                                        setDueDate(format(addDays(d, 10), 'yyyy-MM-dd'));
                                    }
                                    setDatePickerOpen(false);
                                }}
                            />
                            <JumpDateModal
                                isOpen={dueDatePickerOpen}
                                onClose={() => setDueDatePickerOpen(false)}
                                initialDate={dueDate ? new Date(dueDate + 'T00:00:00') : addDays(new Date(), 10)}
                                onSelect={(d) => {
                                    setDueDate(format(d, 'yyyy-MM-dd'));
                                    setDueDateManuallySet(true);
                                    setDueDatePickerOpen(false);
                                }}
                            />
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

                            {/* Bridge Toggle */}
                            <div className="mt-5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer" onClick={() => setCreateFinanceEntry(!createFinanceEntry)}>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                        <Wallet className="w-4 h-4 text-indigo-500" /> 
                                        {isReceivable ? 'Record as Income' : 'Record as Expense'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Add to main finance ledger</p>
                                </div>
                                <button type="button">
                                    {createFinanceEntry ? <ToggleRight className="w-8 h-8 text-indigo-600" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                                </button>
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

            {/* ========== Reminder Preview Modal ========== */}
            <AnimatePresence>
                {isReminderOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-24 sm:p-6 sm:items-center">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsReminderOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10 max-h-[85vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Send Reminder</h3>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${reminderMethod === 'whatsapp' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'}`}>
                                        via {reminderMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Templates</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {templates.map((tpl, idx) => (
                                        <button 
                                            key={tpl.id} 
                                            onClick={() => handleTemplateChange(idx)}
                                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedTemplateIndex === idx ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}
                                        >
                                            {tpl.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Message Text</label>
                                <textarea
                                    value={reminderMessage}
                                    onChange={e => setReminderMessage(e.target.value)}
                                    rows={5}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-900 dark:text-white font-medium leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-sm"
                                />
                            </div>

                            <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/20 mb-6">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">Professional Attachments</p>
                                        <p className="text-[10px] text-slate-500">Auto-generated with current details</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                   <button disabled={isGeneratingPdf} onClick={generatePDFInvoice} className="text-[10px] uppercase font-bold text-white bg-indigo-600 dark:bg-indigo-500 px-3 py-1.5 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50">
                                       {isGeneratingPdf ? <RotateCcw className="w-3 h-3 animate-spin"/> : <Download className="w-3 h-3" />}
                                       Download PDF
                                   </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <button type="button" onClick={handleCopyMessage} className={`w-14 shrink-0 py-4 font-bold rounded-xl flex items-center justify-center transition-all border ${copied ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/30' : 'text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                    <button type="button" onClick={handleSendReminder} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm">
                                        <Send className="w-4 h-4" /> Send via {reminderMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                                    </button>
                                </div>
                                <button disabled={isSendingWithImage} type="button" onClick={handleShareWithImage} className="w-full py-3.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl border border-indigo-200 dark:border-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/15 disabled:opacity-50">
                                    {isSendingWithImage ? <RotateCcw className="w-4 h-4 animate-spin"/> : <ImageIcon className="w-4 h-4" />}
                                    {isSendingWithImage ? 'Generating...' : 'Share with Account Overview'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            <JumpDateModal isOpen={dateFromPickerOpen} onClose={() => setDateFromPickerOpen(false)} initialDate={dateFrom ? new Date(dateFrom + 'T00:00:00') : new Date()} onSelect={(d) => { if (d) setDateFrom(format(d, 'yyyy-MM-dd')); setDateFromPickerOpen(false); }} />
            <JumpDateModal isOpen={dateToPickerOpen} onClose={() => setDateToPickerOpen(false)} initialDate={dateTo ? new Date(dateTo + 'T00:00:00') : new Date()} onSelect={(d) => { if (d) setDateTo(format(d, 'yyyy-MM-dd')); setDateToPickerOpen(false); }} />
        
            {/* Hidden Element for html2canvas to render temporary visual reminder */}
            <div className="absolute top-0 left-[-9999px]">
                <div ref={hiddenImageRef} className="w-[600px] bg-slate-900 text-white p-12 flex flex-col items-center justify-center text-center font-sans tracking-tight">
                    <h1 className="text-[52px] font-black text-indigo-400 mb-6 uppercase tracking-widest leading-none">AWAKE</h1>
                    <p className="text-xl font-bold text-slate-400 uppercase tracking-[0.2em] mb-12">Account Overview</p>
                    
                    <div className="bg-slate-800/80 rounded-[2.5rem] p-10 w-full border border-slate-700/50 shadow-2xl mb-8">
                        <div className="mb-10 text-left w-full border-b border-slate-700/80 pb-6">
                            <p className="text-sm font-black text-slate-500 uppercase tracking-widest mb-2">Prepared For</p>
                            <h2 className="text-3xl font-black text-white">{party.name}</h2>
                            <p className="text-slate-400 text-xl font-medium mt-1">{party.country_code || '+91'} {party.phone_number}</p>
                        </div>
                        
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3">Total Outstanding Balance</p>
                        <p className={`text-[80px] leading-none font-black mb-10 tracking-tighter ${(balance > 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ₹{totalPending.toLocaleString()}
                        </p>
                        
                        <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-700/50 text-left">
                           <p className="text-slate-300 whitespace-pre-wrap leading-relaxed px-2 font-medium text-lg">{reminderMessage}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between w-full px-6 opacity-60">
                         <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Generated automatically</p>
                         <p className="text-sm text-slate-400 font-bold tracking-widest">{format(new Date(), 'dd MMM yyyy')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Summary Cell Component ---
const SummaryCell = ({ label, value, color, icon }) => (
    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1.5 flex items-center justify-center gap-1">
            {icon}{label}
        </p>
        <p className={`text-[15px] font-black ${color}`}>{value}</p>
    </div>
);

export default PartyDetail;
