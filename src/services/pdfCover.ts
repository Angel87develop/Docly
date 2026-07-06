import * as pdfjs from 'pdfjs-dist'

let workerConfigured = false

export function configurePdfWorker(): void {
  if (workerConfigured) return
  workerConfigured = true
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
}

/** pdf.js puede transferir el buffer al worker y dejarlo detached: siempre trabajar sobre copia. */
export function copyPdfBytesForWorker(data: ArrayBuffer): Uint8Array {
  return new Uint8Array(data.slice(0))
}

export async function renderPdfFirstPageDataUrl(
  data: ArrayBuffer,
  maxWidth = 280,
): Promise<string | null> {
  configurePdfWorker()
  const loadingTask = pdfjs.getDocument({ data: copyPdfBytesForWorker(data) })
  const pdf = await loadingTask.promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 1 })
  const scale = maxWidth / viewport.width
  const scaled = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  canvas.width = scaled.width
  canvas.height = scaled.height
  await page.render({ canvasContext: ctx, viewport: scaled, canvas }).promise
  return canvas.toDataURL('image/jpeg', 0.82)
}

export async function getPdfPageCount(data: ArrayBuffer): Promise<number> {
  configurePdfWorker()
  const pdf = await pdfjs.getDocument({ data: copyPdfBytesForWorker(data) }).promise
  return pdf.numPages
}
