import { getQuery, setResponseHeader, setResponseStatus, sendStream } from 'h3'
import { QUERY_KEYS } from '~/constants/snippet'

/**
 * Stream a remote URL to the client (CORS proxy for direct audio).
 * GET /api/proxy?url=<encoded-url>
 * Used when <audio src="direct-url"> fails due to CORS; only for direct audio, not YouTube.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query[QUERY_KEYS.url]
  const targetUrl = typeof url === 'string' ? url : Array.isArray(url) ? url[0] : null

  if (!targetUrl) {
    setResponseStatus(event, 400)
    return { error: 'Missing url query parameter' }
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'AudioSnippetPlayer/1.0',
      },
    })

    if (!res.ok) {
      setResponseStatus(event, res.status)
      return { error: `Upstream returned ${res.status}` }
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    setResponseHeader(event, 'Content-Type', contentType)
    const contentLength = res.headers.get('content-length')
    if (contentLength) setResponseHeader(event, 'Content-Length', contentLength)

    const body = res.body
    if (!body) {
      setResponseStatus(event, 502)
      return { error: 'No response body' }
    }

    await sendStream(event, body)
  } catch (e) {
    setResponseStatus(event, 502)
    return { error: e instanceof Error ? e.message : 'Proxy fetch failed' }
  }
})
