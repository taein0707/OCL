import {
  collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc,
  query, where, updateDoc, runTransaction, increment,
  serverTimestamp, limit as fsLimit, onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase/index.js'
import { getRegionFromAddress, getTimestampMillis } from '../utils/index.js'
import { dispatchLocalNotification, NOTIF_TEMPLATES, shouldTriggerVibeMilestone } from '../utils/notifications.js'

// ─── Helpers ────────────────────────────────────────────────────────────────

function toISO(ts) {
  if (!ts) return new Date().toISOString()
  if (ts?.toDate) return ts.toDate().toISOString()
  return String(ts)
}

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)))
}

function pairKey(a, b) {
  return [a, b].sort().join('::')
}

function normalizePost(data, id) {
  const vibeCount = Number(data.vibeCount ?? data.likes ?? 0)
  return {
    id: id || data.id,
    type: data.type || 'community',
    board: data.board || '자유',
    title: data.title || '제목 없는 글',
    content: data.content || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    // author/authorPhotoURL are stored only as deleted-user fallbacks.
    // Live rendering must use useAuthor(ownerUid) from AuthorCacheContext.
    author: data.isAnonymous ? '익명' : data.author || '익명',
    authorId: data.isAnonymous ? null : data.authorId || null,
    ownerUid: data.ownerUid || null,
    isAnonymous: Boolean(data.isAnonymous),
    likes: vibeCount,
    vibes: vibeCount,
    comments: Number(data.commentCount ?? data.comments ?? 0),
    createdAt: toISO(data.createdAt),
    schoolName: data.schoolName || '우리 커뮤니티',
    schoolRegion: data.schoolRegion || '',
    vibed: Boolean(data.vibed),
    liked: Boolean(data.vibed),
    // media
    mediaItems: Array.isArray(data.mediaItems) ? data.mediaItems : [],
    // poll
    pollOptions: Array.isArray(data.pollOptions) ? data.pollOptions : undefined,
    totalVotes: data.totalVotes !== undefined ? Number(data.totalVotes) : undefined,
    // Q&A
    solved: data.solved !== undefined ? Boolean(data.solved) : undefined,
    acceptedCommentId: data.acceptedCommentId || null,
  }
}

async function getVibedPostIds(uid) {
  if (!db || !uid) return new Set()
  try {
    const snap = await getDocs(query(collection(db, 'vibes'), where('userId', '==', uid)))
    return new Set(snap.docs.map((d) => d.data().postId))
  } catch {
    return new Set()
  }
}

// ─── Community posts ─────────────────────────────────────────────────────────

export async function getCommunityPosts(profile) {
  if (!db) return []
  try {
    const uid = profile?.uid || null
    const [snap, vibedIds] = await Promise.all([
      getDocs(query(collection(db, 'posts'), where('type', 'in', ['community', 'poll', 'question']), fsLimit(120))),
      getVibedPostIds(uid),
    ])
    return snap.docs
      .map((d) => normalizePost({ ...d.data(), vibed: vibedIds.has(d.id) }, d.id))
      .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))
  } catch (err) {
    console.warn('[community] getCommunityPosts failed:', err)
    return []
  }
}

export const getCommunityFlows = getCommunityPosts

export function getCommunityBoards(profile) {
  const selected = profile?.selectedBoards || []
  return uniq(['자유', '질문', '공부', '급식', ...selected])
}

export function createCommunityBoard(name) {
  const trimmed = (name || '').trim().replace(/\s+/g, ' ')
  if (!trimmed) throw new Error('게시판 이름을 입력해 주세요.')
  return trimmed
}

export async function createCommunityPost(payload, profile) {
  if (!db) throw new Error('Firebase가 초기화되지 않았습니다.')
  const board = payload.board?.trim() || '자유'
  const anonymous = Boolean(payload.anonymous)
  const ownerUid = profile?.uid || 'local-user'
  const post = {
    type: 'community',
    board,
    title: payload.title?.trim() || '제목 없는 글',
    content: payload.content?.trim() || '',
    author: anonymous ? '익명' : profile?.nickname || '나',
    authorId: anonymous ? null : ownerUid,
    ownerUid,
    isAnonymous: anonymous,
    vibeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    schoolName: profile?.school?.name || '우리 커뮤니티',
    schoolRegion: getRegionFromAddress(profile?.school?.address),
    schoolId: profile?.school?.id ? String(profile.school.id) : null,
    tags: uniq([board, payload.tag || 'NOW']),
    mediaItems: Array.isArray(payload.mediaItems) ? payload.mediaItems : [],
  }
  const ref = await addDoc(collection(db, 'posts'), post)
  return normalizePost({ ...post, createdAt: new Date().toISOString() }, ref.id)
}

