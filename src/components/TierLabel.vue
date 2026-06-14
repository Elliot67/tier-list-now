<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { tierColor, tierTextColor } from '@/utils/colors'

const props = defineProps<{
  name: string
  index: number
  count: number
}>()

const emit = defineEmits<{ rename: [name: string] }>()

const editing = ref(false)
const draft = ref('')
const input = ref<HTMLInputElement | null>(null)

const bg = computed(() => tierColor(props.index, props.count))
const fg = computed(() => tierTextColor(props.index, props.count))

async function startEdit() {
  draft.value = props.name
  editing.value = true
  await nextTick()
  input.value?.focus()
  input.value?.select()
}

function commit() {
  if (!editing.value) return
  editing.value = false
  emit('rename', draft.value.trim())
}

function cancel() {
  editing.value = false
}
</script>

<template>
  <div class="label" :style="{ backgroundColor: bg, color: fg }">
    <input
      v-if="editing"
      ref="input"
      v-model="draft"
      class="edit"
      :style="{ color: fg }"
      @keydown.enter.prevent="commit"
      @keydown.esc.prevent="cancel"
      @blur="commit"
    />
    <button v-else type="button" class="name" :style="{ color: fg }" @click="startEdit">
      {{ name || '—' }}
    </button>
  </div>
</template>

<style scoped>
.label {
  flex: 0 0 100px;
  min-height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: var(--radius) 0 0 var(--radius);
}

.name {
  background: none;
  border: none;
  border-radius: 6px;
  font-size: 17px;
  font-weight: 800;
  width: 100%;
  height: 100%;
  word-break: break-word;
  text-align: center;
  transition: background-color 0.15s ease;
}

.name:hover {
  background: rgba(0, 0, 0, 0.16);
}

.edit {
  width: 100%;
  background: rgba(0, 0, 0, 0.18);
  border: none;
  border-radius: 4px;
  text-align: center;
  /* >= 16px to avoid iOS Safari auto-zooming the page on focus */
  font-size: 16px;
  font-weight: 800;
  padding: 6px 4px;
  outline: none;
}
</style>
