// Color generation utilities.
//
// Tier colors are *positional*: derived from the row index and total row count, so
// they redistribute automatically as rows are added/removed. They are never persisted.
//
// Item colors are assigned *once* (only the hue is stored). The text color is constant
// (near-black), and the background lightness is computed deterministically so that the
// WCAG contrast ratio against that text always clears 4.5:1 — guaranteeing readability
// for every hue.

export const ITEM_TEXT_COLOR = '#1a1a1a'

const GOLDEN_ANGLE = 137.508
const MIN_CONTRAST = 4.5

export interface Rgb {
  r: number
  g: number
  b: number
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  // h in [0,360), s and l in [0,1]
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0
  let g = 0
  let b = 0
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const m = l - c / 2
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

function hexToRgb(hex: string): Rgb {
  const v = hex.replace('#', '')
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  }
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Distinct, evenly-spaced tier color that redistributes with the total count. */
export function tierColor(index: number, count: number): string {
  const hue = count > 0 ? Math.round((index / count) * 360) : 0
  return `hsl(${hue}, 65%, 55%)`
}

/** Readable label text color for a tier background, chosen by luminance. */
export function tierTextColor(index: number, count: number): string {
  const hue = count > 0 ? (index / count) * 360 : 0
  const rgb = hslToRgb(hue, 0.65, 0.55)
  return relativeLuminance(rgb) > 0.5 ? '#1a1a1a' : '#ffffff'
}

const itemTextRgb = hexToRgb(ITEM_TEXT_COLOR)

/**
 * Background + (constant) text color for an item, given its stored hue.
 * Lightness starts pale and steps up until contrast against the dark text clears 4.5:1.
 */
export function itemColor(hue: number): { bg: string; text: string } {
  let l = 0.78
  while (l < 0.97) {
    const rgb = hslToRgb(hue, 0.7, l)
    if (contrastRatio(rgb, itemTextRgb) >= MIN_CONTRAST) break
    l += 0.05
  }
  return { bg: `hsl(${Math.round(hue)}, 70%, ${Math.round(l * 100)}%)`, text: ITEM_TEXT_COLOR }
}

/** Next hue for a new item, spread from existing hues via the golden angle. */
export function nextHue(existingHues: number[]): number {
  if (existingHues.length === 0) return 0
  const last = existingHues[existingHues.length - 1] ?? 0
  return (last + GOLDEN_ANGLE) % 360
}
