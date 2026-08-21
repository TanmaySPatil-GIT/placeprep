import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// PlacePrep Firebase Configuration
// All values are read from .env (VITE_ prefix required for Vite to expose to client).
// Copy the values from: Firebase Console → Project Settings → General → Your apps → SDK setup.
const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta?.env?.[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process?.env?.[key]) {
    return process.env[key];
  }
  return undefined;
};

const firebaseConfig = {
  apiKey:            getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain:        getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId:         getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket:     getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId:             getEnvVar('VITE_FIREBASE_APP_ID'),
};

// Runtime guard — fires before initializeApp so you get a clear message
// instead of Firebase's cryptic "auth/api-key-not-valid" error.
if (!firebaseConfig.apiKey) {
  console.warn(
    '[PlacePrep] Firebase config is missing.\n' +
    'Fill in the VITE_FIREBASE_* keys in your .env file, then restart the dev server.\n' +
    'Get the values from: Firebase Console → Project Settings → General → Your apps.'
  );
}

let app = null;
let auth = null;
let db = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_firebase_api_key_here') {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    if (typeof window !== 'undefined') {
      setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn('[PlacePrep] Could not set browser local persistence:', err.message);
      });
    }
    db = getFirestore(app);
  } else {
    console.warn('[PlacePrep] Firebase API key missing or placeholder. Running in mock/offline mode.');
  }
} catch (err) {
  console.warn('[PlacePrep] Firebase initialization notice:', err.message);
}

export { auth, db };
export default app;
