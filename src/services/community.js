import { getRegionFromAddress, getTimestampMillis } from '../utils/index.js'
import { dispatchLocalNotification, NOTIF_TEMPLATES, shouldTriggerVibeMilestone } from '../utils/notifications.js'

const STORAGE_POSTS_KEY = 'ocl:community:posts'
const STORAGE_BOARDS_KEY = 'ocl:community:boards'
const STORAGE_LIKED_POSTS_KEY = 'ocl:community:liked-posts'
const STORAGE_LIKE_DELTAS_KEY = 'ocl:community:like-deltas'
const STORAGE_FOLLOWS_KEY = 'ocl:community:follows'
const STORAGE_RELATIONSHIPS_KEY = 'ocl:community:relationships'
const STORAGE_RELATIONSHIPS_VERSION_KEY = 'ocl:community:relationships:version'
const STORAGE_FRIEND_NOTIFICATIONS_KEY = 'ocl:community:friend-notifications'
const STORAGE_CLASS_POSTS_KEY = 'ocl:community:class-posts'
const RELATIONSHIPS_VERSION = '2'


const STORAGE_SCHOOL_POSTS_KEY = 'ocl:community:school-posts'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readStorage(key, fallback) {
  if (!canUseStorage()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  if (!canUseStorage()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function uniq(values) {
  return Array.from(new Set(values.filter(Boolean)))
}

function pairKey(a, b) {
  return [a, b].sort().join('::')
}

function normalizePost(post) {
  const vibeCount = Number((post.vibes ?? post.likes) || 0)
  return {
    ...post,
    board: post.board || post.tags?.[0] || '자유',
    content: post.content || post.excerpt || '',
    tags: uniq([...(post.tags || []), post.board]),
    author: post.isAnonymous ? '익명' : post.author || '익명',
    authorId: post.isAnonymous ? null : post.authorId || post.ownerUid || null,
    ownerUid: post.ownerUid || post.authorId || null,
    isAnonymous: Boolean(post.isAnonymous),
    likes: vibeCount,
    vibes: vibeCount,
    comments: Number(post.comments || 0),
    createdAt: post.createdAt || new Date().toISOString(),
    schoolName: post.schoolName || '우리 커뮤니티',
    schoolRegion: post.schoolRegion || '',
  }
}

function applyVibeState(post, vibedIds, vibeDeltas) {
  const delta = vibeDeltas[post.id] || 0
  const nextVibes = Math.max(0, post.vibes + delta)
  const vibed = vibedIds.includes(post.id)
  return {
    ...post,
    likes: nextVibes,
    vibes: nextVibes,
    liked: vibed,
    vibed,
  }
}

function getSeedUserMap() {
  return new Map()
}

function normalizeFollows(records = []) {
  return records.filter((record) => record.followerUid && record.followingUid && record.followerUid !== record.followingUid)
}

function normalizeRelationships(records = []) {
  const map = new Map()

  records.forEach((record) => {
    const left = record.userAUid || record.requesterUid || record.followerUid
    const right = record.userBUid || record.addresseeUid || record.followingUid
    if (!left || !right || left === right) return

    const key = pairKey(left, right)
    const [userAUid, userBUid] = key.split('::')
    const createdAt = record.createdAt || new Date().toISOString()
    const approvalPendingForUid = record.approvalPendingForUid || null

    map.set(key, {
      id: record.id || `relationship-${key}`,
      userAUid,
      userBUid,
      status: 'friends',
      requestedByUid: record.requestedByUid || record.requesterUid || left,
      approvalPendingForUid,
      createdAt,
      approvedAt: approvalPendingForUid ? record.approvedAt || null : record.approvedAt || createdAt,
      respondedAt: approvalPendingForUid ? null : record.respondedAt || record.approvedAt || createdAt,
      migratedFromLegacy: Boolean(record.migratedFromLegacy),
    })
  })

  return Array.from(map.values())
}

function normalizeFriendNotifications(records = []) {
  return records
    .filter((record) => record.id && record.recipientUid && record.requesterUid && record.relationshipId)
    .map((record) => ({
      id: record.id,
      type: 'friend-approval',
      recipientUid: record.recipientUid,
      requesterUid: record.requesterUid,
      requesterNickname: record.requesterNickname || '친구',
      requesterProfileId: record.requesterProfileId || '',
      relationshipId: record.relationshipId,
      createdAt: record.createdAt || new Date().toISOString(),
    }))
    .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))
}

function getNotificationRecords() {
  return normalizeFriendNotifications(readStorage(STORAGE_FRIEND_NOTIFICATIONS_KEY, []))
}

function writeNotificationRecords(records) {
  writeStorage(STORAGE_FRIEND_NOTIFICATIONS_KEY, normalizeFriendNotifications(records))
}

function getLegacyFollowRecords() {
  return normalizeFollows(readStorage(STORAGE_FOLLOWS_KEY, []))
}

function writeRelationshipRecords(records) {
  writeStorage(STORAGE_RELATIONSHIPS_KEY, normalizeRelationships(records))
  writeStorage(STORAGE_RELATIONSHIPS_VERSION_KEY, RELATIONSHIPS_VERSION)
}

function migrateLegacyFollowsIfNeeded() {
  const version = readStorage(STORAGE_RELATIONSHIPS_VERSION_KEY, null)
  if (version === RELATIONSHIPS_VERSION) return

  const currentRelationships = normalizeRelationships(readStorage(STORAGE_RELATIONSHIPS_KEY, []))
  if (currentRelationships.length) {
    writeRelationshipRecords(currentRelationships)
    return
  }

  const legacyFollows = getLegacyFollowRecords()
  const migrated = normalizeRelationships(
    legacyFollows.map((record) => ({
      id: `legacy-${pairKey(record.followerUid, record.followingUid)}`,
      userAUid: record.followerUid,
      userBUid: record.followingUid,
      requestedByUid: record.followerUid,
      approvalPendingForUid: null,
      createdAt: record.createdAt || new Date().toISOString(),
      approvedAt: record.createdAt || new Date().toISOString(),
      respondedAt: record.createdAt || new Date().toISOString(),
      migratedFromLegacy: true,
    })),
  )

  writeRelationshipRecords(migrated)
}

function getRelationshipRecords() {
  migrateLegacyFollowsIfNeeded()
  return normalizeRelationships(readStorage(STORAGE_RELATIONSHIPS_KEY, []))
}

function findRelationshipBetween(leftUid, rightUid, records = getRelationshipRecords()) {
  if (!leftUid || !rightUid) return null
  const key = pairKey(leftUid, rightUid)
  return records.find((record) => pairKey(record.userAUid, record.userBUid) === key) || null
}

function touchesUser(record, userId) {
  return record.userAUid === userId || record.userBUid === userId
}

function createFriendApprovalNotification(recipientUid, requesterUid, relationship, profile) {
  const notifications = getNotificationRecords().filter((item) => item.relationshipId !== relationship.id)
  notifications.unshift({
    id: `friend-approval-${relationship.id}`,
    type: 'friend-approval',
    recipientUid,
    requesterUid,
    requesterNickname: profile?.nickname || '친구',
    requesterProfileId: profile?.id || '',
    relationshipId: relationship.id,
    createdAt: new Date().toISOString(),
  })
  writeNotificationRecords(notifications)
}

function removeFriendApprovalNotification(relationshipId) {
  writeNotificationRecords(getNotificationRecords().filter((item) => item.relationshipId !== relationshipId))
}

export function getCommunityPosts(profile) {
  const vibedIds = readStorage(STORAGE_LIKED_POSTS_KEY, [])
  const vibeDeltas = readStorage(STORAGE_LIKE_DELTAS_KEY, {})
  const customPosts = readStorage(STORAGE_POSTS_KEY, []).map(normalizePost)

  return customPosts
    .map((post) => applyVibeState(post, vibedIds, vibeDeltas))
    .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))
}

