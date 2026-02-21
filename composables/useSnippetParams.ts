import { normalizeUrl, isYouTubeUrl, getYouTubeVideoId, getYouTubeEmbedUrl } from '~/utils/youtube'

export interface SnippetParams {
  url: string
  start: number
  end: number
}

export interface SnippetParamsResult {
  valid: boolean
  url: string
  start: number
  end: number
  isYouTube: boolean
  /** YouTube video ID when isYouTube (for IFrame API). */
  videoId: string | null
  embedUrl: string | null
  audioUrl: string | null
  /** When true, hide the YouTube video (audio-only; embed still plays, just not visible). */
  hideVideo: boolean
  error?: string
}

function parseHideVideo(value: string | string[] | undefined): boolean {
  if (value === undefined) return false
  const v = Array.isArray(value) ? value[0] : value
  if (v === undefined) return false
  const s = String(v).toLowerCase()
  return s === '1' || s === 'true' || s === 'yes'
}

/**
 * Parse and validate url, start, end from route query.
 * Returns validated params, isYouTube flag, and either embedUrl (YouTube) or audioUrl (direct).
 * Optional: hideVideo=1 to hide the YouTube video (audio-only).
 */
export function useSnippetParams(query: {
  url?: string | string[]
  start?: string | string[]
  end?: string | string[]
  hideVideo?: string | string[]
}): SnippetParamsResult {
  const url = Array.isArray(query.url) ? query.url[0] : query.url
  const startRaw = Array.isArray(query.start) ? query.start[0] : query.start
  const endRaw = Array.isArray(query.end) ? query.end[0] : query.end
  const hideVideo = parseHideVideo(query.hideVideo)

  const start = startRaw != null ? Number(startRaw) : NaN
  const end = endRaw != null ? Number(endRaw) : NaN

  if (!url || typeof url !== 'string' || url.trim() === '') {
    return {
      valid: false,
      url: '',
      start: 0,
      end: 0,
      isYouTube: false,
      videoId: null,
      embedUrl: null,
      audioUrl: null,
      hideVideo: false,
      error: 'Missing url parameter',
    }
  }

  const trimmedUrl = normalizeUrl(url.trim())
  if (start < 0 || !Number.isFinite(start)) {
    return {
      valid: false,
      url: trimmedUrl,
      start: 0,
      end: 0,
      isYouTube: isYouTubeUrl(trimmedUrl),
      videoId: null,
      embedUrl: null,
      audioUrl: null,
      hideVideo,
      error: 'Invalid or missing start time (seconds)',
    }
  }
  if (end <= start || !Number.isFinite(end)) {
    return {
      valid: false,
      url: trimmedUrl,
      start,
      end,
      isYouTube: isYouTubeUrl(trimmedUrl),
      videoId: null,
      embedUrl: null,
      audioUrl: null,
      hideVideo,
      error: 'Invalid or missing end time (must be > start, in seconds)',
    }
  }

  const isYouTube = isYouTubeUrl(trimmedUrl)
  if (isYouTube) {
    const videoId = getYouTubeVideoId(trimmedUrl)
    if (!videoId) {
      return {
        valid: false,
        url: trimmedUrl,
        start,
        end,
        isYouTube: true,
        videoId: null,
        embedUrl: null,
        audioUrl: null,
        hideVideo,
        error: 'Could not parse YouTube video ID',
      }
    }
    return {
      valid: true,
      url: trimmedUrl,
      start,
      end,
      isYouTube: true,
      videoId,
      embedUrl: getYouTubeEmbedUrl(videoId, start, end),
      audioUrl: null,
      hideVideo,
    }
  }

  return {
    valid: true,
    url: trimmedUrl,
    start,
    end,
    isYouTube: false,
    videoId: null,
    embedUrl: null,
    audioUrl: trimmedUrl,
    hideVideo: false,
  }
}
