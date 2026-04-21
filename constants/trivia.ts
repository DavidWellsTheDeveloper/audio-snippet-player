/** Broadcast channel name for host ↔ presenter tabs (same origin) */
export const TRIVIA_PRESENTER_CHANNEL = 'trivia-presenter-sync'

/** IndexedDB database name for trivia domain */
export const TRIVIA_DB_NAME = 'audio-snippet-trivia-db'

export const TRIVIA_DB_VERSION = 1

/** Object store names (alphabetical) */
export const TRIVIA_STORES = {
  events: 'events',
  questions: 'questions',
  roundScores: 'roundScores',
  rounds: 'rounds',
  teams: 'teams',
} as const

export const TRIVIA_ROUTES = {
  home: '/trivia',
  newEvent: '/trivia/events/new',
} as const

export function triviaEventPath(eventId: string): string {
  return `/trivia/events/${eventId}`
}

export function triviaEventRunPath(eventId: string): string {
  return `/trivia/events/${eventId}/run`
}

export function triviaPresentPath(eventId: string): string {
  return `/trivia/present/${eventId}`
}

/** Default points for new questions */
export const TRIVIA_DEFAULT_QUESTION_POINTS = 1

/** Poll presenter state from IndexedDB (ms) when not using BroadcastChannel only */
export const TRIVIA_PRESENTER_POLL_MS = 1500

export type EventStatus = 'draft' | 'ended' | 'live'

export type PresenterPhase = 'answer' | 'idle' | 'question'

export type RoundType = 'music' | 'standard'

export interface PresenterPointer {
  phase: PresenterPhase
  questionIndex: number
  roundId: string | null
}

export interface TriviaEvent {
  createdAt: string
  id: string
  notes: string
  presenterPointer: PresenterPointer
  status: EventStatus
  title: string
  updatedAt: string
}

export interface TriviaRound {
  eventId: string
  id: string
  sortOrder: number
  title: string
  type: RoundType
}

export interface TriviaQuestion {
  answerText: string
  id: string
  points: number
  promptText: string
  roundId: string
  snippetPlayerUrl: string
  sortOrder: number
}

export interface TriviaTeam {
  eventId: string
  id: string
  name: string
  sortOrder: number
}

export interface TriviaRoundScore {
  eventId: string
  id: string
  points: number
  roundId: string
  teamId: string
}
