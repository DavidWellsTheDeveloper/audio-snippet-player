import { nextTick, onMounted, ref, type ComputedRef } from 'vue'
import {
  YOUTUBE_IFRAME_API_SCRIPT_URL,
  YT_HIDDEN_PLAYER_CONTAINER_ID,
  YT_HIDDEN_PLAYER_SIZE_PX,
} from '~/constants/snippet'
import type { SnippetParamsResult } from '~/composables/useSnippetParams'

interface YTPlayer {
  pauseVideo?: () => void
  playVideo?: () => void
}

type WindowWithYt = typeof window & {
  onYouTubeIframeAPIReady?: () => void
  YT?: { Player: new (id: string, opts: Record<string, unknown>) => YTPlayer }
}

export function useYoutubeIframePlayer(params: ComputedRef<SnippetParamsResult>) {
  const ytPlayerRef = ref<YTPlayer | null>(null)

  function initYtPlayer() {
    const p = params.value
    if (!p.videoId || !document.getElementById(YT_HIDDEN_PLAYER_CONTAINER_ID)) {
      return
    }

    const YT = (window as WindowWithYt).YT
    if (!YT?.Player) {
      return
    }

    ytPlayerRef.value = new YT.Player(YT_HIDDEN_PLAYER_CONTAINER_ID, {
      events: {
        onReady(event: { target: YTPlayer }) {
          ytPlayerRef.value = event.target
        },
      },
      height: YT_HIDDEN_PLAYER_SIZE_PX,
      playerVars: {
        end: Math.floor(p.end),
        start: Math.floor(p.start),
      },
      videoId: p.videoId,
      width: YT_HIDDEN_PLAYER_SIZE_PX,
    })
  }

  onMounted(() => {
    if (!params.value.hideVideo || !params.value.isYouTube || !params.value.videoId) {
      return
    }

    nextTick(() => {
      const w = window as WindowWithYt
      if (w.YT?.Player) {
        initYtPlayer()
      } else {
        w.onYouTubeIframeAPIReady = () => initYtPlayer()
        const script = document.createElement('script')
        script.src = YOUTUBE_IFRAME_API_SCRIPT_URL
        document.head.appendChild(script)
      }
    })
  })

  function pause() {
    ytPlayerRef.value?.pauseVideo?.()
  }

  function play() {
    ytPlayerRef.value?.playVideo?.()
  }

  return {
    containerId: YT_HIDDEN_PLAYER_CONTAINER_ID,
    pause,
    play,
  }
}
