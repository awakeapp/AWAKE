import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { format, startOfMonth, endOfMonth, isWithinInterval, addDays, subDays, addWeeks, addMonths, addYears, isBefore, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
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
        { id: 'cat_savings', name: 'Savings Allocation', type: 'savings', budget: 2000, color: 'bg-teal-500', icon: 'Wallet' },
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
    const [debtParties, setDebtParties] = useState([]);
    const [debtTransactions, setDebtTransactions] = useState([]);
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
            setDebtParties([]);
            setDebtTransactions([]);
            setSubscriptions([]);
            setRecurringRules([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const seedDefaults = async (collectionName, defaults) => {
            for (const item of defaults) {
                await FirestoreService.setItem(`users/${user.uid}/${collectionName}`, item.id, item, true);
            }
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

        const unsubDebtParties = FirestoreService.subscribeToCollection(
            `users/${user.uid}/debtParties`,
            (data) => setDebtParties(data)
        );

        const unsubDebtTransactions = FirestoreService.subscribeToCollection(
            `users/${user.uid}/debtTransactions`,
            (data) => setDebtTransactions(data)
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
            unsubDebtParties();
            unsubDebtTransactions();
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
                await seedDefaults('categories', DEFAULT_CATEGORIES);
            } else if (!cats.some(c => c.type === 'savings')) {
                await FirestoreService.setItem(`users/${user.uid}/categories`, 'cat_savings', { id: 'cat_savings', name: 'Savings Allocation', type: 'savings', budget: 0, color: 'bg-teal-500', icon: 'Wallet' }, true);
            }
            const accs = await FirestoreService.getCollection(`users/${user.uid}/accounts`);
            if (accs.length === 0) {
                await seedDefaults('accounts', DEFAULT_ACCOUNTS);
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

    const getCalculatedBalance = useCallback(() => {
        const income = transactions
            .filter(t => !t.isDeleted && t.type === 'income')
            .reduce((acc, t) => acc + Number(t.amount), 0);
        const expense = transactions
            .filter(t => !t.isDeleted && t.type === 'expense')
            .reduce((acc, t) => acc + Number(t.amount), 0);
        const savings = transactions
            .filter(t => !t.isDeleted && t.type === 'savings')
            .reduce((acc, t) => acc + Number(t.amount), 0);
        return income - expense - savings;
    }, [transactions]);

    const getTotalBalance = useCallback(() => {
        // User requested Total Income - Total Expense logic
        return getCalculatedBalance();
    }, [getCalculatedBalance]);

    const getMonthlySpend = useCallback(() => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        return transactions
            .filter(t => !t.isDeleted && t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end }))
            .reduce((acc, t) => acc + Number(t.amount), 0);
    }, [transactions]);

    const getCategorySpend = useCallback((categoryId) => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        return transactions
            .filter(t => !t.isDeleted && isWithinInterval(new Date(t.date), { start, end }))
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
            .filter(t => !t.isDeleted && t.type === 'expense' && isSameDay(new Date(t.date || t.createdAt), date))
            .reduce((acc, t) => acc + Number(t.amount), 0);
    }, [transactions]);

    const getWeeklySavings = useCallback(() => {
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });

        const weeklyTx = transactions.filter(t =>
            !t.isDeleted && isWithinInterval(new Date(t.date || t.createdAt), { start, end })
        );

        const income = weeklyTx.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = weeklyTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

        return income - expense;
    }, [transactions]);


    // --- Actions ---

    const addTransaction = useCallback(async (tx) => {
        if (!user) return;

        const numAmount = Number(tx.amount);
        if (!numAmount || isNaN(numAmount) || numAmount <= 0 || numAmount > 9999999) {
            throw new Error('Invalid amount. Must be between 1 and 99,99,999.');
        }

        const newTx = {
            transactionId: crypto.randomUUID(),
            accountId: tx.accountId,
            type: tx.type,
            amount: numAmount,
            categoryId: tx.categoryId,
            date: tx.date || new Date().toISOString(),
            note: tx.note || tx.description || '',
            description: tx.note || tx.description || 'Transaction',
            createdAt: Date.now(),
            metadata: { ...tx }
        };

        try {
            await FirestoreService.addItem(`users/${user.uid}/transactions`, newTx);
        } catch (error) {
            console.error("Failed to add transaction via FirestoreService:", error);
            throw error;
        }
    }, [user]);

    const addTransfer = useCallback(async ({ amount, fromAccountId, toAccountId, note, date }) => {
        if (!user) return;

        const newTx = {
            transactionId: crypto.randomUUID(),
            accountId: fromAccountId,
            toAccountId: toAccountId,
            type: 'transfer',
            amount: Number(amount),
            date: date || new Date().toISOString(),
            note: note || '',
            description: note || 'Fund Transfer',
            categoryId: 'cat_transfer',
            createdAt: Date.now()
        };

        try {
            await FirestoreService.addItem(`users/${user.uid}/transactions`, newTx);
        } catch (error) {
            console.error("Failed to add transfer via FirestoreService:", error);
            throw error;
        }
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
        const tx = transactions.find(t => t.transactionId === id || t.id === id);
        if (!tx) return;
        if (tx.isDeleted) return;

        const docId = tx.id;
        try {
            await FirestoreService.updateItem(`users/${user.uid}/transactions`, docId, {
                isDeleted: true,
                deletedAt: Date.now()
            });
        } catch (error) {
            console.error("Failed to delete transaction:", error);
            throw error;
        }
    }, [user, transactions]);

    const restoreTransaction = useCallback(async (id) => {
        if (!user) return;
        const tx = transactions.find(t => t.transactionId === id || t.id === id);
        if (!tx) return;

        const docId = tx.id;
        try {
            await FirestoreService.updateItem(`users/${user.uid}/transactions`, docId, {
                isDeleted: false,
                deletedAt: null
            });
        } catch (error) {
            console.error("Failed to restore transaction:", error);
        }
    }, [user, transactions]);

    const editTransaction = useCallback(async (id, updatedTx) => {
        if (!user) return;
        const tx = transactions.find(t => t.transactionId === id || t.id === id);
        if (!tx) return;

        const docId = tx.id;
        try {
            await FirestoreService.updateItem(`users/${user.uid}/transactions`, docId, {
                ...updatedTx,
                note: updatedTx.note || updatedTx.description || '',
                description: updatedTx.note || updatedTx.description || tx.description,
                updatedAt: Date.now()
            });
        } catch (error) {
            console.error("Failed to edit transaction:", error);
            throw error;
        }
    }, [user, transactions]);

    const checkDuplicate = useCallback((newTx) => {
        if (!newTx || !newTx.amount || !newTx.categoryId) return false;
        const recent = transactions.filter(t => !t.isDeleted && 
            t.amount === Number(newTx.amount) && 
            t.categoryId === newTx.categoryId &&
            Date.now() - (t.createdAt || 0) < 60000
        );
        return recent.length > 0;
    }, [transactions]);

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
        await FirestoreService.setItem(`users/${user.uid}/categories`, catId, { budget: newLimit }, true);
    }, [user]);

    const addCategory = useCallback(async (cat) => {
        if (!user) return;
        const newCat = {
            id: `cat_${Date.now()}`,
            budget: 0,
            color: 'bg-indigo-500',
            icon: 'IndianRupee',
            ...cat
        };
        await FirestoreService.addItem(`users/${user.uid}/categories`, newCat);
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


    const ENTRY_LOCK_DAYS = 30;

    const isEntryLocked = useCallback((tx) => {
        if (!tx || !tx.date) return false;
        const txDate = new Date(tx.date);
        const lockDate = subDays(new Date(), ENTRY_LOCK_DAYS);
        return isBefore(txDate, lockDate);
    }, []);

    const addDebtParty = useCallback(async (party) => {
        if (!user) return;
        const newParty = {
            created_at: new Date().toISOString(),
            is_deleted: false,
            ...party
        };
        await FirestoreService.addItem(`users/${user.uid}/debtParties`, newParty);
    }, [user]);

    const updateDebtParty = useCallback(async (id, updates) => {
        if (!user) return;
        await FirestoreService.updateItem(`users/${user.uid}/debtParties`, id, updates);
    }, [user]);

    const softDeleteDebtParty = useCallback(async (id) => {
        if (!user) return;
        await FirestoreService.updateItem(`users/${user.uid}/debtParties`, id, { is_deleted: true });
    }, [user]);

    const addDebtTransaction = useCallback(async (tx) => {
        if (!user) return;
        const newTx = {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_deleted: false,
            edit_history: [],
            ...tx
        };
        await FirestoreService.addItem(`users/${user.uid}/debtTransactions`, newTx);
    }, [user]);

    const editDebtTransaction = useCallback(async (id, updates) => {
        if (!user) return;
        const tx = debtTransactions.find(t => t.id === id);
        if (!tx || isEntryLocked(tx)) return;
        
        const historyEntry = {
            edited_at: new Date().toISOString(),
            changes: updates
        };

        await FirestoreService.updateItem(`users/${user.uid}/debtTransactions`, id, {
            ...updates,
            updated_at: new Date().toISOString(),
            edit_history: [...(tx.edit_history || []), historyEntry]
        });
    }, [user, debtTransactions, isEntryLocked]);

    const softDeleteDebtTransaction = useCallback(async (id) => {
        if (!user) return;
        const tx = debtTransactions.find(t => t.id === id);
        if (!tx || isEntryLocked(tx)) return;
        
        await FirestoreService.updateItem(`users/${user.uid}/debtTransactions`, id, {
            is_deleted: true,
            updated_at: new Date().toISOString()
        });
    }, [user, debtTransactions, isEntryLocked]);

    const reverseDebtTransaction = useCallback(async (id) => {
        if (!user) return;
        const tx = debtTransactions.find(t => t.id === id);
        if (!tx) return;
        
        let reverseType;
        switch(tx.type) {
            case 'you_gave': reverseType = 'you_received'; break;
            case 'you_received': reverseType = 'you_gave'; break;
            case 'you_borrowed': reverseType = 'you_repaid'; break;
            case 'you_repaid': reverseType = 'you_borrowed'; break;
            case 'adjustment': reverseType = 'adjustment'; break; 
            case 'write_off': reverseType = 'adjustment'; break; 
            default: reverseType = 'adjustment';
        }
        
        const newTx = {
            party_id: tx.party_id,
            type: reverseType,
            amount: reverseType === 'adjustment' && tx.type === 'adjustment' ? -Number(tx.amount) : Number(tx.amount),
            date: new Date().toISOString(),
            notes: `Reversal of ${tx.type} transaction`,
            is_reversal: true,
            reversed_tx_id: tx.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_deleted: false,
            edit_history: []
        };
        await FirestoreService.addItem(`users/${user.uid}/debtTransactions`, newTx);
    }, [user, debtTransactions]);

    const getPartyTransactions = useCallback((partyId) => {
        return debtTransactions
            .filter(t => t.party_id === partyId && !t.is_deleted)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [debtTransactions]);

    const getPartyBalance = useCallback((partyId) => {
        const txs = getPartyTransactions(partyId);
        let balance = 0;
        
        const sortedOldestFirst = [...txs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        for (const t of sortedOldestFirst) {
            const amt = Number(t.amount);
            switch(t.type) {
                case 'you_gave': balance += amt; break;
                case 'you_received': balance -= amt; break;
                case 'you_borrowed': balance -= amt; break;
                case 'you_repaid': balance += amt; break;
                case 'adjustment': balance += amt; break;
                case 'write_off': balance = 0; break;
            }
        }
        
        return balance;
    }, [getPartyTransactions]);

    // --- Settlement Logic ---

    // Returns how much of entry `entryId` has been settled by payment txs
    const getEntrySettledAmount = useCallback((entryId) => {
        return debtTransactions
            .filter(t => !t.is_deleted && t.settlements)
            .reduce((sum, t) => {
                const match = (t.settlements || []).find(s => s.entry_id === entryId);
                return sum + (match ? Number(match.amount) : 0);
            }, 0);
    }, [debtTransactions]);

    // Returns outstanding (unsettled) entries for a party
    // "Outstanding" = you_gave or you_borrowed entries with remaining > 0
    const getPendingEntries = useCallback((partyId) => {
        const txs = debtTransactions
            .filter(t => t.party_id === partyId && !t.is_deleted)
            .filter(t => t.type === 'you_gave' || t.type === 'you_borrowed')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // oldest first

        return txs.map(t => {
            const settled = getEntrySettledAmount(t.id);
            const remaining = Number(t.amount) - settled;
            return { ...t, settled, remaining };
        }).filter(t => t.remaining > 0);
    }, [debtTransactions, getEntrySettledAmount]);

    // settleOldestFirst: boolean
    // selectedEntries: [{ entry_id, amount }] — only used when settleOldestFirst=false
    const addSettlementPayment = useCallback(async (partyId, totalAmount, { settleOldestFirst = false, selectedEntries = [], txType, date, notes }) => {
        if (!user) return;
        let remaining = Number(totalAmount);
        if (remaining <= 0) return;

        let settlements = [];

        if (settleOldestFirst) {
            const pending = getPendingEntries(partyId);
            for (const entry of pending) {
                if (remaining <= 0) break;
                const allocate = Math.min(entry.remaining, remaining);
                settlements.push({ entry_id: entry.id, amount: allocate });
                remaining -= allocate;
            }
        } else {
            // Use user-selected entries
            for (const sel of selectedEntries) {
                if (remaining <= 0) break;
                const entry = debtTransactions.find(t => t.id === sel.entry_id);
                if (!entry) continue;
                const settled = getEntrySettledAmount(sel.entry_id);
                const entryRemaining = Number(entry.amount) - settled;
                const allocate = Math.min(Number(sel.amount), entryRemaining, remaining);
                if (allocate > 0) {
                    settlements.push({ entry_id: sel.entry_id, amount: allocate });
                    remaining -= allocate;
                }
            }
        }

        // Create the payment transaction with settlement references
        const paymentTx = {
            party_id: partyId,
            type: txType || 'you_received',
            amount: Number(totalAmount) - remaining, // actual allocated amount (prevents over-allocation)
            date: date || new Date().toISOString(),
            notes: notes || 'Payment',
            settlements,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_deleted: false,
            edit_history: []
        };

        await FirestoreService.addItem(`users/${user.uid}/debtTransactions`, paymentTx);
    }, [user, getPendingEntries, debtTransactions, getEntrySettledAmount]);

    // Party status: 'cleared' | 'overdue' | 'active'
    const getPartyStatus = useCallback((partyId) => {
        const bal = getPartyBalance(partyId);
        if (bal === 0) return 'cleared';

        const pending = getPendingEntries(partyId);
        const now = new Date();
        const hasOverdue = pending.some(t => t.due_date && isBefore(new Date(t.due_date), now));
        if (hasOverdue) return 'overdue';

        return 'active';
    }, [getPartyBalance, getPendingEntries]);


    const loadMoreTransactions = useCallback(() => setTxLimit(prev => prev + 50), []);

    const value = useMemo(() => ({
        transactions,
        categories,
        accounts,
        savingsGoals,
        debts,
        debtParties,
        debtTransactions,
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
        addDebtParty,
        updateDebtParty,
        softDeleteDebtParty,
        addDebtTransaction,
        editDebtTransaction,
        softDeleteDebtTransaction,
        reverseDebtTransaction,
        getPartyTransactions,
        getPartyBalance,
        isEntryLocked,
        getEntrySettledAmount,
        getPendingEntries,
        addSettlementPayment,
        getPartyStatus,
        isLoading,
        loadMoreTransactions
    }), [
        transactions, categories, accounts, savingsGoals, debts, debtParties, debtTransactions, subscriptions, recurringRules, isLoading,
        addTransaction, addTransfer, deleteTransaction, editTransaction, restoreTransaction, checkDuplicate,
        getAccountBalance, getTotalBalance, getMonthlySpend, getCategorySpend, updateCategoryBudget, addCategory,
        addDebt, addDebtPayment, settleDebt, addSubscription, updateSubscription, toggleSubscriptionStatus, deleteSubscription,
        updateAccount, toggleArchiveAccount, addRecurringRule, getBudgetStats, getDailySpend, getWeeklySavings,
        addDebtParty, updateDebtParty, softDeleteDebtParty, addDebtTransaction, editDebtTransaction,
        softDeleteDebtTransaction, reverseDebtTransaction, getPartyTransactions, getPartyBalance, isEntryLocked,
        getEntrySettledAmount, getPendingEntries, addSettlementPayment, getPartyStatus,
        loadMoreTransactions
    ]);

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
};

