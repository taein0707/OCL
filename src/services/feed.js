import { getTimestampMillis } from '../utils/index.js'

const SEEN_POSTS_KEY = 'ocl:feed:seen-posts'
const MAX_SEEN_ENTRIES = 600

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function namespacedKey(uid) {
  return uid ? `${SEEN_POSTS_KEY}:${uid}` : SEEN_POSTS_KEY
}

function readMap(uid) {
  if (!canUseStorage()) return {}
  try {
    const raw = window.localStorage.getItem(namespacedKey(uid))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeMap(uid, map) {
  if (!canUseStorage()) return
  try {
    const entries = Object.entries(map)
    let trimmed = map
    if (entries.length > MAX_SEEN_ENTRIES) {
      const sorted = entries.sort((a, b) => b[1] - a[1]).slice(0, MAX_SEEN_ENTRIES)
      trimmed = Object.fromEntries(sorted)
    }
    window.localStorage.setItem(namespacedKey(uid), JSON.stringify(trimmed))
  } catch {
    /* ignore quota errors */
  }
}

export function getSeenPostMap(uid) {
  return readMap(uid)
}

export function markPostSeen(uid, postId) {
  if (!postId) return
  const map = readMap(uid)
  map[postId] = Date.now()
  writeMap(uid, map)
}

export function isPostSeen(uid, postId) {
  if (!postId) return false
  const map = readMap(uid)
  return Boolean(map[postId])
}

export function clearSeenPosts(uid) {
  if (!canUseStorage()) return
  window.localStorage.removeItem(namespacedKey(uid))
}

function matchScore(post, interests) {
  if (!interests || interests.length === 0) return 0
  const haystack = [post.title, post.content, post.board, ...(post.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  let hits = 0
  for (const term of interests) {
    const t = String(term || '').toLowerCase().trim()
    if (t && haystack.includes(t)) hits += 1
  }
  return hits
}

function recencyBonus(post) {
  const ageMs = Math.max(0, Date.now() - getTimestampMillis(post.createdAt))
  const ageHours = ageMs / (1000 * 60 * 60)
  if (ageHours < 6) return 6
  if (ageHours < 24) return 3
  if (ageHours < 72) return 1
  return 0
}

export function scorePost(post, { seenMap = {}, interests = [] } = {}) {
  const vibes = Number(post.vibes ?? post.likes ?? 0)
  const comments = Number(post.comments ?? 0)
  const base = vibes * 2 + comments * 3
  const interest = matchScore(post, interests) * 5
  const recency = recencyBonus(post)
  const seenPenalty = seenMap[post.id] ? 1000 : 0
  return base + interest + recency - seenPenalty
}

export function buildRecommendedFeed(
  posts,
  { uid, interests = [], hideSeen = true } = {},
) {
  const seenMap = readMap(uid)
  const enriched = posts.map((post) => ({
    post,
    score: scorePost(post, { seenMap, interests }),
    seen: Boolean(seenMap[post.id]),
  }))

  const visible = hideSeen ? enriched.filter((entry) => !entry.seen) : enriched
  const ordered = (visible.length ? visible : enriched).sort((a, b) => b.score - a.score)
  return ordered.map((entry) => entry.post)
}

export function collectInterestTerms(profile) {
  if (!profile) return []
  const list = []
  if (Array.isArray(profile.selectedBoards)) list.push(...profile.selectedBoards)
  if (Array.isArray(profile.interests)) list.push(...profile.interests)
  if (Array.isArray(profile.recentSearches)) list.push(...profile.recentSearches)
  return Array.from(new Set(list.filter(Boolean)))
}
