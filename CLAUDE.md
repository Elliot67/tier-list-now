# CLAUDE.md

Guidance for working in this repository.

## What this is

**Tier List Now** is a text-based tier-list maker. Users build tiered rows (S/A/B/C/D by
default), add text items, drag them into tiers, then **export a PNG** or **share a link**.
There is **no backend** — the entire app state lives in the URL hash, so a link fully
reconstructs a tier list.

**UI vocabulary vs code:** the UI calls rows **tiers** and items **cards**; the code keeps
`Tier`/`tiers` and `Item`/`items` (and `ItemSquare`, `ItemsTray`). When touching user-facing
strings use "tier"/"card"; don't rename the code identifiers.

## Stack

Vue 3.5 (`<script setup>`) · Pinia 3 · TypeScript 6 · Vite 8 · Vitest 4 (jsdom).
Package manager: **pnpm**. Path alias `@` → `./src`. `noUncheckedIndexedAccess` is on
(array access is `T | undefined` — handle it). Prettier: no semicolons, single quotes,
printWidth 100.

### Commands
- `pnpm dev` — dev server
- `pnpm build` — type-check + production build
- `pnpm test:unit --run` — unit tests
- `pnpm lint` — oxlint + eslint (both must pass)
- `pnpm type-check` — `vue-tsc`

## Architecture

### State model (`src/stores/tierList.ts`, `src/types.ts`)
- **Items own their placement** via `tierId: string | null` (`null` = unassigned tray).
  Tiers are a separate ordered `Tier[]`. This makes "remove a row → its items become
  unassigned" a trivial null-out, and dedupe O(1) over a flat `items[]`.
- **Order within a tier** is derived: the relative order of items in the single flat
  `items[]` array filtered to that tier. One source of truth for ordering.
- **`moveItem(itemId, toTierId, beforeItemId?)` is the single sink for all drag operations**
  (cross-tier, to-tray, reorder). Don't add parallel move logic elsewhere.
- Tiers store **no color** (derived positionally at render time). Items store **only a
  `hue`** (the rest of the color is recomputed) — keeps the URL payload small.
- The list has an optional **`title`** (string, default `''`); `unassignAll()` moves every
  placed item back to the tray; `resetToDefaults()` backs the toolbar's "New list".

### Colors (`src/utils/colors.ts`, pure)
- **Tier colors are positional**: `hue = index / count * 360`, so they redistribute as rows
  are added/removed. Never persisted.
- **Item colors are assigned once** (hue via golden-angle spread). Text color is **constant**
  (`#1a1a1a`); background lightness is stepped up until WCAG `contrastRatio ≥ 4.5`, so every
  hue is readable. The contrast invariant is unit-tested across all 360 hues — preserve it.

### URL state (`src/utils/serialize.ts` + `src/composables/useUrlState.ts`)
- Serialized shape is **compact, positional, version-tagged**:
  `{ v: 1, n?: title, t: string[], i: [text, hue, tierIndex][] }`. Tiers are referenced **by
  index**; runtime ids are regenerated on load and never enter the URL. `n` (title) is
  **optional** — omitted when empty to keep links short, and absent in pre-title links, which
  still load (as untitled). Adding it kept `v: 1` because it's purely additive.
- `serialize.ts` is pure (state ↔ `Serialized` ↔ hash). `parseState` is **defensive** — the
  hash is user-pasteable, so any malformed input returns `null` → caller falls back to
  defaults. lz-string compression is confined to this file.
- `useUrlState` does the two-way sync: load-on-init, debounced (`replaceState`, not
  `pushState`) writes on `$subscribe`, and a `lastWrittenHash` + `isApplyingFromUrl` guard to
  break the `hashchange` ↔ `replaceState` feedback loop.
