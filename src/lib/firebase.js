import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAFLf5FxuXFw21D1Kxkq9cPQ59oGPSJbGg",
  authDomain: "humi-awake.firebaseapp.com",
  projectId: "humi-awake",
  storageBucket: "humi-awake.appspot.com",
  messagingSenderId: "473703878796",
  appId: "1:473703878796:web:2b612896eace5d6a6eeba9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