export async function createPollPost(payload, profile) {
  if (!db) throw new Error('Firebase가 초기화되지 않았습니다.')
  const validOptions = (payload.options || []).filter((o) => o.trim())
  if (!payload.question?.trim()) throw new Error('질문을 입력해 주세요.')
  if (validOptions.length < 2) throw new Error('선택지를 2개 이상 입력해 주세요.')
  const anonymous = Boolean(payload.anonymous)
  const ownerUid = profile?.uid || 'local-user'
  const post = {
    type: 'poll',
    board: payload.board?.trim() || '투표',
    title: payload.question.trim(),
    content: payload.description?.trim() || '',
    author: anonymous ? '익명' : profile?.nickname || '나',
    authorId: anonymous ? null : ownerUid,
    ownerUid,
    isAnonymous: anonymous,
    pollOptions: validOptions.map((text) => ({ text: text.trim(), voteCount: 0 })),
    totalVotes: 0,
    vibeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    schoolName: profile?.school?.name || '우리 커뮤니티',
    schoolRegion: getRegionFromAddress(profile?.school?.address),
    schoolId: profile?.school?.id ? String(profile.school.id) : null,
    tags: uniq([payload.board || '투표', 'POLL']),
    mediaItems: [],
  }
  const ref = await addDoc(collection(db, 'posts'), post)
  return normalizePost({ ...post, createdAt: new Date().toISOString() }, ref.id)
}

export async function createQuestionPost(payload, profile) {
  if (!db) throw new Error('Firebase가 초기화되지 않았습니다.')
  if (!payload.title?.trim()) throw new Error('질문 제목을 입력해 주세요.')
  const anonymous = Boolean(payload.anonymous)
  const ownerUid = profile?.uid || 'local-user'
  const post = {
    type: 'question',
    board: payload.board?.trim() || 'Q&A',
    title: payload.title.trim(),
    content: payload.content?.trim() || '',
    author: anonymous ? '익명' : profile?.nickname || '나',
    authorId: anonymous ? null : ownerUid,
    ownerUid,
    isAnonymous: anonymous,
    solved: false,
    acceptedCommentId: null,
    vibeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    schoolName: profile?.school?.name || '우리 커뮤니티',
    schoolRegion: getRegionFromAddress(profile?.school?.address),
    schoolId: profile?.school?.id ? String(profile.school.id) : null,
    tags: uniq([payload.board || 'Q&A', 'QUESTION']),
    mediaItems: Array.isArray(payload.mediaItems) ? payload.mediaItems : [],
  }
  const ref = await addDoc(collection(db, 'posts'), post)
  return normalizePost({ ...post, createdAt: new Date().toISOString() }, ref.id)
}

export async function votePoll(postId, optionIndex, uid) {
  if (!db || !uid || !postId) return
  const voteId = `${uid}_${postId}`
  const voteRef = doc(db, 'pollVotes', voteId)
  const postRef = doc(db, 'posts', postId)
  try {
    await runTransaction(db, async (tx) => {
      const [voteDoc, postDoc] = await Promise.all([tx.get(voteRef), tx.get(postRef)])
      if (voteDoc.exists() || !postDoc.exists()) return
      const opts = [...(postDoc.data().pollOptions || [])]
      if (optionIndex < 0 || optionIndex >= opts.length) return
      opts[optionIndex] = { ...opts[optionIndex], voteCount: (opts[optionIndex].voteCount || 0) + 1 }
      tx.set(voteRef, { postId, userId: uid, optionIndex, createdAt: serverTimestamp() })
      tx.update(postRef, { pollOptions: opts, totalVotes: increment(1) })
    })
  } catch (err) {
    console.warn('[community] votePoll failed:', err)
  }
}

