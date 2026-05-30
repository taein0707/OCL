import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection } from 'firebase/firestore';
import { getStorage, ref } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app = null;
let auth = null;
let db = null;
let storage = null;

if (isConfigValid) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error);
    app = null;
    auth = null;
    db = null;
    storage = null;
  }
} else {
  console.error(
    '[Firebase] Missing environment variables. ' +
    'Set VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID (and other VITE_FIREBASE_* vars) ' +
    'in your .env file or Vercel project settings.',
  );
}

export { auth, db, storage };

export function getPublicCol(collectionName) {
  if (!db) throw new Error('[Firebase] Firestore is not initialized. Check VITE_FIREBASE_* environment variables.');
  return collection(db, collectionName);
}

export function getProfilePhotoRef(uid, key) {
  if (!storage) throw new Error('[Firebase] Storage is not initialized. Check VITE_FIREBASE_* environment variables.');
  return ref(storage, `users/${uid}/avatar-${key}`);
}
