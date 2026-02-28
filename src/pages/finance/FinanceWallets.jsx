import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { useState, useRef } from 'react';
import FinanceBottomNav from '../../components/finance/FinanceBottomNav';
import PageLayout from '../../components/layout/PageLayout';
import { ItemMenu } from '../../components/ui/ItemMenu';
import { DeleteConfirmationModal } from '../../components/ui/DeleteConfirmationModal';
import { useSelection } from '../../hooks/useSelection';
import { SelectionBar } from '../../components/ui/SelectionBar';
import { ArrowLeft, Wallet, Plus, Trash2, Archive as ArchiveIcon } from 'lucide-react';
import clsx from 'clsx';

const FinanceWallets = () => {
    const navigate = useNavigate();
    const { accounts, addAccount, deleteAccount, toggleArchiveAccount, getAccountBalance } = useFinance();
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newBalance, setNewBalance] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const timerRef = useRef(null);

    const {
        isSelectionMode,
        selectedIds,
        toggleSelection,
        enterSelectionMode,
        exitSelectionMode,
        toggleSelectAll,
        count: selectedCount,
        isAllSelected
    } = useSelection();

    const activeAccounts = accounts.filter(a => !a.isArchived);
    const archivedAccounts = accounts.filter(a => a.isArchived);

    const handleAdd = async () => {
        if (!newName.trim()) return;
        await addAccount({ name: newName.trim(), openingBalance: Number(newBalance) || 0 });
        setNewName('');
        setNewBalance('');
        setIsAdding(false);
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteAccount(deleteId);
            setDeleteId(null);
        }
    };

    const handlePointerDown = (id) => {
        if (isSelectionMode) return;
        timerRef.current = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50);
            enterSelectionMode(id);
        }, 500);
    };

    const handlePointerUpOrLeave = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };

    return (
        <PageLayout
            bottomNav={<FinanceBottomNav />}
            header={
                <div className="contents">
                    <SelectionBar 
                        count={selectedCount}
                        isAllSelected={isAllSelected}
                        onCancel={exitSelectionMode}
                        onSelectAll={() => toggleSelectAll(accounts.map(a => a.id))}
                        actions={[
                            {
                                label: 'Archive',
                                icon: <ArchiveIcon className="w-5 h-5" />,
                                onClick: () => {
                                    selectedIds.forEach(id => toggleArchiveAccount(id));
                                    exitSelectionMode();
                                }
                            }
                        ]}
                    />
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
                </div>
            }
            renderFloating={
                <DeleteConfirmationModal 
                    isOpen={!!deleteId}
                    onClose={() => setDeleteId(null)}
                    onConfirm={handleDelete}
                    isFinancial={true}
                    title="Delete Wallet?"
                    message="Are you sure you want to delete this wallet? All associated transactions will be permanently removed. This action cannot be undone."
                />
            }
        >
            <div className="space-y-4">
                {/* Active Accounts */}
                {activeAccounts.map(acc => {
                    const bal = getAccountBalance ? getAccountBalance(acc.id) : acc.balance;
                    const isSelected = selectedIds.includes(acc.id);
                    return (
                        <div key={acc.id} className="relative group">
                            <button
                                onClick={() => isSelectionMode ? toggleSelection(acc.id) : navigate(`/finance/account/${acc.id}`)}
                                onMouseDown={() => handlePointerDown(acc.id)}
                                onMouseUp={handlePointerUpOrLeave}
                                onMouseLeave={handlePointerUpOrLeave}
                                onTouchStart={() => handlePointerDown(acc.id)}
                                onTouchEnd={handlePointerUpOrLeave}
                                className={clsx(
                                    "w-full bg-white dark:bg-slate-900 rounded-2xl border p-5 flex items-center justify-between transition-all",
                                    isSelected 
                                        ? "border-indigo-500 ring-2 ring-indigo-500/20 dark:ring-indigo-500/40" 
                                        : "border-slate-100 dark:border-slate-800",
                                    isSelectionMode && "active:scale-[0.98]"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                        isSelected ? "bg-indigo-600 text-white" : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500"
                                    )}>
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-slate-900 dark:text-white text-[15px]">{acc.name}</p>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Active • Tap to view</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className={`text-lg font-black ${(bal || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                        ₹{(bal || 0).toLocaleString()}
                                    </p>
                                    {!isSelectionMode && (
                                        <ItemMenu 
                                            onEdit={() => navigate(`/finance/account/${acc.id}?edit=true`)}
                                            onDelete={() => setDeleteId(acc.id)}
                                            extraActions={[
                                                { label: 'Archive', icon: ArchiveIcon, onClick: () => toggleArchiveAccount(acc.id) }
                                            ]}
                                        />
                                    )}
                                </div>
                            </button>
                        </div>
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
                                        <ArchiveIcon className="w-5 h-5 text-slate-400" />
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
