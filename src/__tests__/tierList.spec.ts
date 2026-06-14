import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTierListStore } from '@/stores/tierList'

describe('tierList store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with default tiers S A B C D and no items', () => {
    const store = useTierListStore()
    expect(store.tiers.map((t) => t.name)).toEqual(['S', 'A', 'B', 'C', 'D'])
    expect(store.items).toHaveLength(0)
  })

  it('adds items, trimming, dropping blanks, and deduping (case-insensitive)', () => {
    const store = useTierListStore()
    const res = store.addItems('  Mario \n\nLuigi\nmario\n  ')
    expect(res).toEqual({ added: 2, skipped: 1 })
    expect(store.items.map((i) => i.text)).toEqual(['Mario', 'Luigi'])
  })

  it('skips items already present anywhere in the list', () => {
    const store = useTierListStore()
    store.addItems('Peach')
    const res = store.addItems('peach\nToad')
    expect(res).toEqual({ added: 1, skipped: 1 })
    expect(store.items.map((i) => i.text)).toEqual(['Peach', 'Toad'])
  })

  it('removing a tier moves its items to unassigned', () => {
    const store = useTierListStore()
    store.addItems('Mario')
    const tierId = store.tiers[0]!.id
    store.moveItem(store.items[0]!.id, tierId)
    expect(store.itemsForTier(tierId)).toHaveLength(1)

    store.removeTier(tierId)
    expect(store.tiers.find((t) => t.id === tierId)).toBeUndefined()
    expect(store.unassignedItems).toHaveLength(1)
    expect(store.items[0]!.tierId).toBeNull()
  })

  it('moveItem places an item into a tier and within ordering', () => {
    const store = useTierListStore()
    store.addItems('a\nb\nc')
    const [a, b, c] = store.items.map((i) => i.id)
    const tierId = store.tiers[0]!.id

    store.moveItem(a!, tierId)
    store.moveItem(c!, tierId)
    store.moveItem(b!, tierId, c!) // insert b before c

    const ordered = store.itemsForTier(tierId).map((i) => i.text)
    expect(ordered).toEqual(['a', 'b', 'c'])
  })

  it('moveItem back to unassigned sets tierId null', () => {
    const store = useTierListStore()
    store.addItems('x')
    const id = store.items[0]!.id
    const tierId = store.tiers[0]!.id
    store.moveItem(id, tierId)
    store.moveItem(id, null)
    expect(store.items[0]!.tierId).toBeNull()
  })

  it('assigns a distinct hue per item', () => {
    const store = useTierListStore()
    store.addItems('a\nb\nc')
    const hues = store.items.map((i) => i.hue)
    expect(new Set(hues).size).toBe(3)
  })
})
