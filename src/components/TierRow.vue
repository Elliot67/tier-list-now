<script setup lang="ts">
import { ref } from 'vue'
import type { Item, Tier } from '@/types'
import { useCardSortable } from '@/composables/useCardSortable'
import TierLabel from './TierLabel.vue'
import ItemSquare from './ItemSquare.vue'

defineProps<{
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
useCardSortable(zone)
</script>

<template>
  <div class="row">
    <TierLabel
      :name="tier.name"
      :index="index"
      :count="count"
      @rename="(name) => emit('rename', name)"
    />
    <div ref="zone" class="zone" :data-tier-id="tier.id">
      <ItemSquare v-for="item in items" :key="item.id" :item="item" />
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
