import { initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import * as firebaseFirestore from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let auth;
let db;
let signInWithEmailAndPassword;
let createUserWithEmailAndPassword;
let signOut;
let onAuthStateChanged;
let sendPasswordResetEmail;

try {
    if (!firebaseConfig.apiKey) {
        throw new Error('Firebase API key is missing');
    }
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    // Initialize Auth
    auth = firebaseAuth.getAuth(app);
    // Initialize Firestore
    db = firebaseFirestore.getFirestore(app);

    // Assign Real SDK Functions
    signInWithEmailAndPassword = firebaseAuth.signInWithEmailAndPassword;
    createUserWithEmailAndPassword = firebaseAuth.createUserWithEmailAndPassword;
    signOut = firebaseAuth.signOut;
    onAuthStateChanged = firebaseAuth.onAuthStateChanged;
    sendPasswordResetEmail = firebaseAuth.sendPasswordResetEmail;

} catch (error) {
    console.warn('Firebase keys missing using MOCK AUTH', error);

    // Mock Auth implementation with localStorage persistence
    const STORAGE_KEY = 'mock_auth_user';
    const mockUser = JSON.parse(localStorage.getItem(STORAGE_KEY));

    auth = {
        currentUser: mockUser,
        mock: true
    };

    // Mock DB
    db = { mock: true };

    signInWithEmailAndPassword = async (authInstance, email, password) => {
        // ... (existing mock implementation)
        console.log('MOCK LOGIN:', email);
        const user = {
            uid: 'mock-user-123',
            email,
            displayName: 'Mock User',
            emailVerified: true
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        auth.currentUser = user;
        window.dispatchEvent(new Event('mock-auth-change'));
        return { user };
    };

    // ... (existing mock implementation for createUser and signOut)
    createUserWithEmailAndPassword = async (authInstance, email, password) => {
        console.log('MOCK SIGNUP:', email);
        const user = {
            uid: 'mock-user-123',
            email,
            displayName: 'Mock User',
            emailVerified: true
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        auth.currentUser = user;
        window.dispatchEvent(new Event('mock-auth-change'));
        return { user };
    };

    signOut = async (authInstance) => {
        console.log('MOCK LOGOUT');
        localStorage.removeItem(STORAGE_KEY);
        auth.currentUser = null;
        window.dispatchEvent(new Event('mock-auth-change'));
    };

    sendPasswordResetEmail = async (authInstance, email) => {
        console.log('MOCK RESET EMAIL SENT:', email);
        return Promise.resolve();
    };

    onAuthStateChanged = (authInstance, callback) => {
        // Initial state
        callback(auth.currentUser);

        const listener = () => {
            const user = JSON.parse(localStorage.getItem(STORAGE_KEY));
            auth.currentUser = user;
            callback(user);
        };

        window.addEventListener('storage', listener);
        window.addEventListener('mock-auth-change', listener);

        return () => {
            window.removeEventListener('storage', listener);
            window.removeEventListener('mock-auth-change', listener);
        };
    };
}

export { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail };
