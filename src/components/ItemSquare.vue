<script setup lang="ts">
import { computed } from 'vue'
import type { Item } from '@/types'
import { itemColor } from '@/utils/colors'

const props = defineProps<{ item: Item }>()

const colors = computed(() => itemColor(props.item.hue))
</script>

<template>
  <div class="item" :data-item-id="item.id" :title="item.text">
    <div class="surface" :style="{ backgroundColor: colors.bg, color: colors.text }">
      <span class="label">{{ item.text }}</span>
    </div>
  </div>
</template>

<style scoped>
.item {
  position: relative;
  padding: 0 3px;
  flex: 0 0 auto;
  user-select: none;
  cursor: grab;
}

.item:active {
  cursor: grabbing;
}

.surface {
  width: 78px;
  height: 78px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.15;
  overflow: hidden;
  transform-origin: top left;
  transition: transform 0.12s ease;
}

.label {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
</style>
