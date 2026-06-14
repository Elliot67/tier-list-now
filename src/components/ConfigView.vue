<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useTierListStore } from '@/stores/tierList'
import { itemColor } from '@/utils/colors'
import AddItemsPanel from './AddItemsPanel.vue'

const emit = defineEmits<{ back: [] }>()

const store = useTierListStore()
const feedback = ref('')

// Lock page scroll while the modal is open (it mounts on open, unmounts on close).
let prevOverflow = ''
onMounted(() => {
  prevOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  document.body.style.overflow = prevOverflow
})

function onAdd(raw: string) {
  const { added, skipped } = store.addItems(raw)
  const parts: string[] = []
  if (added) parts.push(`${added} added`)
  if (skipped) parts.push(`${skipped} skipped`)
  feedback.value = parts.length ? parts.join(' · ') : 'No new cards'
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click="emit('back')"></div>
    <section class="modal-sheet" role="dialog" aria-modal="true" aria-label="Configure cards">
      <div class="bar">
        <h2>Configure cards</h2>
        <button type="button" class="action" @click="emit('back')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
          Close
        </button>
      </div>

      <div class="sheet-body">
        <AddItemsPanel @add="onAdd" />
        <p v-if="feedback" class="feedback">{{ feedback }}</p>

        <ul v-if="store.items.length" class="card-list">
          <li v-for="item in store.items" :key="item.id" class="card-row">
            <span class="dot" :style="{ backgroundColor: itemColor(item.hue).bg }"></span>
            <span class="card-text">{{ item.text }}</span>
            <button
              type="button"
              class="remove"
              title="Remove card"
              @click="store.removeItem(item.id)"
            >
              ×
            </button>
          </li>
        </ul>
        <p v-else class="empty">No cards yet. Add some above.</p>
      </div>
    </section>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 100;
}

.modal-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 101;
  height: 80dvh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-top: 1px solid var(--border);
  border-radius: 14px 14px 0 0;
  padding: 28px 16px 16px;
  box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.45);
  animation: sheet-up 0.22s ease;
}

@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.sheet-body {
  flex: 1 1 auto;
  overflow-y: auto;
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
