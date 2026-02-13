const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * commitFinancialTransaction
 * Canonical primitive for ALL finance mutations.
 * Enforces server-side authority on account balances.
 */
exports.commitFinancialTransaction = functions.https.onCall(async (data, context) => {
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const uid = context.auth.uid;

    // 2. Input Validation
    const {
        transactionId,
        accountId,
        type,
        amount,
        categoryId,
        date,
        description,
        toAccountId,
        metadata
    } = data;

    if (!transactionId || !accountId || !type || amount === undefined) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }

    if (amount < 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Amount must be positive.');
    }

    const txDate = date || new Date().toISOString();
    const docRef = db.collection('users').doc(uid).collection('transactions').doc(transactionId);

    // References for Accounts
    const accountRef = db.collection('users').doc(uid).collection('accounts').doc(accountId);
    let toAccountRef = null;
    if (type === 'transfer') {
        if (!toAccountId) {
            throw new functions.https.HttpsError('invalid-argument', 'Transfer requires toAccountId.');
        }
        toAccountRef = db.collection('users').doc(uid).collection('accounts').doc(toAccountId);
    }

    // 3. Firestore Transaction
    try {
        await db.runTransaction(async (t) => {
            // Check for idempotency (if transactionId already exists, fail or ignore?)
            // For now, we fail to prevent double-counting if the client retries blindly.
            const doc = await t.get(docRef);
            if (doc.exists) {
                throw new functions.https.HttpsError('already-exists', 'Transaction ID already processed.');
            }

            // Get Account(s)
            const accDoc = await t.get(accountRef);
            if (!accDoc.exists) {
                throw new functions.https.HttpsError('not-found', `Account ${accountId} not found.`);
            }
            const currentBalance = Number(accDoc.data().balance || 0);

            let newBalance = currentBalance;

            // Calculate Impact
            if (type === 'income') {
                newBalance += Number(amount);
            } else if (type === 'expense') {
                newBalance -= Number(amount);
            } else if (type === 'transfer') {
                newBalance -= Number(amount);

                // Handle Target Account
                const toAccDoc = await t.get(toAccountRef);
                if (!toAccDoc.exists) {
                    throw new functions.https.HttpsError('not-found', `Target Account ${toAccountId} not found.`);
                }
                const toBalance = Number(toAccDoc.data().balance || 0);
                t.update(toAccountRef, { balance: toBalance + Number(amount) });
            }

            // Update Source Account
            t.update(accountRef, { balance: newBalance });

            // Create Transaction Record
            t.set(docRef, {
                transactionId,
                accountId,
                toAccountId: toAccountId || null,
                type,
                amount: Number(amount),
                categoryId: categoryId || null,
                date: txDate,
                description: description || '',
                metadata: metadata || {},
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: uid
            });
        });

        return { success: true, transactionId };

    } catch (error) {
        console.error("Transaction Error:", error);
        // Re-throw HttpsErrors, wrap others
        if (error.code && error.details) throw error;
        throw new functions.https.HttpsError('internal', error.message);
    }
});