export function getCommunityFlows(profile) {
  return getCommunityPosts(profile)
}

export function getCommunityBoards(profile) {
  const storedBoards = readStorage(STORAGE_BOARDS_KEY, [])
  const selectedBoards = profile?.selectedBoards || []
  const boardsFromPosts = getCommunityPosts(profile).map((post) => post.board)
  return uniq(['자유', '질문', '공부', '급식', ...selectedBoards, ...storedBoards, ...boardsFromPosts])
}

export function createCommunityBoard(name) {
  const trimmed = (name || '').trim().replace(/\s+/g, ' ')
  if (!trimmed) throw new Error('게시판 이름을 입력해 주세요.')

  const storedBoards = readStorage(STORAGE_BOARDS_KEY, [])
  if (!storedBoards.includes(trimmed)) {
    writeStorage(STORAGE_BOARDS_KEY, [trimmed, ...storedBoards])
  }
  return trimmed
}

export function createCommunityPost(payload, profile) {
  const storedPosts = readStorage(STORAGE_POSTS_KEY, [])
  const board = payload.board?.trim() || '자유'
  const anonymous = Boolean(payload.anonymous)
  const ownerUid = profile?.uid || 'local-user'
  const post = normalizePost({
    id: `post-${Date.now()}`,
    board,
    title: payload.title?.trim() || '제목 없는 글',
    content: payload.content?.trim() || '',
    author: anonymous ? '익명' : profile?.nickname || '나',
    authorId: anonymous ? null : ownerUid,
    ownerUid,
    isAnonymous: anonymous,
    likes: 0,
    comments: 0,
    createdAt: new Date().toISOString(),
    schoolName: profile?.school?.name || '우리 커뮤니티',
    schoolRegion: getRegionFromAddress(profile?.school?.address),
    tags: uniq([board, payload.tag || 'NOW']),
  })

  writeStorage(STORAGE_POSTS_KEY, [post, ...storedPosts])
  return post
}

