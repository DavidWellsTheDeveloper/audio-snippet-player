<script setup lang="ts">
import { onMounted } from 'vue'
import { useTriviaDb } from '~/composables/useTriviaDb'
import { triviaEventPath, TRIVIA_ROUTES } from '~/constants/trivia'

const { createEvent } = useTriviaDb()

onMounted(async () => {
  if (typeof window === 'undefined') {
    return
  }

  const ev = await createEvent({ title: 'New trivia night' })
  await navigateTo(triviaEventPath(ev.id))
})
</script>

<template>
  <p class="text-body2 text-medium-emphasis">Creating event…</p>
  <p class="text-caption mt-2">
    If you are not redirected, go to <NuxtLink :to="TRIVIA_ROUTES.home">Trivia home</NuxtLink>.
  </p>
</template>
