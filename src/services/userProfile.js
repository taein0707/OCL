import { deleteObject, getDownloadURL, uploadBytes } from 'firebase/storage'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
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
