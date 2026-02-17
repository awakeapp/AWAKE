import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { getRemoteConfig } from 'firebase/remote-config';

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

// Initialize Analytics (only in browser)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Performance Monitoring
let performance = null;
if (typeof window !== 'undefined') {
  performance = getPerformance(app);
}

// Initialize Remote Config
let remoteConfig = null;
if (typeof window !== 'undefined') {
  remoteConfig = getRemoteConfig(app);
  // Set default values
  remoteConfig.defaultConfig = {
    enable_ai_chat: true,
    enable_finance: true,
    enable_vehicles: true,
    enable_confetti: true,
    daily_quote: "Stay focused and never give up!",
    max_tasks_per_day: 50,
    max_habits: 20
  };
}

export { app, auth, db, analytics, performance, remoteConfig };