export function toggleCommunityPostVibe(postId, profile) {
  const vibedIds = new Set(readStorage(STORAGE_LIKED_POSTS_KEY, []))
  const vibeDeltas = { ...readStorage(STORAGE_LIKE_DELTAS_KEY, {}) }
  const isVibed = vibedIds.has(postId)

  if (isVibed) {
    vibedIds.delete(postId)
    vibeDeltas[postId] = (vibeDeltas[postId] || 0) - 1
  } else {
    vibedIds.add(postId)
    vibeDeltas[postId] = (vibeDeltas[postId] || 0) + 1
  }

  if (vibeDeltas[postId] === 0) delete vibeDeltas[postId]

  writeStorage(STORAGE_LIKED_POSTS_KEY, Array.from(vibedIds))
  writeStorage(STORAGE_LIKE_DELTAS_KEY, vibeDeltas)

  const updatedPost = getCommunityPosts(profile).find((post) => post.id === postId) || null

  // 공감 추가 시점에만 마일스톤 체크 (10의 배수마다 포스트 소유자에게 알림)
  if (!isVibed && updatedPost && shouldTriggerVibeMilestone(updatedPost.vibes - 1, updatedPost.vibes)) {
    dispatchLocalNotification(NOTIF_TEMPLATES.vibeMilestone(updatedPost.vibes))
  }

  return updatedPost
}

export const toggleCommunityPostLike = toggleCommunityPostVibe

export function getUserFriendStats(userId) {
  if (!userId) return { friends: 0, pendingApprovals: 0, outgoingApprovals: 0 }
  const relationships = getRelationshipRecords()
  return {
    friends: relationships.filter((record) => touchesUser(record, userId)).length,
    pendingApprovals: relationships.filter((record) => record.approvalPendingForUid === userId).length,
    outgoingApprovals: relationships.filter((record) => record.requestedByUid === userId && record.approvalPendingForUid && record.approvalPendingForUid !== userId).length,
  }
}

