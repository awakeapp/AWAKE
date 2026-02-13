
import {
    collection,
    doc,
    onSnapshot,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    getDoc,
    getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const FirestoreService = {
    // --- Subscriptions (Real-time) ---

    subscribeToCollection: (path, callback, ...args) => {
        if (!db) {
            console.warn("Firestore not initialized");
            return () => { };
        }

        // Handle optional onError which might be the last argument if provided
        // We need to separate queryConstraints from onError
        let queryConstraints = args;
        let onError = null;

        if (args.length > 0 && typeof args[args.length - 1] === 'function') {
            onError = args.pop();
            queryConstraints = args;
        }

        try {
            const ref = collection(db, path);
            const q = query(ref, ...queryConstraints);

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(data);
            }, (error) => {
                if (onError) {
                    onError(error);
                } else {
                    console.error(`Error subscribing to ${path}: `, error);
                }
            });

            return unsubscribe;
        } catch (error) {
            console.error(`Error setting up subscription for ${path}: `, error);
            if (onError) onError(error);
            return () => { };
        }
    },

    subscribeToDocument: (path, docId, callback) => {
        if (!db) return () => { };

        try {
            const ref = doc(db, path, docId);
            const unsubscribe = onSnapshot(ref, (docSnap) => {
                if (docSnap.exists()) {
                    callback({ id: docSnap.id, ...docSnap.data() });
                } else {
                    callback(null);
                }
            }, (error) => {
                console.error(`Error subscribing to ${path}/${docId}:`, error);
            });
            return unsubscribe;
        } catch (error) {
            console.error(`Error in document subscription ${path}/${docId}:`, error);
            return () => { };
        }
    },

    // --- CRUD Operations ---

    addItem: async (path, data) => {
        const ref = collection(db, path);
        return await addDoc(ref, data);
    },

    setItem: async (path, docId, data, merge = true) => {
        const ref = doc(db, path, docId);
        return await setDoc(ref, data, { merge });
    },

    updateItem: async (path, docId, data) => {
        const ref = doc(db, path, docId);
        return await updateDoc(ref, data);
    },

    deleteItem: async (path, docId) => {
        const ref = docId ? doc(db, path, docId) : doc(db, path);
        return await deleteDoc(ref);
    },

    // --- One-time Fetches ---
    getDocument: async (path, docId) => {
        if (!db) return null;
        const ref = doc(db, path, docId);
        const snap = await getDoc(ref);
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },

    getCollection: async (path, ...queryConstraints) => {
        if (!db) return [];
        const ref = collection(db, path);
        const q = query(ref, ...queryConstraints);
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};
