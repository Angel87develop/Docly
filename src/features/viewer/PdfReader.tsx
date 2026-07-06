import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import * as pdfjs from 'pdfjs-dist'
import type { LibraryFile } from '@/types'
import { configurePdfWorker, copyPdfBytesForWorker } from '@/services/pdfCover'
import { useLibraryStore } from '@/store/libraryStore'
import { Button } from '@/components/ui/Button'

export function PdfReader({ file }: { file: LibraryFile }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const [pageNum, setPageNum] = useState(Math.max(1, file.progress.currentPage || 1))
  const [numPages, setNumPages] = useState(file.progress.totalPages ?? 0)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [layoutTick, setLayoutTick] = useState(0)
  const updateFileProgress = useLibraryStore((s) => s.updateFileProgress)

  useEffect(() => {
    const onResize = () => setLayoutTick((n) => n + 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const clampedPage = useMemo(() => {
    const total = numPages || 0
    if (total <= 0) return Math.max(1, pageNum)
    return Math.min(Math.max(1, pageNum), total)
  }, [pageNum, numPages])

  const renderPage = useCallback(
    async (pdf: PDFDocumentProxy, num: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const page = await pdf.getPage(num)
      const base = page.getViewport({ scale: 1 })
      const pad = 8
      const maxW = Math.max(2000, window.innerWidth - pad * 2)
      const maxH = Math.max(1200, window.innerHeight * 0.92)
      const sW = maxW / base.width
      const sH = maxH / base.height
      /** Apaisado: llenar ancho (como lectores PDF típicos); vertical: que quepa en alto */
      const landscape = base.width >= base.height
      const scaleFit = landscape ? sW : Math.min(sW, sH)
      /** Máxima nitidez en pantallas retina (tope por memoria) */
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      const viewport = page.getViewport({ scale: scaleFit * dpr })
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return
      const bw = Math.floor(viewport.width)
      const bh = Math.floor(viewport.height)
      canvas.width = bw
      canvas.height = bh
      const cssW = Math.floor(bw / dpr)
      const cssH = Math.floor(bh / dpr)
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      await page.render({ canvasContext: ctx, viewport, canvas }).promise
      const total = pdf.numPages
      const pct = total > 0 ? Math.round(((num - 1) / Math.max(1, total - 1)) * 100) : 0
      void updateFileProgress(file.id, {
        currentPage: num,
        totalPages: total,
        percent: pct,
      })
    },
    [file.id, updateFileProgress],
  )

  useEffect(() => {
    const url = file.blobUrl
    if (!url) return
    let cancelled = false
    pdfRef.current?.destroy()
    pdfRef.current = null

    const run = async () => {
      setError(null)
      setReady(false)
      try {
        configurePdfWorker()
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buf = await res.arrayBuffer()
        if (cancelled) return
        const pdf = await pdfjs
          .getDocument({ data: copyPdfBytesForWorker(buf) })
          .promise
        if (cancelled) {
          pdf.destroy()
          return
        }
        pdfRef.current = pdf
        setNumPages(pdf.numPages)
        setReady(true)
      } catch (e) {
        console.error(e)
        if (!cancelled) setError('No se pudo cargar el PDF.')
      }
    }

    void run()
    return () => {
      cancelled = true
      pdfRef.current?.destroy()
      pdfRef.current = null
      setReady(false)
    }
  }, [file.blobUrl, file.id])

  useEffect(() => {
    const pdf = pdfRef.current
    if (!pdf || !ready) return
    void renderPage(pdf, clampedPage)
  }, [ready, clampedPage, renderPage, layoutTick])

  const go = (delta: number) => {
    setPageNum((p) => {
      const max = Math.max(1, numPages || 1)
      return Math.min(Math.max(1, p + delta), max)
    })
  }

  if (error) {
    return <p className="text-center text-sm text-red-400">{error}</p>
  }

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-4">
      <div className="relative w-full h-[calc(100vh-9.5rem)] overflow-auto rounded-lg border border-docly-border bg-neutral-950 shadow-2xl">
        <canvas ref={canvasRef} className="mx-auto block max-w-none bg-neutral-900" />
        <button
          type="button"
          aria-label="Página anterior"
          className="absolute inset-y-0 left-0 z-10 flex w-16 items-center justify-center bg-linear-to-r from-black/40 to-transparent text-3xl text-white/70 transition hover:text-white"
          onClick={() => go(-1)}
          disabled={clampedPage <= 1 || !ready}
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Página siguiente"
          className="absolute inset-y-0 right-0 z-10 flex w-16 items-center justify-center bg-linear-to-l from-black/40 to-transparent text-3xl text-white/70 transition hover:text-white"
          onClick={() => go(1)}
          disabled={!ready || (numPages > 0 && clampedPage >= numPages)}
        >
          ›
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="ghost" disabled={clampedPage <= 1 || !ready} onClick={() => go(-1)}>
          ← Anterior
        </Button>
        <span className="font-mono text-sm text-neutral-400">
          {clampedPage} / {numPages || '…'}
        </span>
        <Button
          variant="ghost"
          disabled={!ready || (numPages > 0 && clampedPage >= numPages)}
          onClick={() => go(1)}
        >
          Siguiente →
        </Button>
      </div>
    </div>
  )
}
