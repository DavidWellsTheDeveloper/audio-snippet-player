<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSnippetsDb } from '~/composables/useSnippetsDb'
import type { SavedSnippet } from '~/composables/useSnippetsDb'

const { getAllSnippets, deleteSnippet } = useSnippetsDb()
const snippets = ref<SavedSnippet[]>([])
const loading = ref(true)

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { dateStyle: 'medium' }) + ' ' + d.toLocaleTimeString(undefined, { timeStyle: 'short' })
  } catch {
    return iso
  }
}

async function load() {
  if (typeof window === 'undefined') return
  loading.value = true
  try {
    snippets.value = await getAllSnippets()
  } finally {
    loading.value = false
  }
}

async function remove(id: string) {
  await deleteSnippet(id)
  await load()
}

onMounted(load)
</script>

<template>
  <v-card class="mx-auto" max-width="800">
    <v-card-title class="text-h5">Saved snippets</v-card-title>
    <v-card-text>
      <p v-if="loading" class="text-body2 text-medium-emphasis">Loading…</p>
      <template v-else-if="snippets.length === 0">
        <p class="text-body2 text-medium-emphasis">No saved snippets yet.</p>
        <p class="text-caption mt-1">
          <NuxtLink to="/form">Create a snippet</NuxtLink> or open the <NuxtLink to="/">player</NuxtLink> with a URL and save it there.
        </p>
      </template>
      <v-list v-else>
        <v-list-item
          v-for="snippet in snippets"
          :key="snippet.id"
          class="saved-item"
        >
          <v-list-item-title>{{ snippet.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ formatDate(snippet.dateSaved) }}</v-list-item-subtitle>
          <template #append>
            <a
              :href="snippet.playerUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary text-body2 text-decoration-none mr-2"
            >
              Open
            </a>
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              aria-label="Delete"
              @click="remove(snippet.id)"
            >
              <v-icon size="small">mdi-delete-outline</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.saved-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.saved-item:last-child {
  border-bottom: none;
}
</style>
