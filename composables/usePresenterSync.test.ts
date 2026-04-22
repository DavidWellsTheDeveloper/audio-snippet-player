import { afterEach, describe, expect, it, vi } from 'vitest'
import { postPresenterReload, subscribePresenterReload } from './usePresenterSync'
import { TRIVIA_PRESENTER_CHANNEL } from '~/constants/trivia'

describe('postPresenterReload', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns early when BroadcastChannel is undefined', () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    expect(() => postPresenterReload('event-1')).not.toThrow()
  })

  it('posts trivia-reload message and closes the channel', () => {
    const postMessage = vi.fn()
    const close = vi.fn()
    const createdNames: string[] = []

    class MockChannel {
      constructor(name: string) {
        createdNames.push(name)
      }

      postMessage = postMessage
      close = close
    }

    vi.stubGlobal('BroadcastChannel', MockChannel as unknown as typeof BroadcastChannel)

    postPresenterReload('evt-abc')

    expect(createdNames).toEqual([TRIVIA_PRESENTER_CHANNEL])
    expect(postMessage).toHaveBeenCalledWith({
      eventId: 'evt-abc',
      type: 'trivia-reload',
    })
    expect(close).toHaveBeenCalled()
  })
})

describe('subscribePresenterReload', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns no-op unsubscribe when BroadcastChannel is undefined', () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const onReload = vi.fn()
    const unsub = subscribePresenterReload('e1', onReload)

    unsub()
    expect(onReload).not.toHaveBeenCalled()
  })

  it('calls onReload only for matching eventId and trivia-reload type', () => {
    const instances: { onmessage: ((ev: MessageEvent) => void) | null; close: ReturnType<typeof vi.fn> }[] = []

    class MockChannel {
      onmessage: ((ev: MessageEvent) => void) | null = null
      close = vi.fn()

      constructor(_name: string) {
        instances.push(this)
      }
    }

    vi.stubGlobal('BroadcastChannel', MockChannel as unknown as typeof BroadcastChannel)

    const onReload = vi.fn()
    subscribePresenterReload('target-id', onReload)

    const ch = instances[0]!
    expect(ch.onmessage).toBeTruthy()

    ch.onmessage!(
      new MessageEvent('message', {
        data: { eventId: 'other', type: 'trivia-reload' },
      }),
    )
    expect(onReload).not.toHaveBeenCalled()

    ch.onmessage!(
      new MessageEvent('message', {
        data: { eventId: 'target-id', type: 'trivia-reload' },
      }),
    )
    expect(onReload).toHaveBeenCalledTimes(1)
  })

  it('unsubscribe closes the channel', () => {
    const instances: { close: ReturnType<typeof vi.fn> }[] = []

    class MockChannel {
      onmessage: ((ev: MessageEvent) => void) | null = null
      close = vi.fn()

      constructor(_name: string) {
        instances.push(this)
      }
    }

    vi.stubGlobal('BroadcastChannel', MockChannel as unknown as typeof BroadcastChannel)

    const unsub = subscribePresenterReload('id', () => {})
    unsub()

    expect(instances[0]!.close).toHaveBeenCalled()
  })
})
