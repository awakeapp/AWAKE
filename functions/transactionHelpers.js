'use strict';

const { FieldValue } = require('firebase-admin/firestore');

function validateFinancialPayload(payload) {
  const required = ['uid', 'accountId', 'amount', 'type', 'description'];
  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      throw Object.assign(new Error(`Missing required financial field: ${field}`), {
        code: 'invalid-argument',
        field,
      });
    }
  }

  if (!Number.isFinite(payload.amount) || payload.amount === 0) {
    throw Object.assign(new Error('amount must be a non-zero finite number'), {
      code: 'invalid-argument',
      field: 'amount',
    });
  }

  if (!['debit', 'credit'].includes(payload.type)) {
    throw Object.assign(new Error('type must be "debit" or "credit"'), {
      code: 'invalid-argument',
      field: 'type',
    });
  }
}

async function commitFinancialTransactionInternal(t, db, payload) {
  validateFinancialPayload(payload);

  const {
    uid,
    accountId,
    amount,
    type,
    description,
    category = 'uncategorized',
    referenceId = null,
    referenceType = null,
  } = payload;

  const accountRef = db.collection('users').doc(uid).collection('accounts').doc(accountId);
  const accountSnap = await t.get(accountRef);

  if (!accountSnap.exists) {
    throw Object.assign(new Error(`Account not found: ${accountId}`), { code: 'not-found' });
  }

  const accountData = accountSnap.data();
  const currentBalance = accountData.balance ?? 0;

  if (type === 'debit' && currentBalance < amount) {
    throw Object.assign(
      new Error(`Insufficient balance. Available: ${currentBalance}, Required: ${amount}`),
      { code: 'failed-precondition' }
    );
  }

  const balanceDelta = type === 'credit' ? amount : -amount;
  const newBalance = currentBalance + balanceDelta;

  t.update(accountRef, {
    balance: newBalance,
    lastTransactionAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const ledgerRef = db.collection('users').doc(uid).collection('ledger').doc();

  t.set(ledgerRef, {
    accountId,
    amount,
    type,
    description,
    category,
    balanceAfter: newBalance,
    referenceId,
    referenceType,
    createdAt: FieldValue.serverTimestamp(),
    uid,
  });

  return { ledgerRef, balanceDelta, newBalance };
}

module.exports = {
  commitFinancialTransactionInternal,
  validateFinancialPayload,
};
