import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyAwz70YD9mgkrEEZFdv7YTAWqeqg7LXKO4",
  authDomain: "smartnote-13b7b.firebaseapp.com",
  projectId: "smartnote-13b7b",
  storageBucket: "smartnote-13b7b.appspot.com",
  appId: "1:81954195843:web:324c3e8d95eff8aca40eb6",
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)