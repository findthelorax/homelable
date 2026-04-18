import { toPng } from 'html-to-image'

export type ExportQuality = 'standard' | 'high' | 'ultra'

const QUALITY_TARGET_RATIOS: Record<ExportQuality, number> = {
  standard: 2,
  high: 4,
  ultra: 6,
}

const MAX_CANVAS_EDGE_PX = 16384

function getSafePixelRatio(element: HTMLElement, targetRatio: number): number {
  const width = Math.max(1, element.clientWidth)
  const height = Math.max(1, element.clientHeight)
  const basePixelRatio = Math.max(window.devicePixelRatio || 1, targetRatio)
  const maxRatioByWidth = MAX_CANVAS_EDGE_PX / width
  const maxRatioByHeight = MAX_CANVAS_EDGE_PX / height
  return Math.max(1, Math.min(basePixelRatio, maxRatioByWidth, maxRatioByHeight))
}

function uniqueDescendingRatios(baseRatio: number, targetRatio: number): number[] {
  const ratios = [baseRatio, targetRatio, targetRatio - 1, targetRatio - 2, 4, 3, 2, 1]
  return [...new Set(ratios.map((r) => Math.max(1, Math.floor(r))))].sort((a, b) => b - a)
}

interface ExportToPngOptions {
  quality?: ExportQuality
}

/**
 * Export the React Flow canvas as a PNG and trigger a browser download.
 * Pass the `.react-flow` wrapper element.
 */
export async function exportToPng(element: HTMLElement, options: ExportToPngOptions = {}): Promise<void> {
  const quality = options.quality ?? 'ultra'
  const targetRatio = QUALITY_TARGET_RATIOS[quality]
  const baseRatio = getSafePixelRatio(element, targetRatio)
  const ratios = uniqueDescendingRatios(baseRatio, targetRatio)
  let lastError: unknown = null
  let dataUrl: string | null = null

  for (const pixelRatio of ratios) {
    try {
      dataUrl = await toPng(element, {
        backgroundColor: '#0d1117',
        pixelRatio,
        cacheBust: true,
        // Avoid html-to-image font parsing crashes in some browser/font combos.
        fontEmbedCSS: '',
        style: {
          // Exclude controls from the export
          '--xy-controls-display': 'none',
        } as Partial<CSSStyleDeclaration>,
      })
      break
    } catch (err) {
      lastError = err
    }
  }

  if (!dataUrl) {
    const reason = lastError instanceof Error ? lastError.message : String(lastError ?? 'Unknown export error')
    throw new Error(`PNG export failed after retries. ${reason}`)
  }

  const link = document.createElement('a')
  link.download = 'homelable-canvas.png'
  link.href = dataUrl
  link.click()
}