export async function getUserPollVote(postId, uid) {
  if (!db || !uid || !postId) return null
  try {
    const snap = await getDoc(doc(db, 'pollVotes', `${uid}_${postId}`))
    return snap.exists() ? snap.data().optionIndex : null
  } catch {
    return null
  }
}

export async function acceptAnswer(postId, commentId, ownerUid) {
  if (!db || !ownerUid) return false
  try {
    await Promise.all([
      updateDoc(doc(db, 'posts', postId), { solved: true, acceptedCommentId: commentId }),
      updateDoc(doc(db, 'posts', postId, 'comments', commentId), { isAccepted: true }),
    ])
    return true
  } catch (err) {
    console.warn('[community] acceptAnswer failed:', err)
    return false
  }
}

export async function createBoard(payload, profile) {
  if (!db) throw new Error('Firebase가 초기화되지 않았습니다.')
  const name = payload.name?.trim() || ''
  if (!name) throw new Error('게시판 이름을 입력해 주세요.')
  const board = {
    name,
    description: payload.description?.trim() || '',
    isPublic: payload.isPublic !== false,
    schoolRestricted: Boolean(payload.schoolRestricted),
    schoolId: payload.schoolRestricted && profile?.school
      ? String(profile.school.id || profile.school.name)
      : null,
    createdBy: profile?.uid || null,
    createdAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, 'boards'), board)
  return { id: ref.id, ...board, createdAt: new Date().toISOString() }
}

export async function toggleCommunityPostVibe(postId, profile) {
  if (!db || !profile?.uid || !postId) return null
  const uid = profile.uid
  const vibeId = `${uid}_${postId}`
  const vibeRef = doc(db, 'vibes', vibeId)
  const postRef = doc(db, 'posts', postId)
  let isVibedNow = false

  try {
    await runTransaction(db, async (tx) => {
      const [vibeDoc, postDoc] = await Promise.all([tx.get(vibeRef), tx.get(postRef)])
      if (!postDoc.exists()) return
      if (vibeDoc.exists()) {
        tx.delete(vibeRef)
        tx.update(postRef, { vibeCount: increment(-1) })
        isVibedNow = false
      } else {
        tx.set(vibeRef, { postId, userId: uid, createdAt: serverTimestamp() })
        tx.update(postRef, { vibeCount: increment(1) })
        isVibedNow = true
      }
    })

    if (isVibedNow) {
      const postSnap = await getDoc(postRef)
      if (postSnap.exists()) {
        const count = postSnap.data().vibeCount || 0
        if (shouldTriggerVibeMilestone(count - 1, count)) {
          dispatchLocalNotification(NOTIF_TEMPLATES.vibeMilestone(count))
        }
      }
    }
  } catch (err) {
    console.warn('[community] toggleVibe failed:', err)
  }
  return null
}

export const toggleCommunityPostLike = toggleCommunityPostVibe

// ─── School posts ─────────────────────────────────────────────────────────────

export async function getSchoolPosts(profile) {
  if (!db || !profile?.school) return []
  const schoolId = String(profile.school.id || profile.school.name || '')
  if (!schoolId) return []
  try {
    const uid = profile?.uid || null
    const [snap, vibedIds] = await Promise.all([
      getDocs(query(
        collection(db, 'posts'),
        where('type', '==', 'school'),
        where('schoolId', '==', schoolId),
        fsLimit(80),
      )),
      getVibedPostIds(uid),
    ])
    return snap.docs
      .map((d) => normalizePost({ ...d.data(), vibed: vibedIds.has(d.id) }, d.id))
      .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))
  } catch (err) {
    console.warn('[community] getSchoolPosts failed:', err)
    return []
  }
}

