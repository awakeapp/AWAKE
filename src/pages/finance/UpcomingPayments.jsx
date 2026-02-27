import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Plus, Trash2, Calendar, Zap, CreditCard, Music, Monitor, Smartphone, Briefcase, ShoppingBag, Pause, Play, RefreshCw, X } from 'lucide-react';
import { format, differenceInDays, isBefore, addMonths } from 'date-fns';
import { useTranslation } from 'react-i18next'; // Added i18n support
import { useScrollLock } from '../../hooks/useScrollLock';
import { useToast } from '../../context/ToastContext';
import { DeleteConfirmationModal } from '../../components/ui/DeleteConfirmationModal';
import { ItemMenu } from '../../components/ui/ItemMenu';
import { SelectionBar } from '../../components/ui/SelectionBar';
import { useSelection } from '../../hooks/useSelection';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import FinanceBottomNav from '../../components/finance/FinanceBottomNav';

const ICONS = [
    { icon: Zap, label: 'Utility' },
    { icon: Music, label: 'Spotify' },
    { icon: Monitor, label: 'Netflix' },
    { icon: Smartphone, label: 'Phone' },
    { icon: Briefcase, label: 'Work' },
    { icon: ShoppingBag, label: 'Shop' },
    { icon: CreditCard, label: 'Card' }
];

const COLORS = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-pink-500 to-rose-500',
    'from-slate-700 to-slate-900',
];

