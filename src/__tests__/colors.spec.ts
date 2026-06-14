import { describe, expect, it } from 'vitest'
import {
  ITEM_TEXT_COLOR,
  contrastRatio,
  hslToRgb,
  itemColor,
  nextHue,
  tierColor,
} from '@/utils/colors'

function parseItemBg(bg: string): { h: number; s: number; l: number } {
  const m = bg.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)!
  return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) }
}

const textRgb = {
  r: parseInt(ITEM_TEXT_COLOR.slice(1, 3), 16),
  g: parseInt(ITEM_TEXT_COLOR.slice(3, 5), 16),
  b: parseInt(ITEM_TEXT_COLOR.slice(5, 7), 16),
}

describe('colors', () => {
  it('tierColor spreads hues across the wheel and recomputes with count', () => {
    expect(tierColor(0, 5)).toBe('hsl(0, 65%, 55%)')
    expect(tierColor(1, 5)).toBe('hsl(72, 65%, 55%)')
    // same index, different count -> different hue
    expect(tierColor(1, 5)).not.toBe(tierColor(1, 10))
  })

  it('item background always clears WCAG 4.5:1 against the constant text color', () => {
    for (let hue = 0; hue < 360; hue++) {
      const { h, s, l } = parseItemBg(itemColor(hue).bg)
      const rgb = hslToRgb(h, s / 100, l / 100)
      expect(contrastRatio(rgb, textRgb)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('nextHue advances by the golden angle and stays in range', () => {
    expect(nextHue([])).toBe(0)
    const h1 = nextHue([0])
    expect(h1).toBeGreaterThan(0)
    expect(h1).toBeLessThan(360)
  })
})
