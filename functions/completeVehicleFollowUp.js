'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');
const { commitFinancialTransactionInternal } = require('./transactionHelpers');

exports.completeVehicleFollowUp = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  }

  const uid = context.auth.uid;
  const { followUpId, completionDetails } = data;
  const { date, odometer, cost, accountId } = completionDetails;
  const db = admin.firestore();

  const followUpRef = db.collection('users').doc(uid).collection('followUps').doc(followUpId);

  return await db.runTransaction(async (t) => {
    const followUpSnap = await t.get(followUpRef);
    if (!followUpSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'FollowUp not found.');
    }

    const followUp = followUpSnap.data();
    const vehicleRef = db.collection('users').doc(uid).collection('vehicles').doc(followUp.vehicleId);
    const vehicleSnap = await t.get(vehicleRef);

    if (!vehicleSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Vehicle not found.');
    }

    const currentOdometer = vehicleSnap.data().odometer ?? 0;
    const shouldUpdate = odometer && odometer > currentOdometer;
    const effectiveOdo = shouldUpdate ? odometer : currentOdometer;

    let nextDueDate = null;
    let nextDueOdo = null;

    if (followUp.isRecurring && followUp.frequencyType !== 'none') {
      if (followUp.frequencyType === 'date' || followUp.frequencyType === 'both') {
        const base = new Date(date);
        switch (followUp.frequencyUnit) {
          case 'days': base.setUTCDate(base.getUTCDate() + followUp.frequencyValue); break;
          case 'months': base.setUTCMonth(base.getUTCMonth() + followUp.frequencyValue); break;
          case 'years': base.setUTCFullYear(base.getUTCFullYear() + followUp.frequencyValue); break;
        }
        nextDueDate = base.toISOString().split('T')[0];
      }

      if (followUp.frequencyType === 'odometer' || followUp.frequencyType === 'both') {
        nextDueOdo = effectiveOdo + followUp.odometerValue;
      }
    }

    const serviceRef = db.collection('users').doc(uid).collection('serviceRecords').doc();

    t.set(serviceRef, {
      vehicleId: followUp.vehicleId,
      followUpId,
      completedDate: date,
      odometer: effectiveOdo,
      cost,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const vehicleUpdate = {
      lastServiceDate: date,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (shouldUpdate) vehicleUpdate.odometer = odometer;
    t.update(vehicleRef, vehicleUpdate);

    t.delete(followUpRef);

    if (nextDueDate || nextDueOdo) {
      const nextRef = db.collection('users').doc(uid).collection('followUps').doc();
      t.set(nextRef, {
        ...followUp,
        dueDate: nextDueDate,
        dueOdometer: nextDueOdo,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    if (cost > 0) {
      await commitFinancialTransactionInternal(t, db, {
        uid,
        accountId,
        amount: cost,
        type: 'debit',
        description: 'Vehicle Service',
        referenceId: serviceRef.id,
        referenceType: 'serviceRecord',
      });
    }

    return { success: true };
  });
});