export async function createSchoolPost(payload, profile) {
  if (!db) throw new Error('Firebase가 초기화되지 않았습니다.')
  if (!profile?.school) throw new Error('학교 정보가 필요합니다.')
  const anonymous = Boolean(payload.anonymous)
  const ownerUid = profile?.uid || 'local-user'
  const schoolId = String(profile.school.id || profile.school.name || '')
  const post = {
    type: 'school',
    board: '학우 게시판',
    title: payload.title?.trim() || '제목 없는 글',
    content: payload.content?.trim() || '',
    author: anonymous ? '익명' : profile?.nickname || '나',
    authorId: anonymous ? null : ownerUid,
    ownerUid,
    authorPhotoURL: anonymous ? null : profile?.profilePhoto?.url || null,
    isAnonymous: anonymous,
    vibeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    schoolName: profile.school.name || '우리 학교',
    schoolRegion: getRegionFromAddress(profile.school.address),
    schoolId,
    grade: null,
    classNum: null,
    tags: ['학우 게시판'],
  }
  const ref = await addDoc(collection(db, 'posts'), post)
  return normalizePost({ ...post, createdAt: new Date().toISOString() }, ref.id)
}

// ─── Class posts ─────────────────────────────────────────────────────────────

export async function getClassPosts(profile) {
  if (!db || !profile?.grade || !profile?.classNum) return []
  const schoolId = String(profile?.school?.id || profile?.school?.name || '')
  if (!schoolId) return []
  try {
    const uid = profile?.uid || null
    const [snap, vibedIds] = await Promise.all([
      getDocs(query(
        collection(db, 'posts'),
        where('type', '==', 'class'),
        where('schoolId', '==', schoolId),
        where('grade', '==', profile.grade),
        where('classNum', '==', profile.classNum),
        fsLimit(80),
      )),
      getVibedPostIds(uid),
    ])
    return snap.docs
      .map((d) => normalizePost({ ...d.data(), vibed: vibedIds.has(d.id) }, d.id))
      .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))
  } catch (err) {
    console.warn('[community] getClassPosts failed:', err)
    return []
  }
}

export async function createClassPost(payload, profile) {
  if (!db) throw new Error('Firebase가 초기화되지 않았습니다.')
  if (!profile?.grade || !profile?.classNum) throw new Error('학년/반 정보가 필요합니다.')
  const anonymous = Boolean(payload.anonymous)
  const ownerUid = profile?.uid || 'local-user'
  const schoolId = String(profile?.school?.id || profile?.school?.name || 'unknown')
  const post = {
    type: 'class',
    board: '우리 반 친구들 목록',
    title: payload.title?.trim() || '제목 없는 글',
    content: payload.content?.trim() || '',
    author: anonymous ? '익명' : profile?.nickname || '나',
    authorId: anonymous ? null : ownerUid,
    ownerUid,
    authorPhotoURL: anonymous ? null : profile?.profilePhoto?.url || null,
    isAnonymous: anonymous,
    vibeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    schoolName: profile?.school?.name || '우리 반',
    schoolRegion: getRegionFromAddress(profile?.school?.address),
    schoolId,
    grade: profile.grade,
    classNum: profile.classNum,
    tags: ['우리 반 친구들 목록'],
  }
  const ref = await addDoc(collection(db, 'posts'), post)
  return normalizePost({ ...post, createdAt: new Date().toISOString() }, ref.id)
}

// ─── Comments ────────────────────────────────────────────────────────────────

export async function getPostById(postId) {
  if (!db || !postId) return null
  try {
    const snap = await getDoc(doc(db, 'posts', postId))
    if (!snap.exists()) return null
    return normalizePost(snap.data(), snap.id)
  } catch (err) {
    console.warn('[community] getPostById failed:', err)
    return null
  }
}

// Returns an unsubscribe function. Calls onPost(post) on every update;
// calls onPost(null) when the document is deleted.
export function subscribeToPost(postId, onPost) {
  if (!db || !postId) return () => {}
  return onSnapshot(
    doc(db, 'posts', postId),
    (snap) => {
      onPost(snap.exists() ? normalizePost(snap.data(), snap.id) : null)
    },
    (err) => {
      console.warn('[community] subscribeToPost error:', err)
      onPost(null)
    },
  )
}

export async function getComments(postId) {
  if (!db || !postId) return []
  try {
    const snap = await getDocs(collection(db, 'posts', postId, 'comments'))
    return snap.docs
      .map((d) => ({
        id: d.id,
        postId,
        ...d.data(),
        createdAt: toISO(d.data().createdAt),
        replies: (d.data().replies || []).map((r) => ({ ...r, createdAt: toISO(r.createdAt) })),
      }))
      .sort((a, b) => getTimestampMillis(a.createdAt) - getTimestampMillis(b.createdAt))
  } catch (err) {
    console.warn('[community] getComments failed:', err)
    return []
  }
}

