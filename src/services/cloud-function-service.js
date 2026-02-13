
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase'; // Ensure app is exported from lib/firebase

export const CloudFunctionService = {
    /**
     * Canonical Primitive for ALL finance mutations.
     * @param {Object} payload 
     * @param {string} payload.transactionId - UUID v4
     * @param {string} payload.accountId - Source Account ID
     * @param {string} [payload.toAccountId] - Target Account ID (if transfer)
     * @param {'income'|'expense'|'transfer'} payload.type
     * @param {number} payload.amount - Positive Number
     * @param {string} [payload.categoryId]
     * @param {string} [payload.date] - ISO string
     * @param {string} [payload.description]
     * @param {Object} [payload.metadata]
     */
    async commitFinancialTransaction(payload) {
        const functions = getFunctions(app); // region default
        const commitFn = httpsCallable(functions, 'commitFinancialTransaction');

        try {
            const result = await commitFn(payload);
            return result.data;
        } catch (error) {
            console.error("Cloud Function Failed:", error);
            throw error;
        }
    }
};
