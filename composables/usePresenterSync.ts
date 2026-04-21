import { TRIVIA_PRESENTER_CHANNEL } from '~/constants/trivia'

/** Ask presenter tab(s) to reload state from IndexedDB (same origin). */
export function postPresenterReload(eventId: string) {
  if (typeof BroadcastChannel === 'undefined') {
    return
  }

  const ch = new BroadcastChannel(TRIVIA_PRESENTER_CHANNEL)
  ch.postMessage({ eventId, type: 'trivia-reload' })
  ch.close()
}

export function subscribePresenterReload(
  eventId: string,
  onReload: () => void,
): () => void {
  if (typeof BroadcastChannel === 'undefined') {
    return () => {}
  }

  const ch = new BroadcastChannel(TRIVIA_PRESENTER_CHANNEL)
  ch.onmessage = (ev: MessageEvent) => {
    const data = ev.data as { eventId?: string; type?: string }
    if (data?.type === 'trivia-reload' && data.eventId === eventId) {
      onReload()
    }
  }

  return () => ch.close()
}
