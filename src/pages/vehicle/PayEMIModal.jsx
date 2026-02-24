import { useState, useEffect } from 'react';
import { X, Check, Banknote, AlertCircle, TrendingDown, Percent, MinusCircle, Calendar } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { format } from 'date-fns';
import JumpDateModal from '../../components/organisms/JumpDateModal';

const PayEMIModal = ({ isOpen, onClose, onSave, loan, vehicle, loanDetail }) => {
    const { accounts } = useFinance();

    const [formData, setFormData] = useState({
        type: 'EMI', // EMI, Prepayment, Penalty
        amount: '',
        date: new Date().toISOString().split('T')[0],
        accountId: (accounts || []).find(a => !a.isArchived)?.id || '',
        notes: '',
        principal: '',
        interest: '',
        penalty: 0,
        discount: 0,
    });

    useEffect(() => {
        if (loan && formData.type === 'EMI') {
            const emi = Number(loan.emiAmount);
            let penalty = 0;
            if (loanDetail?.isPastDue) {
                // Example penalty: 2% of EMI per 30 days late
                penalty = Math.round((emi * 0.02) * (loanDetail.daysLate / 30));
                if (penalty < 100 && loanDetail.daysLate > 0) penalty = 500; // Min penalty
            }
            setFormData(prev => ({ ...prev, amount: emi, penalty: penalty }));
        }
    }, [loan, formData.type, loanDetail]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(loan.id, {
            ...formData,
            amount: Number(formData.amount),
            principal: Number(formData.principal) || (formData.type === 'EMI' ? Number(formData.amount) * 0.7 : Number(formData.amount)),
            interest: Number(formData.interest) || (formData.type === 'EMI' ? Number(formData.amount) * 0.3 : 0),
            penalty: Number(formData.penalty),
            discount: Number(formData.discount)
        });
        onClose();
    };

    if (!isOpen || !loan) return null;

    const remaining = Number(loan.remainingPrincipal);

    const [paymentDatePickerOpen, setPaymentDatePickerOpen] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-emerald-600 text-white">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Banknote className="w-5 h-5" />
                            Record Payment
                        </h2>
                        <p className="text-[10px] opacity-80">{loan.lender} - {vehicle?.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {['EMI', 'Prepayment', 'Penalty'].map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setFormData({ ...formData, type: t })}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.type === t ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                            <button
                                type="button"
                                onClick={() => setPaymentDatePickerOpen(true)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white text-left flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                {formData.date ? format(new Date(formData.date + 'T00:00:00'), 'MMM d, yyyy') : 'Select date'}
                            </button>
                            <JumpDateModal
                                isOpen={paymentDatePickerOpen}
                                onClose={() => setPaymentDatePickerOpen(false)}
                                initialDate={formData.date ? new Date(formData.date + 'T00:00:00') : new Date()}
                                onSelect={(d) => { setFormData({ ...formData, date: format(d, 'yyyy-MM-dd') }); setPaymentDatePickerOpen(false); }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Paid Amount</label>
                            <input
                                type="number"
                                required
                                placeholder="0"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Penalty Paid
                            </label>
                            <input
                                type="number"
                                value={formData.penalty}
                                onChange={(e) => setFormData({ ...formData, penalty: e.target.value })}
                                className="w-full bg-red-50 dark:bg-red-900/10 border-none rounded-xl px-4 py-3 text-red-600 dark:text-red-400 font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <MinusCircle className="w-3 h-3" /> Discount/Bonus
                            </label>
                            <input
                                type="number"
                                value={formData.discount}
                                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                className="w-full bg-emerald-50 dark:bg-emerald-900/10 border-none rounded-xl px-4 py-3 text-emerald-600 dark:text-emerald-400 font-bold"
                            />
                        </div>
                    </div>

                    {formData.type === 'EMI' && (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Principal Component</label>
                                <input
                                    type="number"
                                    placeholder="Suggest: 70%"
                                    value={formData.principal}
                                    onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Interest Component</label>
                                <input
                                    type="number"
                                    placeholder="Suggest: 30%"
                                    value={formData.interest}
                                    onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {formData.type === 'Penalty' && (
                        <div className="animate-in slide-in-from-top-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Late Fee / Penalty Description</label>
                            <textarea
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="e.g. Late fee for March EMI"
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm"
                            />
                        </div>
                    )}

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Paid From Account</label>
                        <select
                            value={formData.accountId}
                            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
                        >
                            {accounts.filter(a => !a.isArchived).map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.balance})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase mt-2">
                        <TrendingDown className="w-3 h-3" />
                        Remaining Principal: ₹{remaining.toLocaleString()}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl mt-2 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        <Check className="w-5 h-5" />
                        Record & Log Finance
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PayEMIModal;
