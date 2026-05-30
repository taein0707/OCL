import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase/index.js'

export const MAX_VIDEO_SECONDS = 7
const MAX_IMAGE_MB = 10
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024

export async function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.src = url
    video.preload = 'metadata'
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration) }
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('동영상을 읽을 수 없습니다.')) }
  })
}

export async function generateVideoThumbnail(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.src = url
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'

    const capture = () => {
      try {
        const canvas = document.createElement('canvas')
        const maxW = 720
        const scale = Math.min(1, maxW / (video.videoWidth || maxW))
        canvas.width = Math.round((video.videoWidth || maxW) * scale)
        canvas.height = Math.round((video.videoHeight || 480) * scale)
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => { URL.revokeObjectURL(url); resolve(blob) }, 'image/jpeg', 0.82)
      } catch (err) { URL.revokeObjectURL(url); reject(err) }
    }

    video.addEventListener('seeked', capture, { once: true })
    video.addEventListener('error', () => { URL.revokeObjectURL(url); reject(new Error('썸네일 생성 실패')) })
    video.addEventListener('loadeddata', () => { video.currentTime = 0.1 })
    video.load()
  })
}

export async function validateVideoFile(file) {
  if (!file.type.startsWith('video/')) throw new Error('동영상 파일만 업로드할 수 있어요.')
  const duration = await getVideoDuration(file)
  if (duration > MAX_VIDEO_SECONDS) {
    throw new Error(`동영상은 ${MAX_VIDEO_SECONDS}초 이하만 업로드할 수 있어요. (현재 ${Math.ceil(duration)}초)`)
  }
  return { duration }
}

export function validateImageFile(file) {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 업로드할 수 있어요.')
  if (file.size > MAX_IMAGE_BYTES) throw new Error(`이미지는 ${MAX_IMAGE_MB}MB 이하만 업로드할 수 있어요.`)
}

function makePath(uid, filename) {
  const clean = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `media/${uid}/${Date.now()}_${clean}`
}

function uploadToStorage(file, path, onProgress) {
  return new Promise((resolve, reject) => {
    if (!storage) return reject(new Error('Storage가 초기화되지 않았습니다.'))
    const task = uploadBytesResumable(ref(storage, path), file)
    task.on(
      'state_changed',
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref)),
    )
  })
}

export async function uploadMediaFiles(files, uid, onProgress) {
  const results = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) continue

    const sliceProgress = (pct) => {
      onProgress?.(Math.round(((i + pct / 100) / files.length) * 100))
    }

    if (isVideo) {
      await validateVideoFile(file)
      const videoUrl = await uploadToStorage(file, makePath(uid, file.name), (p) => sliceProgress(p * 0.8))
      let thumbnailUrl = null
      try {
        const thumbBlob = await generateVideoThumbnail(file)
        thumbnailUrl = await uploadToStorage(thumbBlob, makePath(uid, 'thumb_' + file.name.replace(/\.[^.]+$/, '.jpg')), (p) => sliceProgress(80 + p * 0.2))
      } catch { /* thumbnail optional */ }
      results.push({ url: videoUrl, type: 'video', thumbnailUrl })
    } else {
      validateImageFile(file)
      const imageUrl = await uploadToStorage(file, makePath(uid, file.name), sliceProgress)
      results.push({ url: imageUrl, type: 'image', thumbnailUrl: imageUrl })
    }
  }
  onProgress?.(100)
  return results
}
