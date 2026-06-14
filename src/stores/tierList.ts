import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Item, Tier, TierListState } from '@/types'
import { createId } from '@/utils/id'
import { nextHue } from '@/utils/colors'

const DEFAULT_TIER_NAMES = ['S', 'A', 'B', 'C', 'D']

function defaultTiers(): Tier[] {
  return DEFAULT_TIER_NAMES.map((name) => ({ id: createId(), name }))
}

export const useTierListStore = defineStore('tierList', () => {
  const title = ref('')
  const tiers = ref<Tier[]>(defaultTiers())
  const items = ref<Item[]>([])

  const unassignedItems = computed(() => items.value.filter((i) => i.tierId === null))

  const itemsForTier = computed(() => (tierId: string) =>
    items.value.filter((i) => i.tierId === tierId),
  )

  const existingTexts = computed(
    () => new Set(items.value.map((i) => i.text.toLowerCase())),
  )

  function addTier() {
    tiers.value.push({ id: createId(), name: '' })
  }

  function renameTier(id: string, name: string) {
    const tier = tiers.value.find((t) => t.id === id)
    if (tier) tier.name = name
  }

  function removeTier(id: string) {
    for (const item of items.value) {
      if (item.tierId === id) item.tierId = null
    }
    tiers.value = tiers.value.filter((t) => t.id !== id)
  }

  /**
   * Parse raw textarea input: one item per line, trimmed, blanks dropped,
   * deduped within the input (case-insensitive) and against existing items.
   * New items are appended unassigned. Returns added/skipped counts.
   */
  function addItems(raw: string): { added: number; skipped: number } {
    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    const seen = new Set(existingTexts.value)
    const toAdd: string[] = []
    let skipped = 0
    for (const line of lines) {
      const key = line.toLowerCase()
      if (seen.has(key)) {
        skipped++
        continue
      }
      seen.add(key)
      toAdd.push(line)
    }

    for (const text of toAdd) {
      const hues = items.value.map((i) => i.hue)
      items.value.push({ id: createId(), text, hue: nextHue(hues), tierId: null })
    }

    return { added: toAdd.length, skipped }
  }

  function removeItem(id: string) {
    items.value = items.value.filter((i) => i.id !== id)
  }

  /** Move every placed item back to the unassigned tray. */
  function unassignAll() {
    for (const item of items.value) item.tierId = null
  }

  /**
   * Single sink for all drag operations. Moves an item to a tier (or null for the
   * unassigned tray) and reorders the flat array so it lands before `beforeItemId`
   * (or at the end of that group when omitted/not found).
   */
  function moveItem(itemId: string, toTierId: string | null, beforeItemId?: string | null) {
    const index = items.value.findIndex((i) => i.id === itemId)
    if (index === -1) return
    const [item] = items.value.splice(index, 1)
    if (!item) return
    item.tierId = toTierId

    if (beforeItemId) {
      const beforeIndex = items.value.findIndex((i) => i.id === beforeItemId)
      if (beforeIndex !== -1) {
        items.value.splice(beforeIndex, 0, item)
        return
      }
    }
    items.value.push(item)
  }

  function resetToDefaults() {
    title.value = ''
    tiers.value = defaultTiers()
    items.value = []
  }

  function loadState(state: TierListState) {
    title.value = state.title
    tiers.value = state.tiers
    items.value = state.items
  }

  function serialize(): TierListState {
    return { title: title.value, tiers: tiers.value, items: items.value }
  }

  return {
    title,
    tiers,
    items,
    unassignedItems,
    itemsForTier,
    existingTexts,
    addTier,
    renameTier,
    removeTier,
    addItems,
    removeItem,
    unassignAll,
    moveItem,
    resetToDefaults,
    loadState,
    serialize,
  }
})