export function getRelationshipState(viewerUid, targetUid) {
  if (!viewerUid || !targetUid) return { status: 'none', relationship: null }
  if (viewerUid === targetUid) return { status: 'self', relationship: null }

  const relationship = findRelationshipBetween(viewerUid, targetUid)
  if (!relationship) return { status: 'none', relationship: null }

  if (relationship.approvalPendingForUid === viewerUid) {
    return { status: 'incoming_approval', relationship }
  }

  if (relationship.approvalPendingForUid === targetUid && relationship.requestedByUid === viewerUid) {
    return { status: 'outgoing_pending', relationship }
  }

  return { status: 'friends', relationship }
}

export function sendFriendRequest(viewerUid, targetUid, profile) {
  if (!viewerUid || !targetUid || viewerUid === targetUid) return getRelationshipState(viewerUid, targetUid)

  const relationships = getRelationshipRecords()
  const existing = findRelationshipBetween(viewerUid, targetUid, relationships)
  if (existing) return getRelationshipState(viewerUid, targetUid)

  const key = pairKey(viewerUid, targetUid)
  const createdAt = new Date().toISOString()
  const nextRelationship = {
    id: `relationship-${key}`,
    userAUid: key.split('::')[0],
    userBUid: key.split('::')[1],
    status: 'friends',
    requestedByUid: viewerUid,
    approvalPendingForUid: targetUid,
    createdAt,
    approvedAt: createdAt,
    respondedAt: null,
  }

  writeRelationshipRecords([...relationships, nextRelationship])
  createFriendApprovalNotification(targetUid, viewerUid, nextRelationship, profile)
  return getRelationshipState(viewerUid, targetUid)
}

export function approveFriendRequest(viewerUid, targetUid) {
  if (!viewerUid || !targetUid || viewerUid === targetUid) return getRelationshipState(viewerUid, targetUid)

  const relationships = getRelationshipRecords()
  const nextRelationships = relationships.map((record) => {
    if (pairKey(record.userAUid, record.userBUid) !== pairKey(viewerUid, targetUid)) return record
    if (record.approvalPendingForUid !== viewerUid) return record
    return {
      ...record,
      approvalPendingForUid: null,
      respondedAt: new Date().toISOString(),
    }
  })

  writeRelationshipRecords(nextRelationships)
  const relationship = findRelationshipBetween(viewerUid, targetUid, nextRelationships)
  if (relationship) removeFriendApprovalNotification(relationship.id)
  return getRelationshipState(viewerUid, targetUid)
}

export function declineFriendRequest(viewerUid, targetUid) {
  if (!viewerUid || !targetUid || viewerUid === targetUid) return getRelationshipState(viewerUid, targetUid)

  const relationships = getRelationshipRecords()
  const relationship = findRelationshipBetween(viewerUid, targetUid, relationships)
  if (!relationship || relationship.approvalPendingForUid !== viewerUid) return getRelationshipState(viewerUid, targetUid)

  writeRelationshipRecords(relationships.filter((record) => record.id !== relationship.id))
  removeFriendApprovalNotification(relationship.id)
  return getRelationshipState(viewerUid, targetUid)
}

export function removeFriend(viewerUid, targetUid) {
  if (!viewerUid || !targetUid || viewerUid === targetUid) return getRelationshipState(viewerUid, targetUid)
  const relationships = getRelationshipRecords()
  const relationship = findRelationshipBetween(viewerUid, targetUid, relationships)
  if (!relationship) return getRelationshipState(viewerUid, targetUid)
  writeRelationshipRecords(relationships.filter((record) => record.id !== relationship.id))
  removeFriendApprovalNotification(relationship.id)
  return getRelationshipState(viewerUid, targetUid)
}

