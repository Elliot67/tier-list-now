<script setup lang="ts">
import { ref } from 'vue'
import { useTierListStore } from '@/stores/tierList'
import { itemColor } from '@/utils/colors'
import AddItemsPanel from './AddItemsPanel.vue'

const emit = defineEmits<{ back: [] }>()

const store = useTierListStore()
const feedback = ref('')

function onAdd(raw: string) {
  const { added, skipped } = store.addItems(raw)
  const parts: string[] = []
  if (added) parts.push(`${added} added`)
  if (skipped) parts.push(`${skipped} skipped`)
  feedback.value = parts.length ? parts.join(' · ') : 'No new cards'
}
</script>

<template>
  <section class="config">
    <div class="bar">
      <button type="button" class="action" @click="emit('back')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <h2>Configure cards</h2>
    </div>

    <AddItemsPanel @add="onAdd" />
    <p v-if="feedback" class="feedback">{{ feedback }}</p>

    <ul v-if="store.items.length" class="card-list">
      <li v-for="item in store.items" :key="item.id" class="card-row">
        <span class="dot" :style="{ backgroundColor: itemColor(item.hue).bg }"></span>
        <span class="card-text">{{ item.text }}</span>
        <button type="button" class="remove" title="Remove card" @click="store.removeItem(item.id)">
          ×
        </button>
      </li>
    </ul>
    <p v-else class="empty">No cards yet. Add some above.</p>
  </section>
</template>

<style scoped>
.config {
  margin-top: 16px;
}

.bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
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

.action:hover {
  border-color: var(--accent);
}

.action:active {
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

h2 {
  margin: 0;
  font-size: 18px;
}

.feedback {
  color: var(--text-muted);
  font-size: 13px;
  margin: 0 0 12px;
}

.card-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 8px 6px 10px;
}

.dot {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

.card-text {
  flex: 1 1 auto;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove {
  flex: 0 0 auto;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 4px;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.remove:hover {
  color: var(--danger);
  background: var(--drop);
}
</style>
