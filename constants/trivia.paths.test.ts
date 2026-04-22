import { describe, expect, it } from 'vitest'
import {
  TRIVIA_ROUTES,
  triviaEventPath,
  triviaEventRunPath,
  triviaPresentPath,
} from './trivia'

describe('trivia route helpers', () => {
  it('triviaEventPath embeds id', () => {
    expect(triviaEventPath('abc-123')).toBe('/trivia/events/abc-123')
  })

  it('triviaEventRunPath includes run segment', () => {
    expect(triviaEventRunPath('e1')).toBe('/trivia/events/e1/run')
  })

  it('triviaPresentPath uses present segment', () => {
    expect(triviaPresentPath('e1')).toBe('/trivia/present/e1')
  })

  it('TRIVIA_ROUTES home and newEvent are stable', () => {
    expect(TRIVIA_ROUTES.home).toBe('/trivia')
    expect(TRIVIA_ROUTES.newEvent).toBe('/trivia/events/new')
  })
})
