/** API paths (alphabetical by key) */
export const API_PATHS = {
  proxy: '/api/proxy',
} as const

/** YouTube IFrame API script (hidden player for audio-only mode) */
export const YOUTUBE_IFRAME_API_SCRIPT_URL = 'https://www.youtube.com/iframe_api'

/** DOM id for the hidden YouTube player container */
export const YT_HIDDEN_PLAYER_CONTAINER_ID = 'yt-player-hidden'

/** Hidden YouTube API player size (px); must stay non-zero for the API */
export const YT_HIDDEN_PLAYER_SIZE_PX = 200

/** Route paths (alphabetical by key) */
export const ROUTES = {
  create: '/',
  play: '/play',
  saved: '/saved',
} as const

/** URL query parameter names shared client ↔ server (alphabetical by key) */
export const QUERY_KEYS = {
  end: 'end',
  hideVideo: 'hideVideo',
  start: 'start',
  url: 'url',
} as const

export const SNIPPET_SAVE_MESSAGE_CLEAR_MS = 3000

/** User-facing save feedback (alphabetical by key) */
export const SNIPPET_MESSAGES = {
  saveFailed: 'Failed to save.',
  saved: 'Snippet saved.',
} as const

export function buildAudioProxyUrl(targetUrl: string): string {
  const search = new URLSearchParams()
  search.set(QUERY_KEYS.url, targetUrl)

  return `${API_PATHS.proxy}?${search.toString()}`
}
