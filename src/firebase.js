import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyANwULSo3bZkLsU0v1AJer7nBF0mH5mvok",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lokvani-d8bc7.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lokvani-d8bc7",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lokvani-d8bc7.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "961603131139",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:961603131139:web:05865fb89b3c608dd47b36",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-KPH0SSCDLB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Initialize analytics safely if supported in browser environment
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export default app;
