<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source'
import type { Item } from '@/types'
import { itemColor } from '@/utils/colors'

const props = defineProps<{
  item: Item
  /** Forces a drop indicator edge even when this card isn't directly hovered. */
  forceEdge?: 'left' | 'right' | null
}>()

const el = ref<HTMLElement | null>(null)
const dragging = ref(false)
const pressed = ref(false)
const closestEdge = ref<'left' | 'right' | null>(null)

const colors = computed(() => itemColor(props.item.hue))
const shownEdge = computed(() => closestEdge.value ?? props.forceEdge ?? null)

function edgeFromInput(element: Element, clientX: number): 'left' | 'right' {
  const rect = element.getBoundingClientRect()
  return clientX < rect.left + rect.width / 2 ? 'left' : 'right'
}

let cleanup: (() => void) | undefined

onMounted(() => {
  if (!el.value) return
  cleanup = combine(
    draggable({
      element: el.value,
      getInitialData: () => ({ itemId: props.item.id }),
      onGenerateDragPreview: ({ location, nativeSetDragImage }) => {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: preserveOffsetOnSource({
            element: el.value!,
            input: location.current.input,
          }),
          render({ container }) {
            if (!el.value) return
            const preview = el.value.cloneNode(true) as HTMLElement
            preview.style.transform = 'rotate(4deg)'
            preview.style.transformOrigin = 'top left'
            preview.style.margin = '0'
            container.appendChild(preview)
          },
        })
      },
      onDragStart: () => {
        dragging.value = true
        pressed.value = false
      },
      onDrop: () => {
        dragging.value = false
        pressed.value = false
      },
    }),
    dropTargetForElements({
      element: el.value,
      getData: ({ input, element }) => ({
        targetType: 'item',
        itemId: props.item.id,
        tierId: props.item.tierId,
        edge: edgeFromInput(element, input.clientX),
      }),
      // Stay a valid (no-op) target for our own card so hovering its spot doesn't fall
      // through to the zone (which would drop at the end); just hide the indicator on it.
      onDragEnter: ({ self, source }) =>
        (closestEdge.value =
          source.data.itemId === props.item.id ? null : (self.data.edge as 'left' | 'right')),
      onDrag: ({ self, source }) =>
        (closestEdge.value =
          source.data.itemId === props.item.id ? null : (self.data.edge as 'left' | 'right')),
      onDragLeave: () => (closestEdge.value = null),
      onDrop: () => (closestEdge.value = null),
    }),
  )
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div
    ref="el"
    class="item"
    :class="{ dragging, pressed }"
    :title="item.text"
    @pointerdown="pressed = true"
    @pointerup="pressed = false"
    @pointerleave="pressed = false"
    @pointercancel="pressed = false"
  >
    <span v-if="shownEdge" class="indicator" :class="shownEdge"></span>
    <div class="surface" :style="{ backgroundColor: colors.bg, color: colors.text }">
      <span class="label">{{ item.text }}</span>
    </div>
  </div>
</template>

<style scoped>
/* The .item is the drag/drop hitbox: transparent side-padding provides the visual
   spacing between cards while keeping the hit areas edge-to-edge (no dead gap). */
.item {
  position: relative;
  padding: 0 3px;
  user-select: none;
  cursor: grab;
  overflow: visible;
  flex: 0 0 auto;
  transform-origin: top left;
  transition: transform 0.12s ease;
}

.item:active {
  cursor: grabbing;
}

.item.pressed {
  transform: rotate(4deg);
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
}

.label {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.dragging {
  opacity: 0.4;
}

.indicator {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 6px;
  border-radius: 4px;
  background: var(--accent);
  box-shadow: 0 0 8px 1px var(--accent);
  pointer-events: none;
  z-index: 2;
}

/* Centered on the boundary between two cards (the middle of the fake spacing). */
.indicator.left {
  left: 0;
  transform: translateX(-50%);
}

.indicator.right {
  right: 0;
  transform: translateX(50%);
}
</style>
