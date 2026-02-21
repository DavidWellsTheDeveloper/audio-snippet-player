<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSnippetsDb } from '~/composables/useSnippetsDb'
import { useSnippetParams } from '~/composables/useSnippetParams'

const route = useRoute()
const url = ref('')
const start = ref<number | string>('')
const end = ref<number | string>('')
const hideVideo = ref(false)
const saveName = ref('')
const saveMessage = ref('')
const { saveSnippet } = useSnippetsDb()

// If user lands on / with snippet params (e.g. old saved link), redirect to /play
onMounted(() => {
  if (import.meta.server) return
  const q = route.query
  if (q?.url && q?.start != null && q?.end != null) {
    const p = useSnippetParams({ url: q.url, start: q.start, end: q.end, hideVideo: q.hideVideo })
    if (p.valid) {
      const query: Record<string, string> = { url: String(q.url), start: String(q.start), end: String(q.end) }
      if (q.hideVideo) query.hideVideo = String(q.hideVideo)
      navigateTo({ path: '/play', query })
    }
  }
})

function buildQuery(): Record<string, string> {
  const query: Record<string, string> = {
    url: url.value.trim(),
    start: String(Number(start.value) || 0),
    end: String(Number(end.value) || 0),
  }
  if (hideVideo.value) query.hideVideo = '1'
  return query
}

const canSave = computed(() => {
  const u = url.value.trim()
  const s = Number(start.value)
  const e = Number(end.value)
  return u.length > 0 && Number.isFinite(s) && s >= 0 && Number.isFinite(e) && e > s
})

function openPlayer() {
  navigateTo({ path: '/play', query: buildQuery() })
}

async function onSaveSnippet() {
  if (typeof window === 'undefined' || !canSave.value) return
  const name = saveName.value.trim()
  if (!name) return
  const query = buildQuery()
  const playerUrl = window.location.origin + '/play?' + new URLSearchParams(query).toString()
  try {
    await saveSnippet({ name, playerUrl })
    saveName.value = ''
    saveMessage.value = 'Snippet saved.'
    setTimeout(() => { saveMessage.value = '' }, 3000)
  } catch {
    saveMessage.value = 'Failed to save.'
  }
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

        <v-divider class="my-4" />
        <p class="text-body2 font-weight-medium mb-2">Save snippet</p>
        <div class="d-flex align-center gap-2 flex-wrap mb-2">
          <v-text-field
            v-model="saveName"
            label="Name"
            placeholder="My snippet"
            variant="outlined"
            density="compact"
            hide-details
            class="flex-grow-1"
            style="max-width: 200px"
            @keydown.enter.prevent="onSaveSnippet"
          />
          <v-btn size="small" color="primary" :disabled="!canSave" @click="onSaveSnippet">Save</v-btn>
        </div>
        <p v-if="saveMessage" class="text-caption text-medium-emphasis">{{ saveMessage }}</p>
      </v-form>
    </v-card-text>
  </v-card>
</template>
