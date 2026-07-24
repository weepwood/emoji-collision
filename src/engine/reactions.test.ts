import { describe, expect, it } from 'vitest'
import { findReaction, normalizePair } from './reactions'

describe('emoji reactions', () => {
  it('normalizes pairs regardless of order', () => {
    expect(normalizePair('fire', 'water')).toBe(normalizePair('water', 'fire'))
  })

  it('finds a reaction when impact is strong enough', () => {
    expect(findReaction('fire', 'water', 3)?.effect).toBe('steam')
  })

  it('does not trigger a weak impact', () => {
    expect(findReaction('fire', 'water', 0.5)).toBeUndefined()
  })

  it('returns undefined for an unknown pair', () => {
    expect(findReaction('cat', 'moon', 10)).toBeUndefined()
  })
})