export function getFriendApprovalNotifications(userId, profile) {
  if (!userId) return []
  const relationships = getRelationshipRecords()
  const userMap = new Map(getCommunityUsers(profile).map((user) => [user.id, user]))

  return getNotificationRecords()
    .filter((item) => item.recipientUid === userId)
    .filter((item) => {
      const relationship = relationships.find((record) => record.id === item.relationshipId)
      return relationship?.approvalPendingForUid === userId
    })
    .map((item) => {
      const requester = userMap.get(item.requesterUid)
      return {
        ...item,
        requesterNickname: requester?.nickname || item.requesterNickname || '친구',
        requesterProfileId: requester?.profileId || item.requesterProfileId || '',
      }
    })
}

export function getCommunityUsers(profile) {
  const posts = getCommunityPosts(profile)
  const friendStatsByUser = new Map()
  const seedMap = getSeedUserMap()
  const map = new Map(seedMap)

  posts.forEach((post) => {
    const key = post.ownerUid || post.authorId || `author-${post.author}`
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        nickname: post.isAnonymous ? '익명' : post.author,
        intro: `${post.board} 게시판에서 자주 보여요.`,
        region: post.schoolRegion || '',
        schoolName: post.schoolName || '',
        grade: null,
        classNum: null,
        boards: [post.board],
      })
      return
    }

    const existing = map.get(key)
    map.set(key, {
      ...existing,
      nickname: existing.nickname || (post.isAnonymous ? '익명' : post.author),
      boards: uniq([...(existing.boards || []), post.board]),
      region: existing.region || post.schoolRegion || '',
      schoolName: existing.schoolName || post.schoolName || '',
    })
  })

  if (profile?.uid) {
    map.set(profile.uid, {
      id: profile.uid,
      nickname: profile.nickname || '나',
      intro: '내 스냅과 게시판을 직접 꾸미는 중',
      region: getRegionFromAddress(profile.school?.address),
      schoolName: profile.school?.name || '',
      grade: profile.grade || null,
      classNum: profile.classNum || null,
      boards: profile.selectedBoards || [],
      profileId: profile.id || '',
    })
  }

  Array.from(map.keys()).forEach((userId) => {
    friendStatsByUser.set(userId, getUserFriendStats(userId))
  })

  return Array.from(map.values()).map((user) => {
    const stats = friendStatsByUser.get(user.id) || { friends: 0, pendingApprovals: 0, outgoingApprovals: 0 }
    return {
      ...user,
      friendCount: stats.friends,
      pendingApprovalCount: stats.pendingApprovals,
      outgoingApprovalCount: stats.outgoingApprovals,
      followerCount: stats.friends,
      followingCount: stats.outgoingApprovals,
    }
  })
}

export function getCommunityUserById(userId, profile) {
  return getCommunityUsers(profile).find((user) => user.id === userId) || null
}

export function getUserFollowStats(userId) {
  const stats = getUserFriendStats(userId)
  return {
    followers: stats.friends,
    following: stats.pendingApprovals,
  }
}

export function isFollowing(viewerUid, targetUid) {
  return getRelationshipState(viewerUid, targetUid).status !== 'none'
}

export function toggleFollowUser(viewerUid, targetUid, profile) {
  return sendFriendRequest(viewerUid, targetUid, profile)
}

export function getPostsByOwner(ownerUid, profile) {
  return getCommunityPosts(profile).filter((post) => post.ownerUid === ownerUid)
}

export function getPostsForProfileView(targetUid, viewerUid, profile) {
  const posts = getPostsByOwner(targetUid, profile)
  if (viewerUid === targetUid) return posts
  return posts.filter((post) => !post.isAnonymous)
}

// ─── 학우 게시판 (전교생 공용) ────────────────────────────────────────────────

function schoolPostStorageKey(profile) {
  const code = profile?.school?.code || profile?.school?.id || profile?.school?.name || 'unknown'
  return `${STORAGE_SCHOOL_POSTS_KEY}:${code}`
}

