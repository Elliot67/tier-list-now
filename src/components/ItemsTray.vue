<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Item } from '@/types'
import { useTierListStore } from '@/stores/tierList'
import { useCardSortable } from '@/composables/useCardSortable'
import ItemSquare from './ItemSquare.vue'

defineProps<{ items: Item[] }>()

const emit = defineEmits<{ configure: [] }>()

const store = useTierListStore()
const hasPlacedItems = computed(() => store.items.some((i) => i.tierId !== null))

const zone = ref<HTMLElement | null>(null)
useCardSortable(zone)

// Mobile: when the tray scrolls out of view, surface the unassigned cards in a sticky
// bottom strip (its own Sortable zone) so they can still be dragged into the tiers above.
const floatingZone = ref<HTMLElement | null>(null)
useCardSortable(floatingZone)

const trayOffscreen = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!zone.value) return
  observer = new IntersectionObserver(
    ([entry]) => {
      // Off-screen only counts when the tray is actually laid out; a display:none tray
      // (e.g. the Configure view is open) has a zero-size rect and must not trigger it.
      const rect = entry?.boundingClientRect
      trayOffscreen.value =
        !!entry && !entry.isIntersecting && !!rect && rect.width > 0 && rect.height > 0
    },
    // Shrink the root's bottom a little: the tray must scroll a bit into view before it
    // counts as visible, so while it only peeks at the very bottom the sticky bar stays up.
    { threshold: 0, rootMargin: '0px 0px -40px 0px' },
  )
  observer.observe(zone.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <section class="tray">
    <div class="bar">
      <button
        type="button"
        class="action"
        :disabled="!hasPlacedItems"
        title="Move all placed cards back here"
        @click="store.unassignAll()"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 2v6h6" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L3 8" />
        </svg>
        Rollback
      </button>
      <button type="button" class="action" title="Configure cards" @click="emit('configure')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          />
        </svg>
        Configure
      </button>
    </div>

    <div ref="zone" data-tier-id="" class="zone" :class="{ 'is-empty': items.length === 0 }">
      <ItemSquare v-for="item in items" :key="item.id" :item="item" />
      <p v-if="items.length === 0" class="empty">Add new cards, or drag cards back here.</p>
    </div>
  </section>

  <!-- Mobile-only sticky strip, shown when the tray is scrolled off-screen -->
  <Teleport to="body">
    <div class="floating-tray" :class="{ visible: trayOffscreen, empty: items.length === 0 }">
      <div ref="floatingZone" data-tier-id="" class="floating-zone">
        <ItemSquare v-for="item in items" :key="item.id" :item="item" />
        <p v-if="items.length === 0" class="floating-empty">
          Add new cards, or drag cards back here.
        </p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tray {
  margin-top: 0;
}

.bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 14px;
  font-weight: 600;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.05s ease;
}

.action:not(:disabled):hover {
  border-color: var(--accent);
}

.action:not(:disabled):active {
  transform: translateY(1px);
}

.action svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex: 0 0 auto;
}

.action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.zone {
  /* matches a single card row (78px card + 10px padding + 1px border, top/bottom) so the
     height doesn't change when the first card is dropped in */
  min-height: 100px;
  background: var(--drop);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  display: flex;
  flex-wrap: wrap;
  gap: 6px 0;
  padding: 10px 7px;
  align-content: flex-start;
  -webkit-user-select: none;
  user-select: none;
}

.zone.is-empty {
  align-items: center;
  justify-content: center;
  align-content: center;
}

/* Desktop: the tray is a fixed-width right sidebar (exactly 3 cards wide), with room for
   at least two card rows. Sized here (not from the parent) because this component renders
   a fragment, so a class passed to it wouldn't reach this root element. */
@media (min-width: 830px) {
  .tray {
    flex: 0 0 270px;
    width: 270px;
  }

  .zone {
    min-height: 184px;
  }

  .empty {
    max-width: 20ch;
  }
}

.empty {
  color: var(--text-muted);
  font-size: 13px;
  margin: 0;
  text-align: center;
}

/* While a card (the drag ghost) is in an otherwise-empty zone, hide the prompt text so it
   doesn't take space and push the ghost out of place. */
.zone:has(.item) .empty,
.floating-zone:has(.item) .floating-empty {
  display: none;
}

/* Sticky bottom strip — hidden on desktop, slides up on mobile when the tray is off-screen. */
.floating-tray {
  display: none;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: 8px;
  transform: translateY(110%);
  transition: transform 0.2s ease;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.35);
}

.floating-tray.visible {
  transform: translateY(0);
}

.floating-zone {
  display: flex;
  flex-wrap: nowrap;
  gap: 0;
  overflow-x: auto;
  /* Horizontal scroll forces vertical overflow to clip, so give enough top/bottom room for
     the slightly-rotated dragged card not to get cropped. */
  padding: 8px 4px;
  min-height: 94px;
  align-items: center;
  -webkit-user-select: none;
  user-select: none;
}

.floating-tray.empty .floating-zone {
  justify-content: center;
}

.floating-empty {
  margin: 0;
  max-width: 20ch;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
}

@media (max-width: 640px) {
  .floating-tray {
    display: block;
  }
}
</style>
