import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase/index.js'

export async function getRecentAnnouncements(maxCount = 5) {
  if (!db) return []
  try {
    // No where() clause — avoids composite index requirement.
    // Admin only ever sets status='sent', so all docs are publishable.
    const snap = await getDocs(
      query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc'),
        limit(maxCount),
      ),
    )
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }))
  } catch (err) {
    console.warn('[announcements] fetch failed:', err?.message)
    return []
  }
}
