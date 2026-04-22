<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTriviaDb } from '~/composables/useTriviaDb'
import {
  triviaEventPath,
  triviaEventRunPath,
  triviaPresentPath,
  TRIVIA_ROUTES,
  type TriviaEvent,
} from '~/constants/trivia'
import { ROUTES } from '~/constants/snippet'

const {
  createEvent,
  deleteEvent,
  listEvents,
} = useTriviaDb()

const events = ref<TriviaEvent[]>([])
const loading = ref(true)
const creating = ref(false)

async function load() {
  if (typeof window === 'undefined') {
    return
  }

  loading.value = true
  events.value = await listEvents()
  loading.value = false
}

onMounted(load)

async function onCreate() {
  creating.value = true
  try {
    const ev = await createEvent({ title: 'New trivia night' })
    await navigateTo(triviaEventPath(ev.id))
  } finally {
    creating.value = false
  }
}

async function onDelete(id: string) {
  if (!confirm('Delete this event and all rounds, teams, and scores?')) {
    return
  }

  await deleteEvent(id)
  await load()
}

function formatUpdated(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-4">
      <h1 class="text-h5">
        Bar trivia
      </h1>
      <div class="d-flex flex-wrap gap-2">
        <v-btn
          color="primary"
          :loading="creating"
          prepend-icon="mdi-plus"
          @click="onCreate"
        >
          New event
        </v-btn>
        <v-btn variant="tonal" :to="ROUTES.create">
          Snippet builder
        </v-btn>
      </div>
    </div>

    <p class="text-body2 text-medium-emphasis mb-4">
      Create events, add rounds and questions, run the night from the host dashboard, and open a
      <strong>presenter</strong> window for the audience screen.
    </p>

    <p v-if="loading" class="text-body2 text-medium-emphasis">Loading…</p>
    <v-alert v-else-if="events.length === 0" type="info" variant="tonal" class="mb-4">
      No events yet. Use “New event” to start building a trivia night.
    </v-alert>

    <v-list v-else class="border rounded">
      <v-list-item
        v-for="ev in events"
        :key="ev.id"
        class="border-b"
      >
        <v-list-item-title>{{ ev.title }}</v-list-item-title>
        <v-list-item-subtitle>
          {{ ev.status }} · Updated {{ formatUpdated(ev.updatedAt) }}
        </v-list-item-subtitle>
        <template #append>
          <div class="d-flex flex-wrap align-center gap-1">
            <v-btn size="small" variant="text" :to="triviaEventPath(ev.id)">Edit</v-btn>
            <v-btn size="small" variant="text" :to="triviaEventRunPath(ev.id)">Host</v-btn>
            <v-btn size="small" variant="text" :to="triviaPresentPath(ev.id)" target="_blank">Present</v-btn>
            <v-btn size="small" variant="text" color="error" @click="onDelete(ev.id)">Delete</v-btn>
          </div>
        </template>
      </v-list-item>
    </v-list>

    <p class="text-caption text-medium-emphasis mt-4">
      Shortcut: <NuxtLink :to="TRIVIA_ROUTES.newEvent" class="text-primary">/trivia/events/new</NuxtLink>
      creates an event and opens the editor.
    </p>
  </div>
</template>