const UpcomingPayments = () => {
    const { subscriptions, addSubscription, deleteSubscription, toggleSubscriptionStatus } = useFinance();
    const [isAdding, setIsAdding] = useState(false);
    const { t } = useTranslation();
    const { showToast } = useToast();

    const {
        selectedIds,
        isSelectionMode,
        toggleSelection,
        clearSelection,
        enterSelectionMode,
        exitSelectionMode,
        toggleSelectAll
    } = useSelection(subscriptions.map(s => s.id));

    useScrollLock(isAdding);

    // Form State
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [day, setDay] = useState('');
    const [selectedIconIdx, setSelectedIconIdx] = useState(0);
    const [selectedColorIdx, setSelectedColorIdx] = useState(0);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !amount || !day) return;

        const dayNum = Number(day);
        if (dayNum < 1 || dayNum > 31) {
            alert("Please enter a valid day (1-31)");
            return;
        }


        try {
            addSubscription({
                name,
                amount,
                dueDate: dayNum,
                iconIdx: selectedIconIdx,
                colorIdx: selectedColorIdx
            });
            showToast('Subscription added', 'success');
            setIsAdding(false);
            setName('');
            setAmount('');
            setDay('');
        } catch (err) {
            console.error("Failed to save subscription:", err);
            showToast('Failed to save. Please try again.', 'error');
        }
    };

    const getDaysLeft = (nextDate) => {
        const today = new Date();
        const target = new Date(nextDate);
        const days = differenceInDays(target, today);

        if (days < 0) return `Overdue ${Math.abs(days)}d`;
        if (days === 0) return 'Due Today';
        if (days === 1) return 'Tomorrow';
        return `${days} days left`;
    };

    const sortedSubs = [...subscriptions].sort((a, b) => {
        if (!a.nextBillingDate) return 0;
        return new Date(a.nextBillingDate) - new Date(b.nextBillingDate);
    });

    const totalMonthlyCost = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + Number(s.amount), 0);

    const handleBulkDelete = async () => {
        try {
            await Promise.all(Array.from(selectedIds).map(id => deleteSubscription(id)));
            showToast(`Deleted ${selectedIds.size} subscriptions`, 'success');
            exitSelectionMode();
        } catch (error) {
            showToast('Failed to delete some subscriptions', 'error');
        } finally {
            setDeleteConfirmId(null);
        }
    };

    return (
        <PageLayout
            bottomNav={<FinanceBottomNav />}
            title={isSelectionMode ? undefined : t('finance.upcoming', 'Upcoming')}
            header={isSelectionMode ? (
                <SelectionBar 
                    count={selectedIds.size}
                    onCancel={exitSelectionMode}
                    onSelectAll={toggleSelectAll}
                    isAllSelected={selectedIds.size === subscriptions.length}
                    actions={(
                        <button
                            onClick={() => setDeleteConfirmId('bulk')}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                />
            ) : undefined}
            showBack={!isSelectionMode}
            rightNode={isSelectionMode ? null : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="text-xs text-indigo-500 font-bold uppercase hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                >
                    {t('finance.add_new', '+ Add New')}
                </button>
            )}
        >
            <div className="space-y-4">





            {/* Horizontal Scroll List */}
            < div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide flex gap-3" >
                {
                    sortedSubs.length === 0 && !isAdding && (
                        <div className="w-full text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            <p className="text-slate-400 text-sm mb-2">{t('finance.no_upcoming_bills', 'No upcoming bills.')}</p>
                            <button onClick={() => setIsAdding(true)} className="text-indigo-500 font-bold text-sm">{t('finance.add_bill', '+ Add Bill')}</button>
                        </div>
                    )
                }

                {
                    sortedSubs.map(sub => {
                        const Icon = ICONS[sub.iconIdx || 0].icon;
                        const daysLeft = getDaysLeft(sub.nextBillingDate || sub.dueDate);
                        const isSelected = selectedIds.has(sub.id);

                        return (
                            <div 
                                key={sub.id} 
                                onClick={() => isSelectionMode && toggleSelection(sub.id)}
                                onContextMenu={(e) => { e.preventDefault(); enterSelectionMode(sub.id); }}
                                className={clsx(
                                    "min-w-[170px] max-w-[200px] p-5 rounded-[1.5rem] bg-white dark:bg-slate-900 border transition-all relative group flex flex-col justify-between min-h-[120px] gap-3 cursor-pointer",
                                    isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-100 dark:border-slate-800"
                                )}
                            >
                                {/* Action Buttons */}
                                <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                                    {isSelectionMode ? (
                                        <div className={clsx(
                                            "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                            isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300 dark:border-slate-700"
                                        )}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    ) : (
                                        <ItemMenu 
                                            onEdit={() => alert("Edit coming soon")}
                                            onDelete={() => setDeleteConfirmId(sub.id)}
                                            extraActions={[
                                                {
                                                    label: sub.status === 'active' ? 'Pause' : 'Resume',
                                                    icon: sub.status === 'active' ? Pause : Play,
                                                    onClick: () => toggleSubscriptionStatus(sub.id)
                                                }
                                            ]}
                                        />
                                    )}
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-slate-900 dark:text-white text-[11px] leading-tight truncate">{sub.name}</h4>
                                        <p className="text-slate-400 text-[11px] font-extrabold mt-0.5">₹{Number(sub.amount).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className={`w-full text-center py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${sub.status !== 'active' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : daysLeft.includes('Overdue') ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'}`}>
                                    {sub.status === 'active' ? daysLeft : 'Paused'}
                                </div>
                            </div>

                        );
                    })
                }
            </div >

            {/* Add Modal */}
            {
                isAdding && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setIsAdding(false)} />
                        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl relative z-10 max-h-[92vh] overflow-hidden flex flex-col border border-white/10 shrink-0">
                            <div className="flex justify-between items-center mb-8 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
                                        <Zap className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Recurring Bill</h2>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Subscription Manager</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAdding(false)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:rotate-90 transition-transform">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-1 scrollbar-hide pb-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Spotify"
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/30 rounded-2xl p-4 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 transition-all"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Amount</label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/30 rounded-2xl p-4 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 transition-all text-right"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Due Day (1-31)</label>
                                    <input
                                        type="number"
                                        value={day}
                                        onChange={e => setDay(e.target.value)}
                                        placeholder="15"
                                        min="1"
                                        max="31"
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/30 rounded-2xl p-4 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 transition-all"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Visual Symbol</label>
                                    <div className="grid grid-cols-5 gap-3">
                                        {ICONS.map((item, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setSelectedIconIdx(idx)}
                                                className={`aspect-square rounded-2xl flex items-center justify-center border-2 transition-all ${selectedIconIdx === idx ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-50 dark:border-slate-800'}`}
                                            >
                                                <item.icon className={`w-5 h-5 ${selectedIconIdx === idx ? 'text-indigo-600' : 'text-slate-400'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Theme Palette</label>
                                    <div className="flex gap-4 pb-2">
                                        {COLORS.map((g, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setSelectedColorIdx(idx)}
                                                className={`w-10 h-10 rounded-full bg-gradient-to-br ${g} ring-2 ring-offset-4 ring-offset-white dark:ring-offset-slate-900 transition-all ${selectedColorIdx === idx ? 'ring-indigo-500 scale-110' : 'ring-transparent opacity-60'}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-xs tracking-[0.2em] py-5 rounded-2xl shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4">
                                    Secure Subscription
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            <DeleteConfirmationModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={deleteConfirmId === 'bulk' ? handleBulkDelete : () => {
                    deleteSubscription(deleteConfirmId);
                    showToast('Subscription deleted', 'info');
                    setDeleteConfirmId(null);
                }}
                title={deleteConfirmId === 'bulk' ? `Delete ${selectedIds.size} Subscriptions?` : "Delete Subscription?"}
                message={deleteConfirmId === 'bulk' ? "Are you sure you want to delete these subscriptions? This action cannot be undone." : "Are you sure you want to delete this subscription? This cannot be undone."}
            />
        </div>
        </PageLayout>
    );
};

export default UpcomingPayments;
