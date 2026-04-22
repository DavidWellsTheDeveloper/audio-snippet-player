import { describe, expect, it } from 'vitest'
import type { TriviaQuestion, TriviaRound, TriviaRoundScore } from '~/constants/trivia'
import {
  roundScoreByTeamRound,
  scoreRowId,
  sortQuestionsByOrder,
  sortRoundsByOrder,
  teamTotalPoints,
} from './triviaDomain'

describe('sortRoundsByOrder', () => {
  it('orders by sortOrder ascending', () => {
    const rounds: TriviaRound[] = [
      {
        eventId: 'e',
        id: 'b',
        sortOrder: 2,
        title: 'B',
        type: 'standard',
      },
      {
        eventId: 'e',
        id: 'a',
        sortOrder: 1,
        title: 'A',
        type: 'standard',
      },
    ]

    const sorted = sortRoundsByOrder(rounds)

    expect(sorted.map((r) => r.id)).toEqual(['a', 'b'])
  })
})

describe('sortQuestionsByOrder', () => {
  it('orders by sortOrder ascending', () => {
    const qs: TriviaQuestion[] = [
      {
        answerText: '',
        id: 'q2',
        points: 1,
        promptText: '',
        roundId: 'r',
        snippetPlayerUrl: '',
        sortOrder: 2,
      },
      {
        answerText: '',
        id: 'q1',
        points: 1,
        promptText: '',
        roundId: 'r',
        snippetPlayerUrl: '',
        sortOrder: 1,
      },
    ]

    expect(sortQuestionsByOrder(qs).map((q) => q.id)).toEqual(['q1', 'q2'])
  })
})

describe('teamTotalPoints', () => {
  it('sums score rows', () => {
    const rows: TriviaRoundScore[] = [
      { eventId: 'e', id: '1', points: 3, roundId: 'r1', teamId: 't' },
      { eventId: 'e', id: '2', points: 5, roundId: 'r2', teamId: 't' },
    ]

    expect(teamTotalPoints(rows)).toBe(8)
  })
})

describe('roundScoreByTeamRound', () => {
  it('returns points for matching team and round', () => {
    const rows: TriviaRoundScore[] = [
      { eventId: 'e', id: 'x', points: 4, roundId: 'r1', teamId: 't1' },
    ]

    expect(roundScoreByTeamRound(rows, 't1', 'r1')).toBe(4)
    expect(roundScoreByTeamRound(rows, 't2', 'r1')).toBeUndefined()
  })
})

describe('scoreRowId', () => {
  it('builds deterministic id', () => {
    expect(scoreRowId('e', 't', 'r')).toBe('e::t::r')
  })
})
