<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { subscribePresenterReload } from '~/composables/usePresenterSync'
import { useTriviaDb } from '~/composables/useTriviaDb'
import { TRIVIA_PRESENTER_POLL_MS, type TriviaEvent, type TriviaQuestion, type TriviaRound, type TriviaRoundScore, type TriviaTeam } from '~/constants/trivia'
import { openSnippetPlayerUrl } from '~/utils/triviaOpenSnippet'
import { sortQuestionsByOrder, sortRoundsByOrder, teamTotalPoints } from '~/utils/triviaDomain'

definePageMeta({
  layout: 'trivia-presenter',
})

const route = useRoute()
const eventId = computed(() => String(route.params.eventId))

const db = useTriviaDb()

const event = ref<TriviaEvent | null>(null)
const rounds = ref<TriviaRound[]>([])
const teams = ref<TriviaTeam[]>([])
const questionsByRound = ref<Record<string, TriviaQuestion[]>>({})
const scores = ref<TriviaRoundScore[]>([])
const loading = ref(true)

let pollId: ReturnType<typeof setInterval> | null = null
let unsubscribeBc: (() => void) | null = null

async function load(opts?: { silent: boolean }) {
  if (typeof window === 'undefined') {
    return
  }

  if (!opts?.silent) {
    loading.value = true
  }

  const ev = await db.getEvent(eventId.value)
  event.value = ev ?? null
  if (!ev) {
    loading.value = false

    return
  }

  rounds.value = sortRoundsByOrder(await db.listRoundsForEvent(ev.id))
  teams.value = (await db.listTeamsForEvent(ev.id)).sort((a, b) => a.sortOrder - b.sortOrder)
  scores.value = await db.listScoresForEvent(ev.id)

  const map: Record<string, TriviaQuestion[]> = {}
  for (const r of rounds.value) {
    map[r.id] = sortQuestionsByOrder(await db.listQuestionsForRound(r.id))
  }
  questionsByRound.value = map
  loading.value = false
}

onMounted(() => {
  load()

  pollId = setInterval(() => {
    load({ silent: true })
  }, TRIVIA_PRESENTER_POLL_MS)

  unsubscribeBc = subscribePresenterReload(eventId.value, () => {
    load({ silent: true })
  })
})

onUnmounted(() => {
  if (pollId) {
    clearInterval(pollId)
  }

  if (unsubscribeBc) {
    unsubscribeBc()
  }
})

const pointer = computed(() => event.value?.presenterPointer)

const activeRound = computed(() => {
  const id = pointer.value?.roundId
  if (!id) {
    return null
  }

  return rounds.value.find((r) => r.id === id) ?? null
})

const roundQuestions = computed(() => {
  if (!activeRound.value) {
    return []
  }

  return questionsByRound.value[activeRound.value.id] ?? []
})

const activeQuestion = computed(() => {
  const idx = pointer.value?.questionIndex ?? 0

  return roundQuestions.value[idx] ?? null
})

const standings = computed(() => {
  return teams.value
    .map((t) => ({
      name: t.name,
      total: teamTotalPoints(scores.value.filter((s) => s.teamId === t.id)),
    }))
    .sort((a, b) => b.total - a.total)
})
</script>

<template>
  <div class="presenter-root pa-6">
    <div v-if="loading" class="presenter-muted">Loading…</div>
    <div v-else-if="!event" class="presenter-muted">Event not found.</div>
    <div v-else class="d-flex flex-column gap-8">
      <header class="d-flex flex-wrap justify-space-between align-start ga-2">
        <div>
          <p class="text-overline text-medium-emphasis mb-1">
            {{ event.status === 'live' ? 'Live' : event.status }}
          </p>
          <h1 class="presenter-title">{{ event.title }}</h1>
          <p v-if="activeRound" class="text-h6 text-medium-emphasis mt-2">
            {{ activeRound.title }}
            <span v-if="activeRound.type === 'music'" class="text-caption"> · Music</span>
          </p>
        </div>
        <div class="presenter-standings text-body2">
          <p class="text-overline text-medium-emphasis mb-1">Standings</p>
          <ol class="pl-4 mb-0">
            <li v-for="(row, i) in standings" :key="i" class="mb-1">
              {{ row.name }} — {{ row.total }}
            </li>
          </ol>
        </div>
      </header>

      <section v-if="pointer?.phase === 'idle' || !activeQuestion" class="presenter-stage presenter-muted">
        <p class="text-h4 text-medium-emphasis">Waiting for the host…</p>
      </section>

      <section v-else-if="pointer.phase === 'question' && activeQuestion" class="presenter-stage">
        <p class="text-overline text-medium-emphasis mb-4">Question</p>
        <p class="presenter-q">{{ activeQuestion.promptText }}</p>
        <v-btn
          v-if="activeRound?.type === 'music' && activeQuestion.snippetPlayerUrl?.trim()"
          class="mt-6"
          size="large"
          color="primary"
          prepend-icon="mdi-play"
          @click="openSnippetPlayerUrl(activeQuestion.snippetPlayerUrl)"
        >
          Play clip
        </v-btn>
      </section>

      <section v-else-if="pointer.phase === 'answer' && activeQuestion" class="presenter-stage">
        <p class="text-overline text-medium-emphasis mb-2">Answer</p>
        <p class="presenter-answer">{{ activeQuestion.answerText }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.presenter-root {
  min-height: 100vh;
  background: rgb(var(--v-theme-surface));
}

.presenter-title {
  font-size: clamp(1.5rem, 4vw, 2.75rem);
  line-height: 1.2;
  font-weight: 600;
}

.presenter-stage {
  flex: 1 1 auto;
}

.presenter-q {
  font-size: clamp(1.75rem, 5vw, 3.5rem);
  line-height: 1.25;
  font-weight: 600;
}

.presenter-answer {
  font-size: clamp(1.5rem, 4vw, 2.75rem);
  line-height: 1.3;
  font-weight: 500;
}

.presenter-muted {
  opacity: 0.85;
}

.presenter-standings {
  min-width: 200px;
}
</style>
