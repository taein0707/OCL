import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, doc } from 'firebase/firestore'
import { getStorage, ref } from 'firebase/storage'
import { firebaseConfig, appId } from './config.js'

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export { appId }

export const getPublicCol = (colName) =>
  collection(db, 'artifacts', appId, 'public', 'data', colName)

export const getUserPrivateDoc = (userId, colName, docId) =>
  doc(db, 'artifacts', appId, 'users', userId, colName, docId)

export const getProfilePhotoRef = (userId, key) =>
  ref(storage, `artifacts/${appId}/users/${userId}/profile/avatar-${key}`)
