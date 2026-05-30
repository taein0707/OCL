/**
 * Module-level author profile cache with per-uid subscriptions.
 *
 * Why module-level (not React state)?
 * If the cache lives in React context state, ANY uid resolving causes
 * ALL useAuthor() consumers to re-render simultaneously — this is the
 * main cause of feed flickering. With a module store + per-uid subscriptions,
 * only the component that displays uid X re-renders when X's profile loads.
 */
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/index.js'

// ─── Module-level store ──────────────────────────────────────────────────────
const _store = Object.create(null)   // uid → profile | null
const _pending = new Set()           // uids currently in-flight
const _queue = new Set()             // uids batched for next tick
const _subs = Object.create(null)    // uid → Set<(profile) => void>
let _timer = null

function _notify(uid) {
  _subs[uid]?.forEach((fn) => fn(_store[uid]))
}

function _subscribe(uid, fn) {
  if (!_subs[uid]) _subs[uid] = new Set()
  _subs[uid].add(fn)
  return () => { _subs[uid]?.delete(fn) }
}

async function _flush() {
  const uids = Array.from(_queue)
  _queue.clear()
  if (!uids.length || !db) return

  await Promise.all(
    uids.map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, 'users', uid))
        _store[uid] = snap.exists()
          ? {
              uid,
              nickname: snap.data().nickname || null,
              profilePhoto: snap.data().profilePhoto || null,
              id: snap.data().id || null,
              intro: snap.data().intro || null,
            }
          : null
      } catch {
        _store[uid] = null
      } finally {
        _pending.delete(uid)
        _notify(uid)
      }
    }),
  )
}

function _request(uid) {
  if (!uid || uid in _store || _pending.has(uid)) return
  _queue.add(uid)
  _pending.add(uid)
  clearTimeout(_timer)
  _timer = setTimeout(_flush, 0)
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Called by AuthContext whenever the current user's profile changes.
 * Directly updates the store and notifies only components showing that uid.
 */
export function seedAuthor(uid, data) {
  if (!uid || !data) return
  _store[uid] = { uid, ..._store[uid], ...data }
  _notify(uid)
}

/**
 * AuthorCacheProvider is kept as a passthrough for backward compatibility.
 * All state now lives at module level — no React context required.
 */
export function AuthorCacheProvider({ children }) {
  return children
}

// Thin hook for components that still call useAuthorCache()
export const useAuthorCache = () => null

/**
 * Returns the live author profile for a uid.
 * Re-renders ONLY when THIS specific uid's profile changes.
 *
 *   undefined → still loading
 *   null      → anonymous / user deleted / uid was falsy
 *   object    → { uid, nickname, profilePhoto, id, intro }
 */
export function useAuthor(uid) {
  const [profile, setProfile] = useState(() =>
    uid ? (uid in _store ? _store[uid] : undefined) : null,
  )

  useEffect(() => {
    if (!uid) {
      setProfile(null)
      return
    }

    // Sync with current store state immediately
    if (uid in _store) {
      setProfile(_store[uid])
    } else {
      setProfile(undefined)
      _request(uid)
    }

    // Subscribe to future updates for this uid (covers seedAuthor calls too)
    return _subscribe(uid, setProfile)
  }, [uid])

  return profile
}
