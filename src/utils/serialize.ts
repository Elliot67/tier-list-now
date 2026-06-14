import type { Item, Tier, TierListState } from '@/types'
import { createId } from '@/utils/id'
import LZString from '@/vendor/lz-string'

const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = LZString

// Compact, version-tagged, positional serialization. Tiers are referenced by index
// (their runtime ids are regenerated on load), so the payload never carries random ids.

const VERSION = 1

export interface Serialized {
  v: 1
  /** Optional tier-list title; omitted when empty to keep the payload small. */
  n?: string
  /** Tier names, positional — index is the tier slot. */
  t: string[]
  /** Items as [text, hue, tierIndex]; tierIndex -1 = unassigned. */
  i: [string, number, number][]
}

export function serializeState(state: TierListState, stripPlacement = false): Serialized {
  const tierIndexById = new Map<string, number>()
  state.tiers.forEach((tier, index) => tierIndexById.set(tier.id, index))

  const serialized: Serialized = {
    v: VERSION,
    t: state.tiers.map((tier) => tier.name),
    i: state.items.map((item) => {
      const tierIndex =
        stripPlacement || item.tierId === null ? -1 : (tierIndexById.get(item.tierId) ?? -1)
      return [item.text, item.hue, tierIndex]
    }),
  }
  if (state.title) serialized.n = state.title
  return serialized
}

/** Defensive parse — the hash is user-pasteable. Returns null on any malformed input. */
export function parseState(raw: unknown): Serialized | null {
  if (typeof raw !== 'object' || raw === null) return null
  const obj = raw as Record<string, unknown>
  if (obj.v !== VERSION) return null
  if (obj.n !== undefined && typeof obj.n !== 'string') return null
  if (!Array.isArray(obj.t) || !obj.t.every((n) => typeof n === 'string')) return null
  if (!Array.isArray(obj.i)) return null

  const tierCount = obj.t.length
  const items: [string, number, number][] = []
  for (const entry of obj.i) {
    if (!Array.isArray(entry) || entry.length !== 3) return null
    const [text, hue, tierIndex] = entry
    if (typeof text !== 'string' || text.length === 0) return null
    if (typeof hue !== 'number' || !Number.isFinite(hue)) return null
    if (typeof tierIndex !== 'number' || !Number.isInteger(tierIndex)) return null
    if (tierIndex < -1 || tierIndex >= tierCount) return null
    items.push([text, hue, tierIndex])
  }

  const result: Serialized = { v: VERSION, t: obj.t as string[], i: items }
  if (typeof obj.n === 'string') result.n = obj.n
  return result
}

/** Rebuild runtime state (with fresh ids) from a validated Serialized payload. */
export function toState(serialized: Serialized): TierListState {
  const tiers: Tier[] = serialized.t.map((name) => ({ id: createId(), name }))
  const items: Item[] = serialized.i.map(([text, hue, tierIndex]) => ({
    id: createId(),
    text,
    hue,
    tierId: tierIndex === -1 ? null : (tiers[tierIndex]?.id ?? null),
  }))
  return { title: serialized.n ?? '', tiers, items }
}

export function toHash(state: TierListState, stripPlacement = false): string {
  return compressToEncodedURIComponent(JSON.stringify(serializeState(state, stripPlacement)))
}

export function fromHash(hash: string): Serialized | null {
  const clean = hash.startsWith('#') ? hash.slice(1) : hash
  if (clean.length === 0) return null
  try {
    const json = decompressFromEncodedURIComponent(clean)
    if (!json) return null
    return parseState(JSON.parse(json))
  } catch {
    return null
  }
}
