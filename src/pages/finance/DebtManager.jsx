import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { ArrowLeft, User, Plus, Check, RotateCcw } from 'lucide-react';
import { useState } from 'react';

const DebtManager = () => {
    const navigate = useNavigate();
    const { debts, addDebt, settleDebt, addDebtPayment } = useFinance();
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [type, setType] = useState('receivable'); // 'receivable' (They owe me) | 'payable' (I owe them)
    const [person, setPerson] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [note, setNote] = useState('');

    // Repayment State
    const [repayModalOpen, setRepayModalOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [repayAmount, setRepayAmount] = useState('');

    const activeDebts = debts.filter(d => !d.isSettled);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!person || !amount) return;

        addDebt({
            type,
            person,
            amount: Number(amount),
            note,
            dueDate: dueDate || null
        });
        setIsAdding(false);
        setPerson('');
        setAmount('');
        setDueDate('');
        setNote('');
    };

    const receivables = activeDebts.filter(d => d.type === 'receivable');
    const payables = activeDebts.filter(d => d.type === 'payable');
    // Summary based on REMAINING amount
    const totalReceivable = receivables.reduce((sum, d) => sum + (Number(d.amount) - (d.paidAmount || 0)), 0);
    const totalPayable = payables.reduce((sum, d) => sum + (Number(d.amount) - (d.paidAmount || 0)), 0);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Header */}
            <header className="bg-slate-900 text-white p-6 rounded-b-[2.5rem] shadow-2xl shadow-slate-900/30">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate('/finance')} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="text-lg font-bold tracking-wide">Debts & Lending</h1>
                    <div className="w-10" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-4 rounded-2xl">
                        <p className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider mb-1">To Receive</p>
                        <h2 className="text-2xl font-bold text-emerald-400">₹{totalReceivable.toLocaleString()}</h2>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl">
                        <p className="text-[10px] text-red-300 uppercase font-bold tracking-wider mb-1">To Pay</p>
                        <h2 className="text-2xl font-bold text-red-400">₹{totalPayable.toLocaleString()}</h2>
                    </div>
                </div>
            </header>

            <div className="p-4 space-y-8">
                {isAdding ? (
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Add New Record</h3>

                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                            <button
                                type="button"
                                onClick={() => setType('receivable')}
                                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${type === 'receivable' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                            >
                                I Lent (Get Back)
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('payable')}
                                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${type === 'payable' ? 'bg-white dark:bg-slate-700 shadow-sm text-red-600 dark:text-red-400' : 'text-slate-500'}`}
                            >
                                I Borrowed (Pay)
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Person Name</label>
                                <input
                                    type="text"
                                    value={person}
                                    onChange={e => setPerson(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Amount</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="500"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Due Date (Optional)</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Note</label>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Reason..."
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="flex-1 py-3 font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
                            >
                                Save Record
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex items-center justify-center gap-2 text-slate-500 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all font-bold"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Record
                    </button>
                )}

                {/* Lists */}
                {/* Lists logic with progress bars */}
            </div>

            {/* Lists with Zero State */}
            {receivables.length === 0 && payables.length === 0 && !isAdding && (
                <div className="text-center py-16 px-6">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <User className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No active debts</h3>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
                        Keep track of money you lend to friends or borrow from others. Everything is balanced!
                    </p>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-transform"
                    >
                        + Add Person
                    </button>
                </div>
            )}

            <div className="space-y-8">
                {receivables.length > 0 && (
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-3 pl-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Expected to Receive
                        </h3>
                        <div className="space-y-3">
                            {receivables.map(d => <DebtItem key={d.id} debt={d} onRepay={() => { setSelectedDebt(d); setRepayModalOpen(true); }} />)}
                        </div>
                    </div>
                )}
                {payables.length > 0 && (
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-3 pl-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Need to Pay
                        </h3>
                        <div className="space-y-3">
                            {payables.map(d => <DebtItem key={d.id} debt={d} onRepay={() => { setSelectedDebt(d); setRepayModalOpen(true); }} />)}
                        </div>
                    </div>
                )}
            </div>

            {/* Repay Modal */}
            {repayModalOpen && selectedDebt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRepayModalOpen(false)} />
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl w-full max-w-sm relative z-10 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Record Repayment</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            How much {selectedDebt.type === 'receivable' ? 'did you receive' : 'did you pay'}?
                        </p>

                        <div className="mb-4">
                            <input
                                type="number"
                                value={repayAmount}
                                onChange={e => setRepayAmount(e.target.value)}
                                placeholder={`Remaining: ${Number(selectedDebt.amount) - (selectedDebt.paidAmount || 0)}`}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xl font-bold"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setRepayModalOpen(false)} className="py-3 font-bold text-slate-500">Cancel</button>
                            <button
                                onClick={() => {
                                    if (repayAmount) {
                                        addDebtPayment(selectedDebt.id, repayAmount);
                                        setRepayModalOpen(false);
                                        setRepayAmount('');
                                    }
                                }}
                                className="py-3 bg-slate-900 text-white font-bold rounded-xl"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Component for List Item
const DebtItem = ({ debt, onRepay }) => {
    const paid = Number(debt.paidAmount) || 0;
    const total = Number(debt.amount);
    const percent = Math.min((paid / total) * 100, 100);
    const remaining = total - paid;

    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${debt.type === 'receivable' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white">{debt.person}</p>
                        <p className="text-xs text-slate-400">{debt.note}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`font-bold ${debt.type === 'receivable' ? 'text-emerald-600' : 'text-red-600'}`}>
                        ₹{remaining.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400">of ₹{total.toLocaleString()}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                <div
                    className={`h-full rounded-full ${debt.type === 'receivable' ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${percent}%` }}
                />
            </div>

            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {debt.dueDate ? `Due ${new Date(debt.dueDate).toLocaleDateString()}` : 'No Due Date'}
                </span>
                <button
                    onClick={onRepay}
                    className="text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg"
                >
                    Record Payment
                </button>
            </div>
        </div>
    );
};

export default DebtManager;
