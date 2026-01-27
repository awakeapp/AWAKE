import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAFLF5FuxXFw21DKxkq9cPQ59oGPSJbGg",
  authDomain: "humi-awake.firebaseapp.com",
  projectId: "humi-awake",
  storageBucket: "humi-awake.firebasestorage.app",
  messagingSenderId: "473703878796",
  appId: "1:473703878796:web:2b61289eace5d6a6eeba9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
