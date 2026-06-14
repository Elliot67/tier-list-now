import Sortable from 'sortablejs'
import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { useTierListStore } from '@/stores/tierList'

/**
 * Makes a zone element a SortableJS drop zone for cards (shared group `cards`), with
 * mouse + touch support. The store stays the source of truth: on drop we read the target
 * tier and insertion point from the DOM, revert Sortable's DOM mutation, then apply the
 * move through `store.moveItem` and let Vue re-render.
 *
 * Zones must carry `data-tier-id` (empty string = unassigned tray) and cards `data-item-id`.
 */
export function useCardSortable(zone: Ref<HTMLElement | null>) {
  const store = useTierListStore()
  let sortable: Sortable | null = null
  let originParent: Node | null = null
  let originNext: Node | null = null

  onMounted(() => {
    if (!zone.value) return
    sortable = Sortable.create(zone.value, {
      group: 'cards',
      draggable: '.item',
      animation: 150,
      forceFallback: true,
      fallbackClass: 'card-fallback',
      ghostClass: 'card-ghost',
      chosenClass: 'card-chosen',
      onStart: (evt) => {
        originParent = evt.item.parentNode
        originNext = evt.item.nextSibling
      },
      onEnd: (evt) => {
        const itemId = evt.item.getAttribute('data-item-id')
        const toTierId = evt.to.getAttribute('data-tier-id') || null
        const beforeId =
          (evt.item.nextElementSibling as HTMLElement | null)?.getAttribute('data-item-id') ?? null
        // Revert Sortable's DOM change so Vue stays authoritative, then apply via the store.
        if (originParent) originParent.insertBefore(evt.item, originNext)
        if (itemId) store.moveItem(itemId, toTierId, beforeId)
      },
    })
  })

  onBeforeUnmount(() => {
    sortable?.destroy()
    sortable = null
  })
}
