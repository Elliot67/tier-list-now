<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ add: [raw: string] }>()

const text = ref('')

function submit() {
  if (text.value.trim().length === 0) return
  emit('add', text.value)
  text.value = ''
}
</script>

<template>
  <div class="panel">
    <textarea
      v-model="text"
      class="textarea"
      rows="5"
      placeholder="One card per line…"
      @keydown.ctrl.enter="submit"
      @keydown.meta.enter="submit"
    ></textarea>
    <div class="actions">
      <span class="hint">Enter one card per line · duplicates are skipped</span>
      <button type="button" class="add" @click="submit">Add cards</button>
    </div>
  </div>
</template>

<style scoped>
.panel {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  margin-bottom: 12px;
}

.textarea {
  width: 100%;
  resize: vertical;
  background: var(--drop);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px;
  font-family: inherit;
  /* >= 16px to avoid iOS Safari auto-zooming the page on focus */
  font-size: 16px;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  gap: 12px;
}

.hint {
  color: var(--text-muted);
  font-size: 12px;
}

.add {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 600;
  transition:
    filter 0.15s ease,
    transform 0.05s ease;
}

.add:hover {
  filter: brightness(1.1);
}

.add:active {
  transform: translateY(1px);
}
</style>
