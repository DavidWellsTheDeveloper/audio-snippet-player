import { QUERY_KEYS } from '~/constants/snippet'
import {
  getYouTubeEmbedUrl,
  getYouTubeVideoId,
  isYouTubeUrl,
  normalizeUrl,
} from '~/utils/youtube'

export interface SnippetParams {
  end: number
  start: number
  url: string
}

export interface SnippetParamsResult {
  audioUrl: string | null
  embedUrl: string | null
  end: number
  error?: string
  hideVideo: boolean
  isYouTube: boolean
  start: number
  url: string
  valid: boolean
  videoId: string | null
}

function invalid(overrides: Partial<SnippetParamsResult> & Pick<SnippetParamsResult, 'valid'>): SnippetParamsResult {
  return {
    audioUrl: null,
    embedUrl: null,
    end: 0,
    hideVideo: false,
    isYouTube: false,
    start: 0,
    url: '',
    videoId: null,
    ...overrides,
  }
}

function parseHideVideo(value: string | string[] | undefined): boolean {
  if (value === undefined) {
    return false
  }

  const v = Array.isArray(value) ? value[0] : value
  if (v === undefined) {
    return false
  }

  const s = String(v).toLowerCase()

  return s === '1' || s === 'true' || s === 'yes'
}

/**
 * Parse and validate url, start, end from route query.
 * Returns validated params, isYouTube flag, and either embedUrl (YouTube) or audioUrl (direct).
 * Optional: hideVideo=1 to hide the YouTube video (audio-only).
 */
export function useSnippetParams(query: {
  [QUERY_KEYS.end]?: string | string[]
  [QUERY_KEYS.hideVideo]?: string | string[]
  [QUERY_KEYS.start]?: string | string[]
  [QUERY_KEYS.url]?: string | string[]
}): SnippetParamsResult {
  const urlRaw = Array.isArray(query[QUERY_KEYS.url]) ? query[QUERY_KEYS.url][0] : query[QUERY_KEYS.url]
  const startRaw = Array.isArray(query[QUERY_KEYS.start]) ? query[QUERY_KEYS.start][0] : query[QUERY_KEYS.start]
  const endRaw = Array.isArray(query[QUERY_KEYS.end]) ? query[QUERY_KEYS.end][0] : query[QUERY_KEYS.end]
  const hideVideo = parseHideVideo(query[QUERY_KEYS.hideVideo])

  const start = startRaw != null ? Number(startRaw) : NaN
  const end = endRaw != null ? Number(endRaw) : NaN

  if (!urlRaw || typeof urlRaw !== 'string' || urlRaw.trim() === '') {
    return invalid({
      error: 'Missing url parameter',
      valid: false,
    })
  }

  const trimmedUrl = normalizeUrl(urlRaw.trim())
  if (start < 0 || !Number.isFinite(start)) {
    return invalid({
      audioUrl: null,
      embedUrl: null,
      end: 0,
      error: 'Invalid or missing start time (seconds)',
      hideVideo,
      isYouTube: isYouTubeUrl(trimmedUrl),
      start: 0,
      url: trimmedUrl,
      valid: false,
      videoId: null,
    })
  }

  if (end <= start || !Number.isFinite(end)) {
    return invalid({
      audioUrl: null,
      embedUrl: null,
      end,
      error: 'Invalid or missing end time (must be > start, in seconds)',
      hideVideo,
      isYouTube: isYouTubeUrl(trimmedUrl),
      start,
      url: trimmedUrl,
      valid: false,
      videoId: null,
    })
  }

  const isYouTube = isYouTubeUrl(trimmedUrl)
  if (isYouTube) {
    const videoId = getYouTubeVideoId(trimmedUrl)
    if (!videoId) {
      return invalid({
        audioUrl: null,
        embedUrl: null,
        end,
        error: 'Could not parse YouTube video ID',
        hideVideo,
        isYouTube: true,
        start,
        url: trimmedUrl,
        valid: false,
        videoId: null,
      })
    }

    return {
      audioUrl: null,
      embedUrl: getYouTubeEmbedUrl(videoId, start, end),
      end,
      hideVideo,
      isYouTube: true,
      start,
      url: trimmedUrl,
      valid: true,
      videoId,
    }
  }

  return {
    audioUrl: trimmedUrl,
    embedUrl: null,
    end,
    hideVideo: false,
    isYouTube: false,
    start,
    url: trimmedUrl,
    valid: true,
    videoId: null,
  }
}
