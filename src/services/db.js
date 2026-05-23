import { db, getPublicCol } from '../firebase/index.js'
import {
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  collection,
} from 'firebase/firestore'

// ── Collections ───────────────────────────────────────────────────────────────
// All collections live under: artifacts/{appId}/public/data/{colName}
const postsCol = () => getPublicCol('posts')
const boardsCol = () => getPublicCol('boards')
const usersCol = () => getPublicCol('users')

// ── Posts ─────────────────────────────────────────────────────────────────────

export async function dbCreatePost(data) {
  const ref = await addDoc(postsCol(), {
    ...data,
    createdAt: serverTimestamp(),
    vibes: 0,
  })
  return { id: ref.id, ...data }
}

export async function dbGetPost(postId) {
  const snap = await getDoc(doc(postsCol(), postId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function dbListPosts({ boardId = null, maxResults = 50 } = {}) {
  let q = query(postsCol(), orderBy('createdAt', 'desc'), limit(maxResults))
  if (boardId) q = query(postsCol(), where('board', '==', boardId), orderBy('createdAt', 'desc'), limit(maxResults))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function dbUpdatePost(postId, data) {
  await updateDoc(doc(postsCol(), postId), data)
}

export async function dbDeletePost(postId) {
  await deleteDoc(doc(postsCol(), postId))
}

// ── Boards ────────────────────────────────────────────────────────────────────

export async function dbCreateBoard(data) {
  const id = data.id || data.name?.replace(/\s+/g, '-').toLowerCase()
  await setDoc(doc(boardsCol(), id), {
    ...data,
    createdAt: serverTimestamp(),
    memberCount: 0,
  })
  return { id, ...data }
}

export async function dbGetBoard(boardId) {
  const snap = await getDoc(doc(boardsCol(), boardId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function dbListBoards() {
  const snap = await getDocs(boardsCol())
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function dbUpdateBoard(boardId, data) {
  await updateDoc(doc(boardsCol(), boardId), data)
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function dbGetUser(userId) {
  const snap = await getDoc(doc(usersCol(), userId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function dbSaveUser(userId, data) {
  await setDoc(doc(usersCol(), userId), data, { merge: true })
  return { id: userId, ...data }
}

export async function dbListUsers({ maxResults = 100 } = {}) {
  const snap = await getDocs(query(usersCol(), limit(maxResults)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function dbDeleteUser(userId) {
  await deleteDoc(doc(usersCol(), userId))
}
