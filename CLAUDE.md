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
- `pnpm format` — Prettier (no semicolons, single quotes, printWidth 100)
- `pnpm type-check` — `vue-tsc`

Always run `pnpm format` (or rely on the editor's Prettier integration) and `pnpm lint`
before finishing a change — keep code properly formatted and lint-clean.

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

### Drag & drop — SortableJS (`src/composables/useCardSortable.ts`)
- Uses raw **`sortablejs`** (touch + mouse) — we tried `@atlaskit/pragmatic-drag-and-drop`
  first but its native-HTML5-DnD base doesn't fire on touch. Local types in
  `src/sortablejs.d.ts`.
- `useCardSortable(zoneRef)` makes a zone a Sortable drop zone in the shared `cards` group.
  Each zone carries `data-tier-id` (empty string = unassigned tray) and each `ItemSquare`
  carries `data-item-id`.
- **The store stays authoritative.** On `onEnd` the composable reads the target tier and
  insertion point (`evt.to` + `evt.item.nextElementSibling`) from the DOM, **reverts**
  Sortable's DOM mutation (so Vue isn't operating on moved nodes), then applies the move via
  `store.moveItem` and lets Vue re-render. All drag moves still go through `moveItem`.
- **Visuals** are Sortable classes styled globally in `assets/main.css`: `chosenClass`
  (`.card-chosen`, the 4° tilt on pickup), `fallbackClass` (`.card-fallback` with
  `forceFallback`, the rotated drag image — rotate `.surface`, not the root, which Sortable
  positions), `ghostClass` (`.card-ghost`, the placeholder gap = insertion indicator).
- `ItemSquare` is presentational: a `.item` hitbox (transparent side-padding for spacing)
  wrapping the colored `.surface`. Drag regions set `user-select: none` (inputs re-enable it)
  so a drag never starts a text selection the browser would hijack.

### Image export (`src/utils/exportImage.ts`)
- `html-to-image`'s `toPng` over `TierBoard`'s `captureEl` (the `.rows` div — includes the
  editable title, excludes the Add tier button which lives outside it) → download.
- During capture: elements with **`.export-hide`** (per-row delete crosses) are `display:none`,
  and the node is forced to a fixed **`EXPORT_WIDTH`** so the image is window-size-independent;
  both are restored in a `finally`. Keep the board self-contained (system fonts, no external
  images) so style inlining works.

### Components (`src/components/`)
- `TierListApp` — root: URL init, `mode` ('rank' | 'configure'), toolbar with **New list** +
  `ShareMenu`. **New list** (two-step inline confirm) does `history.pushState` to a hash-less
  URL (no reload) then `store.resetToDefaults()`, so Back restores the previous list.
- `TierBoard` — the captured `.rows` (inline-editable list **title** + `TierRow`s, empty-state
  message) + **Add tier** button (outside the capture). Exposes `captureEl`.
- `TierRow` → `TierLabel` (inline rename) + `ItemSquare`s; Sortable zone + delete cross.
- `ItemsTray` — the **Rank** view's tray: unassigned-cards Sortable zone, **Rollback**
  (`unassignAll`), and a **Configure** button (emits `configure`).
- `ConfigView` — the **Configure** view, rendered as a **bottom-sheet modal**
  (`<Teleport to="body">` + backdrop, `80dvh`, locks body scroll): `AddItemsPanel` (bulk add)
  + removable card list + Close button; owns the add feedback.
- `ShareMenu` — Share ranking / Share template / Export image; per-button green success
  feedback shown on the button itself.

### Responsive layout (`TierListApp` + `ItemsTray`)
- **Desktop (≥830px):** the rank view is a two-column flex — board left, the tray a fixed
  `270px` right **sidebar** sized for exactly 3 cards/row (min 2-row height).
- **Mobile (≤640px):** the tray stacks under the board, and a **sticky bottom strip**
  (Teleported, single scrollable row) appears when the tray scrolls out of view — driven by an
  `IntersectionObserver` (with a small negative bottom `rootMargin`). It stays visible (compact,
  with the same empty prompt) even when there are no unassigned cards, and is itself a Sortable
  zone so cards can be dragged from it into the tiers.
- Form fields are ≥16px to avoid iOS Safari focus-zoom.

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
