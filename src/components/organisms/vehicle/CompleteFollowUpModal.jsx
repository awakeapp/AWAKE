import { useState } from 'react';
import { X, CheckCircle, Wallet, Gauge, FileText, Calendar } from 'lucide-react';
import { useFinance } from '../../../context/FinanceContext';
import { format } from 'date-fns';
import JumpDateModal from '../JumpDateModal';

const CompleteFollowUpModal = ({ isOpen, onClose, onComplete, followUp, vehicle }) => {
    const { accounts } = useFinance();

    // Default form data
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        cost: '', // Optional
        odometer: vehicle?.odometer || '',
        notes: '',
        accountId: (accounts || []).find(a => !a.isArchived)?.id || '' // Default to first account
    });

    if (!isOpen || !followUp) return null;

    const [completeDatePickerOpen, setCompleteDatePickerOpen] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();

        onComplete(followUp.id, {
            ...formData,
            cost: Number(formData.cost) || 0,
            odometer: Number(formData.odometer) || vehicle.odometer
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/10">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            Complete Service
                        </h2>
                        <p className="text-xs text-slate-500 ml-7">{followUp.type}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date Completed</label>
                            <button
                                type="button"
                                onClick={() => setCompleteDatePickerOpen(true)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white text-left flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                {formData.date ? format(new Date(formData.date + 'T00:00:00'), 'MMM d, yyyy') : 'Select date'}
                            </button>
                            <JumpDateModal
                                isOpen={completeDatePickerOpen}
                                onClose={() => setCompleteDatePickerOpen(false)}
                                initialDate={formData.date ? new Date(formData.date + 'T00:00:00') : new Date()}
                                onSelect={(d) => { setFormData({ ...formData, date: format(d, 'yyyy-MM-dd') }); setCompleteDatePickerOpen(false); }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">New Odometer</label>
                            <input
                                type="number"
                                required
                                placeholder={vehicle.odometer}
                                value={formData.odometer}
                                onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Wallet className="w-4 h-4 text-slate-400" />
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Cost & Payment</h3>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Cost (Optional)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-slate-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {Number(formData.cost) > 0 && (
                            <div className="animate-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Paid From</label>
                                <select
                                    value={formData.accountId}
                                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                                >
                                    {accounts.filter(a => !a.isArchived).map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.balance})</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-indigo-500 mt-1 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Creates expense in Finance
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes (Optional)</label>
                        <textarea
                            rows="2"
                            placeholder="Details about service, parts changed..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl mt-2 transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Complete & Log
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompleteFollowUpModal;