export function getSchoolPosts(profile) {
  if (!profile?.school) return []
  const vibedIds = readStorage(STORAGE_LIKED_POSTS_KEY, [])
  const vibeDeltas = readStorage(STORAGE_LIKE_DELTAS_KEY, {})
  return readStorage(schoolPostStorageKey(profile), [])
    .map(normalizePost)
    .map((post) => applyVibeState(post, vibedIds, vibeDeltas))
    .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))
}

export function createSchoolPost(payload, profile) {
  if (!profile?.school) throw new Error('학교 정보가 필요합니다.')
  const key = schoolPostStorageKey(profile)
  const stored = readStorage(key, [])
  const anonymous = Boolean(payload.anonymous)
  const ownerUid = profile?.uid || 'local-user'
  const post = normalizePost({
    id: `school-post-${Date.now()}`,
    board: '학우 게시판',
    title: payload.title?.trim() || '제목 없는 글',
    content: payload.content?.trim() || '',
    author: anonymous ? '익명' : profile?.nickname || '나',
    authorId: anonymous ? null : ownerUid,
    ownerUid,
    isAnonymous: anonymous,
    likes: 0,
    comments: 0,
    createdAt: new Date().toISOString(),
    schoolName: profile?.school?.name || '우리 학교',
    schoolRegion: getRegionFromAddress(profile?.school?.address),
    tags: ['학우 게시판'],
  })
  writeStorage(key, [post, ...stored])
  return post
}

// ─── 급우 게시판 (같은 반 전용) ──────────────────────────────────────────────

function classPostStorageKey(profile) {
  const code = profile?.school?.code || profile?.school?.name || 'unknown'
  const grade = profile?.grade || '0'
  const classNum = profile?.classNum || '0'
  return `${STORAGE_CLASS_POSTS_KEY}:${code}:${grade}:${classNum}`
}

export function getClassPosts(profile) {
  if (!profile?.grade || !profile?.classNum) return []
  const vibedIds = readStorage(STORAGE_LIKED_POSTS_KEY, [])
  const vibeDeltas = readStorage(STORAGE_LIKE_DELTAS_KEY, {})
  return readStorage(classPostStorageKey(profile), [])
    .map(normalizePost)
    .map((post) => applyVibeState(post, vibedIds, vibeDeltas))
    .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt))
}

export function createClassPost(payload, profile) {
  if (!profile?.grade || !profile?.classNum) {
    throw new Error('학년/반 정보가 필요합니다.')
  }
  const key = classPostStorageKey(profile)
  const stored = readStorage(key, [])
  const anonymous = Boolean(payload.anonymous)
  const ownerUid = profile?.uid || 'local-user'
  const post = normalizePost({
    id: `class-post-${Date.now()}`,
    board: '급우 게시판',
    title: payload.title?.trim() || '제목 없는 글',
    content: payload.content?.trim() || '',
    author: anonymous ? '익명' : profile?.nickname || '나',
    authorId: anonymous ? null : ownerUid,
    ownerUid,
    isAnonymous: anonymous,
    likes: 0,
    comments: 0,
    createdAt: new Date().toISOString(),
    schoolName: profile?.school?.name || '우리 반',
    schoolRegion: getRegionFromAddress(profile?.school?.address),
    tags: ['급우 게시판'],
  })
  writeStorage(key, [post, ...stored])
  return post
}

// ───────────────────────────────────────────────────────────────────────────

export function searchCommunity(query, profile) {
  const term = (query || '').trim().toLowerCase()
  if (!term) return { posts: [], users: [] }

  const posts = getCommunityPosts(profile).filter((post) =>
    [post.title, post.content, post.author, post.board, ...(post.tags || [])]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term)),
  )

  const users = getCommunityUsers(profile).filter((user) =>
    [user.nickname, user.intro, user.region, user.schoolName, ...(user.boards || [])]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term)),
  )

  return { posts, users }
}
