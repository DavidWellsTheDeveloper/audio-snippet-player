<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSnippetsDb, type SavedSnippet } from '~/composables/useSnippetsDb'
import { ROUTES } from '~/constants/snippet'

const emit = defineEmits<{
  select: [playerUrl: string]
}>()

const { getAllSnippets } = useSnippetsDb()

const items = ref<SavedSnippet[]>([])
const loading = ref(false)
const copyHint = ref('')

async function load() {
  if (typeof window === 'undefined') {
    return
  }

  loading.value = true
  try {
    items.value = await getAllSnippets()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
})

async function copyUrl(url: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return
  }

  try {
    await navigator.clipboard.writeText(url)
    copyHint.value = 'Copied'
    setTimeout(() => {
      copyHint.value = ''
    }, 2000)
  } catch {
    copyHint.value = ''
  }
}
</script>

<template>
  <v-card variant="tonal" color="primary" class="snippets-picker">
    <v-card-title class="text-subtitle-2 d-flex flex-wrap align-center gap-2">
      Saved audio clips
      <v-spacer />
      <v-btn size="x-small" variant="text" :loading="loading" @click="load">Refresh</v-btn>
    </v-card-title>
    <v-card-text class="pt-0">
      <p class="text-caption text-medium-emphasis mb-3">
        Create clips on the snippet page, then attach one to this question.
      </p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <v-btn size="small" color="primary" variant="flat" :to="ROUTES.create">
          Create clip
        </v-btn>
        <v-btn size="small" variant="outlined" :to="ROUTES.saved">
          Saved library
        </v-btn>
      </div>

      <p v-if="loading" class="text-caption text-medium-emphasis">Loading clips…</p>
      <p v-else-if="items.length === 0" class="text-caption text-medium-emphasis">
        No saved clips yet. Use “Create clip” to add YouTube or direct audio snippets.
      </p>

      <v-list v-else class="snippets-picker__list bg-transparent pa-0" density="compact">
        <v-list-item
          v-for="s in items"
          :key="s.id"
          class="snippets-picker__item border rounded mb-2 px-3"
          rounded
        >
          <v-list-item-title class="text-body-2 text-wrap">{{ s.name }}</v-list-item-title>
          <v-list-item-subtitle class="text-caption text-truncate mt-1 snippets-picker__url">
            {{ s.playerUrl }}
          </v-list-item-subtitle>
          <template #append>
            <div class="d-flex flex-wrap gap-1 align-center">
              <v-btn size="small" color="primary" variant="tonal" @click="emit('select', s.playerUrl)">
                Use clip
              </v-btn>
              <v-btn size="small" variant="text" @click="copyUrl(s.playerUrl)">
                Copy URL
              </v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>
      <p v-if="copyHint" class="text-caption text-success mt-2">{{ copyHint }}</p>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.snippets-picker__list {
  max-height: 280px;
  overflow-y: auto;
}

.snippets-picker__url {
  max-width: 100%;
  display: block;
}
</style>
