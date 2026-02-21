/**
 * YouTube URL detection and embed URL building.
 * Supports youtube.com/watch?v=, youtu.be/, youtube.com/embed/
 */

/** Fix common paste mistakes: double protocol, etc. */
export function normalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return url
  let s = url.trim()
  // Fix https://https:// or http://https:// -> https://
  s = s.replace(/^(https?:\/\/)+/i, (match) => {
    const hasHttps = /https/i.test(match)
    return hasHttps ? 'https://' : 'http://'
  })
  return s
}

/** Regex fallback when URL is malformed (e.g. double protocol). Video ID is 11 chars. */
const YOUTUBE_VIDEO_ID_REGEX = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/

function getYouTubeVideoIdFromString(url: string): string | null {
  const m = url.match(YOUTUBE_VIDEO_ID_REGEX)
  return m ? m[1]! : null
}

export function isYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  const normalized = normalizeUrl(url)
  try {
    const u = new URL(normalized)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return true
    if (host === 'youtube.com') return true
    return false
  } catch {
    return getYouTubeVideoIdFromString(normalized) !== null
  }
}

/**
 * Extract YouTube video ID from various URL formats.
 * Uses regex fallback when URL is malformed (e.g. https://https://youtu.be/...).
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  const normalized = normalizeUrl(url)
  try {
    const u = new URL(normalized)
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      return id || null
    }
    if (u.hostname.replace(/^www\./, '') === 'youtube.com') {
      return u.searchParams.get('v') || getYouTubeVideoIdFromString(normalized)
    }
    return null
  } catch {
    return getYouTubeVideoIdFromString(normalized)
  }
}

export interface YouTubeEmbedOptions {
  /** When true, add autoplay=1 (e.g. for hide-video mode so playback can start without visible controls). */
  autoplay?: boolean
}

/**
 * Build YouTube embed URL with start and end times (seconds).
 * Playback begins paused when autoplay is omitted or false.
 */
export function getYouTubeEmbedUrl(
  videoId: string,
  startSeconds: number,
  endSeconds: number,
  options?: YouTubeEmbedOptions
): string {
  const params = new URLSearchParams()
  params.set('start', String(Math.max(0, Math.floor(startSeconds))))
  params.set('end', String(Math.max(0, Math.floor(endSeconds))))
  if (options?.autoplay) {
    params.set('autoplay', '1')
  }
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`
}
