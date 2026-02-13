import {
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    updateDoc,
    serverTimestamp,
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    where
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const DB = {
    /**
     * Get a reference to the daily document
     * Path: users/{uid}/days/{dateKey}
     */
    getDayRef(uid, date) {
        return doc(db, 'users', uid, 'days', date);
    },

    /**
     * Subscribe to real-time updates for a specific day
     */
    subscribeToDay(uid, date, callback) {
        const ref = this.getDayRef(uid, date);
        return onSnapshot(ref, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data());
            } else {
                callback(null);
            }
        }, (error) => {
            console.error("Firestore Subscribe Error:", error);
        });
    },

    /**
     * Save/Update daily data
     * Uses setDoc with merge: true to avoid overwriting unrelated fields if any
     */
    async saveDay(uid, date, data) {
        const ref = this.getDayRef(uid, date);
        try {
            await setDoc(ref, {
                ...data,
                lastModified: serverTimestamp() // Use server timestamp for sync correctness
            }, { merge: true });
        } catch (error) {
            console.error("Firestore Save Error:", error);
            throw error;
        }
    },

    /**
     * Lock a day explicitly
     */
    async lockDay(uid, date) {
        const ref = this.getDayRef(uid, date);
        await updateDoc(ref, {
            locked: true,
            submitted: true,
            lockedAt: serverTimestamp()
        });
    },

    /**
     * Get recent history (last N days)
     * Optimized for specific day lookup logic or small ranges
     */
    async getRecentHistory(uid, days = 7) {
        const history = [];
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const ref = this.getDayRef(uid, dateStr);
            // We could parallelize this with Promise.all for speed
            const snap = await getDoc(ref);
            if (snap.exists()) {
                history.push({ date: dateStr, data: snap.data(), score: this.calculateScore(snap.data()) });
            } else {
                history.push({ date: dateStr, data: null, score: 0 });
            }
        }
        return history.reverse(); // Oldest first
    },

    /**
     * Get ALL history for Analytics
     * Uses Collection Query
     */
    async getAllHistory(uid) {
        try {
            const daysRef = collection(db, 'users', uid, 'days');
            // Assuming documents have a 'date' field inside them as per Security Rules.
            // If not, we use doc.id. 
            // Security rules said: isValidDay includes 'date'.
            // However, previous code didn't explicitly save 'date' property in 'saveDay'...? 
            // Wait, saveDay merge: true... does the data passed have 'date'?
            // DataContext saveDay passes newData. newData usually has tasks/habits/etc.
            // It might NOT have date field inside body if only docId is used.
            // Safe bet: Fetch all, then map doc.id to date.

            // NEW: Limit to current year to prevent unbounded reads
            const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
            const q = query(daysRef, where('date', '>=', startOfYear));
            const querySnapshot = await getDocs(q);

            const history = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                history.push({
                    date: doc.id, // reliable
                    data: data,
                    score: this.calculateScore(data)
                });
            });

            // Sort by date string
            history.sort((a, b) => a.date.localeCompare(b.date));

            return history;
        } catch (error) {
            console.error("Error fetching all history:", error);
            return [];
        }
    },

    calculateScore(data) {
        if (!data || !data.tasks) return 0;
        const total = data.tasks.length;
        if (total === 0) return 0;
        const completed = data.tasks.filter(t => t.status === 'checked').length;
        return Math.round((completed / total) * 100);
    },

    // --- GENERIC MODULES (Finance, Vehicle, etc) ---

    getModuleRef(uid, moduleName) {
        return doc(db, 'users', uid, 'modules', moduleName);
    },

    subscribeToModule(uid, moduleName, callback) {
        const ref = this.getModuleRef(uid, moduleName);
        return onSnapshot(ref, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data());
            } else {
                callback(null);
            }
        }, (error) => {
            console.error(`Firestore Module Subscribe Error (${moduleName}):`, error);
        });
    },

    async saveModule(uid, moduleName, data) {
        const ref = this.getModuleRef(uid, moduleName);
        try {
            await setDoc(ref, {
                ...data,
                lastModified: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error(`Firestore Module Save Error (${moduleName}):`, error);
            throw error;
        }
    }
};
