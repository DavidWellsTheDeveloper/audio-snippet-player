<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSnippetParams } from '~/composables/useSnippetParams'
import { useSnippetSave } from '~/composables/useSnippetSave'
import { QUERY_KEYS, ROUTES } from '~/constants/snippet'

const route = useRoute()
const url = ref('')
const start = ref<number | string>('')
const end = ref<number | string>('')
const hideVideo = ref(false)
const { saveMessage, saveName, trySave } = useSnippetSave()

onMounted(() => {
  if (import.meta.server) {
    return
  }

  const q = route.query
  if (q?.[QUERY_KEYS.url] && q?.[QUERY_KEYS.start] != null && q?.[QUERY_KEYS.end] != null) {
    const p = useSnippetParams({
      [QUERY_KEYS.end]: q[QUERY_KEYS.end],
      [QUERY_KEYS.hideVideo]: q[QUERY_KEYS.hideVideo],
      [QUERY_KEYS.start]: q[QUERY_KEYS.start],
      [QUERY_KEYS.url]: q[QUERY_KEYS.url],
    })
    if (p.valid) {
      const query: Record<string, string> = {
        [QUERY_KEYS.end]: String(q[QUERY_KEYS.end]),
        [QUERY_KEYS.start]: String(q[QUERY_KEYS.start]),
        [QUERY_KEYS.url]: String(q[QUERY_KEYS.url]),
      }
      if (q[QUERY_KEYS.hideVideo]) {
        query[QUERY_KEYS.hideVideo] = String(q[QUERY_KEYS.hideVideo])
      }
      navigateTo({ path: ROUTES.play, query })
    }
  }
})

function buildQuery(): Record<string, string> {
  const query: Record<string, string> = {
    [QUERY_KEYS.end]: String(Number(end.value) || 0),
    [QUERY_KEYS.start]: String(Number(start.value) || 0),
    [QUERY_KEYS.url]: url.value.trim(),
  }
  if (hideVideo.value) {
    query[QUERY_KEYS.hideVideo] = '1'
  }

  return query
}

const canSave = computed(() => {
  const u = url.value.trim()
  const s = Number(start.value)
  const e = Number(end.value)

  return u.length > 0 && Number.isFinite(s) && s >= 0 && Number.isFinite(e) && e > s
})

function openPlayer() {
  navigateTo({ path: ROUTES.play, query: buildQuery() })
}

function onSaveSnippet() {
  return trySave(
    () => `${window.location.origin}${ROUTES.play}?${new URLSearchParams(buildQuery()).toString()}`,
    () => canSave.value,
  )
}
</script>

<template>
  <v-card class="mx-auto" max-width="600">
    <v-card-title class="text-h5">Create snippet</v-card-title>
    <v-card-subtitle>
      Paste a URL and set the start and end time, then open the player.
    </v-card-subtitle>
    <v-card-text>
      <v-form @submit.prevent="openPlayer">
        <v-text-field
          v-model="url"
          label="Audio or video URL"
          placeholder="https://www.youtube.com/watch?v=... or https://example.com/audio.mp3"
          type="url"
          variant="outlined"
          class="mb-3"
          clearable
        />
        <v-text-field
          v-model="start"
          label="Start time (seconds)"
          placeholder="0"
          type="number"
          min="0"
          step="0.1"
          variant="outlined"
          class="mb-3"
        />
        <v-text-field
          v-model="end"
          label="End time (seconds)"
          placeholder="60"
          type="number"
          min="0"
          step="0.1"
          variant="outlined"
          class="mb-3"
        />
        <v-switch
          v-model="hideVideo"
          label="Hide video (audio only for YouTube)"
          color="primary"
          class="mb-4"
          hide-details
        />
        <v-btn type="submit" color="primary" size="large">
          Open player
        </v-btn>

        <SaveSnippetForm
          v-model="saveName"
          :disabled="!canSave"
          :message="saveMessage"
          @save="onSaveSnippet"
        />
      </v-form>
    </v-card-text>
  </v-card>
</template>
