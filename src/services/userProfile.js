import { deleteObject, getDownloadURL, uploadBytes } from 'firebase/storage'
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore'
import { db, getPublicCol, getProfilePhotoRef } from '../firebase/index.js'
import { DEFAULT_APP_SETTINGS } from '../constants/appSettings.js'

export function userDocRef(uid) {
  return doc(getPublicCol('users'), uid)
}

export async function getUserProfile(uid) {
  const snap = await getDoc(userDocRef(uid))
  return snap.exists() ? { uid, ...snap.data() } : null
}

export async function getPublicProfileByUid(uid) {
  return getUserProfile(uid)
}

export async function saveUserProfile(uid, data) {
  await setDoc(
    userDocRef(uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

export async function uploadUserProfilePhoto(uid, file, previousPhoto = null) {
  const key = Date.now()
  const photoRef = getProfilePhotoRef(uid, key)
  await uploadBytes(photoRef, file, {
    contentType: file.type,
  })
  const url = await getDownloadURL(photoRef)
  const profilePhoto = { url, path: photoRef.fullPath }
  await saveUserProfile(uid, { profilePhoto })

  if (previousPhoto?.path && previousPhoto.path !== photoRef.fullPath) {
    await deleteObject(getProfilePhotoRef(uid, previousPhoto.path.split('avatar-').pop())).catch(() => {})
  }

  return profilePhoto
}

export async function removeUserProfilePhoto(uid, currentPhoto = null) {
  if (currentPhoto?.path) {
    const key = currentPhoto.path.split('avatar-').pop()
    await deleteObject(getProfilePhotoRef(uid, key)).catch(() => {})
  }
  await saveUserProfile(uid, { profilePhoto: null })
}

export async function ensureUserProfile(uid, partial = {}) {
  const existing = await getUserProfile(uid)
  if (existing) return existing

  const created = {
    id: partial.id || '',
    nickname: partial.nickname || '',
    onboardingComplete: false,
    appSettings: {
      ...DEFAULT_APP_SETTINGS,
      ...(partial.appSettings || {}),
    },
    selectedBoards: [],
    profilePhoto: null,
    createdAt: serverTimestamp(),
    ...partial,
  }
  await setDoc(userDocRef(uid), created)
  return { uid, ...created }
}

export function isOnboardingDone(profile) {
  if (!profile) return false
  return Boolean(profile.onboardingComplete)
}

export async function reportPost({ reporterUid, reportedUid, reportedNickname, school, postId, reason, detail = '' }) {
  if (!db) return
  await addDoc(collection(db, 'reports'), {
    targetId: postId || '',
    targetType: '게시글',
    reporterUid: reporterUid || '',
    reportedUid: reportedUid || '',
    reportedNickname: reportedNickname || '',
    school: school ? { id: String(school.id || ''), name: String(school.name || '') } : null,
    reason: reason || '',
    detail: detail || '',
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

export async function searchUsersInFirestore(term) {
  if (!term || !db) return []
  const clean = (term.startsWith('@') ? term.slice(1) : term).trim()
  if (!clean) return []
  const end = clean + ''
  const usersCol = getPublicCol('users')
  try {
    const [byNickname, byId] = await Promise.all([
      getDocs(query(usersCol, where('nickname', '>=', clean), where('nickname', '<=', end), limit(12))),
      getDocs(query(usersCol, where('id', '>=', clean), where('id', '<=', end), limit(12))),
    ])
    const map = new Map()
    byNickname.docs.forEach((d) => map.set(d.id, { uid: d.id, ...d.data() }))
    byId.docs.forEach((d) => map.set(d.id, { uid: d.id, ...d.data() }))
    return Array.from(map.values())
  } catch {
    return []
  }
}

export async function logUserChange({ uid, previousNickname, nextNickname, previousId, nextId }) {
  if (!db) return
  await addDoc(collection(db, 'user_logs'), {
    uid: uid || '',
    previousNickname: previousNickname || '',
    nextNickname: nextNickname || '',
    previousId: previousId || '',
    nextId: nextId || '',
    timestamp: serverTimestamp(),
  })
}
