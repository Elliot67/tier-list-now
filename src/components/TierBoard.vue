<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useTierListStore } from '@/stores/tierList'
import TierRow from './TierRow.vue'

const store = useTierListStore()

// The element to capture when exporting an image — title + rows, no Add tier button.
const captureEl = ref<HTMLElement | null>(null)
defineExpose({ captureEl })

const editingTitle = ref(false)
const titleDraft = ref('')
const titleInput = ref<HTMLInputElement | null>(null)

async function startTitleEdit() {
  titleDraft.value = store.title
  editingTitle.value = true
  await nextTick()
  titleInput.value?.focus()
  titleInput.value?.select()
}

function commitTitle() {
  if (!editingTitle.value) return
  editingTitle.value = false
  store.title = titleDraft.value.trim()
}

function cancelTitle() {
  editingTitle.value = false
}
</script>

<template>
  <div class="board">
    <div ref="captureEl" class="rows">
      <input
        v-if="editingTitle"
        ref="titleInput"
        v-model="titleDraft"
        class="title-edit"
        placeholder="Untitled tier list"
        @keydown.enter.prevent="commitTitle"
        @keydown.esc.prevent="cancelTitle"
        @blur="commitTitle"
      />
      <h2
        v-else
        class="title"
        :class="{ untitled: !store.title }"
        title="Click to rename"
        @click="startTitleEdit"
      >
        {{ store.title || 'Untitled tier list' }}
      </h2>

      <TierRow
        v-for="(tier, index) in store.tiers"
        :key="tier.id"
        :tier="tier"
        :index="index"
        :count="store.tiers.length"
        :items="store.itemsForTier(tier.id)"
        @rename="(name) => store.renameTier(tier.id, name)"
        @remove="store.removeTier(tier.id)"
      />
      <p v-if="store.tiers.length === 0" class="empty">No tiers yet — add one to start ranking.</p>
    </div>
    <button type="button" class="add-row" @click="store.addTier()">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Add tier
    </button>
  </div>
</template>

<style scoped>
.empty {
  margin: 0;
  padding: 24px 8px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}

.rows {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px;
  -webkit-user-select: none;
  user-select: none;
}

.title {
  margin: 4px 4px 12px;
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
  cursor: text;
  border-radius: 6px;
  padding: 2px 6px;
  display: inline-block;
  transition: background-color 0.15s ease;
}

.title:hover {
  background: var(--surface-2);
}

.title.untitled {
  color: var(--text-muted);
  font-weight: 700;
}

.title-edit {
  display: block;
  width: 100%;
  margin: 4px 0 12px;
  background: var(--drop);
  color: var(--text);
  border: 1px solid var(--accent);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 22px;
  font-weight: 800;
  outline: none;
}

.add-row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 6px;
  width: 100%;
  background: var(--surface-2);
  color: var(--text-muted);
  border: 1px dashed var(--border);
  border-radius: 6px;
  padding: 10px;
  font-weight: 600;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.add-row svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex: 0 0 auto;
}

.add-row:hover {
  color: var(--text);
  border-color: var(--accent);
  background: var(--surface);
}
</style>