export async function addComment(postId, { authorUid, authorNickname, authorPhotoURL, isAnonymous, content }) {
  if (!db) return []
  try {
    await addDoc(collection(db, 'posts', postId, 'comments'), {
      postId,
      authorUid,
      authorNickname,
      authorPhotoURL: isAnonymous ? null : authorPhotoURL || null,
      isAnonymous: Boolean(isAnonymous),
      content,
      createdAt: serverTimestamp(),
      replies: [],
    })
    await updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) })
  } catch (err) {
    console.warn('[community] addComment failed:', err)
  }
  return getComments(postId)
}

export async function addReply(postId, commentId, { authorUid, authorNickname, authorPhotoURL, isAnonymous, content }) {
  if (!db) return []
  const reply = {
    id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    commentId,
    authorUid,
    authorNickname,
    authorPhotoURL: isAnonymous ? null : authorPhotoURL || null,
    isAnonymous: Boolean(isAnonymous),
    content,
    createdAt: new Date().toISOString(),
  }
  try {
    const commentRef = doc(db, 'posts', postId, 'comments', commentId)
    const snap = await getDoc(commentRef)
    await updateDoc(commentRef, { replies: [...(snap.data()?.replies || []), reply] })
  } catch (err) {
    console.warn('[community] addReply failed:', err)
  }
  return getComments(postId)
}

// ─── Profile posts ────────────────────────────────────────────────────────────

export async function getPostsByOwner(ownerUid, profile) {
  if (!db || !ownerUid) return []
  try {
    const uid = profile?.uid || null
    const [snap, vibedIds] = await Promise.all([
      getDocs(query(collection(db, 'posts'), where('ownerUid', '==', ownerUid), fsLimit(60))),
      getVibedPostIds(uid),
    ])
    return snap.docs
      .map((d) => normalizePost({ ...d.data(), vibed: vibedIds.has(d.id) }, d.id))
      .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))
  } catch (err) {
    console.warn('[community] getPostsByOwner failed:', err)
    return []
  }
}

export async function getPostsForProfileView(targetUid, viewerUid, profile) {
  const posts = await getPostsByOwner(targetUid, profile)
  if (viewerUid === targetUid) return posts
  return posts.filter((post) => !post.isAnonymous)
}

// ─── Relationships ────────────────────────────────────────────────────────────

async function findRelationship(aUid, bUid) {
  if (!db || !aUid || !bUid) return null
  const [sortedA, sortedB] = pairKey(aUid, bUid).split('::')
  try {
    const snap = await getDocs(query(
      collection(db, 'relationships'),
      where('userAUid', '==', sortedA),
      where('userBUid', '==', sortedB),
    ))
    if (snap.empty) return null
    const d = snap.docs[0]
    const data = d.data()
    return {
      id: d.id,
      userAUid: data.userAUid,
      userBUid: data.userBUid,
      status: data.status || 'friends',
      requestedByUid: data.requestedByUid,
      approvalPendingForUid: data.approvalPendingForUid || null,
      createdAt: toISO(data.createdAt),
      approvedAt: data.approvedAt ? toISO(data.approvedAt) : null,
      respondedAt: data.respondedAt ? toISO(data.respondedAt) : null,
    }
  } catch (err) {
    console.warn('[community] findRelationship failed:', err)
    return null
  }
}

async function fetchRelationshipsByUser(uid) {
  if (!db || !uid) return []
  try {
    const [snapA, snapB] = await Promise.all([
      getDocs(query(collection(db, 'relationships'), where('userAUid', '==', uid))),
      getDocs(query(collection(db, 'relationships'), where('userBUid', '==', uid))),
    ])
    const map = new Map()
    ;[...snapA.docs, ...snapB.docs].forEach((d) => {
      if (map.has(d.id)) return
      const data = d.data()
      map.set(d.id, {
        id: d.id,
        userAUid: data.userAUid,
        userBUid: data.userBUid,
        status: data.status || 'friends',
        requestedByUid: data.requestedByUid,
        approvalPendingForUid: data.approvalPendingForUid || null,
        createdAt: toISO(data.createdAt),
        approvedAt: data.approvedAt ? toISO(data.approvedAt) : null,
        respondedAt: data.respondedAt ? toISO(data.respondedAt) : null,
      })
    })
    return Array.from(map.values())
  } catch (err) {
    console.warn('[community] fetchRelationships failed:', err)
    return []
  }
}

