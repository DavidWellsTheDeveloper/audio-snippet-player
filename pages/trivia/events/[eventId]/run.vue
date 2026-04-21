<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { postPresenterReload } from '~/composables/usePresenterSync'
import { useTriviaDb } from '~/composables/useTriviaDb'
import {
  triviaEventPath,
  triviaPresentPath,
  type PresenterPhase,
} from '~/constants/trivia'
import { openSnippetPlayerUrl } from '~/utils/triviaOpenSnippet'
import { sortQuestionsByOrder, sortRoundsByOrder, teamTotalPoints } from '~/utils/triviaDomain'

const route = useRoute()
const eventId = computed(() => String(route.params.eventId))

const db = useTriviaDb()

const event = ref<TriviaEvent | null>(null)
const rounds = ref<TriviaRound[]>([])
const teams = ref<TriviaTeam[]>([])
const questionsByRound = ref<Record<string, TriviaQuestion[]>>({})
const scores = ref<TriviaRoundScore[]>([])
const loading = ref(true)

const selectedRoundId = ref<string | null>(null)
const scoreDraft = ref<Record<string, string>>({})
const hostReady = ref(false)

async function load() {
  if (typeof window === 'undefined') {
    return
  }

  loading.value = true
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

  const ptr = ev.presenterPointer
  if (ptr.roundId && rounds.value.some((r) => r.id === ptr.roundId)) {
    selectedRoundId.value = ptr.roundId
  } else if (rounds.value[0]) {
    selectedRoundId.value = rounds.value[0].id
  }

  initScoreDraft()
  loading.value = false
  hostReady.value = true
}

function initScoreDraft() {
  const next: Record<string, string> = {}
  for (const t of teams.value) {
    for (const r of rounds.value) {
      const id = `${t.id}@${r.id}`
      const row = scores.value.find((s) => s.teamId === t.id && s.roundId === r.id)
      next[id] = row ? String(row.points) : '0'
    }
  }
  scoreDraft.value = next
}

onMounted(load)

watch(eventId, () => {
  hostReady.value = false
  load()
})

watch(selectedRoundId, (newId, oldId) => {
  if (!hostReady.value || oldId === undefined || newId === oldId || !newId) {
    return
  }

  onRoundChange()
})

const currentRound = computed(() => rounds.value.find((r) => r.id === selectedRoundId.value) ?? null)
const currentQuestions = computed(() => {
  if (!currentRound.value) {
    return []
  }

  return questionsByRound.value[currentRound.value.id] ?? []
})

const pointer = computed(() => event.value?.presenterPointer)

const currentQuestion = computed(() => {
  const idx = pointer.value?.questionIndex ?? 0
  const qlist = currentQuestions.value

  return qlist[idx] ?? null
})

async function persistPointer(updates: { phase: PresenterPhase; questionIndex?: number; roundId?: string | null }) {
  const ev = event.value
  if (!ev) {
    return
  }

  const nextRoundId = updates.roundId !== undefined ? updates.roundId : (selectedRoundId.value ?? ev.presenterPointer.roundId)
  const pointerNext = {
    phase: updates.phase,
    questionIndex: updates.questionIndex ?? ev.presenterPointer.questionIndex,
    roundId: nextRoundId,
  }
  await db.setPresenterPointer(ev.id, pointerNext)
  await db.updateEvent(ev.id, { status: 'live' })
  await load()
  postPresenterReload(ev.id)
}

async function onRoundChange() {
  const ev = event.value
  if (!ev || !selectedRoundId.value) {
    return
  }

  await db.setPresenterPointer(ev.id, {
    phase: 'idle',
    questionIndex: 0,
    roundId: selectedRoundId.value,
  })
  await db.updateEvent(ev.id, { status: 'live' })
  await load()
  postPresenterReload(ev.id)
}

async function showQuestion() {
  await persistPointer({ phase: 'question' })
}

async function showAnswer() {
  await persistPointer({ phase: 'answer' })
}

async function prevQuestion() {
  const ev = event.value
  if (!ev || !currentRound.value) {
    return
  }

  const qlist = currentQuestions.value
  const nextIdx = Math.max(0, (pointer.value?.questionIndex ?? 0) - 1)

  await db.setPresenterPointer(ev.id, {
    phase: 'question',
    questionIndex: nextIdx,
    roundId: currentRound.value.id,
  })
  await load()
  postPresenterReload(ev.id)
}

async function nextQuestion() {
  const ev = event.value
  if (!ev || !currentRound.value) {
    return
  }

  const qlist = currentQuestions.value
  const idx = pointer.value?.questionIndex ?? 0
  const nextIdx = Math.min(qlist.length - 1, idx + 1)

  await db.setPresenterPointer(ev.id, {
    phase: 'question',
    questionIndex: nextIdx,
    roundId: currentRound.value.id,
  })
  await load()
  postPresenterReload(ev.id)
}

