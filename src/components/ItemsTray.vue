<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type { Item } from '@/types'
import { useTierListStore } from '@/stores/tierList'
import ItemSquare from './ItemSquare.vue'

defineProps<{ items: Item[] }>()

const emit = defineEmits<{ configure: [] }>()

const store = useTierListStore()
const hasPlacedItems = computed(() => store.items.some((i) => i.tierId !== null))

const zone = ref<HTMLElement | null>(null)
const isOver = ref(false)

let cleanup: (() => void) | undefined

onMounted(() => {
  if (!zone.value) return
  cleanup = dropTargetForElements({
    element: zone.value,
    getData: () => ({ targetType: 'zone', tierId: null }),
    onDragEnter: () => (isOver.value = true),
    onDragLeave: () => (isOver.value = false),
    onDrop: () => (isOver.value = false),
  })
})

onBeforeUnmount(() => cleanup?.())
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
        Retrieve cards
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

    <div ref="zone" class="zone" :class="{ over: isOver, 'is-empty': items.length === 0 }">
      <ItemSquare v-for="item in items" :key="item.id" :item="item" />
      <p v-if="items.length === 0" class="empty">Add new cards, or drag cards back here.</p>
    </div>
  </section>
</template>

<style scoped>
.tray {
  margin-top: 16px;
}

.bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 10px;
}

.action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
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
  min-height: 90px;
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

.zone.over {
  box-shadow: inset 0 0 0 2px var(--accent);
}

.zone.is-empty {
  align-items: center;
  justify-content: center;
  align-content: center;
}

.empty {
  color: var(--text-muted);
  font-size: 13px;
  margin: 0;
  text-align: center;
}
</style>