export async function getRelationshipState(viewerUid, targetUid) {
  if (!viewerUid || !targetUid) return { status: 'none', relationship: null }
  if (viewerUid === targetUid) return { status: 'self', relationship: null }
  const relationship = await findRelationship(viewerUid, targetUid)
  if (!relationship) return { status: 'none', relationship: null }
  if (relationship.approvalPendingForUid === viewerUid) return { status: 'incoming_approval', relationship }
  if (relationship.approvalPendingForUid === targetUid && relationship.requestedByUid === viewerUid) return { status: 'outgoing_pending', relationship }
  return { status: 'friends', relationship }
}

export async function sendFriendRequest(viewerUid, targetUid, profile) {
  if (!db || !viewerUid || !targetUid || viewerUid === targetUid) return getRelationshipState(viewerUid, targetUid)
  const existing = await findRelationship(viewerUid, targetUid)
  if (existing) return getRelationshipState(viewerUid, targetUid)

  const [sortedA, sortedB] = pairKey(viewerUid, targetUid).split('::')
  const relationshipId = `relationship-${sortedA}-${sortedB}`
  try {
    await setDoc(doc(db, 'relationships', relationshipId), {
      userAUid: sortedA, userBUid: sortedB,
      status: 'friends', requestedByUid: viewerUid,
      approvalPendingForUid: targetUid,
      createdAt: serverTimestamp(), approvedAt: null, respondedAt: null,
    })
    await addDoc(collection(db, 'friendNotifications'), {
      type: 'friend-approval', recipientUid: targetUid, requesterUid: viewerUid,
      requesterNickname: profile?.nickname || '친구',
      requesterProfileId: profile?.id || '',
      relationshipId, createdAt: serverTimestamp(),
    })
  } catch (err) {
    console.warn('[community] sendFriendRequest failed:', err)
  }
  return getRelationshipState(viewerUid, targetUid)
}

export async function approveFriendRequest(viewerUid, targetUid) {
  if (!db || !viewerUid || !targetUid || viewerUid === targetUid) return getRelationshipState(viewerUid, targetUid)
  const relationship = await findRelationship(viewerUid, targetUid)
  if (!relationship || relationship.approvalPendingForUid !== viewerUid) return getRelationshipState(viewerUid, targetUid)
  try {
    await updateDoc(doc(db, 'relationships', relationship.id), {
      approvalPendingForUid: null, respondedAt: serverTimestamp(),
    })
    const snap = await getDocs(query(collection(db, 'friendNotifications'), where('relationshipId', '==', relationship.id)))
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  } catch (err) {
    console.warn('[community] approveFriendRequest failed:', err)
  }
  return getRelationshipState(viewerUid, targetUid)
}

export async function declineFriendRequest(viewerUid, targetUid) {
  if (!db || !viewerUid || !targetUid || viewerUid === targetUid) return getRelationshipState(viewerUid, targetUid)
  const relationship = await findRelationship(viewerUid, targetUid)
  if (!relationship || relationship.approvalPendingForUid !== viewerUid) return getRelationshipState(viewerUid, targetUid)
  try {
    await deleteDoc(doc(db, 'relationships', relationship.id))
    const snap = await getDocs(query(collection(db, 'friendNotifications'), where('relationshipId', '==', relationship.id)))
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  } catch (err) {
    console.warn('[community] declineFriendRequest failed:', err)
  }
  return getRelationshipState(viewerUid, targetUid)
}

export async function removeFriend(viewerUid, targetUid) {
  if (!db || !viewerUid || !targetUid || viewerUid === targetUid) return getRelationshipState(viewerUid, targetUid)
  const relationship = await findRelationship(viewerUid, targetUid)
  if (!relationship) return getRelationshipState(viewerUid, targetUid)
  try {
    await deleteDoc(doc(db, 'relationships', relationship.id))
    const snap = await getDocs(query(collection(db, 'friendNotifications'), where('relationshipId', '==', relationship.id)))
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  } catch (err) {
    console.warn('[community] removeFriend failed:', err)
  }
  return getRelationshipState(viewerUid, targetUid)
}

