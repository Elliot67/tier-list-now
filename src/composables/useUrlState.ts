import { useTierListStore } from '@/stores/tierList'
import { fromHash, toHash, toState } from '@/utils/serialize'

const DEBOUNCE_MS = 400

/**
 * Two-way sync between the store and the URL hash.
 * - Loads state from the hash on init (falling back to defaults on empty/invalid).
 * - Writes a compressed hash on every (debounced) state change via replaceState.
 * - Guards against the hashchange <-> replaceState feedback loop.
 */
export function useUrlState() {
  const store = useTierListStore()

  let lastWrittenHash: string | null = null
  let isApplyingFromUrl = false
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function applyFromHash() {
    const parsed = fromHash(location.hash)
    isApplyingFromUrl = true
    if (parsed) {
      store.loadState(toState(parsed))
    } else if (location.hash.replace('#', '').length === 0) {
      store.resetToDefaults()
    }
    // If the hash was non-empty but invalid, keep current state untouched.
    isApplyingFromUrl = false
  }

  function writeHash() {
    const hash = toHash(store.serialize())
    lastWrittenHash = hash
    history.replaceState(null, '', `${location.pathname}${location.search}#${hash}`)
  }

  function onHashChange() {
    // Ignore the event we caused ourselves.
    if (location.hash === `#${lastWrittenHash}`) return
    applyFromHash()
  }

  function init() {
    applyFromHash()
    // Ensure the URL reflects the (possibly defaulted) initial state.
    writeHash()

    const unsubscribe = store.$subscribe(() => {
      if (isApplyingFromUrl) return
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(writeHash, DEBOUNCE_MS)
    })

    window.addEventListener('hashchange', onHashChange)

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      window.removeEventListener('hashchange', onHashChange)
      unsubscribe()
    }
  }

  return { init }
}
