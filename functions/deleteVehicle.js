'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.purgeVehicleData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  }

  const uid = context.auth.uid;
  const { vehicleId } = data;

  if (!vehicleId) {
    throw new functions.https.HttpsError('invalid-argument', 'vehicleId is required.');
  }

  const db = admin.firestore();
  const vehicleRef = db.collection('users').doc(uid).collection('vehicles').doc(vehicleId);

  return await db.runTransaction(async (t) => {
    // 1. READS
    const vehicleSnap = await t.get(vehicleRef);
    if (!vehicleSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Vehicle not found.');
    }

    const followUpsSnap = await t.get(
      db.collection('users').doc(uid).collection('followUps').where('vehicleId', '==', vehicleId)
    );

    const recordsSnap = await t.get(
      db.collection('users').doc(uid).collection('serviceRecords').where('vehicleId', '==', vehicleId)
    );

    const loansSnap = await t.get(
      db.collection('users').doc(uid).collection('vehicleLoans').where('vehicleId', '==', vehicleId)
    );

    // 2. SAFETY CHECK (Max 500 ops in transaction, reserve 50 for safety)
    const totalDeletes = 1 + followUpsSnap.size + recordsSnap.size + loansSnap.size; // 1 for vehicle itself
    if (totalDeletes > 450) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Vehicle has too many related records (${totalDeletes}). Use archive instead.`
      );
    }

    // 3. DELETES
    // Delete FollowUps
    followUpsSnap.docs.forEach((doc) => {
      t.delete(doc.ref);
    });

    // Delete ServiceRecords
    recordsSnap.docs.forEach((doc) => {
      t.delete(doc.ref);
    });

    // Delete Loans
    loansSnap.docs.forEach((doc) => {
      t.delete(doc.ref);
    });

    // Delete Vehicle
    t.delete(vehicleRef);

    return { success: true, deletedCount: totalDeletes };
  });
});
