import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { User, Plus, MoreVertical, Search, CheckCircle, UserPlus, Phone, X } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { motion, AnimatePresence } from 'framer-motion';
import FinanceBottomNav from '../../components/finance/FinanceBottomNav';

const DebtManager = () => {
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

    const { debtParties, addDebtParty, getPartyBalance, getPartyTransactions, getPartyStatus } = context;
    const [isAdding, setIsAdding] = useState(false);
    useScrollLock(isAdding);

    // Form State
    const [searchQuery, setSearchQuery] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [tag, setTag] = useState('');
    const [creditLimit, setCreditLimit] = useState('');

    const [phonePickerNumbers, setPhonePickerNumbers] = useState([]);
    const [isPhonePickerOpen, setIsPhonePickerOpen] = useState(false);
    const [contactError, setContactError] = useState('');
    const vcfInputRef = React.useRef(null);

    const contactPickerSupported = typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;

    const cleanPhoneNumber = useCallback((raw) => {
        if (!raw) return { code: '+91', number: '' };
        let cleaned = raw.replace(/[\s\-\(\)\.]/g, '');
        if (cleaned.startsWith('+')) {
            if (cleaned.startsWith('+91') && cleaned.length >= 13) return { code: '+91', number: cleaned.slice(3) };
            if (cleaned.startsWith('+1') && cleaned.length >= 12) return { code: '+1', number: cleaned.slice(2) };
            if (cleaned.startsWith('+44') && cleaned.length >= 13) return { code: '+44', number: cleaned.slice(3) };
            if (cleaned.startsWith('+971') && cleaned.length >= 13) return { code: '+971', number: cleaned.slice(4) };
            if (cleaned.startsWith('+966') && cleaned.length >= 13) return { code: '+966', number: cleaned.slice(4) };
            const match = cleaned.match(/^(\+\d{1,4})(\d+)$/);
            if (match) return { code: match[1], number: match[2] };
        }
        if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
        return { code: '+91', number: cleaned };
    }, []);

    const parseVCard = useCallback((text) => {
        const lines = text.split(/\r?\n/);
        let contactName = '';
        const phones = [];
        for (const line of lines) {
            if (line.startsWith('FN:') || line.startsWith('FN;')) {
                contactName = line.split(':').slice(1).join(':').trim();
            }
            if (line.startsWith('TEL') || line.startsWith('tel')) {
                const val = line.split(':').slice(1).join(':').trim();
                if (val) phones.push(val);
            }
        }
        return { name: contactName, phones };
    }, []);

    const handleVcfImport = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            const { name: cName, phones } = parseVCard(text);
            if (cName) setName(cName);
            if (phones.length === 1) {
                const { code, number } = cleanPhoneNumber(phones[0]);
                setCountryCode(code);
                setPhone(number);
            } else if (phones.length > 1) {
                setPhonePickerNumbers(phones);
                setIsPhonePickerOpen(true);
            }
        };
        reader.readAsText(file);
        if (vcfInputRef.current) vcfInputRef.current.value = '';
    }, [parseVCard, cleanPhoneNumber]);

    const pickContact = useCallback(async () => {
        setContactError('');
        try {
            if (contactPickerSupported) {
                const props = ['name', 'tel'];
                const opts = { multiple: false };
                const contacts = await navigator.contacts.select(props, opts);
                if (!contacts || contacts.length === 0) return;
                const contact = contacts[0];
                if (contact.name && contact.name.length > 0) setName(contact.name[0]);
                if (contact.tel && contact.tel.length > 0) {
                    if (contact.tel.length === 1) {
                        const { code, number } = cleanPhoneNumber(contact.tel[0]);
                        setCountryCode(code);
                        setPhone(number);
                    } else {
                        setPhonePickerNumbers(contact.tel);
                        setIsPhonePickerOpen(true);
                    }
                }
            } else {
                // Fallback: iOS/desktop don't support the Contact Picker API. 
                // Don't open a confusing file picker, just tell them.
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                if (isIOS) {
                    setContactError('Contact picker not supported on iOS Safari. Please type name/number or use keyboard AutoFill.');
                } else {
                    setContactError('Contact picker not supported on your browser. Please type it manually.');
                }
                setTimeout(() => setContactError(''), 5000);
            }
        } catch (err) {
            if (err.name === 'SecurityError' || err.name === 'NotAllowedError') {
                setContactError('Contact access denied. Please allow in device Settings.');
                setTimeout(() => setContactError(''), 5000);
            } else if (err.name !== 'AbortError') {
                setContactError('Contact picker error. Please type manually.');
                setTimeout(() => setContactError(''), 4000);
            }
        }
    }, [contactPickerSupported, cleanPhoneNumber]);

    const selectPhoneNumber = useCallback((num) => {
        const { code, number } = cleanPhoneNumber(num);
        setCountryCode(code);
        setPhone(number);
        setIsPhonePickerOpen(false);
        setPhonePickerNumbers([]);
    }, [cleanPhoneNumber]);

    const activeParties = (debtParties || []).filter(p => !p.is_deleted);

    // Calculate totals over all non-deleted parties
    let totalReceivable = 0;
    let totalPayable = 0;
    let overdueCount = 0;
    let overdueTotal = 0;

    const partyData = activeParties.map(p => {
        const bal = getPartyBalance(p.id);
        const txs = getPartyTransactions(p.id);
        const lastTxDate = txs.length > 0 ? txs[0].date : p.created_at;
        const status = getPartyStatus(p.id);
        if (bal > 0) totalReceivable += bal;
        else if (bal < 0) totalPayable += Math.abs(bal);
        if (status === 'overdue') { overdueCount++; overdueTotal += Math.abs(bal); }
        return { ...p, balance: bal, lastTxDate };
    }).sort((a, b) => new Date(b.lastTxDate).getTime() - new Date(a.lastTxDate).getTime());

    const netPosition = totalReceivable - totalPayable;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return;

        await addDebtParty({
            name,
            phone_number: phone,
            country_code: countryCode,
            tag,
            credit_limit: creditLimit ? Number(creditLimit) : null,
            preferred_reminder_method: 'whatsapp',
            last_reminder_sent_at: null
        });

        setIsAdding(false);
        setName('');
        setPhone('');
        setTag('');
        setCreditLimit('');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-[env(safe-area-inset-top)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}>
            {/* Header */}
            <header className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Debts & Lending</h1>
                    <button onClick={() => setIsAdding(true)} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors -mr-2 shadow-sm shadow-indigo-500/30">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100 p-5 rounded-[2rem] shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Net Receivable</p>
                        <h2 className="text-2xl font-black">₹{totalReceivable.toLocaleString()}</h2>
                    </div>
                    <div className="bg-red-50 text-red-900 dark:bg-red-500/10 dark:text-red-100 p-5 rounded-[2rem] shadow-sm border border-red-100 dark:border-red-500/20">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Net Payable</p>
                        <h2 className="text-2xl font-black">₹{totalPayable.toLocaleString()}</h2>
                    </div>
                </div>
            </header>

            <div className="px-6 flex-1 flex flex-col space-y-4">


                {/* Search */}
                <div className="relative">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search parties..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>

                <div className="space-y-3 pb-8">
                    {partyData.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.tag && p.tag.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 ? (
                        <div className="text-center py-16 px-6">
                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-300">
                                <User className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No parties found</h3>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
                                Add friends, clients, or businesses you lend to or borrow from.
                            </p>
                            <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-transform">
                                + Add Party
                            </button>
                        </div>
                    ) : (
                        partyData.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.tag && p.tag.toLowerCase().includes(searchQuery.toLowerCase()))).map(party => {
                            const bal = party.balance;
                            const isReceivable = bal > 0;
                            const isPayable = bal < 0;
                            const isSettled = bal === 0;
                            const status = getPartyStatus(party.id);
                            const statusMap = {
                                active: { label: 'Active', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' },
                                cleared: { label: 'Cleared', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
                                overdue: { label: 'Overdue', cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' },
                            };
                            const badge = statusMap[status] || statusMap.active;

                            return (
                                <motion.div key={party.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => navigate(`/finance/debts/${party.id}`)} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-lg shrink-0 overflow-hidden">
                                            {party.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-900 dark:text-white capitalize truncate max-w-[110px] sm:max-w-[170px]">{party.name}</p>
                                                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                {party.tag && (
                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase tracking-wider text-slate-500 font-bold">{party.tag}</span>
                                                )}
                                                <span className="text-xs text-slate-400 font-medium">Updated {new Date(party.lastTxDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        {isSettled ? (
                                            <div className="flex items-center justify-end gap-1 text-slate-400">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Settled</span>
                                            </div>
                                        ) : (
                                            <>
                                                <p className={`text-base font-black ${isReceivable ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    ₹{Math.abs(bal).toLocaleString()}
                                                </p>
                                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                    {isReceivable ? 'To Get' : 'To Pay'}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Add Party Drawer */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-24 sm:p-6 sm:items-center">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        
                        <motion.form 
                            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onSubmit={handleSubmit} 
                            className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[2rem] p-7 shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10 max-h-[85vh] overflow-y-auto"
                        >
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/50 pb-5 mb-6 leading-tight">New Party Details</h3>

                            {/* Hidden vCard file input for fallback contact import */}
                            <input type="file" ref={vcfInputRef} accept=".vcf,.vcard" onChange={handleVcfImport} className="hidden" />

                            <div className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Name</label>
                                    <div className="relative">
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" autoComplete="name" className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3.5 pr-12 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm" autoFocus />
                                        <button
                                            type="button"
                                            onClick={pickContact}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 active:scale-90 transition-all"
                                            title="Import from contacts"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {contactError && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1.5 flex items-center gap-1">
                                            <span className="shrink-0">⚠</span> {contactError}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-[100px_1fr] gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Code</label>
                                        <input type="text" value={countryCode} onChange={e => setCountryCode(e.target.value)} placeholder="+91" className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm text-center" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Phone No. (Opt)</label>
                                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" autoComplete="tel" className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tag (Opt)</label>
                                        <input type="text" value={tag} onChange={e => setTag(e.target.value)} placeholder="Vendor, Friend" className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cred. Limit (Opt)</label>
                                        <input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} placeholder="₹0" className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                                    </div>
                                </div>


                            </div>

                            <div className="flex gap-3 mt-8">
                                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition-all">
                                    Save Party
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>

            {/* Phone Number Selection Modal */}
            <AnimatePresence>
                {isPhonePickerOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsPhonePickerOpen(false); setPhonePickerNumbers([]); }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10 overflow-hidden"
                        >
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">Select Number</h4>
                                <button onClick={() => { setIsPhonePickerOpen(false); setPhonePickerNumbers([]); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                            <div className="p-2 max-h-60 overflow-y-auto">
                                {phonePickerNumbers.map((num, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => selectPhoneNumber(num)}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                                            <Phone className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{num}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <FinanceBottomNav />
        </div>
    );
};

export default DebtManager;
