import { useParams, useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { ArrowLeft, Archive, RefreshCw, Save, History, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';

const AccountDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { accounts, transactions, updateAccount, toggleArchiveAccount, categories } = useFinance();

    const account = accounts.find(a => a.id === id);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editBalance, setEditBalance] = useState('');

    // Filter transactions for this account
    const accountTx = useMemo(() => {
        if (!account) return [];
        return transactions.filter(t => t.accountId === id || t.fromAccountId === id || t.toAccountId === id)
            .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    }, [transactions, id, account]);

    if (!account) return <div className="p-6 text-center">Account not found</div>;

    const handleEdit = () => {
        setEditName(account.name);
        setEditBalance(account.openingBalance);
        setIsEditing(true);
    };

    const handleSave = () => {
        updateAccount(id, { name: editName, openingBalance: Number(editBalance) });
        setIsEditing(false);
    };

    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

    const handleArchiveClick = () => {
        if (showArchiveConfirm) {
            toggleArchiveAccount(id);
            navigate(-1);
        } else {
            setShowArchiveConfirm(true);
            setTimeout(() => setShowArchiveConfirm(false), 3000); // Reset after 3s if not confirmed
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 animate-in slide-in-from-right-4">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 pb-12 rounded-b-[2rem] shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate('/finance')} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="text-lg font-bold">Account Details</h1>
                    <button
                        onClick={handleArchiveClick}
                        className={`p-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${showArchiveConfirm
                            ? 'bg-red-500 text-white w-auto px-3'
                            : account.isArchived
                                ? 'bg-orange-500 text-white'
                                : 'bg-white/10 hover:bg-white/20'
                            }`}
                    >
                        <Archive className="w-5 h-5" />
                        {showArchiveConfirm && <span className="text-xs font-bold whitespace-nowrap">Confirm?</span>}
                    </button>
                </div>

                <div className="text-center">
                    {isEditing ? (
                        <div className="space-y-3 max-w-xs mx-auto">
                            <input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="bg-white/10 border border-white/20 rounded-lg p-2 text-center text-white font-bold w-full"
                            />
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-slate-400 text-xs">Opening: ₹</span>
                                <input
                                    type="number"
                                    value={editBalance}
                                    onChange={e => setEditBalance(e.target.value)}
                                    className="bg-white/10 border border-white/20 rounded-lg p-1 text-center text-white w-24"
                                />
                            </div>
                            <button onClick={handleSave} className="bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold">Save</button>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{account.name}</p>
                            <h2 className="text-4xl font-bold mb-2">₹{account.balance.toLocaleString()}</h2>
                            <button onClick={handleEdit} className="text-xs text-indigo-300 hover:text-white underline">Edit Info</button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 -mt-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <History className="w-4 h-4 text-slate-400" />
                        Transaction History
                    </h3>

                    <div className="space-y-4">
                        {accountTx.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm py-8">No transactions found.</p>
                        ) : (
                            accountTx.map(tx => {
                                const isTransfer = tx.type === 'transfer';
                                // Determine direction relative to THIS account
                                let isIncome = false;
                                let isExpense = false;
                                let displayAmount = Number(tx.amount);
                                let label = tx.note;
                                let icon = null;

                                if (isTransfer) {
                                    if (tx.toAccountId === id) {
                                        isIncome = true;
                                        label = `Transfer from ${accounts.find(a => a.id === tx.fromAccountId)?.name}`;
                                        icon = <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
                                    } else {
                                        isExpense = true;
                                        label = `Transfer to ${accounts.find(a => a.id === tx.toAccountId)?.name}`;
                                        icon = <ArrowRightLeft className="w-4 h-4 text-slate-500" />;
                                    }
                                } else {
                                    isIncome = tx.type === 'income';
                                    isExpense = tx.type === 'expense';
                                    const cat = categories.find(c => c.id === tx.categoryId);
                                    label = tx.note || cat?.name;
                                    icon = isIncome ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />;
                                }

                                return (
                                    <div key={tx.id} className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                                {icon}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800 dark:text-white">{label}</p>
                                                <p className="text-xs text-slate-400">{format(new Date(tx.date || tx.createdAt), 'MMM d, yyyy')}</p>
                                            </div>
                                        </div>
                                        <span className={`font-bold ${isIncome ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                            {isIncome ? '+' : '-'}₹{displayAmount.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountDetail;
