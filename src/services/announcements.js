import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/index.js'

export async function getRecentAnnouncements(maxCount = 5) {
  if (!db) return []
  try {
    const snap = await getDocs(
      query(
        collection(db, 'announcements'),
        where('status', '==', 'sent'),
        orderBy('createdAt', 'desc'),
        limit(maxCount),
      ),
    )
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch {
    return []
  }
}
