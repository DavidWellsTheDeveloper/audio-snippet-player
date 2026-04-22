<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTriviaDb } from '~/composables/useTriviaDb'
import {
  TRIVIA_DEFAULT_QUESTION_POINTS,
  triviaEventRunPath,
  type RoundType,
  type TriviaEvent,
  type TriviaQuestion,
  type TriviaRound,
  type TriviaTeam,
} from '~/constants/trivia'
import { ROUTES } from '~/constants/snippet'
import { sortQuestionsByOrder, sortRoundsByOrder } from '~/utils/triviaDomain'

const route = useRoute()
const eventId = computed(() => String(route.params.eventId))

const db = useTriviaDb()

const event = ref<TriviaEvent | null>(null)
const rounds = ref<TriviaRound[]>([])
const teams = ref<TriviaTeam[]>([])
const questionsByRound = ref<Record<string, TriviaQuestion[]>>({})
const loading = ref(true)

const tab = ref<'rounds' | 'teams'>('rounds')

const newRoundTitle = ref('')
const newRoundType = ref<RoundType>('standard')
const showAddRound = ref(false)

const newTeamName = ref('')

const editingQuestionId = ref<string | null>(null)

/** Index of the open round panel (accordion). Ensures panels stay open after silent reloads. */
const expansionOpen = ref<number | undefined>(undefined)

async function loadAll(opts?: { silent?: boolean }) {
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

  const rs = sortRoundsByOrder(await db.listRoundsForEvent(ev.id))
  rounds.value = rs
  teams.value = sortTeams(await db.listTeamsForEvent(ev.id))

  const map: Record<string, TriviaQuestion[]> = {}
  for (const r of rs) {
    map[r.id] = sortQuestionsByOrder(await db.listQuestionsForRound(r.id))
  }
  questionsByRound.value = map
  loading.value = false
}

function sortTeams(t: TriviaTeam[]): TriviaTeam[] {
  return [...t].sort((a, b) => a.sortOrder - b.sortOrder)
}

onMounted(() => loadAll())

watch(eventId, () => loadAll())

async function saveMeta() {
  const ev = event.value
  if (!ev) {
    return
  }

  await db.updateEvent(ev.id, { notes: ev.notes, title: ev.title })
  await loadAll({ silent: true })
}

async function addRound() {
  const title = newRoundTitle.value.trim() || 'Round'
  await db.createRound({ eventId: eventId.value, title, type: newRoundType.value })
  newRoundTitle.value = ''
  newRoundType.value = 'standard'
  showAddRound.value = false
  await loadAll({ silent: true })
}

async function removeRound(id: string) {
  if (!confirm('Delete this round and all its questions and scores for this round?')) {
    return
  }

  await db.deleteRound(id)
  await loadAll({ silent: true })
}

async function addQuestion(roundId: string) {
  const created = await db.createQuestion({
    answerText: '',
    points: TRIVIA_DEFAULT_QUESTION_POINTS,
    promptText: 'New question',
    roundId,
    snippetPlayerUrl: '',
  })
  await loadAll({ silent: true })
  const idx = rounds.value.findIndex((r) => r.id === roundId)
  if (idx >= 0) {
    expansionOpen.value = idx
  }

  editingQuestionId.value = created.id
}

async function saveQuestion(q: TriviaQuestion) {
  await db.updateQuestion(q.id, {
    answerText: q.answerText,
    points: q.points,
    promptText: q.promptText,
    snippetPlayerUrl: q.snippetPlayerUrl,
  })
  editingQuestionId.value = null
  await loadAll({ silent: true })
}

async function cancelQuestionEdit() {
  editingQuestionId.value = null
  await loadAll({ silent: true })
}

async function removeQuestion(id: string) {
  if (!confirm('Delete this question?')) {
    return
  }

  await db.deleteQuestion(id)
  await loadAll({ silent: true })
}

async function addTeam() {
  const name = newTeamName.value.trim() || 'Team'
  await db.createTeam({ eventId: eventId.value, name })
  newTeamName.value = ''
  await loadAll({ silent: true })
}

async function saveTeam(t: TriviaTeam) {
  await db.updateTeam(t.id, { name: t.name })
  await loadAll({ silent: true })
}

async function removeTeam(id: string) {
  if (!confirm('Delete this team and its score rows?')) {
    return
  }

  await db.deleteTeam(id)
  await loadAll({ silent: true })
}

function openSnippetBuilder() {
  window.open(ROUTES.create, '_blank')
}
</script>