async function saveScore(teamId: string, roundId: string) {
  const key = `${teamId}@${roundId}`
  const raw = scoreDraft.value[key]
  const points = Number(raw)

  if (!Number.isFinite(points)) {
    return
  }

  await db.upsertRoundScore({
    eventId: eventId.value,
    points,
    roundId,
    teamId,
  })
  await load()
  postPresenterReload(eventId.value)
}

function totalForTeam(teamId: string): number {
  const rows = scores.value.filter((s) => s.teamId === teamId)

  return teamTotalPoints(rows)
}

function playMusicClip() {
  const q = currentQuestion.value
  if (!q?.snippetPlayerUrl?.trim()) {
    return
  }

  openSnippetPlayerUrl(q.snippetPlayerUrl)
}

async function endEvent() {
  if (!event.value) {
    return
  }

  if (!confirm('Mark this event as ended?')) {
    return
  }

  await db.setEventStatus(event.value.id, 'ended')
  await load()
}
</script>

<template>
  <div v-if="loading" class="text-body2 text-medium-emphasis">Loading…</div>
  <div v-else-if="!event">
    <v-alert type="warning" variant="tonal">Event not found.</v-alert>
    <NuxtLink to="/trivia" class="text-primary">Back</NuxtLink>
  </div>
  <div v-else>
    <div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-4">
      <div>
        <h1 class="text-h5">Host — {{ event.title }}</h1>
        <NuxtLink :to="triviaEventPath(event.id)" class="text-caption text-primary text-decoration-none">Edit</NuxtLink>
        ·
        <a :href="triviaPresentPath(event.id)" target="_blank" rel="noopener noreferrer" class="text-caption text-primary text-decoration-none">
          Presenter window
        </a>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <v-btn variant="tonal" @click="endEvent">End event</v-btn>
      </div>
    </div>

    <v-card class="mb-4">
      <v-card-title class="text-subtitle-1">Round &amp; screen</v-card-title>
      <v-card-text>
        <v-select
          v-model="selectedRoundId"
          label="Active round"
          :items="rounds.map((r) => ({ title: r.title + (r.type === 'music' ? ' (music)' : ''), value: r.id }))"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-4 max-field"
        />

        <p v-if="currentRound?.type === 'music'" class="text-caption text-medium-emphasis mb-2">
          Music round: use “Play clip” when the question points at a saved snippet URL.
        </p>

        <div class="d-flex flex-wrap gap-2 mb-2">
          <v-btn color="primary" :disabled="!currentQuestion" @click="showQuestion">Audience: question</v-btn>
          <v-btn color="secondary" :disabled="!currentQuestion" @click="showAnswer">Audience: answer</v-btn>
          <v-btn variant="outlined" :disabled="!currentQuestions.length" @click="prevQuestion">Prev question</v-btn>
          <v-btn variant="outlined" :disabled="!currentQuestions.length" @click="nextQuestion">Next question</v-btn>
        </div>
        <div class="d-flex flex-wrap gap-2 align-center mb-2">
          <v-btn
            v-if="currentRound?.type === 'music' && currentQuestion?.snippetPlayerUrl?.trim()"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-play"
            @click="playMusicClip"
          >
            Play clip (new tab)
          </v-btn>
          <span class="text-caption text-medium-emphasis">
            Host view: Q{{ (pointer?.questionIndex ?? 0) + 1 }} / {{ currentQuestions.length }}
            · phase {{ pointer?.phase ?? 'idle' }}
          </span>
        </div>
        <v-alert v-if="currentQuestion" type="info" variant="tonal" density="compact" class="text-body2">
          <strong>Q:</strong> {{ currentQuestion.promptText }}
        </v-alert>
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title class="text-subtitle-1">Scores (selected round)</v-card-title>
      <v-card-text>
        <v-table v-if="teams.length && selectedRoundId" density="compact">
          <thead>
            <tr>
              <th>Team</th>
              <th class="points-col">Points this round</th>
              <th>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in teams" :key="t.id">
              <td>{{ t.name }}</td>
              <td>
                <v-text-field
                  v-model="scoreDraft[`${t.id}@${selectedRoundId}`]"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="points-field"
                />
              </td>
              <td>{{ totalForTeam(t.id) }}</td>
              <td>
                <v-btn size="small" variant="text" @click="saveScore(t.id, selectedRoundId)">Save</v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
        <p v-else class="text-body2 text-medium-emphasis">Add teams from the editor, then assign points per round.</p>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.max-field {
  max-width: 420px;
}

.points-col {
  width: 140px;
}

.points-field {
  max-width: 120px;
}
</style>
