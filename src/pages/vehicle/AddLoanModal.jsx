import { useState, useEffect } from 'react';
import { X, Save, Landmark, Calculator, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import JumpDateModal from '../../components/organisms/JumpDateModal';

import { useScrollLock } from '../../hooks/useScrollLock';

const AddLoanModal = ({ isOpen, onClose, onSave, vehicle }) => {
    useScrollLock(isOpen);
    const [formData, setFormData] = useState({
        vehicleId: vehicle?.id || '',
        lender: '',
        totalLoanAmount: '',
        interestRate: '',
        interestType: 'reducing', // reducing or flat
        tenureMonths: '',
        startDate: new Date().toISOString().split('T')[0],
        dueDateDay: 5,
    });

    const [calculatedEMI, setCalculatedEMI] = useState(0);
    const [calculatedTotalPayable, setCalculatedTotalPayable] = useState(0);
    const [calculatedTotalInterest, setCalculatedTotalInterest] = useState(0);

    useEffect(() => {
        if (vehicle) {
            setFormData(prev => ({ ...prev, vehicleId: vehicle.id }));
        }
    }, [vehicle]);

    useEffect(() => {
        // Calculate EMI preview
        const p = Number(formData.totalLoanAmount);
        const r = Number(formData.interestRate) / 12 / 100;
        const n = Number(formData.tenureMonths);

        if (p > 0 && r > 0 && n > 0) {
            if (formData.interestType === 'reducing') {
                const emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
                const emiRounded = Math.round(emi);
                setCalculatedEMI(emiRounded);
                setCalculatedTotalPayable(emiRounded * n);
                setCalculatedTotalInterest((emiRounded * n) - p);
            } else {
                // Flat
                const totalInterest = p * (Number(formData.interestRate) / 100) * (n / 12);
                const emi = (p + totalInterest) / n;
                const emiRounded = Math.round(emi);
                setCalculatedEMI(emiRounded);
                setCalculatedTotalPayable(Math.round(p + totalInterest));
                setCalculatedTotalInterest(Math.round(totalInterest));
            }
        } else {
            setCalculatedEMI(0);
            setCalculatedTotalPayable(0);
            setCalculatedTotalInterest(0);
        }
    }, [formData.totalLoanAmount, formData.interestRate, formData.tenureMonths, formData.interestType]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            emiAmount: calculatedEMI,
            totalPayable: calculatedTotalPayable,
            totalInterest: calculatedTotalInterest,
            totalLoanAmount: Number(formData.totalLoanAmount),
            interestRate: Number(formData.interestRate),
            tenureMonths: Number(formData.tenureMonths),
            dueDateDay: Number(formData.dueDateDay)
        });
        onClose();
    };

    if (!isOpen) return null;

    const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-900 text-white">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-indigo-400" />
                        Vehicle Financing
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lender / Bank Name</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. HDFC Bank, SBI"
                            value={formData.lender}
                            onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Loan Amount (Principal)</label>
                            <input
                                type="number"
                                required
                                placeholder="0"
                                value={formData.totalLoanAmount}
                                onChange={(e) => setFormData({ ...formData, totalLoanAmount: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Interest Rate (% p.a.)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="8.5"
                                value={formData.interestRate}
                                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tenure (Months)</label>
                            <input
                                type="number"
                                required
                                placeholder="60"
                                value={formData.tenureMonths}
                                onChange={(e) => setFormData({ ...formData, tenureMonths: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Interest Type</label>
                            <select
                                value={formData.interestType}
                                onChange={(e) => setFormData({ ...formData, interestType: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="reducing">Reducing Balance</option>
                                <option value="flat">Flat Interest</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                            <button
                                type="button"
                                onClick={() => setStartDatePickerOpen(true)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-left flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                {formData.startDate ? format(new Date(formData.startDate + 'T00:00:00'), 'MMM d, yyyy') : 'Select date'}
                            </button>
                            <JumpDateModal
                                isOpen={startDatePickerOpen}
                                onClose={() => setStartDatePickerOpen(false)}
                                initialDate={formData.startDate ? new Date(formData.startDate + 'T00:00:00') : new Date()}
                                onSelect={(d) => { setFormData({ ...formData, startDate: format(d, 'yyyy-MM-dd') }); setStartDatePickerOpen(false); }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">EMI Due Day</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                required
                                placeholder="5"
                                value={formData.dueDateDay}
                                onChange={(e) => setFormData({ ...formData, dueDateDay: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {calculatedEMI > 0 && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Estimated Monthly EMI</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">₹{calculatedEMI.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl mt-4 transition-colors flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Initialize Loan
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddLoanModal;