- **Share template** = serialize with `stripPlacement` (every `tierIndex = -1`): rows + item
  pool kept, placement dropped. Live state is untouched. Both share + template links include
  the title (it isn't placement).

### Drag & drop — `@atlaskit/pragmatic-drag-and-drop`
- Chosen over native HTML5 DnD for **touch/mobile support**.
- Each `ItemSquare` is a `draggable` and a drop target. Its `data.edge` (`'left'|'right'`) is
  computed from the pointer vs the card's horizontal midpoint. Each tier zone and the tray is
  a drop target (data `{ targetType: 'zone', tierId }`).
- A **single `monitorForElements` in `TierListApp.vue`** handles every drop: it reads the
  innermost `location.current.dropTargets[0]` and computes `beforeItemId` from `edge`
  (left = before target, right = before the next item / end), then calls `store.moveItem`.
  Components only register draggables/targets and reflect hover state.
- **No dead gaps:** the `.item` is a transparent hitbox with side-padding wrapping an inner
  `.surface` (the colored square). Adjacent hitboxes touch, so hovering "between" cards always
  hits a card and shows a left/right **drop indicator** (centered on the gap). Dropping in the
  empty part of a row shows the indicator on the **last** card (`forceEdge`); an empty tier
  shows a standalone indicator bar (`overEnd`).
- The dragged card stays a (no-op) drop target for **itself** so dropping in place doesn't
  fall through to the zone (which would mean "drop at end").
- **Custom drag preview:** `setCustomNativeDragPreview` + `preserveOffsetOnSource` renders a
  clone rotated 4° (origin top-left, so the grab point stays under the cursor — no shadow, which
  would shift the snapshot). Pressing a card pre-tilts it before the drag starts.
- Drag regions set `user-select: none` (inputs re-enable it) so a drag never starts a text
  selection that the browser would hijack as native text DnD.

### Image export (`src/utils/exportImage.ts`)
- `html-to-image`'s `toPng` over `TierBoard`'s `captureEl` (the `.rows` div — includes the
  editable title, excludes the Add tier button which lives outside it) → download.
- During capture: elements with **`.export-hide`** (per-row delete crosses) are `display:none`,
  and the node is forced to a fixed **`EXPORT_WIDTH`** so the image is window-size-independent;
  both are restored in a `finally`. Keep the board self-contained (system fonts, no external
  images) so style inlining works.

### Components (`src/components/`)
- `TierListApp` — root: URL init, the single drop monitor, `mode` ('rank' | 'configure'),
  toolbar with **New list** (two-step inline confirm → `resetToDefaults`) + `ShareMenu`.
- `TierBoard` — the captured `.rows` (inline-editable list **title** + `TierRow`s, empty-state
  message) + **Add tier** button (outside the capture). Exposes `captureEl`.
- `TierRow` → `TierLabel` (inline rename) + `ItemSquare`s; zone drop target + delete cross.
- `ItemsTray` — the **Rank** view's tray: unassigned-cards drop zone, **Retrieve cards**
  (`unassignAll`), and a **Configure** toggle (emits `configure`).
- `ConfigView` — the **Configure** view: `AddItemsPanel` (bulk add) + removable card list +
  Back button; owns the add feedback.
- `ShareMenu` — Share ranking / Share template / Export image; per-button green success
  feedback shown on the button itself.

## Vendored lz-string (`src/vendor/lz-string.js`)
Converted to a clean **ESM default export** (`export default LZString`) — the original
CJS/AMD footer was removed because Vite's dev server doesn't transform CJS in `src/`. Import
as `import LZString from '@/vendor/lz-string'`. The folder is excluded from eslint/oxlint.

## Conventions
- Add new persisted state? Extend `serialize.ts` (`serializeState`/`parseState`/`toState`)
  **and** its round-trip tests. Prefer additive optional fields (keep `v: 1`, omit when
  empty); only bump `v` for incompatible shape changes. Don't put ids or derived colors in the
  URL.
- Keep `src/utils/*` pure and unit-tested (colors, serialize); side effects (URL, clipboard,
  DOM export) live in composables/components.
- All drag moves go through `store.moveItem`.
