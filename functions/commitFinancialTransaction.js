'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { commitFinancialTransactionInternal } = require('./transactionHelpers');

exports.commitFinancialTransaction = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  }

  const uid = context.auth.uid;
  const db = admin.firestore();

  const payload = { ...data, uid };

  try {
    const result = await db.runTransaction(async (t) => {
      return await commitFinancialTransactionInternal(t, db, payload);
    });

    return {
      success: true,
      ledgerId: result.ledgerRef.id,
      newBalance: result.newBalance,
      balanceDelta: result.balanceDelta,
    };
  } catch (err) {
    if (err.code) {
      throw new functions.https.HttpsError(err.code, err.message);
    }
    console.error(err);
    throw new functions.https.HttpsError('internal', 'Transaction failed.');
  }
});
