/** Open a snippet player URL in a new tab (absolute or site-relative). */
export function openSnippetPlayerUrl(raw: string): void {
  if (typeof window === 'undefined' || !raw.trim()) {
    return
  }

  const trimmed = raw.trim()
  const href = trimmed.startsWith('http')
    ? trimmed
    : `${window.location.origin}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`

  window.open(href, '_blank', 'noopener,noreferrer')
}
