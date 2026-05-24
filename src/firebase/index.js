import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, doc } from 'firebase/firestore'
import { getStorage, ref } from 'firebase/storage'
import { firebaseConfig, appId } from './config.js'

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId']
const missing = requiredKeys.filter((key) => !firebaseConfig[key])

if (missing.length > 0) {
  // 빌드 시 VITE_FIREBASE_* 변수가 비어 있으면 흰 화면 대신 콘솔에 명확히 남기고
  // 앱 모듈 로드가 죽지 않도록 막는다. (Capacitor 빌드 시 가장 흔한 흰 화면 원인)
  console.error(
    '[firebase] Missing config keys:',
    missing.join(', '),
    '— check Codemagic/Vite env variables (VITE_FIREBASE_*).',
  )
}

let app
try {
  app = getApps()[0] || initializeApp(firebaseConfig)
} catch (error) {
  console.error('[firebase] initializeApp failed:', error)
  // 더미 앱 대신 다시 throw 하지 않고, downstream에서 명확한 에러를 내도록 둔다.
  app = null
}

export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export const storage = app ? getStorage(app) : null
export { appId }

export const getPublicCol = (colName) => {
  if (!db) throw new Error('Firestore is not initialized')
  return collection(db, 'artifacts', appId, 'public', 'data', colName)
}

export const getUserPrivateDoc = (userId, colName, docId) => {
  if (!db) throw new Error('Firestore is not initialized')
  return doc(db, 'artifacts', appId, 'users', userId, colName, docId)
}

export const getProfilePhotoRef = (userId, key) => {
  if (!storage) throw new Error('Storage is not initialized')
  return ref(storage, `artifacts/${appId}/users/${userId}/profile/avatar-${key}`)
}
