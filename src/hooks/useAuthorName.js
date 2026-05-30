import { useMemo } from 'react'
import { useAuthor } from '../context/AuthorCacheContext.jsx'

/**
 * Returns a stable { name, photoURL, id } for a post/comment author.
 * Only changes when the author's cached profile actually changes.
 */
export function useAuthorInfo(uid, { isAnonymous = false, storedNickname = '' } = {}) {
  const author = useAuthor(isAnonymous ? null : uid)

  return useMemo(() => {
    if (isAnonymous) return { name: '익명', photoURL: null, id: null }
    return {
      name: author?.nickname || storedNickname || '알 수 없음',
      photoURL: author?.profilePhoto?.url || null,
      id: author?.id || null,
    }
  }, [isAnonymous, author, storedNickname])
}
