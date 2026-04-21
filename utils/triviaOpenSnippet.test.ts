import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { openSnippetPlayerUrl } from './triviaOpenSnippet'

describe('openSnippetPlayerUrl', () => {
  const open = vi.fn()

  beforeEach(() => {
    open.mockClear()
    vi.stubGlobal('window', {
      location: { origin: 'https://app.example' },
      open,
    } as unknown as Window & typeof globalThis)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('no-ops for empty or whitespace-only input', () => {
    openSnippetPlayerUrl('')
    openSnippetPlayerUrl('   ')
    expect(open).not.toHaveBeenCalled()
  })

  it('passes through absolute http(s) URLs unchanged', () => {
    openSnippetPlayerUrl('https://cdn.test/clip.mp3')
    expect(open).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledWith(
      'https://cdn.test/clip.mp3',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('prefixes origin for site-relative paths starting with /', () => {
    openSnippetPlayerUrl('/play?url=x&start=0&end=10')
    expect(open).toHaveBeenCalledWith(
      'https://app.example/play?url=x&start=0&end=10',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('prefixes origin and slash for paths without leading slash', () => {
    openSnippetPlayerUrl('play?foo=1')
    expect(open).toHaveBeenCalledWith(
      'https://app.example/play?foo=1',
      '_blank',
      'noopener,noreferrer',
    )
  })
})
