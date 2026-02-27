import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAFLf5FxuXFw21D1Kxkq9cPQ59oGPSJbGg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "humi-awake.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "humi-awake",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "humi-awake.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "473703878796",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:473703878796:web:2b612896eace5d6a6eeba9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
