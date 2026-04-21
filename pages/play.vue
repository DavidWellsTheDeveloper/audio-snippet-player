<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSnippetParams } from '~/composables/useSnippetParams'
import { useSnippetSave } from '~/composables/useSnippetSave'
import { useYoutubeIframePlayer } from '~/composables/useYoutubeIframePlayer'
import { buildAudioProxyUrl, QUERY_KEYS, YT_HIDDEN_PLAYER_SIZE_PX } from '~/constants/snippet'

const ytHiddenPlayerPx = YT_HIDDEN_PLAYER_SIZE_PX
const route = useRoute()
const { saveMessage, saveName, trySave } = useSnippetSave()
const params = computed(() =>
  useSnippetParams({
    [QUERY_KEYS.end]: route.query[QUERY_KEYS.end],
    [QUERY_KEYS.hideVideo]: route.query[QUERY_KEYS.hideVideo],
    [QUERY_KEYS.start]: route.query[QUERY_KEYS.start],
    [QUERY_KEYS.url]: route.query[QUERY_KEYS.url],
  }),
)

const { containerId, pause: pauseYt, play: playYt } = useYoutubeIframePlayer(params)

const audioRef = ref<HTMLAudioElement | null>(null)
const useProxy = ref(false)

const effectiveAudioUrl = computed(() => {
  const p = params.value
  if (!p.valid || p.isYouTube || !p.audioUrl) {
    return ''
  }

  if (useProxy.value) {
    return buildAudioProxyUrl(p.audioUrl)
  }

  return p.audioUrl
})

watch(
  () => [params.value.valid, params.value.url],
  () => {
    useProxy.value = false
  },
)

function onAudioError() {
  const p = params.value
  if (p.valid && !p.isYouTube && p.audioUrl && !useProxy.value) {
    useProxy.value = true
  }
}

function onLoadedMetadata() {
  const el = audioRef.value
  const p = params.value
  if (!el || !p.valid || p.isYouTube) {
    return
  }

  el.currentTime = p.start
  el.pause()
}

function onTimeUpdate() {
  const el = audioRef.value
  const p = params.value
  if (!el || !p.valid || p.isYouTube) {
    return
  }

  if (el.currentTime >= p.end) {
    el.pause()
    el.currentTime = p.end
  }
}

function onSaveSnippet() {
  return trySave(
    () => window.location.origin + route.fullPath,
    () => params.value.valid,
  )
}
</script>

<template>
  <v-card class="mx-auto" max-width="800">
    <v-card-title class="text-h5">Audio Snippet Player</v-card-title>
    <v-card-text>
      <template v-if="!params.valid">
        <v-alert type="info" variant="tonal" class="mb-4">
          {{ params.error || 'Provide url, start, and end in the URL.' }}
        </v-alert>
        <p class="text-body2 text-medium-emphasis mb-2">
          Example (YouTube): <code>?url=https://www.youtube.com/watch?v=VIDEO_ID&amp;start=30&amp;end=90</code>
        </p>
        <p class="text-body2 text-medium-emphasis">
          Optional: <code>hideVideo=1</code> to hide the YouTube video (audio only).
        </p>
        <p class="text-body2 text-medium-emphasis">
          Example (direct audio): <code>?url=https://example.com/audio.mp3&amp;start=0&amp;end=60</code>
        </p>
        <p class="text-caption mt-2">
          Some direct audio URLs may require the app to be run with a server (proxy) when CORS blocks playback.
        </p>
      </template>

      <template v-else-if="params.isYouTube && params.embedUrl">
        <p class="text-body2 mb-2">
          YouTube snippet: {{ params.start }}s – {{ params.end }}s (starts paused)
          <span v-if="params.hideVideo" class="text-caption">(video hidden)</span>
        </p>
        <div
          class="youtube-embed"
          :class="{ 'youtube-embed--audio-only': params.hideVideo }"
        >
          <template v-if="params.hideVideo">
            <p class="text-caption text-medium-emphasis mb-2">
              Video hidden. Use the buttons below to play or pause.
            </p>
            <div class="d-flex gap-2 mb-2">
              <v-btn color="primary" @click="playYt">Play</v-btn>
              <v-btn variant="outlined" @click="pauseYt">Pause</v-btn>
            </div>
            <div class="youtube-embed__player-wrapper">
              <div :id="containerId" class="youtube-embed__player--hidden" />
            </div>
          </template>
          <iframe
            v-else
            :src="params.embedUrl"
            width="640"
            height="360"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            title="YouTube video"
          />
        </div>
      </template>

      <template v-else>
        <p class="text-body2 mb-2">
          Direct audio snippet: {{ params.start }}s – {{ params.end }}s (starts paused)
        </p>
        <audio
          v-if="effectiveAudioUrl"
          ref="audioRef"
          :src="effectiveAudioUrl"
          controls
          @loadedmetadata="onLoadedMetadata"
          @timeupdate="onTimeUpdate"
          @error="onAudioError"
        />
        <v-alert v-else type="warning" variant="tonal">
          No audio URL to play.
        </v-alert>
        <p v-if="useProxy" class="text-caption text-medium-emphasis mt-2">
          Using proxy for this URL (direct load failed).
        </p>
      </template>

      <SaveSnippetForm
        v-if="params.valid"
        v-model="saveName"
        message-class="mt-1"
        :message="saveMessage"
        @save="onSaveSnippet"
      />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.youtube-embed {
  position: relative;
  width: 100%;
  max-width: 640px;
}
.youtube-embed iframe {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
}
/* When hideVideo: 0x0 wrapper clips the player so nothing is visible; inner stays 200x200 so YouTube API works */
.youtube-embed__player-wrapper {
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
  position: absolute !important;
  left: 0;
  top: 0;
}
.youtube-embed__player--hidden {
  position: absolute;
  left: 0;
  top: 0;
  width: calc(v-bind('ytHiddenPlayerPx') * 1px) !important;
  height: calc(v-bind('ytHiddenPlayerPx') * 1px) !important;
}
code {
  font-size: 0.85em;
  background: rgba(0, 0, 0, 0.06);
  padding: 0.15em 0.4em;
  border-radius: 4px;
}
</style>
