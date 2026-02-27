import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { Archive, ArrowLeft, Edit2, Trash2, Calendar, FileText, TrendingUp, Save, Wallet, History, TrendingDown, ArrowRightLeft } from 'lucide-react';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import PageLayout from '../../components/layout/PageLayout';

const AccountDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
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
        <PageLayout
            headerBgClass="bg-slate-900 text-white shadow-xl"
            headerBorderClass="border-none"
            headerPadClass="p-0"
            header={
                <div className="w-full">
                    <div className="flex items-center justify-between px-4 pt-4 pb-5">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 bg-transparent hover:bg-white/10 rounded-full transition-colors text-white -ml-2 focus:outline-none"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-xl font-bold text-white tracking-tight">Account Detail</h1>
                        </div>
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

                    <div className="text-center px-4 pb-8 pt-2">
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
                                <button onClick={handleSave} className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Save Settings</button>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{account.name}</p>
                                <h2 className="text-4xl font-black tracking-tightest leading-tight">₹{account.balance.toLocaleString()}</h2>
                                <button onClick={handleEdit} className="text-[10px] font-bold text-indigo-300 hover:text-white uppercase tracking-wider mt-2">Edit Account</button>
                            </div>
                        )}
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <History className="w-3.5 h-3.5" />
                            Transaction History
                        </h3>

                        <div className="space-y-5">
                            {accountTx.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-slate-400 text-sm font-medium">No transactions found.</p>
                                </div>
                            ) : (
                                accountTx.map(tx => {
                                    const isTransfer = tx.type === 'transfer';
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
                                        label = tx.note || cat?.name || 'Transaction';
                                        icon = isIncome ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />;
                                    }

                                    return (
                                        <div key={tx.id} className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                    {icon}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate uppercase tracking-tight">{label}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{format(new Date(tx.date || tx.createdAt), 'MMM d, yyyy')}</p>
                                                </div>
                                            </div>
                                            <span className={`font-black tracking-tight ${isIncome ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                                {isIncome ? '+' : '-'}₹{displayAmount.toLocaleString()}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
            </div>
        </PageLayout>
    );
};

export default AccountDetail;
