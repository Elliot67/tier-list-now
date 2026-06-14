<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  dropTargetForElements,
  type ElementDropTargetEventBasePayload,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type { Item, Tier } from '@/types'
import TierLabel from './TierLabel.vue'
import ItemSquare from './ItemSquare.vue'

const props = defineProps<{
  tier: Tier
  index: number
  count: number
  items: Item[]
}>()

const emit = defineEmits<{
  rename: [name: string]
  remove: []
}>()

const zone = ref<HTMLElement | null>(null)
// True when the drop will land at the end of the row (hovering the zone, not a card),
// so the last card shows its right-edge drop indicator.
const overEnd = ref(false)

let cleanup: (() => void) | undefined

function updateOverEnd({ location }: ElementDropTargetEventBasePayload) {
  const innermost = location.current.dropTargets[0]
  overEnd.value = innermost?.element === zone.value
}

onMounted(() => {
  if (!zone.value) return
  cleanup = dropTargetForElements({
    element: zone.value,
    getData: () => ({ targetType: 'zone', tierId: props.tier.id }),
    onDragEnter: updateOverEnd,
    onDrag: updateOverEnd,
    onDragLeave: () => (overEnd.value = false),
    onDrop: () => (overEnd.value = false),
  })
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div class="row">
    <TierLabel
      :name="tier.name"
      :index="index"
      :count="count"
      @rename="(name) => emit('rename', name)"
    />
    <div ref="zone" class="zone">
      <span v-if="overEnd && items.length === 0" class="row-indicator"></span>
      <ItemSquare
        v-for="(item, i) in items"
        :key="item.id"
        :item="item"
        :force-edge="overEnd && i === items.length - 1 ? 'right' : null"
      />
    </div>
    <button type="button" class="remove export-hide" title="Remove row" @click="emit('remove')">
      ×
    </button>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: stretch;
  margin-bottom: 4px;
}

.zone {
  flex: 1 1 auto;
  min-height: 90px;
  background: var(--drop);
  display: flex;
  flex-wrap: wrap;
  gap: 6px 0;
  padding: 6px 3px 6px 10px;
  align-content: flex-start;
}

.row-indicator {
  flex: 0 0 auto;
  align-self: center;
  width: 6px;
  height: 78px;
  border-radius: 4px;
  background: var(--accent);
  box-shadow: 0 0 8px 1px var(--accent);
}

.remove {
  flex: 0 0 28px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 20px;
  line-height: 1;
  border-radius: 0 var(--radius) var(--radius) 0;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.remove:hover {
  color: var(--danger);
  background: var(--surface-2);
}
</style>
