import { useVehicle } from '../../../context/VehicleContext';
import { useState } from 'react';
import { format } from 'date-fns';
import { Fuel, Settings, Landmark, Zap, AlertTriangle, Wallet, TrendingUp, History, Archive, CheckCircle, Check, MoreVertical, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ItemMenu } from '../../../components/ui/ItemMenu';
import { clsx } from 'clsx';
import { useRef } from 'react';
import Pressable from '../../../components/atoms/Pressable';

const LedgerScreen = ({ 
    activeVehicle, trendData, maxTrendCost, stats, combinedHistory, historyFilter, setHistoryFilter, onAddEntry, sortedVehicles, showArchived, getIcon, setVehicleActive, setDeleteConfirmId, toggleArchiveVehicle,
    isSelectionMode, selectedIds, toggleSelection, enterSelectionMode, onEditEntry
}) => {
    const longPressTimer = useRef(null);
    const [editingEntry, setEditingEntry] = useState(null);
    const [editAmount, setEditAmount] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [editDate, setEditDate] = useState('');

    const handlePointerDown = (id) => {
        longPressTimer.current = setTimeout(() => {
            enterSelectionMode(id);
        }, 600);
    };

    const handlePointerUpOrLeave = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };
    
    return (
        <>
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Cost Breakdown */}
            {stats?.breakdown && (
                <section className="mt-2 mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white px-1 mb-2 text-sm flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-slate-400" />
                        Cost Breakdown
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { label: 'Fuel', amount: stats.breakdown.fuel, icon: Fuel, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                            { label: 'Service', amount: stats.breakdown.service, icon: Settings, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                            { label: 'EMI', amount: stats.breakdown.emi, icon: Landmark, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                            { label: 'Insure', amount: stats.breakdown.insurance, icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' }
                        ].map(item => (
                            <div key={item.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-2 text-center shadow-sm flex flex-col items-center justify-between">
                                <div className={`w-6 h-6 rounded-full ${item.bg} ${item.color} flex items-center justify-center mb-1`}>
                                    <item.icon className="w-3 h-3" />
                                </div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase">{item.label}</p>
                                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                                    ₹{item.amount > 1000 ? (item.amount / 1000).toFixed(1) + 'k' : item.amount}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 6 Month Trend */}
            {trendData.length > 0 && (
                <section className="mt-6 mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white px-1 mb-3 text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        6-Month Trend
                    </h3>
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-end justify-between h-32">
                        {trendData.map((data, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 w-full group relative">
                                <span className="absolute -top-6 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    ₹{data.cost > 1000 ? (data.cost / 1000).toFixed(1) + 'k' : data.cost}
                                </span>
                                <div className="w-full max-w-[24px] bg-slate-100 dark:bg-slate-800 rounded-t-lg relative flex flex-col justify-end h-16">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(data.cost / maxTrendCost) * 100}%` }}
                                        className="bg-indigo-500 rounded-t-lg w-full transition-all group-hover:bg-indigo-400"
                                    />
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">{data.label}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Transaction Log */}
            <section className="mt-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                        <History className="w-4 h-4 text-slate-500" />
                        Transactions
                    </h3>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar mb-4">
                    {['All', 'Fuel', 'Service', 'EMI', 'Insurance'].map(f => (
                        <Pressable
                            key={f}
                            onClick={() => setHistoryFilter(f)}
                            scaleDown={0.92}
                            className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${historyFilter === f ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                        >
                            {f}
                        </Pressable>
                    ))}
                </div>

                <div className="space-y-3">
                     {combinedHistory.length === 0 ? (
                        <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">No transaction records found.</p>
                        </div>
                    ) : (
                        combinedHistory.map((record, index) => {
                            const isSelected = selectedIds.includes(record.id);
                            return (
                                <Pressable 
                                    key={record.id || index} 
                                    onClick={() => isSelectionMode && toggleSelection(record.id)}
                                    onMouseDown={() => handlePointerDown(record.id)}
                                    onMouseUp={handlePointerUpOrLeave}
                                    onMouseLeave={handlePointerUpOrLeave}
                                    onTouchStart={() => handlePointerDown(record.id)}
                                    onTouchEnd={handlePointerUpOrLeave}
                                    scaleDown={0.98}
                                    className={clsx(
                                        "bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all flex items-start justify-between group cursor-pointer w-full text-left",
                                        isSelected ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10" : "border-slate-100 dark:border-slate-800"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {isSelectionMode && (
                                            <div className={clsx(
                                                "w-5 h-5 rounded-full border flex items-center justify-center mt-1 transition-colors",
                                                isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300 dark:border-slate-700"
                                            )}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h5 className="font-bold text-slate-900 dark:text-white text-sm capitalize">{record.type}</h5>
                                                {record.financeTxId && <div className="w-2 h-2 rounded-full bg-emerald-500" title="Synced with Finance"></div>}
                                            </div>
                                            <p className="text-xs text-slate-400">{format(new Date(record.date), 'MMM d, yyyy')}</p>
                                            {record.notes && (
                                                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{record.notes}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="text-right">
                                            {record.amount > 0 && (
                                                <span className="block font-bold text-slate-900 dark:text-white text-sm">₹{Number(record.amount).toLocaleString()}</span>
                                            )}
                                            {record.odometer && (
                                                <span className="block text-[10px] text-slate-400 mt-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-lg inline-block">
                                                    {Number(record.odometer).toLocaleString()} km
                                                </span>
                                            )}
                                        </div>
                                        {!isSelectionMode && (
                                            <ItemMenu 
                                                onEdit={() => {
                                                    setEditingEntry(record);
                                                    setEditAmount(String(record.amount || ''));
                                                    setEditNotes(record.notes || '');
                                                    setEditDate(format(new Date(record.date), 'yyyy-MM-dd'));
                                                }}
                                                onDelete={() => setDeleteConfirmId(record.id)}
                                            />
                                        )}
                                    </div>
                                </Pressable>
                            );
                        })
                    )}
                </div>
            </section>
        </div>

        {/* Edit Entry Modal */}
        <AnimatePresence>
            {editingEntry && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingEntry(null)} className="absolute inset-0 bg-black/50 backdrop-blur-md" />
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-white/10 dark:border-slate-800 relative z-10 p-7"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Edit Entry</h3>
                                <p className="text-[11px] text-slate-400 font-medium mt-0.5 capitalize">{editingEntry.type}</p>
                            </div>
                            <button onClick={() => setEditingEntry(null)} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 active:scale-90 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={editAmount}
                                    onChange={e => setEditAmount(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white font-bold text-lg outline-none focus:border-indigo-400/50 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Date</label>
                                <input
                                    type="date"
                                    value={editDate}
                                    onChange={e => setEditDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white font-bold text-[13px] outline-none focus:border-indigo-400/50 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Notes</label>
                                <input
                                    type="text"
                                    value={editNotes}
                                    onChange={e => setEditNotes(e.target.value)}
                                    placeholder="Service details..."
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white font-bold text-[13px] outline-none focus:border-indigo-400/50 transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setEditingEntry(null)} className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-sm">
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (onEditEntry) {
                                        const updates = {};
                                        if (editAmount && Number(editAmount) !== Number(editingEntry.amount)) updates.amount = Number(editAmount);
                                        if (editDate && new Date(editDate + 'T12:00:00').toISOString() !== editingEntry.date) updates.date = new Date(editDate + 'T12:00:00').toISOString();
                                        if (editNotes !== (editingEntry.notes || '')) updates.notes = editNotes;
                                        if (Object.keys(updates).length > 0) {
                                            await onEditEntry(editingEntry.id, updates);
                                        }
                                    }
                                    setEditingEntry(null);
                                }}
                                className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </>
    );
};

export default LedgerScreen;
