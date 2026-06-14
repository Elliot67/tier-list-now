<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useTierListStore } from '@/stores/tierList'
import { useUrlState } from '@/composables/useUrlState'
import TierBoard from './TierBoard.vue'
import ItemsTray from './ItemsTray.vue'
import ConfigView from './ConfigView.vue'
import ShareMenu from './ShareMenu.vue'

const store = useTierListStore()
const { init } = useUrlState()

const mode = ref<'rank' | 'configure'>('rank')
const board = ref<InstanceType<typeof TierBoard> | null>(null)
const boardEl = computed(() => board.value?.captureEl ?? null)

let cleanupUrl: (() => void) | undefined
let cleanupMonitor: (() => void) | undefined

onMounted(() => {
  cleanupUrl = init()
  cleanupMonitor = monitorForElements({
    canMonitor: ({ source }) => typeof source.data.itemId === 'string',
    onDrop: ({ source, location }) => {
      const itemId = source.data.itemId as string
      const target = location.current.dropTargets[0]
      if (!target) return
      const data = target.data
      if (data.targetType === 'item') {
        if (data.itemId === itemId) return
        const tierId = data.tierId as string | null
        // Items in the target tier, excluding the one being moved, in display order.
        const ordered = store.items.filter((i) => i.tierId === tierId && i.id !== itemId)
        const targetIndex = ordered.findIndex((i) => i.id === data.itemId)
        const beforeId =
          data.edge === 'left' ? (data.itemId as string) : (ordered[targetIndex + 1]?.id ?? null)
        store.moveItem(itemId, tierId, beforeId)
      } else if (data.targetType === 'zone') {
        store.moveItem(itemId, data.tierId as string | null, null)
      }
    },
  })
})

// "New list" uses a two-step inline confirm so an accidental click can't wipe the list.
const confirmingNew = ref(false)
let confirmTimer: ReturnType<typeof setTimeout> | undefined

function onNewList() {
  if (confirmTimer) clearTimeout(confirmTimer)
  if (confirmingNew.value) {
    confirmingNew.value = false
    store.resetToDefaults()
    mode.value = 'rank'
    return
  }
  confirmingNew.value = true
  confirmTimer = setTimeout(() => (confirmingNew.value = false), 4000)
}

onBeforeUnmount(() => {
  cleanupUrl?.()
  cleanupMonitor?.()
  if (confirmTimer) clearTimeout(confirmTimer)
})
</script>

<template>
  <div class="app">
    <header class="intro">
      <h1>Tier List Now</h1>
      <p class="tagline">
        Build a tier list and share it in one link. No account, no login, nothing to set up.
      </p>
    </header>

    <div class="toolbar">
      <button
        type="button"
        class="new-list"
        :class="{ confirming: confirmingNew }"
        @click="onNewList"
        @blur="confirmingNew = false"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M12 18v-5M9.5 15.5h5" />
        </svg>
        {{ confirmingNew ? 'Confirm — reset?' : 'New list' }}
      </button>
      <ShareMenu :board-el="boardEl" />
    </div>

    <div v-show="mode === 'rank'">
      <TierBoard ref="board" />
      <ItemsTray :items="store.unassignedItems" @configure="mode = 'configure'" />
    </div>

    <ConfigView v-if="mode === 'configure'" @back="mode = 'rank'" />
  </div>
</template>

<style scoped>
.intro {
  margin-bottom: 24px;
}

h1 {
  margin: 0;
  font-size: 26px;
}

.tagline {
  margin: 6px 0 0;
  max-width: 60ch;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.5;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.new-list {
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
    color 0.15s ease,
    transform 0.05s ease;
}

.new-list svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex: 0 0 auto;
}

.new-list:hover {
  border-color: var(--accent);
}

.new-list:active {
  transform: translateY(1px);
}

.new-list.confirming {
  border-color: var(--danger);
  color: var(--danger);
}
</style>