<template>
  <div v-if="loading" class="text-body2 text-medium-emphasis">Loading…</div>
  <div v-else-if="!event">
    <v-alert type="warning" variant="tonal">Event not found.</v-alert>
    <NuxtLink to="/trivia" class="text-primary">Back to trivia</NuxtLink>
  </div>
  <div v-else>
    <div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-4">
      <div>
        <h1 class="text-h5">Edit event</h1>
        <NuxtLink to="/trivia" class="text-caption text-primary text-decoration-none">← Trivia home</NuxtLink>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <v-btn color="primary" :to="triviaEventRunPath(event.id)">Open host</v-btn>
        <v-btn variant="outlined" :href="`/trivia/present/${event.id}`" target="_blank">Open presenter</v-btn>
      </div>
    </div>

    <v-card class="mb-4">
      <v-card-text>
        <v-text-field
          v-model="event.title"
          label="Title"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-3"
        />
        <v-textarea
          v-model="event.notes"
          label="Host notes (private)"
          variant="outlined"
          density="compact"
          rows="2"
          hide-details
          class="mb-3"
        />
        <v-btn size="small" color="primary" @click="saveMeta">Save</v-btn>
      </v-card-text>
    </v-card>

    <v-tabs v-model="tab" class="mb-4">
      <v-tab value="rounds">Rounds &amp; questions</v-tab>
      <v-tab value="teams">Teams</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="rounds">
        <div class="d-flex flex-wrap align-center gap-2 mb-4">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="showAddRound = true">
            Add round
          </v-btn>
          <v-btn variant="tonal" prepend-icon="mdi-music" @click="openSnippetBuilder">
            Snippet builder (music clips)
          </v-btn>
        </div>

        <v-dialog v-model="showAddRound" max-width="420">
          <v-card>
            <v-card-title>Add round</v-card-title>
            <v-card-text>
              <v-text-field v-model="newRoundTitle" label="Round title" variant="outlined" class="mb-3" />
              <v-select
                v-model="newRoundType"
                label="Round type"
                :items="[
                  { title: 'Standard', value: 'standard' },
                  { title: 'Music (audio clips)', value: 'music' },
                ]"
                item-title="title"
                item-value="value"
                variant="outlined"
              />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn variant="text" @click="showAddRound = false">Cancel</v-btn>
              <v-btn color="primary" @click="addRound">Add</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <p v-if="rounds.length === 0" class="text-body2 text-medium-emphasis">No rounds yet.</p>

        <v-expansion-panels
          v-else
          v-model="expansionOpen"
          variant="accordion"
          class="mb-4"
        >
          <v-expansion-panel
            v-for="round in rounds"
            :key="round.id"
          >
            <v-expansion-panel-title>
              {{ round.title }}
              <span class="text-caption text-medium-emphasis ml-2">({{ round.type }})</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="d-flex flex-wrap gap-2 mb-3">
                <v-btn size="small" color="primary" @click="addQuestion(round.id)">Add question</v-btn>
                <v-btn size="small" variant="text" color="error" @click="removeRound(round.id)">Delete round</v-btn>
              </div>

              <p
                v-if="!(questionsByRound[round.id]?.length)"
                class="text-body2 text-medium-emphasis mb-2"
              >
                No questions in this round.
              </p>

              <v-card
                v-for="q in questionsByRound[round.id]"
                :key="q.id"
                variant="outlined"
                class="mb-3 pa-3"
              >
                <div v-if="editingQuestionId === q.id" class="d-flex flex-column gap-3">
                  <v-text-field
                    v-model="q.promptText"
                    label="Question prompt"
                    variant="outlined"
                    density="compact"
                  />
                  <v-text-field
                    v-model="q.answerText"
                    label="Correct answer (for reveal)"
                    variant="outlined"
                    density="compact"
                  />
                  <v-text-field
                    v-model.number="q.points"
                    label="Points"
                    type="number"
                    min="0"
                    step="1"
                    variant="outlined"
                    density="compact"
                  />

                  <TriviaSavedSnippetsPicker
                    v-if="round.type === 'music'"
                    @select="(url) => { q.snippetPlayerUrl = url }"
                  />

                  <v-text-field
                    v-model="q.snippetPlayerUrl"
                    label="Music clip URL"
                    variant="outlined"
                    density="compact"
                    hint="Filled automatically when you use a saved clip, or paste /play… from the snippet player."
                    persistent-hint
                  />
                  <div class="d-flex gap-2">
                    <v-btn size="small" color="primary" @click="saveQuestion(q)">Save</v-btn>
                    <v-btn size="small" variant="text" @click="cancelQuestionEdit">Cancel</v-btn>
                  </div>
                </div>
                <div v-else class="d-flex flex-wrap justify-space-between gap-2 align-start">
                  <div>
                    <p class="font-weight-medium">{{ q.promptText }}</p>
                    <p class="text-caption text-medium-emphasis">{{ q.points }} pt · answer hidden</p>
                  </div>
                  <div class="d-flex flex-wrap gap-1">
                    <v-btn size="small" variant="text" @click="editingQuestionId = q.id">Edit</v-btn>
                    <v-btn size="small" variant="text" color="error" @click="removeQuestion(q.id)">Delete</v-btn>
                  </div>
                </div>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-window-item>

      <v-window-item value="teams">
        <div class="d-flex flex-wrap align-end gap-2 mb-4">
          <v-text-field
            v-model="newTeamName"
            label="Team name"
            variant="outlined"
            density="compact"
            hide-details
            class="team-name-field"
          />
          <v-btn color="primary" @click="addTeam">Add team</v-btn>
        </div>

        <v-list v-if="teams.length" class="border rounded">
          <v-list-item v-for="t in teams" :key="t.id">
            <v-text-field
              v-model="t.name"
              label="Team name"
              variant="underlined"
              density="compact"
              hide-details
              @blur="saveTeam(t)"
            />
            <template #append>
              <v-btn icon size="small" variant="text" color="error" @click="removeTeam(t.id)">
                <v-icon>mdi-delete-outline</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
        <p v-else class="text-body2 text-medium-emphasis">No teams yet.</p>
      </v-window-item>
    </v-window>
  </div>
</template>

<style scoped>
.team-name-field {
  flex: 1 1 220px;
  max-width: 320px;
}
</style>
