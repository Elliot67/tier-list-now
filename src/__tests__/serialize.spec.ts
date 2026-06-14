import { describe, expect, it } from 'vitest'
import type { TierListState } from '@/types'
import { fromHash, parseState, serializeState, toHash, toState } from '@/utils/serialize'

function sampleState(): TierListState {
  return {
    title: 'My Ranking',
    tiers: [
      { id: 't1', name: 'S' },
      { id: 't2', name: 'A' },
      { id: 't3', name: 'Best Renamed' },
    ],
    items: [
      { id: 'i1', text: 'Mario', hue: 12, tierId: 't1' },
      { id: 'i2', text: 'Luigi', hue: 200, tierId: null },
      { id: 'i3', text: 'Peach', hue: 330, tierId: 't3' },
    ],
  }
}

describe('serialize', () => {
  it('round-trips state through hash (modulo regenerated ids)', () => {
    const state = sampleState()
    const restored = toState(fromHash(toHash(state))!)

    expect(restored.title).toBe('My Ranking')
    expect(restored.tiers.map((t) => t.name)).toEqual(['S', 'A', 'Best Renamed'])
    // placement preserved by mapping text -> tier name
    const tierNameByItem = (text: string) => {
      const item = restored.items.find((i) => i.text === text)!
      return restored.tiers.find((t) => t.id === item.tierId)?.name ?? null
    }
    expect(tierNameByItem('Mario')).toBe('S')
    expect(tierNameByItem('Luigi')).toBe(null)
    expect(tierNameByItem('Peach')).toBe('Best Renamed')
    expect(restored.items.map((i) => i.hue)).toEqual([12, 200, 330])
  })

  it('stripPlacement clears placement but keeps rows and item pool', () => {
    const state = sampleState()
    const serialized = serializeState(state, true)
    expect(serialized.i.every(([, , idx]) => idx === -1)).toBe(true)
    expect(serialized.t).toEqual(['S', 'A', 'Best Renamed'])
    // original state untouched
    expect(state.items[0]!.tierId).toBe('t1')
  })

  it('omits the title when empty and loads legacy (titleless) links as untitled', () => {
    const untitled = serializeState({ ...sampleState(), title: '' })
    expect(untitled.n).toBeUndefined()
    // a link with no `n` field still parses and yields an empty title
    const restored = toState(parseState({ v: 1, t: ['S'], i: [] })!)
    expect(restored.title).toBe('')
  })

  it('parseState rejects malformed input', () => {
    expect(parseState(null)).toBeNull()
    expect(parseState({ v: 2, t: [], i: [] })).toBeNull()
    expect(parseState({ v: 1, t: 'nope', i: [] })).toBeNull()
    expect(parseState({ v: 1, t: ['S'], i: [['x', 1]] })).toBeNull() // wrong tuple length
    expect(parseState({ v: 1, t: ['S'], i: [['x', 1, 5]] })).toBeNull() // tierIndex out of bounds
    expect(parseState({ v: 1, t: ['S'], i: [['', 1, 0]] })).toBeNull() // empty text
    expect(parseState({ v: 1, t: ['S'], i: [['x', NaN, 0]] })).toBeNull() // bad hue
  })

  it('parseState accepts valid input', () => {
    const parsed = parseState({ v: 1, t: ['S', 'A'], i: [['x', 10, 1], ['y', 20, -1]] })
    expect(parsed).not.toBeNull()
    expect(parsed!.i).toHaveLength(2)
  })

  it('fromHash returns null on garbage', () => {
    expect(fromHash('')).toBeNull()
    expect(fromHash('#not-valid-lz')).toBeNull()
  })
})
