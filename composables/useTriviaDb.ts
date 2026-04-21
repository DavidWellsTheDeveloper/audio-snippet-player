import {
  TRIVIA_DB_NAME,
  TRIVIA_DB_VERSION,
  TRIVIA_STORES,
  type EventStatus,
  type PresenterPointer,
  type RoundType,
  type TriviaEvent,
  type TriviaQuestion,
  type TriviaRound,
  type TriviaRoundScore,
  type TriviaTeam,
} from '~/constants/trivia'
import { scoreRowId } from '~/utils/triviaDomain'

function defaultPresenterPointer(): PresenterPointer {
  return {
    phase: 'idle',
    questionIndex: 0,
    roundId: null,
  }
}

function openTriviaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(TRIVIA_DB_NAME, TRIVIA_DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(TRIVIA_STORES.events)) {
        db.createObjectStore(TRIVIA_STORES.events, { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains(TRIVIA_STORES.rounds)) {
        const rounds = db.createObjectStore(TRIVIA_STORES.rounds, { keyPath: 'id' })
        rounds.createIndex('byEventId', 'eventId', { unique: false })
      }

      if (!db.objectStoreNames.contains(TRIVIA_STORES.questions)) {
        const questions = db.createObjectStore(TRIVIA_STORES.questions, { keyPath: 'id' })
        questions.createIndex('byRoundId', 'roundId', { unique: false })
      }

      if (!db.objectStoreNames.contains(TRIVIA_STORES.teams)) {
        const teams = db.createObjectStore(TRIVIA_STORES.teams, { keyPath: 'id' })
        teams.createIndex('byEventId', 'eventId', { unique: false })
      }

      if (!db.objectStoreNames.contains(TRIVIA_STORES.roundScores)) {
        const roundScores = db.createObjectStore(TRIVIA_STORES.roundScores, { keyPath: 'id' })
        roundScores.createIndex('byEventId', 'eventId', { unique: false })
      }
    }
  })
}

function runRead<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  return openTriviaDb().then(
    (db) =>
      fn(db).finally(() => {
        db.close()
      }),
  )
}

function runWrite<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  return openTriviaDb().then(
    (db) =>
      fn(db).finally(() => {
        db.close()
      }),
  )
}

