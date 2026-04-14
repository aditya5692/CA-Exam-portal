import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Diagnostic logging for Firebase initialization
if (typeof window !== "undefined") {
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value && key !== 'measurementId')
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    console.warn(`[Firebase] Missing configuration keys in browser: ${missingKeys.join(", ")}`);
    console.warn("Check if your .env file is correctly loaded and the dev server was restarted.");
  } else {
    const keyHint = firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 7)}...` : 'undefined';
    console.log(`[Firebase] Initializing for project: ${firebaseConfig.projectId} (Key: ${keyHint})`);
  }
}

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : (firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null);

if (!app && typeof window !== "undefined") {
  console.error("[Firebase] Failed to initialize: No API Key provided.");
}

// Initialize Analytics conditionally (only in browser)
export const initAnalytics = async () => {
  if (typeof window !== "undefined") {
    const supported = await isSupported();
    if (supported) {
      return getAnalytics(app || undefined);
    }
  }
  return null;
};

export const auth = (typeof window !== "undefined" && app) ? getAuth(app || undefined) : null;
export { app };

// Auth Providers
import { GoogleAuthProvider, EmailAuthProvider } from "firebase/auth";
export const googleProvider = new GoogleAuthProvider();
export { EmailAuthProvider };

