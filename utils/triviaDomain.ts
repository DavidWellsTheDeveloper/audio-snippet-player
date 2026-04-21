import type { TriviaQuestion, TriviaRound, TriviaRoundScore } from '~/constants/trivia'

export function sortRoundsByOrder(rounds: TriviaRound[]): TriviaRound[] {
  return [...rounds].sort((a, b) => a.sortOrder - b.sortOrder)
}

export function sortQuestionsByOrder(questions: TriviaQuestion[]): TriviaQuestion[] {
  return [...questions].sort((a, b) => a.sortOrder - b.sortOrder)
}

export function teamTotalPoints(scores: TriviaRoundScore[]): number {
  return scores.reduce((sum, s) => sum + s.points, 0)
}

export function roundScoreByTeamRound(
  scores: TriviaRoundScore[],
  teamId: string,
  roundId: string,
): number | undefined {
  const row = scores.find((s) => s.teamId === teamId && s.roundId === roundId)

  return row?.points
}

export function scoreRowId(eventId: string, teamId: string, roundId: string): string {
  return `${eventId}::${teamId}::${roundId}`
}
