import { describe, expect, it } from 'vitest'
import { API_PATHS, buildAudioProxyUrl, QUERY_KEYS } from './snippet'

describe('buildAudioProxyUrl', () => {
  it('prefixes proxy path and sets url query', () => {
    const remote = 'https://cdn.example.com/track.mp3?foo=bar&baz=1'
    const built = buildAudioProxyUrl(remote)

    expect(built.startsWith(`${API_PATHS.proxy}?`)).toBe(true)
    const params = new URLSearchParams(built.slice(API_PATHS.proxy.length + 1))
    expect(params.get(QUERY_KEYS.url)).toBe(remote)
  })
})
