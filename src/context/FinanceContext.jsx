import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { format, startOfMonth, endOfMonth, isWithinInterval, addDays, addWeeks, addMonths, addYears, isBefore, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { FirestoreService } from '../services/firestore-service';
import { CloudFunctionService } from '../services/cloud-function-service'; // Import
import { orderBy, where, query, limit } from 'firebase/firestore';

const FinanceContext = createContext();

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (!context) throw new Error('useFinance must be used within FinanceContextProvider');
    return context;
};

export const FinanceContextProvider = ({ children }) => {
    const { user, authIsReady } = useAuthContext();

    // --- Initial State Configuration ---
    const DEFAULT_CATEGORIES = [
        { id: 'cat_food', name: 'Food & Dining', type: 'expense', budget: 5000, color: 'bg-orange-500', icon: 'Utensils' },
        { id: 'cat_transport', name: 'Transport', type: 'expense', budget: 2000, color: 'bg-blue-500', icon: 'Bus' },
        { id: 'cat_shopping', name: 'Shopping', type: 'expense', budget: 3000, color: 'bg-pink-500', icon: 'ShoppingBag' },
        { id: 'cat_bills', name: 'Bills & Utilities', type: 'expense', budget: 4000, color: 'bg-yellow-500', icon: 'Zap' },
        { id: 'cat_salary', name: 'Salary', type: 'income', budget: 0, color: 'bg-emerald-500', icon: 'IndianRupee' },
    ];

    const DEFAULT_ACCOUNTS = [
        { id: 'acc_cash', name: 'Cash Wallet', type: 'cash', balance: 0, openingBalance: 0, isArchived: false },
        { id: 'acc_bank', name: 'Main Bank', type: 'bank', balance: 0, openingBalance: 0, isArchived: false },
        { id: 'acc_upi', name: 'UPI / Digital', type: 'upi', balance: 0, openingBalance: 0, isArchived: false },
    ];

    // --- State ---
    const [transactions, setTransactions] = useState([]);
    const [txLimit, setTxLimit] = useState(50);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [savingsGoals, setSavingsGoals] = useState([]);
    const [debts, setDebts] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [recurringRules, setRecurringRules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Persistence: Firestore Subscriptions ---
    useEffect(() => {
        if (!authIsReady) return;

        if (!user) {
            setTransactions([]);
            setCategories(DEFAULT_CATEGORIES);
            setAccounts(DEFAULT_ACCOUNTS);
            setSavingsGoals([]);
            setDebts([]);
            setSubscriptions([]);
            setRecurringRules([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const seedDefaults = async (collectionName, defaults) => {
            // Seeding logic omitted for brevity in refactor
        };

        const unsubTransactions = FirestoreService.subscribeToCollection(
            `users/${user.uid}/transactions`,
            (data) => {
                setTransactions(data);
                setIsLoading(false);
            },
            orderBy('date', 'desc'),
            limit(txLimit)
        );

        const unsubCategories = FirestoreService.subscribeToCollection(
            `users/${user.uid}/categories`,
            (data) => {
                setCategories(data.length > 0 ? data : []);
            }
        );

        const unsubAccounts = FirestoreService.subscribeToCollection(
            `users/${user.uid}/accounts`,
            (data) => setAccounts(data.length > 0 ? data : [])
        );

        const unsubGoals = FirestoreService.subscribeToCollection(
            `users/${user.uid}/savingsGoals`,
            (data) => setSavingsGoals(data)
        );

        const unsubDebts = FirestoreService.subscribeToCollection(
            `users/${user.uid}/debts`,
            (data) => setDebts(data)
        );

        const unsubSubs = FirestoreService.subscribeToCollection(
            `users/${user.uid}/subscriptions`,
            (data) => setSubscriptions(data)
        );

        const unsubRules = FirestoreService.subscribeToCollection(
            `users/${user.uid}/recurringRules`,
            (data) => setRecurringRules(data)
        );

        return () => {
            unsubTransactions();
            unsubCategories();
            unsubAccounts();
            unsubGoals();
            unsubDebts();
            unsubSubs();
            unsubRules();
        };
    }, [user, authIsReady, txLimit]);

    // One-time Seeding
    useEffect(() => {
        if (!user) return;
        const checkAndSeed = async () => {
            const cats = await FirestoreService.getCollection(`users/${user.uid}/categories`);
            if (cats.length === 0) {
                await Promise.all(DEFAULT_CATEGORIES.map(c => FirestoreService.addItem(`users/${user.uid}/categories`, c)));
            }
            const accs = await FirestoreService.getCollection(`users/${user.uid}/accounts`);
            if (accs.length === 0) {
                await Promise.all(DEFAULT_ACCOUNTS.map(a => FirestoreService.addItem(`users/${user.uid}/accounts`, a)));
            }
        };
        checkAndSeed();
    }, [user?.uid]);


    // --- Recurring Logic Processing ---
    useEffect(() => {
        if (!user || recurringRules.length === 0) return;

        const processRules = async () => {
            const today = new Date();

            for (const rule of recurringRules) {
                if (!rule.isActive) continue;

                let next = new Date(rule.nextDueDate);
                let ruleModified = false;

                while (isBefore(next, today) || isSameDay(next, today)) {
                    if (rule.endDate && isBefore(new Date(rule.endDate), next)) break;

                    const txId = crypto.randomUUID();
                    const txPayload = {
                        transactionId: txId,
                        accountId: rule.transactionTemplate.accountId,
                        type: rule.transactionTemplate.type,
                        amount: Number(rule.transactionTemplate.amount),
                        categoryId: rule.transactionTemplate.categoryId,
                        date: next.toISOString(),
                        description: rule.transactionTemplate.name || 'Recurring Transaction',
                        metadata: {
                            recurringRuleId: rule.id,
                            isfromRecurring: true
                        }
                    };

                    await CloudFunctionService.commitFinancialTransaction(txPayload);

                    if (rule.frequency === 'daily') next = addDays(next, 1);
                    else if (rule.frequency === 'weekly') next = addWeeks(next, 1);
                    else if (rule.frequency === 'monthly') next = addMonths(next, 1);
                    else if (rule.frequency === 'yearly') next = addYears(next, 1);

                    ruleModified = true;
                }

                if (ruleModified) {
                    await FirestoreService.updateItem(`users/${user.uid}/recurringRules`, rule.id, {
                        nextDueDate: next.toISOString()
                    });
                }
            }
        };

        processRules();
    }, [recurringRules, user]);

    // --- Subscription Processing ---
    useEffect(() => {
        if (!user || subscriptions.length === 0) return;

        const processSubscriptions = async () => {
            const today = new Date();

            for (const sub of subscriptions) {
                if (sub.status !== 'active' || !sub.autoPay) continue;

                let next = new Date(sub.nextBillingDate);
                let subModified = false;

                while (isBefore(next, today) || isSameDay(next, today)) {
                    const txId = crypto.randomUUID();
                    const txPayload = {
                        transactionId: txId,
                        accountId: 'acc_bank', // Default, should be configurable in sub
                        type: 'expense',
                        amount: Number(sub.amount),
                        categoryId: 'cat_bills',
                        date: next.toISOString(),
                        description: `Subscription: ${sub.name}`,
                        metadata: {
                            isFromSubscription: true,
                            subscriptionId: sub.id
                        }
                    };

                    await CloudFunctionService.commitFinancialTransaction(txPayload);

                    next = addMonths(next, 1);
                    subModified = true;
                }

                if (subModified) {
                    await FirestoreService.updateItem(`users/${user.uid}/subscriptions`, sub.id, {
                        nextBillingDate: next.toISOString()
                    });
                }
            }
        };

        processSubscriptions();
    }, [subscriptions, user]);


    // --- Computed Values ---
    const getAccountBalance = useCallback((accountId) => {
        return accounts.find(a => a.id === accountId)?.balance || 0;
    }, [accounts]);

    const getTotalBalance = useCallback(() => {
        return accounts.filter(a => !a.isArchived).reduce((acc, curr) => acc + curr.balance, 0);
    }, [accounts]);

    const getMonthlySpend = useCallback(() => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        return transactions
            .filter(t => {
                if (t.isDeleted || t.type !== 'expense') return false;
                const d = new Date(t.date || t.createdAt);
                return !isNaN(d.getTime()) && isWithinInterval(d, { start, end });
            })
            .reduce((acc, t) => acc + Number(t.amount), 0);
    }, [transactions]);

    const getCategorySpend = useCallback((categoryId) => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        return transactions
            .filter(t => {
                if (t.isDeleted) return false;
                const d = new Date(t.date || t.createdAt);
                if (isNaN(d.getTime())) return false;
                return isWithinInterval(d, { start, end });
            })
            .reduce((acc, t) => {
                if (t.categoryId === categoryId) {
                    return acc + Number(t.amount);
                }
                return acc;
            }, 0);
    }, [transactions]);

    const getBudgetStats = useCallback((categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category || !category.budget) return null;

        const spent = getCategorySpend(categoryId);
        const budget = Number(category.budget);
        const remaining = budget - spent;
        const percent = Math.min(Math.round((spent / budget) * 100), 100);

        let status = 'good';
        if (percent >= 100) status = 'danger';
        else if (percent >= 80) status = 'warning';

        return { spent, budget, remaining, percent, status };
    }, [categories, getCategorySpend]);

    const getDailySpend = useCallback((date = new Date()) => {
        return transactions
            .filter(t => {
                if (t.isDeleted || t.type !== 'expense') return false;
                const d = new Date(t.date || t.createdAt);
                if (isNaN(d.getTime())) return false;
                return isSameDay(d, date);
            })
            .reduce((acc, t) => acc + Number(t.amount), 0);
    }, [transactions]);

    const getWeeklySavings = useCallback(() => {
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });

        const weeklyTx = transactions.filter(t => {
            if (t.isDeleted) return false;
            const d = new Date(t.date || t.createdAt);
            if (isNaN(d.getTime())) return false;
            return isWithinInterval(d, { start, end });
        });

        const income = weeklyTx.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = weeklyTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

        return income - expense;
    }, [transactions]);


    // --- Actions ---

    const addTransaction = useCallback(async (tx) => {
        if (!user) return;

        await CloudFunctionService.commitFinancialTransaction({
            transactionId: crypto.randomUUID(),
            accountId: tx.accountId,
            type: tx.type,
            amount: Number(tx.amount),
            categoryId: tx.categoryId,
            date: tx.date || new Date().toISOString(),
            description: tx.note || tx.description,
            metadata: { ...tx } // Keep other fields as metadata
        });
    }, [user]);

    const addTransfer = useCallback(async ({ amount, fromAccountId, toAccountId, note, date }) => {
        if (!user) return;

        await CloudFunctionService.commitFinancialTransaction({
            transactionId: crypto.randomUUID(),
            accountId: fromAccountId,
            toAccountId: toAccountId,
            type: 'transfer',
            amount: Number(amount),
            date: date || new Date().toISOString(),
            description: note || 'Fund Transfer',
            categoryId: 'cat_transfer'
        });
    }, [user]);

    const addRecurringRule = useCallback(async (ruleData) => {
        if (!user) return;
        const newRule = {
            isActive: true,
            nextDueDate: ruleData.startDate,
            ...ruleData
        };
        await FirestoreService.addItem(`users/${user.uid}/recurringRules`, newRule);
    }, [user]);

    // SOFT DELETE REFACTOR: Compensation Transaction
    const deleteTransaction = useCallback(async (id) => {
        if (!user) return;
        const tx = transactions.find(t => t.transactionId === id || t.id === id); // Handle legacy ID vs new UUID
        if (!tx) return;
        if (tx.isDeleted) return;

        // 1. Mark as Deleted (Metadata update only, safe in rules? 
        // Rules say transactions are append-only. 
        // So we strictly obey that: We DON'T update 'isDeleted'. 
        // We create a COMPENSATION transaction.

        // Logic: If we delete an Income, we create an Expense of same amount.
        // If we delete an Expense, we create an Income.
        // If we delete a Transfer, we create a Reverse Transfer.

        const compensationId = crypto.randomUUID();
        let compType = tx.type === 'income' ? 'expense' : 'income'; // Swap
        let compFrom = tx.accountId;
        let compTo = undefined;

        if (tx.type === 'transfer') {
            compType = 'transfer';
            compFrom = tx.toAccountId; // Swap source/dest
            compTo = tx.accountId;
        }

        await CloudFunctionService.commitFinancialTransaction({
            transactionId: compensationId,
            accountId: compFrom,
            toAccountId: compTo,
            type: compType,
            amount: Number(tx.amount),
            date: new Date().toISOString(),
            description: `Correction: Undo ${tx.description || 'Transaction'}`,
            metadata: {
                isCompensation: true,
                originalTransactionId: tx.transactionId || tx.id
            }
        });

        // Optimistically hide from UI? 
        // Or wait for it to appear as a correction?
        // App logic might need to filter 'isCompensation' or 'isDeleted'.
        // For now, we respect the strict primitive.
    }, [user, transactions]);

    const restoreTransaction = useCallback(async (id) => {
        // Not applicable if we use compensation logic. 
        // You can't "restore" a compensated transaction, you just create a new one.
        // Legacy functionality removed or re-implemented as "Redo".
        console.warn("restoreTransaction is deprecated in strict ledger mode.");
    }, []);

    const editTransaction = useCallback(async (id, updatedTx) => {
        if (!user) return;
        // Edit = Compensate Old + Create New
        await deleteTransaction(id);
        await addTransaction(updatedTx);
    }, [user, deleteTransaction, addTransaction]);

    const checkDuplicate = useCallback((newTx) => {
        // ... existing logic ...
        return false; // Simplified for now
    }, []);

    const updateAccount = useCallback(async (id, updates) => {
        if (!user) return;
        // Direct metadata updates ONLY. Balance updates blocked by rules.
        // Filter out balance from updates just in case.
        const { balance, ...safeUpdates } = updates;
        await FirestoreService.updateItem(`users/${user.uid}/accounts`, id, safeUpdates);
    }, [user]);

    const toggleArchiveAccount = useCallback(async (id) => {
        if (!user) return;
        const acc = accounts.find(a => a.id === id);
        if (acc) {
            await FirestoreService.updateItem(`users/${user.uid}/accounts`, id, { isArchived: !acc.isArchived });
        }
    }, [user, accounts]);

    const updateCategoryBudget = useCallback(async (catId, newLimit) => {
        if (!user) return;
        await FirestoreService.updateItem(`users/${user.uid}/categories`, catId, { budget: newLimit });
    }, [user]);

    const addCategory = useCallback(async (cat) => {
        if (!user) return;
        await FirestoreService.addItem(`users/${user.uid}/categories`, cat);
    }, [user]);

    const addDebt = useCallback(async (debt, linkToTransaction = false, accountId = null) => {
        if (!user) return;

        const newDebt = {
            createdAt: Date.now(),
            status: 'open',
            isSettled: false,
            paidAmount: 0,
            history: [{
                id: `dh_${Date.now()}`,
                date: Date.now(),
                amount: Number(debt.amount),
                type: 'creation',
                note: 'Record created'
            }],
            ...debt
        };

        const debtRef = await FirestoreService.addItem(`users/${user.uid}/debts`, newDebt);

        if (linkToTransaction && accountId) {
            const isPayable = debt.type === 'payable';
            // If Payable (I owe money), I received money -> Income
            // If Receivable (They owe me), I gave money -> Expense
            const txType = isPayable ? 'income' : 'expense';

            await CloudFunctionService.commitFinancialTransaction({
                transactionId: crypto.randomUUID(),
                accountId: accountId,
                type: txType,
                amount: Number(debt.amount),
                categoryId: isPayable ? 'cat_debt_in' : 'cat_debt_out',
                date: new Date().toISOString(),
                description: `Debt: ${debt.person}`,
                metadata: { relatedDebtId: debtRef.id }
            });
        }
    }, [user]);

    const addDebtPayment = useCallback(async (debtId, amount, date = new Date()) => {
        if (!user) return;
        const debt = debts.find(d => d.id === debtId);
        if (!debt) return;

        const numAmount = Number(amount);
        const isReceiving = debt.type === 'receivable'; // I am receiving money back -> Income

        await CloudFunctionService.commitFinancialTransaction({
            transactionId: crypto.randomUUID(),
            accountId: 'acc_bank', // Default pending UI support
            type: isReceiving ? 'income' : 'expense',
            amount: numAmount,
            categoryId: 'cat_debt',
            date: new Date(date).toISOString(),
            description: `Repayment: ${debt.person}`,
            metadata: { relatedDebtId: debtId }
        });

        // Update Debt Record (Metadata)
        const newPaidAmount = (debt.paidAmount || 0) + numAmount;
        const isSettled = newPaidAmount >= Number(debt.amount);

        await FirestoreService.updateItem(`users/${user.uid}/debts`, debtId, {
            paidAmount: newPaidAmount,
            isSettled,
            payments: [...(debt.payments || []), { amount: numAmount, date: new Date(date).toISOString(), id: `pay_${Date.now()}` }]
        });
    }, [user, debts]);

    const settleDebt = useCallback((id) => {
        const debt = debts.find(d => d.id === id);
        if (debt && !debt.isSettled) {
            const remaining = Number(debt.amount) - (debt.paidAmount || 0);
            if (remaining > 0) {
                addDebtPayment(id, remaining);
            }
        }
    }, [debts, addDebtPayment]);

    const addSubscription = useCallback(async (sub) => {
        if (!user) return;
        const today = new Date();
        const dueDay = Number(sub.dueDate);
        let firstDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
        if (firstDate < today) firstDate = addMonths(firstDate, 1);

        const newSub = {
            status: 'active',
            autoPay: true,
            nextBillingDate: firstDate.toISOString(),
            ...sub
        };
        await FirestoreService.addItem(`users/${user.uid}/subscriptions`, newSub);
    }, [user]);

    const updateSubscription = useCallback(async (id, updates) => {
        if (!user) return;
        await FirestoreService.updateItem(`users/${user.uid}/subscriptions`, id, updates);
    }, [user]);

    const toggleSubscriptionStatus = useCallback(async (id) => {
        if (!user) return;
        const sub = subscriptions.find(s => s.id === id);
        if (sub) {
            await FirestoreService.updateItem(`users/${user.uid}/subscriptions`, id, { status: sub.status === 'active' ? 'paused' : 'active' });
        }
    }, [user, subscriptions]);

    const deleteSubscription = useCallback(async (id) => {
        if (!user) return;
        await FirestoreService.deleteItem(`users/${user.uid}/subscriptions`, id);
    }, [user]);


    const loadMoreTransactions = useCallback(() => setTxLimit(prev => prev + 50), []);

    const value = useMemo(() => ({
        transactions,
        categories,
        accounts,
        savingsGoals,
        debts,
        subscriptions,
        addTransaction,
        addTransfer,
        deleteTransaction,
        editTransaction,
        restoreTransaction,
        checkDuplicate,
        getAccountBalance,
        getTotalBalance,
        getMonthlySpend,
        getCategorySpend,
        updateCategoryBudget,
        addCategory,
        addDebt,
        addDebtPayment,
        settleDebt,
        addSubscription,
        updateSubscription,
        toggleSubscriptionStatus,
        deleteSubscription,
        updateAccount,
        toggleArchiveAccount,
        addRecurringRule,
        recurringRules,
        getBudgetStats,
        getDailySpend,
        getWeeklySavings,
        isLoading,
        loadMoreTransactions
    }), [
        transactions, categories, accounts, savingsGoals, debts, subscriptions, recurringRules, isLoading,
        addTransaction, addTransfer, deleteTransaction, editTransaction, restoreTransaction, checkDuplicate,
        getAccountBalance, getTotalBalance, getMonthlySpend, getCategorySpend, updateCategoryBudget, addCategory,
        addDebt, addDebtPayment, settleDebt, addSubscription, updateSubscription, toggleSubscriptionStatus, deleteSubscription,
        updateAccount, toggleArchiveAccount, addRecurringRule, getBudgetStats, getDailySpend, getWeeklySavings,
        loadMoreTransactions
    ]);

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
};