export async function getFriendApprovalNotifications(userId) {
  if (!db || !userId) return []
  try {
    const snap = await getDocs(query(
      collection(db, 'friendNotifications'),
      where('recipientUid', '==', userId),
      where('type', '==', 'friend-approval'),
    ))
    const notifications = snap.docs
      .map((d) => ({ id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) }))
      .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))

    const withPending = await Promise.all(
      notifications.map(async (n) => {
        const rel = await findRelationship(userId, n.requesterUid)
        return rel?.approvalPendingForUid === userId ? n : null
      }),
    )
    return withPending.filter(Boolean)
  } catch (err) {
    console.warn('[community] getFriendApprovalNotifications failed:', err)
    return []
  }
}

export async function getUserFriendStats(userId) {
  if (!userId) return { friends: 0, pendingApprovals: 0, outgoingApprovals: 0 }
  const rels = await fetchRelationshipsByUser(userId)
  return {
    friends: rels.filter((r) => !r.approvalPendingForUid).length,
    pendingApprovals: rels.filter((r) => r.approvalPendingForUid === userId).length,
    outgoingApprovals: rels.filter((r) => r.requestedByUid === userId && r.approvalPendingForUid && r.approvalPendingForUid !== userId).length,
  }
}

export async function getUserFollowStats(userId) {
  const stats = await getUserFriendStats(userId)
  return { followers: stats.friends, following: stats.pendingApprovals }
}

export async function isFollowing(viewerUid, targetUid) {
  const state = await getRelationshipState(viewerUid, targetUid)
  return state.status !== 'none' && state.status !== 'self'
}

export async function toggleFollowUser(viewerUid, targetUid, profile) {
  return sendFriendRequest(viewerUid, targetUid, profile)
}

// ─── User list ────────────────────────────────────────────────────────────────

export async function getCommunityUsers(profile) {
  if (!db) return []
  try {
    const snap = await getDocs(query(collection(db, 'users'), fsLimit(200)))
    return snap.docs
      .map((d) => {
        const data = d.data()
        if (!data.nickname) return null
        return {
          id: data.uid || d.id,
          nickname: data.nickname || '',
          intro: data.intro || '',
          region: getRegionFromAddress(data.school?.address),
          schoolName: data.school?.name || '',
          grade: data.grade || null,
          classNum: data.classNum || null,
          boards: data.selectedBoards || [],
          profileId: data.id || '',
          profilePhoto: data.profilePhoto || null,
        }
      })
      .filter(Boolean)
  } catch (err) {
    console.warn('[community] getCommunityUsers failed:', err)
    return []
  }
}

export async function getCommunityUserById(userId) {
  if (!db || !userId) return null
  try {
    const snap = await getDoc(doc(db, 'users', userId))
    if (!snap.exists()) return null
    const data = snap.data()
    return {
      id: data.uid || snap.id,
      nickname: data.nickname || '',
      intro: data.intro || '',
      region: getRegionFromAddress(data.school?.address),
      schoolName: data.school?.name || '',
      grade: data.grade || null,
      classNum: data.classNum || null,
      boards: data.selectedBoards || [],
      profileId: data.id || '',
      profilePhoto: data.profilePhoto || null,
    }
  } catch (err) {
    console.warn('[community] getCommunityUserById failed:', err)
    return null
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchCommunity(queryStr, profile) {
  const raw = (queryStr || '').trim()
  const term = (raw.startsWith('@') ? raw.slice(1) : raw).toLowerCase()
  if (!term) return { posts: [], users: [] }
  try {
    const [allPosts, allUsers] = await Promise.all([
      getCommunityPosts(profile),
      getCommunityUsers(profile),
    ])
    const posts = allPosts.filter((post) =>
      [post.title, post.content, post.author, post.board, ...(post.tags || [])]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term)),
    )
    const users = allUsers.filter((user) =>
      [user.nickname, user.intro, user.region, user.schoolName, user.id, user.profileId, ...(user.boards || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    )
    return { posts, users }
  } catch (err) {
    console.warn('[community] searchCommunity failed:', err)
    return { posts: [], users: [] }
  }
}
