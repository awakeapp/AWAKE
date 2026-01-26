import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Plus, Trash2, Calendar, Zap, CreditCard, Music, Monitor, Smartphone, Briefcase, ShoppingBag, Pause, Play, RefreshCw } from 'lucide-react';
import { format, differenceInDays, isBefore, addMonths } from 'date-fns';

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

    // Form State
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [day, setDay] = useState('');
    const [selectedIconIdx, setSelectedIconIdx] = useState(0);
    const [selectedColorIdx, setSelectedColorIdx] = useState(0);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !amount || !day) return;

        const dayNum = Number(day);
        if (dayNum < 1 || dayNum > 31) {
            alert("Please enter a valid day (1-31)");
            return;
        }

        console.log("Saving subscription:", { name, amount, dayNum });

        try {
            addSubscription({
                name,
                amount,
                dueDate: dayNum,
                iconIdx: selectedIconIdx,
                colorIdx: selectedColorIdx
            });
            setIsAdding(false);
            setName('');
            setAmount('');
            setDay('');
        } catch (err) {
            console.error("Failed to save subscription:", err);
            alert("Failed to save. Please try again.");
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Upcoming Payments</h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="text-xs text-indigo-500 font-bold uppercase hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                >
                    + Add New
                </button>
            </div>



            {/* Summary Card */}
            < div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between mx-2 mb-2" >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Monthly Recurring</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">₹{totalMonthlyCost.toLocaleString()}</p>
                    </div>
                </div>
            </div >

            {/* Horizontal Scroll List */}
            < div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide flex gap-3" >
                {
                    sortedSubs.length === 0 && !isAdding && (
                        <div className="w-full text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            <p className="text-slate-400 text-sm mb-2">No upcoming bills.</p>
                            <button onClick={() => setIsAdding(true)} className="text-indigo-500 font-bold text-sm">+ Add Bill</button>
                        </div>
                    )
                }

                {
                    sortedSubs.map(sub => {
                        const Icon = ICONS[sub.iconIdx || 0].icon;
                        const gradient = COLORS[sub.colorIdx || 0];
                        const daysLeft = getDaysLeft(sub.dueDate);

                        return (
                            <div key={sub.id} className={`min-w-[170px] p-4 rounded-[1.5rem] bg-gradient-to-br ${gradient} text-white shadow-xl relative group`}>
                                {/* Action Buttons */}
                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleSubscriptionStatus(sub.id); }}
                                        className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                                        title={sub.status === 'active' ? "Pause" : "Resume"}
                                    >
                                        {sub.status === 'active' ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white" />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteSubscription(sub.id); }}
                                        className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3 h-3 text-white" />
                                    </button>
                                </div>

                                <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                                    <Icon className="w-5 h-5 text-white" />
                                </div>

                                <h4 className="font-bold text-lg leading-tight mb-1 truncate">{sub.name}</h4>
                                <p className="text-white/80 text-xs font-medium mb-3">₹{Number(sub.amount).toLocaleString()}/mo</p>

                                <div className="flex items-center justify-between">
                                    <div className={`bg-black/20 rounded-lg px-2 py-1 inline-block ${sub.status !== 'active' ? 'opacity-50' : ''}`}>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-white/90">
                                            {sub.status === 'active' ? daysLeft : 'Paused'}
                                        </p>
                                    </div>
                                    {sub.status !== 'active' && <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg">Paused</span>}
                                </div>
                            </div>
                        );
                    })
                }
            </div >

            {/* Add Modal */}
            {
                isAdding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAdding(false)} />
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-bold mb-4">Add Subscription</h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Netflix"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-bold"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Amount</label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            placeholder="500"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Due Day (1-31)</label>
                                        <input
                                            type="number"
                                            value={day}
                                            onChange={e => setDay(e.target.value)}
                                            placeholder="15"
                                            min="1"
                                            max="31"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-bold"
                                        />
                                    </div>
                                </div>

                                {/* Icons Grid */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Icon</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {ICONS.map((item, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setSelectedIconIdx(idx)}
                                                className={`p-2 rounded-xl border-2 transition-all ${selectedIconIdx === idx ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800'}`}
                                            >
                                                <item.icon className={`w-5 h-5 ${selectedIconIdx === idx ? 'text-indigo-600' : 'text-slate-400'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Grid */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Color</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {COLORS.map((g, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setSelectedColorIdx(idx)}
                                                className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 transition-all ${selectedColorIdx === idx ? 'ring-indigo-500 scale-110' : 'ring-transparent opacity-70'}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl mt-4">
                                    Save Subscription
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default UpcomingPayments;
