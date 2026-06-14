<script setup lang="ts">
import { ref } from 'vue'
import { useTierListStore } from '@/stores/tierList'
import { toHash } from '@/utils/serialize'
import { exportTierListImage } from '@/utils/exportImage'

const props = defineProps<{ boardEl: HTMLElement | null }>()

const store = useTierListStore()

type Key = 'share' | 'template' | 'export'
// Per-button transient feedback shown on the button itself.
const feedback = ref<{ key: Key; text: string; ok: boolean } | null>(null)

let timer: ReturnType<typeof setTimeout> | null = null
function flash(key: Key, text: string, ok = true) {
  feedback.value = { key, text, ok }
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => (feedback.value = null), 2000)
}

function buildLink(stripPlacement: boolean) {
  const hash = toHash(store.serialize(), stripPlacement)
  return `${location.origin}${location.pathname}#${hash}`
}

async function copy(stripPlacement: boolean, key: Key) {
  try {
    await navigator.clipboard.writeText(buildLink(stripPlacement))
    flash(key, 'Copied!')
  } catch {
    flash(key, 'Copy failed', false)
  }
}

async function exportImage() {
  if (!props.boardEl) return
  try {
    await exportTierListImage(props.boardEl)
    flash('export', 'Downloaded!')
  } catch {
    flash('export', 'Export failed', false)
  }
}
</script>

<template>
  <div class="share">
    <button
      type="button"
      :class="{ done: feedback?.key === 'share' && feedback.ok, failed: feedback?.key === 'share' && !feedback.ok }"
      @click="copy(false, 'share')"
    >
      <svg v-if="feedback?.key === 'share'" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true">
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      {{ feedback?.key === 'share' ? feedback.text : 'Share ranking' }}
    </button>
    <button
      type="button"
      :class="{ done: feedback?.key === 'template' && feedback.ok, failed: feedback?.key === 'template' && !feedback.ok }"
      @click="copy(true, 'template')"
    >
      <svg v-if="feedback?.key === 'template'" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true">
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      {{ feedback?.key === 'template' ? feedback.text : 'Share template' }}
    </button>
    <button
      type="button"
      class="primary"
      :class="{ done: feedback?.key === 'export' && feedback.ok, failed: feedback?.key === 'export' && !feedback.ok }"
      @click="exportImage"
    >
      <svg v-if="feedback?.key === 'export'" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M7 10l5 5 5-5M12 15V3" />
      </svg>
      {{ feedback?.key === 'export' ? feedback.text : 'Export image' }}
    </button>
  </div>
</template>

<style scoped>
.share {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

button {
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
    filter 0.15s ease,
    transform 0.05s ease;
}

button:hover {
  border-color: var(--accent);
}

button:active {
  transform: translateY(1px);
}

button svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex: 0 0 auto;
}

button.primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

button.primary:hover {
  filter: brightness(1.1);
}

/* Transient success state shown on the button after a copy/export. */
button.done {
  color: var(--success);
  border-color: var(--success);
}

button.primary.done {
  background: var(--success);
  border-color: var(--success);
  color: #fff;
}

button.failed {
  color: var(--danger);
  border-color: var(--danger);
}

button.primary.failed {
  background: var(--danger);
  border-color: var(--danger);
  color: #fff;
}

</style>
