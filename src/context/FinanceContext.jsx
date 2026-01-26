import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { format, startOfMonth, endOfMonth, isWithinInterval, addDays, addWeeks, addMonths, addYears, isBefore, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

const FinanceContext = createContext();

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (!context) throw new Error('useFinance must be used within FinanceContextProvider');
    return context;
};

export const FinanceContextProvider = ({ children }) => {
    const { user } = useAuthContext();

    // --- Initial State Configuration ---
    const DEFAULT_CATEGORIES = [
        { id: 'cat_food', name: 'Food & Dining', type: 'expense', budget: 5000, color: 'bg-orange-500', icon: 'Utensils' },
        { id: 'cat_transport', name: 'Transport', type: 'expense', budget: 2000, color: 'bg-blue-500', icon: 'Bus' },
        { id: 'cat_shopping', name: 'Shopping', type: 'expense', budget: 3000, color: 'bg-pink-500', icon: 'ShoppingBag' },
        { id: 'cat_bills', name: 'Bills & Utilities', type: 'expense', budget: 4000, color: 'bg-yellow-500', icon: 'Zap' },
        { id: 'cat_salary', name: 'Salary', type: 'income', budget: 0, color: 'bg-emerald-500', icon: 'DollarSign' },
    ];

    const DEFAULT_ACCOUNTS = [
        { id: 'acc_cash', name: 'Cash Wallet', type: 'cash', balance: 0, openingBalance: 0, isArchived: false },
        { id: 'acc_bank', name: 'Main Bank', type: 'bank', balance: 0, openingBalance: 0, isArchived: false },
        { id: 'acc_upi', name: 'UPI / Digital', type: 'upi', balance: 0, openingBalance: 0, isArchived: false },
    ];

    // --- State ---
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
    const [savingsGoals, setSavingsGoals] = useState([]);
    const [debts, setDebts] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [recurringRules, setRecurringRules] = useState([]);

    // --- Persistence ---
    useEffect(() => {
        const uid = user ? user.uid : 'guest';
        try {
            const storedData = localStorage.getItem(`awake_finance_data_${uid}`);
            if (storedData) {
                const data = JSON.parse(storedData);
                setTransactions(data.transactions || []);
                setCategories(data.categories || DEFAULT_CATEGORIES);
                // Merge default accounts with stored to ensure new fields exists if migration needed
                const storedAccounts = data.accounts || DEFAULT_ACCOUNTS;
                const mergedAccounts = storedAccounts.map(acc => ({
                    ...acc,
                    openingBalance: acc.openingBalance ?? 0,
                    isArchived: acc.isArchived ?? false
                }));
                setAccounts(mergedAccounts);

                setSavingsGoals(data.savingsGoals || []);
                setDebts(data.debts || []);
                setRecurringRules(data.recurringRules || []);

                // Migrate Subscriptions
                const loadedSubs = data.subscriptions || [];
                const migratedSubs = loadedSubs.map(sub => ({
                    ...sub,
                    status: sub.status || 'active',
                    autoPay: sub.autoPay ?? true, // Default to auto-generate
                    nextBillingDate: sub.nextBillingDate || (() => {
                        const today = new Date();
                        const dueDay = Number(sub.dueDate);
                        let date = new Date(today.getFullYear(), today.getMonth(), dueDay);
                        if (date < today) date = addMonths(date, 1);
                        return date.toISOString();
                    })()
                }));
                setSubscriptions(migratedSubs);
            } else {
                setTransactions([]);
                setCategories(DEFAULT_CATEGORIES);
                setAccounts(DEFAULT_ACCOUNTS);
                setDebts([]);
                setSubscriptions([]);
                setRecurringRules([]);
            }
        } catch (e) {
            console.error("Finance Load Error", e);
        }
    }, [user]);

    const saveData = (newTransactions, newCategories, newAccounts, newGoals, newDebts, newSubs, newRules) => {
        const uid = user ? user.uid : 'guest';
        const data = {
            transactions: newTransactions ?? transactions,
            categories: newCategories ?? categories,
            accounts: newAccounts ?? accounts,
            savingsGoals: newGoals ?? savingsGoals,
            debts: newDebts ?? debts,
            subscriptions: newSubs ?? subscriptions,
            recurringRules: newRules ?? recurringRules
        };

        // Update state locally
        if (newTransactions) setTransactions(newTransactions);
        if (newCategories) setCategories(newCategories);
        if (newAccounts) setAccounts(newAccounts);
        if (newGoals) setSavingsGoals(newGoals);
        if (newDebts) setDebts(newDebts);
        if (newSubs) setSubscriptions(newSubs);
        if (newRules) setRecurringRules(newRules);

        localStorage.setItem(`awake_finance_data_${uid}`, JSON.stringify(data));
    };

    // --- Recurring Logic Processing ---
    useEffect(() => {
        if (recurringRules.length === 0) return;

        const processRules = () => {
            const today = new Date();
            let newTxList = [];
            let rulesChanged = false;
            let accountsChanged = false;
            let tempAccounts = [...accounts]; // Working copy for balance updates

            const updatedRules = recurringRules.map(rule => {
                if (!rule.isActive) return rule;

                let next = new Date(rule.nextDueDate);
                // Check if due: next <= today (ignoring time component roughly, or just straight compare)
                // We'll use start of day to be safe or just direct comparison if stored as ISO
                let ruleModified = false;

                // Loop to catch up if missed multiple
                while (isBefore(next, today) || isSameDay(next, today)) {
                    if (rule.endDate && isBefore(new Date(rule.endDate), next)) break;

                    // Generate Transaction
                    const txId = `tx_rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                    const newTx = {
                        ...rule.transactionTemplate,
                        id: txId,
                        createdAt: Date.now(),
                        date: next.toISOString(),
                        recurringRuleId: rule.id,
                        isfromRecurring: true
                    };
                    newTxList.push(newTx);

                    // Update Balance for this tx immediately in our temp array
                    tempAccounts = tempAccounts.map(acc => {
                        if (acc.id === newTx.accountId) {
                            const change = newTx.type === 'income' ? Number(newTx.amount) : -Number(newTx.amount);
                            return { ...acc, balance: acc.balance + change };
                        }
                        return acc;
                    });
                    accountsChanged = true;

                    // Advance Date
                    if (rule.frequency === 'daily') next = addDays(next, 1);
                    else if (rule.frequency === 'weekly') next = addWeeks(next, 1);
                    else if (rule.frequency === 'monthly') next = addMonths(next, 1);
                    else if (rule.frequency === 'yearly') next = addYears(next, 1);

                    ruleModified = true;
                }

                if (ruleModified) {
                    rulesChanged = true;
                    return { ...rule, nextDueDate: next.toISOString() };
                }
                return rule;
            });

            if (newTxList.length > 0 || rulesChanged) {
                // We need to merge newTxList with existing transactions
                // AND we need to update accounts if we generated transactions
                // AND update rules
                const finalTransactions = [...newTxList, ...transactions];
                saveData(
                    finalTransactions,
                    undefined,
                    accountsChanged ? tempAccounts : undefined,
                    undefined,
                    undefined,
                    undefined,
                    rulesChanged ? updatedRules : undefined
                );
            }
        };

        processRules();
    }, [recurringRules, user]);

    // --- Subscription Processing ---
    useEffect(() => {
        if (subscriptions.length === 0) return;

        const processSubscriptions = () => {
            const today = new Date();
            let newTxList = [];
            let subsChanged = false;
            let accountsChanged = false;
            let tempAccounts = [...accounts];

            const updatedSubs = subscriptions.map(sub => {
                if (sub.status !== 'active' || !sub.autoPay) return sub;

                let next = new Date(sub.nextBillingDate);
                let subModified = false;

                // Check if due
                while (isBefore(next, today) || isSameDay(next, today)) {
                    // Generate Transaction
                    const txId = `tx_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                    const newTx = {
                        id: txId,
                        createdAt: Date.now(),
                        date: next.toISOString(),
                        amount: Number(sub.amount),
                        type: 'expense',
                        categoryId: 'cat_bills', // Default to Bills
                        note: `Subscription: ${sub.name}`,
                        isFromSubscription: true,
                        subscriptionId: sub.id,
                        accountId: 'acc_bank' // Default to Bank for now, ideally user selects
                    };
                    newTxList.push(newTx);

                    // Update Balance
                    tempAccounts = tempAccounts.map(acc => {
                        if (acc.id === newTx.accountId) {
                            return { ...acc, balance: acc.balance - Number(newTx.amount) };
                        }
                        return acc;
                    });
                    accountsChanged = true;

                    // Advance Month
                    next = addMonths(next, 1);
                    subModified = true;
                }

                if (subModified) {
                    subsChanged = true;
                    return { ...sub, nextBillingDate: next.toISOString() };
                }
                return sub;
            });

            if (newTxList.length > 0 || subsChanged) {
                const finalTransactions = [...newTxList, ...transactions];
                saveData(
                    finalTransactions,
                    undefined,
                    accountsChanged ? tempAccounts : undefined,
                    undefined,
                    undefined,
                    subsChanged ? updatedSubs : undefined,
                    undefined
                );
            }
        };

        processSubscriptions();
    }, [subscriptions, user]);

    // --- Computed Values ---
    const getAccountBalance = (accountId) => {
        return accounts.find(a => a.id === accountId)?.balance || 0;
    };

    const getTotalBalance = () => {
        return accounts.filter(a => !a.isArchived).reduce((acc, curr) => acc + curr.balance, 0);
    };

    const getMonthlySpend = () => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        return transactions
            .filter(t => !t.isDeleted && t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end }))
            .reduce((acc, t) => acc + Number(t.amount), 0);
    };

    const getCategorySpend = (categoryId) => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        return transactions
            .filter(t => !t.isDeleted && isWithinInterval(new Date(t.date), { start, end }))
            .reduce((acc, t) => {
                // Handle Splits
                if (t.splits && t.splits.length > 0) {
                    const splitItem = t.splits.find(s => s.categoryId === categoryId);
                    return acc + (splitItem ? Number(splitItem.amount) : 0);
                }
                // Handle Normal
                if (t.categoryId === categoryId) {
                    return acc + Number(t.amount);
                }
                return acc;
            }, 0);
    };

    const getBudgetStats = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category || !category.budget) return null;

        const spent = getCategorySpend(categoryId);
        const budget = Number(category.budget);
        const remaining = budget - spent;
        const percent = Math.min(Math.round((spent / budget) * 100), 100);

        let status = 'good'; // good, warning, danger
        if (percent >= 100) status = 'danger';
        else if (percent >= 80) status = 'warning';

        return { spent, budget, remaining, percent, status };
    };

    // --- Actions ---
    const addTransaction = (tx) => {
        const newTx = {
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            createdAt: Date.now(),
            date: new Date().toISOString(), // Ensure date is present
            ...tx
        };

        // Update Account Balance
        const newAccounts = accounts.map(acc => {
            if (acc.id === tx.accountId) {
                const change = tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount);
                return { ...acc, balance: acc.balance + change };
            }
            return acc;
        });

        const newTransactions = [newTx, ...transactions];
        saveData(newTransactions, undefined, newAccounts, undefined, undefined, undefined, undefined);
    };

    const addRecurringRule = (ruleData) => {
        // ruleData: { frequency, startDate, endDate, transactionTemplate }
        const newRule = {
            id: `rule_${Date.now()}`,
            isActive: true,
            nextDueDate: ruleData.startDate, // Starts on start date
            ...ruleData
        };
        saveData(undefined, undefined, undefined, undefined, undefined, undefined, [...recurringRules, newRule]);
    };

    const addTransfer = ({ amount, fromAccountId, toAccountId, note, date }) => {
        const numAmount = Number(amount);
        const transferTx = {
            id: `tx_transfer_${Date.now()}`,
            createdAt: Date.now(),
            date: date || new Date().toISOString(),
            type: 'transfer',
            amount: numAmount,
            fromAccountId,
            toAccountId,
            note: note || 'Fund Transfer',
            categoryId: 'cat_transfer' // Virtual category for transfers
        };

        const newAccounts = accounts.map(acc => {
            if (acc.id === fromAccountId) {
                return { ...acc, balance: acc.balance - numAmount };
            }
            if (acc.id === toAccountId) {
                return { ...acc, balance: acc.balance + numAmount };
            }
            return acc;
        });

        const newTransactions = [transferTx, ...transactions];
        saveData(newTransactions, undefined, newAccounts, undefined, undefined, undefined);
    };

    const deleteTransaction = (id) => {
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;

        // Revert Balance
        let newAccounts = accounts;

        if (tx.type === 'transfer') {
            // Revert both accounts
            newAccounts = accounts.map(acc => {
                if (acc.id === tx.fromAccountId) {
                    return { ...acc, balance: acc.balance + Number(tx.amount) };
                }
                if (acc.id === tx.toAccountId) {
                    return { ...acc, balance: acc.balance - Number(tx.amount) };
                }
                return acc;
            });
        } else {
            // Revert single account
            newAccounts = accounts.map(acc => {
                if (acc.id === tx.accountId) {
                    const change = tx.type === 'income' ? -Number(tx.amount) : Number(tx.amount);
                    return { ...acc, balance: acc.balance + change };
                }
                return acc;
            });
        }

        // Soft Delete
        const newTransactions = transactions.map(t => t.id === id ? { ...t, isDeleted: true } : t);
        saveData(newTransactions, undefined, newAccounts, undefined, undefined, undefined);
    };

    const editTransaction = (id, updatedTx) => {
        const oldTx = transactions.find(t => t.id === id);
        if (!oldTx) return;

        // Revert old balance
        let tempAccounts = accounts;
        if (oldTx.type === 'transfer') {
            tempAccounts = tempAccounts.map(acc => {
                if (acc.id === oldTx.fromAccountId) return { ...acc, balance: acc.balance + Number(oldTx.amount) };
                if (acc.id === oldTx.toAccountId) return { ...acc, balance: acc.balance - Number(oldTx.amount) };
                return acc;
            });
        } else {
            tempAccounts = tempAccounts.map(acc => {
                if (acc.id === oldTx.accountId) {
                    const change = oldTx.type === 'income' ? -Number(oldTx.amount) : Number(oldTx.amount);
                    return { ...acc, balance: acc.balance + change };
                }
                return acc;
            });
        }

        // Apply new balance
        let finalAccounts = tempAccounts;
        if (updatedTx.type === 'transfer') {
            finalAccounts = finalAccounts.map(acc => {
                if (acc.id === updatedTx.fromAccountId) return { ...acc, balance: acc.balance - Number(updatedTx.amount) };
                if (acc.id === updatedTx.toAccountId) return { ...acc, balance: acc.balance + Number(updatedTx.amount) };
                return acc;
            });
        } else {
            finalAccounts = finalAccounts.map(acc => {
                if (acc.id === updatedTx.accountId) {
                    const change = updatedTx.type === 'income' ? Number(updatedTx.amount) : -Number(updatedTx.amount);
                    return { ...acc, balance: acc.balance + change };
                }
                return acc;
            });
        }

        const newTransactions = transactions.map(t => t.id === id ? { ...t, ...updatedTx } : t);
        saveData(newTransactions, undefined, finalAccounts, undefined, undefined, undefined);
    };

    const restoreTransaction = (id) => {
        const tx = transactions.find(t => t.id === id);
        if (!tx || !tx.isDeleted) return;

        // Apply Balance again
        let newAccounts = accounts;
        if (tx.type === 'transfer') {
            newAccounts = accounts.map(acc => {
                if (acc.id === tx.fromAccountId) return { ...acc, balance: acc.balance - Number(tx.amount) };
                if (acc.id === tx.toAccountId) return { ...acc, balance: acc.balance + Number(tx.amount) };
                return acc;
            });
        } else {
            newAccounts = accounts.map(acc => {
                if (acc.id === tx.accountId) {
                    const change = tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount);
                    return { ...acc, balance: acc.balance + change };
                }
                return acc;
            });
        }

        const newTransactions = transactions.map(t => t.id === id ? { ...t, isDeleted: false } : t);
        saveData(newTransactions, undefined, newAccounts, undefined, undefined, undefined);
    };

    const checkDuplicate = (newTx) => {
        // Check for similar transaction in last 5 minutes
        const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
        return transactions.find(t =>
            !t.isDeleted &&
            t.amount === newTx.amount &&
            t.type === newTx.type &&
            (t.categoryId === newTx.categoryId || (t.type === 'transfer' && t.toAccountId === newTx.toAccountId)) &&
            new Date(t.createdAt).getTime() > fiveMinsAgo
        );
    };

    const updateAccount = (id, updates) => { // updates: { name, openingBalance, isArchived }
        // If opening balance changes, we need to adjust current balance
        const acc = accounts.find(a => a.id === id);
        if (!acc) return;

        let newBalance = acc.balance;
        if (updates.openingBalance !== undefined) {
            const diff = Number(updates.openingBalance) - Number(acc.openingBalance || 0);
            newBalance += diff;
        }

        const newAccounts = accounts.map(a => a.id === id ? { ...a, ...updates, balance: newBalance } : a);
        saveData(undefined, undefined, newAccounts, undefined, undefined, undefined);
    };

    const toggleArchiveAccount = (id) => {
        const acc = accounts.find(a => a.id === id);
        if (acc) {
            updateAccount(id, { isArchived: !acc.isArchived });
        }
    };

    const updateCategoryBudget = (catId, newLimit) => {
        const newCats = categories.map(c => c.id === catId ? { ...c, budget: newLimit } : c);
        saveData(undefined, newCats, undefined, undefined, undefined, undefined);
    };

    const addCategory = (cat) => {
        const newCat = { ...cat, id: `cat_${Date.now()}` };
        saveData(undefined, [...categories, newCat], undefined, undefined, undefined, undefined);
    };

    // --- Debt Actions ---
    const addDebt = (debt, linkToTransaction = false, accountId = null) => {
        const newDebt = {
            id: `debt_${Date.now()}`,
            createdAt: Date.now(),
            status: 'open', // open, partial, settled, overdue
            history: [], // [{ date, amount, type, note }]
            ...debt
        };

        // Initialize history with creation
        newDebt.history.push({
            id: `dh_${Date.now()}`,
            date: Date.now(),
            amount: Number(debt.amount),
            type: 'creation',
            note: 'Record created'
        });

        const newDebts = [...debts, newDebt];
        let newTransactions = undefined;
        let newAccounts = undefined;

        // Optional: Link to Finance (Deduct/Add to Wallet)
        if (linkToTransaction && accountId) {
            const isPayable = debt.type === 'payable'; // I borrowed money -> Income to wallet? OR I owe money for a service?
            // Usually: 
            // "I Lent money" (Receivable) -> Expense from Wallet
            // "I Borrowed money" (Payable) -> Income to Wallet

            const txType = isPayable ? 'income' : 'expense';
            const txAmount = Number(debt.amount);

            const newTx = {
                id: `tx_debt_${Date.now()}`,
                createdAt: Date.now(),
                amount: txAmount,
                type: txType,
                categoryId: isPayable ? 'cat_debt_in' : 'cat_debt_out', // Need to handle these categories or just use generic
                accountId: accountId,
                note: `Debt: ${debt.person} (${isPayable ? 'Borrowed' : 'Lent'})`,
                date: new Date().toISOString()
            };

            newTransactions = [newTx, ...transactions];

            // Update Account Balance
            const acc = accounts.find(a => a.id === accountId);
            if (acc) {
                const change = txType === 'income' ? txAmount : -txAmount;
                const updatedAcc = { ...acc, balance: acc.balance + change };
                newAccounts = accounts.map(a => a.id === accountId ? updatedAcc : a);
            }
        }

        saveData(newTransactions, undefined, newAccounts, undefined, newDebts, undefined);
    };

    const addDebtPayment = (debtId, amount, date = new Date()) => {
        const debt = debts.find(d => d.id === debtId);
        if (!debt) return;

        const numAmount = Number(amount);
        const isReceiving = debt.type === 'receivable'; // We lent, so we receive money back (Income)

        // 1. Create Linked Transaction
        const newTx = {
            id: `tx_debt_${Date.now()}`,
            createdAt: Date.now(),
            date: new Date(date).toISOString(),
            amount: numAmount,
            type: isReceiving ? 'income' : 'expense',
            categoryId: 'cat_debt',
            note: `Repayment: ${debt.person}`,
            accountId: 'acc_bank', // Default, ideally selectable
            relatedDebtId: debtId
        };
        const newTxList = [...transactions, newTx];

        // 2. Update Debt
        const newPaidAmount = (debt.paidAmount || 0) + numAmount;
        const isSettled = newPaidAmount >= Number(debt.amount);

        const updatedDebts = debts.map(d => d.id === debtId ? {
            ...d,
            paidAmount: newPaidAmount,
            isSettled,
            payments: [...(d.payments || []), { amount: numAmount, date: new Date(date).toISOString(), id: `pay_${Date.now()}` }]
        } : d);

        // 3. Update Balance
        const updatedAccounts = accounts.map(a => {
            if (a.id === newTx.accountId) {
                return { ...a, balance: a.balance + (newTx.type === 'income' ? numAmount : -numAmount) };
            }
            return a;
        });

        saveData(newTxList, undefined, updatedAccounts, undefined, updatedDebts);
    };

    const settleDebt = (id) => {
        const debt = debts.find(d => d.id === id);
        if (debt && !debt.isSettled) {
            const remaining = Number(debt.amount) - (debt.paidAmount || 0);
            if (remaining > 0) {
                addDebtPayment(id, remaining);
            }
        }
    };

    // --- Subscription Actions ---
    const addSubscription = (sub) => {
        const today = new Date();
        const dueDay = Number(sub.dueDate);
        let firstDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
        if (firstDate < today) firstDate = addMonths(firstDate, 1);

        const newSub = {
            id: `sub_${Date.now()}`,
            status: 'active',
            autoPay: true,
            nextBillingDate: firstDate.toISOString(),
            ...sub
        };
        saveData(undefined, undefined, undefined, undefined, undefined, [...subscriptions, newSub]);
    };

    const updateSubscription = (id, updates) => {
        const newSubs = subscriptions.map(s => s.id === id ? { ...s, ...updates } : s);
        saveData(undefined, undefined, undefined, undefined, undefined, newSubs);
    };

    const toggleSubscriptionStatus = (id) => {
        const sub = subscriptions.find(s => s.id === id);
        if (sub) {
            updateSubscription(id, { status: sub.status === 'active' ? 'paused' : 'active' });
        }
    };

    const deleteSubscription = (id) => {
        const newSubs = subscriptions.filter(s => s.id !== id);
        saveData(undefined, undefined, undefined, undefined, undefined, newSubs);
    };

    const getDailySpend = (date = new Date()) => {
        return transactions
            .filter(t => !t.isDeleted && t.type === 'expense' && isSameDay(new Date(t.date || t.createdAt), date))
            .reduce((acc, t) => acc + Number(t.amount), 0);
    };

    const getWeeklySavings = () => {
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
        const end = endOfWeek(today, { weekStartsOn: 1 });

        const weeklyTx = transactions.filter(t =>
            !t.isDeleted && isWithinInterval(new Date(t.date || t.createdAt), { start, end })
        );

        const income = weeklyTx.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = weeklyTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

        return income - expense;
    };


    const value = {
        transactions,
        categories,
        accounts,
        savingsGoals,
        debts,
        subscriptions,
        addTransaction,
        addTransfer, // Exported
        deleteTransaction,
        editTransaction, // Exported
        restoreTransaction, // Exported
        checkDuplicate, // Exported
        getAccountBalance,
        getTotalBalance,
        getMonthlySpend,
        getCategorySpend,
        updateCategoryBudget,
        addCategory,
        addDebt,
        addDebtPayment, // Exported
        settleDebt,
        addSubscription,
        updateSubscription, // Exported
        toggleSubscriptionStatus, // Exported
        deleteSubscription,
        updateAccount, // Exported
        toggleArchiveAccount, // Exported
        addRecurringRule, // Exported
        recurringRules,
        getBudgetStats, // Exported
        getDailySpend, // Exported
        getWeeklySavings // Exported
    };

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
};
