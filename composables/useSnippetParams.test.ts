import { describe, expect, it } from 'vitest'
import { QUERY_KEYS } from '~/constants/snippet'
import { useSnippetParams } from './useSnippetParams'

const Q = QUERY_KEYS

function q(payload: {
  [Q.end]?: string | string[]
  [Q.hideVideo]?: string | string[]
  [Q.start]?: string | string[]
  [Q.url]?: string | string[]
}) {
  return payload
}

describe('useSnippetParams', () => {
  it('returns invalid when url is missing', () => {
    const r = useSnippetParams(q({ [Q.start]: '0', [Q.end]: '10' }))
    expect(r.valid).toBe(false)
    expect(r.error).toBe('Missing url parameter')
  })

  it('returns invalid when start is not a finite non-negative number', () => {
    const r = useSnippetParams(
      q({ [Q.url]: 'https://example.com/a.mp3', [Q.start]: '-1', [Q.end]: '10' }),
    )
    expect(r.valid).toBe(false)
    expect(r.error).toBe('Invalid or missing start time (seconds)')
  })

  it('returns invalid when end is not greater than start', () => {
    const r = useSnippetParams(
      q({ [Q.url]: 'https://example.com/a.mp3', [Q.start]: '5', [Q.end]: '5' }),
    )
    expect(r.valid).toBe(false)
    expect(r.error).toBe('Invalid or missing end time (must be > start, in seconds)')
  })

  it('returns valid direct audio with audioUrl set', () => {
    const r = useSnippetParams(
      q({ [Q.url]: 'https://example.com/a.mp3', [Q.start]: '0', [Q.end]: '30' }),
    )
    expect(r.valid).toBe(true)
    expect(r.isYouTube).toBe(false)
    expect(r.audioUrl).toBe('https://example.com/a.mp3')
    expect(r.embedUrl).toBe(null)
    expect(r.hideVideo).toBe(false)
  })

  it('returns valid YouTube with embedUrl and videoId', () => {
    const r = useSnippetParams(
      q({
        [Q.url]: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        [Q.start]: '10',
        [Q.end]: '20',
      }),
    )
    expect(r.valid).toBe(true)
    expect(r.isYouTube).toBe(true)
    expect(r.videoId).toBe('dQw4w9WgXcQ')
    expect(r.embedUrl).toContain('youtube.com/embed/dQw4w9WgXcQ')
    expect(r.audioUrl).toBe(null)
  })

  it('parses hideVideo when YouTube URL has no resolvable video ID', () => {
    const r = useSnippetParams(
      q({
        [Q.url]: 'https://www.youtube.com/watch',
        [Q.start]: '0',
        [Q.end]: '10',
        [Q.hideVideo]: '1',
      }),
    )
    expect(r.valid).toBe(false)
    expect(r.error).toBe('Could not parse YouTube video ID')
    expect(r.hideVideo).toBe(true)
  })

  it('accepts array query values (first element wins)', () => {
    const r = useSnippetParams(
      q({
        [Q.url]: ['https://example.com/a.mp3'],
        [Q.start]: ['1'],
        [Q.end]: ['2'],
      }),
    )
    expect(r.valid).toBe(true)
    expect(r.start).toBe(1)
    expect(r.end).toBe(2)
  })
})
