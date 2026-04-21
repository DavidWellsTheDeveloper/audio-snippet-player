import { describe, expect, it } from 'vitest'
import {
  getYouTubeEmbedUrl,
  getYouTubeVideoId,
  isYouTubeUrl,
  normalizeUrl,
} from './youtube'

describe('normalizeUrl', () => {
  it('returns input when empty or non-string', () => {
    expect(normalizeUrl('')).toBe('')
    expect(normalizeUrl(null as unknown as string)).toBe(null)
  })

  it('collapses duplicate https protocol', () => {
    expect(normalizeUrl('https://https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
  })

  it('trims whitespace', () => {
    expect(normalizeUrl('  https://example.com/path  ')).toBe('https://example.com/path')
  })
})

describe('isYouTubeUrl', () => {
  it('returns true for youtube.com and youtu.be', () => {
    expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
    expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
  })

  it('returns false for unrelated hosts', () => {
    expect(isYouTubeUrl('https://example.com/audio.mp3')).toBe(false)
  })
})

describe('getYouTubeVideoId', () => {
  it('parses watch, short, and embed URLs', () => {
    const id = 'dQw4w9WgXcQ'
    expect(getYouTubeVideoId(`https://www.youtube.com/watch?v=${id}`)).toBe(id)
    expect(getYouTubeVideoId(`https://youtu.be/${id}`)).toBe(id)
    expect(getYouTubeVideoId(`https://www.youtube.com/embed/${id}`)).toBe(id)
  })

  it('returns null when id cannot be resolved', () => {
    expect(getYouTubeVideoId('not-a-url')).toBe(null)
  })
})

describe('getYouTubeEmbedUrl', () => {
  it('builds embed URL with floored start and end', () => {
    const url = getYouTubeEmbedUrl('dQw4w9WgXcQ', 30.7, 90.2)
    expect(url).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ?start=30&end=90',
    )
  })

  it('adds autoplay when requested', () => {
    const url = getYouTubeEmbedUrl('dQw4w9WgXcQ', 0, 60, { autoplay: true })
    expect(url).toContain('autoplay=1')
  })
})
