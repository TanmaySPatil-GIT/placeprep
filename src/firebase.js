import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// PlacePrep Firebase Configuration
// All values are read from .env (VITE_ prefix required for Vite to expose to client).
// Copy the values from: Firebase Console → Project Settings → General → Your apps → SDK setup.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
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

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
