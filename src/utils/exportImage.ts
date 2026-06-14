import { toPng } from 'html-to-image'

// Fixed width (px) for exported images, so the result is consistent regardless of the
// current window/viewport size. The board reflows to this width during capture only.
const EXPORT_WIDTH = 960

/** Render a DOM node to a PNG and trigger a download. */
export async function exportTierListImage(node: HTMLElement, filename = 'tier-list.png') {
  // Elements marked `.export-hide` (e.g. per-row delete buttons) are hidden during capture
  // so they don't appear in the image, then restored afterwards.
  const hidden = Array.from(node.querySelectorAll<HTMLElement>('.export-hide'))
  const prevDisplay = hidden.map((el) => el.style.display)
  hidden.forEach((el) => (el.style.display = 'none'))

  const prevWidth = node.style.width
  const prevMaxWidth = node.style.maxWidth
  node.style.width = `${EXPORT_WIDTH}px`
  node.style.maxWidth = 'none'

  try {
    const dataUrl = await toPng(node, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: getComputedStyle(document.body).backgroundColor || '#14161a',
    })
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  } finally {
    node.style.width = prevWidth
    node.style.maxWidth = prevMaxWidth
    hidden.forEach((el, i) => (el.style.display = prevDisplay[i] ?? ''))
  }
}
