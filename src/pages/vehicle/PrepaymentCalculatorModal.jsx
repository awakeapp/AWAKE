import { useState, useMemo } from 'react';
import { X, Calculator, ArrowRight, Save } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { format, addMonths } from 'date-fns';

const PrepaymentCalculatorModal = ({ isOpen, onClose, loan, onSavePayment }) => {
    useScrollLock(isOpen);

    const [prepaymentAmount, setPrepaymentAmount] = useState('');

    const calcResult = useMemo(() => {
        if (!loan || !prepaymentAmount || Number(prepaymentAmount) <= 0) return null;
        
        const extra = Number(prepaymentAmount);
        const balance = loan.remainingPrincipal;
        const rate = (loan.interestRate / 100) / 12;
        const emi = loan.emiAmount;
        
        if (extra >= balance) {
            return { type: 'closure', savings: 0, newTenure: 0 };
        }

        // Simulating the savings
        // Standard remaining tenure
        let stdBalance = balance;
        let stdMonths = 0;
        let stdInterestPaid = 0;
        while (stdBalance > 0 && stdMonths < 120) {
            stdMonths++;
            const interest = stdBalance * rate;
            stdInterestPaid += interest;
            stdBalance -= (emi - interest);
        }

        // New remaining tenure after prepayment
        let newBalance = balance - extra;
        let newMonths = 0;
        let newInterestPaid = 0;
        while (newBalance > 0 && newMonths < 120) {
            newMonths++;
            const interest = newBalance * rate;
            newInterestPaid += interest;
            newBalance -= (emi - interest);
        }

        return {
            type: 'reduction',
            interestSaved: Math.max(0, stdInterestPaid - newInterestPaid),
            monthsSaved: Math.max(0, stdMonths - newMonths),
            newTenure: newMonths
        };
    }, [loan, prepaymentAmount]);

    const handleSave = (e) => {
        e.preventDefault();
        const amt = Number(prepaymentAmount);
        if (amt > 0) {
            onSavePayment(loan.id, {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                amount: amt,
                principal: amt,
                interest: 0,
                type: 'Prepayment',
                notes: 'Principal Prepayment'
            });
            onClose();
            setPrepaymentAmount('');
        }
    };

    if (!isOpen || !loan) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-900 text-white rounded-t-2xl">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-indigo-400" />
                        Prepayment Calculator
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-4 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Current Principal Balance</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">₹{loan.remainingPrincipal.toLocaleString()}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prepayment Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                            <input
                                type="number"
                                required
                                min="1"
                                max={loan.remainingPrincipal}
                                placeholder="Enter amount..."
                                value={prepaymentAmount}
                                onChange={(e) => setPrepaymentAmount(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-bold"
                            />
                        </div>
                    </div>

                    {calcResult && calcResult.type === 'reduction' && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 space-y-3">
                            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                Projected Savings <ArrowRight className="w-3 h-3" />
                            </h4>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold uppercase">Interest Saved</p>
                                    <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">₹{Math.round(calcResult.interestSaved).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold uppercase">Tenure Reduced By</p>
                                    <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{calcResult.monthsSaved} <span className="text-xs">months</span></p>
                                </div>
                            </div>
                        </div>
                    )}

                    {calcResult && calcResult.type === 'closure' && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 text-center">
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-100">Full Loan Closure</h4>
                            <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">This payment will completely settle the remaining principal.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!prepaymentAmount}
                        className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${prepaymentAmount ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                    >
                        <Save className="w-5 h-5" />
                        Record Prepayment
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PrepaymentCalculatorModal;
