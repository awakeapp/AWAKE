import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { ArrowLeft, Wallet, Plus, Archive } from 'lucide-react';
import { useState } from 'react';
import FinanceBottomNav from '../../components/finance/FinanceBottomNav';
import PageLayout from '../../components/layout/PageLayout';

const FinanceWallets = () => {
    const navigate = useNavigate();
    const { accounts, addAccount, getAccountBalance } = useFinance();
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newBalance, setNewBalance] = useState('');

    const activeAccounts = accounts.filter(a => !a.isArchived);
    const archivedAccounts = accounts.filter(a => a.isArchived);

    const handleAdd = async () => {
        if (!newName.trim()) return;
        await addAccount({ name: newName.trim(), openingBalance: Number(newBalance) || 0 });
        setNewName('');
        setNewBalance('');
        setIsAdding(false);
    };

    return (
        <PageLayout
            bottomNav={<FinanceBottomNav />}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-900 dark:text-white -ml-1">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Wallets</h1>
                            <p className="text-[11px] text-slate-400 font-medium">{activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 active:scale-95 transition-transform shadow-lg shadow-indigo-500/20"
                    >
                        <Plus className="w-4 h-4" /> Add
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                {/* Active Accounts */}
                {activeAccounts.map(acc => {
                    const bal = getAccountBalance ? getAccountBalance(acc.id) : acc.balance;
                    return (
                        <button
                            key={acc.id}
                            onClick={() => navigate(`/finance/account/${acc.id}`)}
                            className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex items-center justify-between active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                                    <Wallet className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900 dark:text-white text-[15px]">{acc.name}</p>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Active • Tap to view</p>
                                </div>
                            </div>
                            <p className={`text-lg font-black ${(bal || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                ₹{(bal || 0).toLocaleString()}
                            </p>
                        </button>
                    );
                })}

                {/* Archived */}
                {archivedAccounts.length > 0 && (
                    <>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mt-6">Archived</p>
                        {archivedAccounts.map(acc => (
                            <button
                                key={acc.id}
                                onClick={() => navigate(`/finance/account/${acc.id}`)}
                                className="w-full bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex items-center justify-between opacity-60"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                                        <Archive className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <p className="font-bold text-slate-500 text-[15px]">{acc.name}</p>
                                </div>
                                <p className="text-slate-400 font-bold">₹{(acc.balance || 0).toLocaleString()}</p>
                            </button>
                        ))}
                    </>
                )}

                {/* Add Account Inline */}
                {isAdding && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 p-5 space-y-3">
                        <input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Account name"
                            autoFocus
                            className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-slate-900 dark:text-white font-bold outline-none border border-slate-200 dark:border-slate-700 focus:border-indigo-400"
                        />
                        <input
                            type="number"
                            value={newBalance}
                            onChange={e => setNewBalance(e.target.value)}
                            placeholder="Opening balance (₹)"
                            className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-slate-900 dark:text-white font-bold outline-none border border-slate-200 dark:border-slate-700 focus:border-indigo-400"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setIsAdding(false)} className="flex-1 py-3 text-slate-400 font-bold rounded-xl">Cancel</button>
                            <button onClick={handleAdd} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl active:scale-95 transition-transform">Save</button>
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    );
};

export default FinanceWallets;
