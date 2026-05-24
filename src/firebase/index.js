import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 필수 변수 검증 생성
const isConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app;
let auth = null;
let db = null;
let storage = null;

if (isConfigValid) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Capacitor iOS 세션 유지 및 로딩 에러 방지 방어 코드
    if (getApps().length === 0) {
      auth = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence]
      });
    } else {
      auth = getAuth(app);
    }
    
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase Initialization Critical Error:", error);
  }
} else {
  console.error("🚨 Critical Alert: Firebase environment variables are missing!");
}

export { auth, db, storage, isConfigValid };