export function useTriviaDb() {
  async function getEvent(id: string): Promise<TriviaEvent | undefined> {
    return runRead(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.events, 'readonly')
          const r = tx.objectStore(TRIVIA_STORES.events).get(id)
          r.onerror = () => reject(r.error)
          r.onsuccess = () => resolve(r.result as TriviaEvent | undefined)
        }),
    )
  }

  async function listEvents(): Promise<TriviaEvent[]> {
    return runRead(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.events, 'readonly')
          const r = tx.objectStore(TRIVIA_STORES.events).getAll()
          r.onerror = () => reject(r.error)
          r.onsuccess = () => {
            const rows = (r.result as TriviaEvent[]) || []
            rows.sort((a, b) => (b.updatedAt < a.updatedAt ? -1 : 1))

            resolve(rows)
          }
        }),
    )
  }

  async function createEvent(payload: { notes?: string; title: string }): Promise<TriviaEvent> {
    const now = new Date().toISOString()
    const record: TriviaEvent = {
      createdAt: now,
      id: crypto.randomUUID(),
      notes: (payload.notes ?? '').trim(),
      presenterPointer: defaultPresenterPointer(),
      status: 'draft',
      title: payload.title.trim() || 'Untitled event',
      updatedAt: now,
    }

    return runWrite(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.events, 'readwrite')
          const req = tx.objectStore(TRIVIA_STORES.events).put(record)
          req.onerror = () => reject(req.error)
          req.onsuccess = () => resolve(record)
        }),
    )
  }

  async function updateEvent(
    id: string,
    patch: Partial<Pick<TriviaEvent, 'notes' | 'presenterPointer' | 'status' | 'title'>>,
  ): Promise<void> {
    const existing = await getEvent(id)
    if (!existing) {
      throw new Error('Event not found')
    }

    const updated: TriviaEvent = {
      ...existing,
      updatedAt: new Date().toISOString(),
    }
    if (patch.title !== undefined) {
      updated.title = patch.title.trim() || 'Untitled event'
    }
    if (patch.notes !== undefined) {
      updated.notes = patch.notes.trim()
    }
    if (patch.status !== undefined) {
      updated.status = patch.status
    }
    if (patch.presenterPointer !== undefined) {
      updated.presenterPointer = patch.presenterPointer
    }

    return runWrite(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.events, 'readwrite')
          const req = tx.objectStore(TRIVIA_STORES.events).put(updated)
          req.onerror = () => reject(req.error)
          req.onsuccess = () => resolve()
        }),
    )
  }

  async function setPresenterPointer(eventId: string, pointer: PresenterPointer): Promise<void> {
    return updateEvent(eventId, { presenterPointer: pointer })
  }

  async function setEventStatus(eventId: string, status: EventStatus): Promise<void> {
    return updateEvent(eventId, { status })
  }

  async function deleteEvent(id: string): Promise<void> {
    const rounds = await listRoundsForEvent(id)
    const teams = await listTeamsForEvent(id)

    for (const round of rounds) {
      await deleteRound(round.id)
    }

    for (const team of teams) {
      await deleteTeam(team.id)
    }

    const scores = await listScoresForEvent(id)
    for (const s of scores) {
      await deleteScoreRow(s.id)
    }

    return runWrite(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.events, 'readwrite')
          const req = tx.objectStore(TRIVIA_STORES.events).delete(id)
          req.onerror = () => reject(req.error)
          req.onsuccess = () => resolve()
        }),
    )
  }

  async function listRoundsForEvent(eventId: string): Promise<TriviaRound[]> {
    return runRead(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.rounds, 'readonly')
          const idx = tx.objectStore(TRIVIA_STORES.rounds).index('byEventId')
          const r = idx.getAll(IDBKeyRange.only(eventId))
          r.onerror = () => reject(r.error)
          r.onsuccess = () => resolve((r.result as TriviaRound[]) || [])
        }),
    )
  }

  async function createRound(payload: { eventId: string; title: string; type: RoundType }): Promise<TriviaRound> {
    const existing = await listRoundsForEvent(payload.eventId)
    const maxOrder = existing.reduce((m, x) => Math.max(m, x.sortOrder), -1)
    const record: TriviaRound = {
      eventId: payload.eventId,
      id: crypto.randomUUID(),
      sortOrder: maxOrder + 1,
      title: payload.title.trim() || 'Round',
      type: payload.type,
    }

    return runWrite(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.rounds, 'readwrite')
          const req = tx.objectStore(TRIVIA_STORES.rounds).add(record)
          req.onerror = () => reject(req.error)
          req.onsuccess = () => resolve(record)
        }),
    )
  }

  async function updateRound(
    id: string,
    patch: Partial<Pick<TriviaRound, 'sortOrder' | 'title' | 'type'>>,
  ): Promise<void> {
    return runWrite(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.rounds, 'readwrite')
          const store = tx.objectStore(TRIVIA_STORES.rounds)
          const getReq = store.get(id)
          getReq.onerror = () => reject(getReq.error)
          getReq.onsuccess = () => {
            const cur = getReq.result as TriviaRound | undefined
            if (!cur) {
              reject(new Error('Round not found'))

              return
            }

            const next = { ...cur, ...patch }
            if (patch.title !== undefined) {
              next.title = patch.title.trim() || 'Round'
            }

            const put = store.put(next)
            put.onerror = () => reject(put.error)
            put.onsuccess = () => resolve()
          }
        }),
    )
  }

  async function deleteRound(id: string): Promise<void> {
    const questions = await listQuestionsForRound(id)
    for (const q of questions) {
      await deleteQuestion(q.id)
    }

    const scores = await listScoresForRound(id)
    for (const s of scores) {
      await deleteScoreRow(s.id)
    }

    return runWrite(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.rounds, 'readwrite')
          const req = tx.objectStore(TRIVIA_STORES.rounds).delete(id)
          req.onerror = () => reject(req.error)
          req.onsuccess = () => resolve()
        }),
    )
  }

  async function listQuestionsForRound(roundId: string): Promise<TriviaQuestion[]> {
    return runRead(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.questions, 'readonly')
          const idx = tx.objectStore(TRIVIA_STORES.questions).index('byRoundId')
          const r = idx.getAll(IDBKeyRange.only(roundId))
          r.onerror = () => reject(r.error)
          r.onsuccess = () => resolve((r.result as TriviaQuestion[]) || [])
        }),
    )
  }

  async function createQuestion(payload: {
    answerText: string
    points?: number
    promptText: string
    roundId: string
    snippetPlayerUrl?: string
  }): Promise<TriviaQuestion> {
    const existing = await listQuestionsForRound(payload.roundId)
    const maxOrder = existing.reduce((m, x) => Math.max(m, x.sortOrder), -1)
    const record: TriviaQuestion = {
      answerText: payload.answerText.trim(),
      id: crypto.randomUUID(),
      points: payload.points ?? 1,
      promptText: payload.promptText.trim(),
      roundId: payload.roundId,
      snippetPlayerUrl: (payload.snippetPlayerUrl ?? '').trim(),
      sortOrder: maxOrder + 1,
    }

    return runWrite(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.questions, 'readwrite')
          const req = tx.objectStore(TRIVIA_STORES.questions).add(record)
          req.onerror = () => reject(req.error)
          req.onsuccess = () => resolve(record)
        }),
    )
  }

  async function updateQuestion(
    id: string,
    patch: Partial<Pick<TriviaQuestion, 'answerText' | 'points' | 'promptText' | 'snippetPlayerUrl' | 'sortOrder'>>,
  ): Promise<void> {
    return runWrite(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.questions, 'readwrite')
          const store = tx.objectStore(TRIVIA_STORES.questions)
          const getReq = store.get(id)
          getReq.onerror = () => reject(getReq.error)
          getReq.onsuccess = () => {
            const cur = getReq.result as TriviaQuestion | undefined
            if (!cur) {
              reject(new Error('Question not found'))

              return
            }

            const next: TriviaQuestion = {
              ...cur,
              ...patch,
              answerText: patch.answerText !== undefined ? patch.answerText.trim() : cur.answerText,
              points: patch.points !== undefined ? patch.points : cur.points,
              promptText: patch.promptText !== undefined ? patch.promptText.trim() : cur.promptText,
              snippetPlayerUrl:
                patch.snippetPlayerUrl !== undefined ? patch.snippetPlayerUrl.trim() : cur.snippetPlayerUrl,
            }

            const put = store.put(next)
            put.onerror = () => reject(put.error)
            put.onsuccess = () => resolve()
          }
        }),
    )
  }

  async function deleteQuestion(id: string): Promise<void> {
    return runWrite(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.questions, 'readwrite')
          const req = tx.objectStore(TRIVIA_STORES.questions).delete(id)
          req.onerror = () => reject(req.error)
          req.onsuccess = () => resolve()
        }),
    )
  }

  async function listTeamsForEvent(eventId: string): Promise<TriviaTeam[]> {
    return runRead(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.teams, 'readonly')
          const idx = tx.objectStore(TRIVIA_STORES.teams).index('byEventId')
          const r = idx.getAll(IDBKeyRange.only(eventId))
          r.onerror = () => reject(r.error)
          r.onsuccess = () => resolve((r.result as TriviaTeam[]) || [])
        }),
    )
  }

  async function createTeam(payload: { eventId: string; name: string }): Promise<TriviaTeam> {
    const existing = await listTeamsForEvent(payload.eventId)
    const maxOrder = existing.reduce((m, x) => Math.max(m, x.sortOrder), -1)
    const record: TriviaTeam = {
      eventId: payload.eventId,
      id: crypto.randomUUID(),
      name: payload.name.trim() || 'Team',
      sortOrder: maxOrder + 1,
    }

    return runWrite(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.teams, 'readwrite')
          const req = tx.objectStore(TRIVIA_STORES.teams).add(record)
          req.onerror = () => reject(req.error)
          req.onsuccess = () => resolve(record)
        }),
    )
  }

  async function updateTeam(id: string, patch: Partial<Pick<TriviaTeam, 'name' | 'sortOrder'>>): Promise<void> {
    return runWrite(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.teams, 'readwrite')
          const store = tx.objectStore(TRIVIA_STORES.teams)
          const getReq = store.get(id)
          getReq.onerror = () => reject(getReq.error)
          getReq.onsuccess = () => {
            const cur = getReq.result as TriviaTeam | undefined
            if (!cur) {
              reject(new Error('Team not found'))

              return
            }

            const next = { ...cur, ...patch }
            if (patch.name !== undefined) {
              next.name = patch.name.trim() || 'Team'
            }

            const put = store.put(next)
            put.onerror = () => reject(put.error)
            put.onsuccess = () => resolve()
          }
        }),
    )
  }

  async function deleteTeam(id: string): Promise<void> {
    const team = await runRead(
      (db) =>
        new Promise<TriviaTeam | undefined>((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.teams, 'readonly')
          const r = tx.objectStore(TRIVIA_STORES.teams).get(id)
          r.onerror = () => reject(r.error)
          r.onsuccess = () => resolve(r.result as TriviaTeam | undefined)
        }),
    )
    if (!team) {
      return
    }

    const scores = await listScoresForEvent(team.eventId)
    for (const s of scores) {
      if (s.teamId === id) {
        await deleteScoreRow(s.id)
      }
    }

    return runWrite(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.teams, 'readwrite')
          const req = tx.objectStore(TRIVIA_STORES.teams).delete(id)
          req.onerror = () => reject(req.error)
          req.onsuccess = () => resolve()
        }),
    )
  }

  async function listScoresForEvent(eventId: string): Promise<TriviaRoundScore[]> {
    return runRead(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.roundScores, 'readonly')
          const idx = tx.objectStore(TRIVIA_STORES.roundScores).index('byEventId')
          const r = idx.getAll(IDBKeyRange.only(eventId))
          r.onerror = () => reject(r.error)
          r.onsuccess = () => resolve((r.result as TriviaRoundScore[]) || [])
        }),
    )
  }

  async function listScoresForRound(roundId: string): Promise<TriviaRoundScore[]> {
    const all = await runRead(
      (db) =>
        new Promise<TriviaRoundScore[]>((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.roundScores, 'readonly')
          const r = tx.objectStore(TRIVIA_STORES.roundScores).getAll()
          r.onerror = () => reject(r.error)
          r.onsuccess = () => resolve((r.result as TriviaRoundScore[]) || [])
        }),
    )

    return all.filter((s) => s.roundId === roundId)
  }

  async function upsertRoundScore(payload: {
    eventId: string
    points: number
    roundId: string
    teamId: string
  }): Promise<TriviaRoundScore> {
    const id = scoreRowId(payload.eventId, payload.teamId, payload.roundId)
    const record: TriviaRoundScore = {
      eventId: payload.eventId,
      id,
      points: payload.points,
      roundId: payload.roundId,
      teamId: payload.teamId,
    }

    return runWrite(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.roundScores, 'readwrite')
          const req = tx.objectStore(TRIVIA_STORES.roundScores).put(record)
          req.onerror = () => reject(req.error)
          req.onsuccess = () => resolve(record)
        }),
    )
  }

  async function deleteScoreRow(id: string): Promise<void> {
    return runWrite(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(TRIVIA_STORES.roundScores, 'readwrite')
          const req = tx.objectStore(TRIVIA_STORES.roundScores).delete(id)
          req.onerror = () => reject(req.error)
          req.onsuccess = () => resolve()
        }),
    )
  }

  return {
    createEvent,
    createQuestion,
    createRound,
    createTeam,
    deleteEvent,
    deleteQuestion,
    deleteRound,
    deleteTeam,
    getEvent,
    listEvents,
    listQuestionsForRound,
    listRoundsForEvent,
    listScoresForEvent,
    listScoresForRound,
    listTeamsForEvent,
    setEventStatus,
    setPresenterPointer,
    updateEvent,
    updateQuestion,
    updateRound,
    updateTeam,
    upsertRoundScore,
  }
}
