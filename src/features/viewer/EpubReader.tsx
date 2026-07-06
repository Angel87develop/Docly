import ePub from 'epubjs'
import type { Book } from 'epubjs'
import type Rendition from 'epubjs/types/rendition'
import type { Location } from 'epubjs/types/rendition'
import { useEffect, useRef, useState } from 'react'
import type { LibraryFile } from '@/types'
import { useLibraryStore } from '@/store/libraryStore'
import { Button } from '@/components/ui/Button'

export function EpubReader({ file }: { file: LibraryFile }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<Book | null>(null)
  const renditionRef = useRef<Rendition | null>(null)
  const initialCfiRef = useRef(file.progress.epubCfi)
  const [error, setError] = useState<string | null>(null)
  const updateFileProgress = useLibraryStore((s) => s.updateFileProgress)

  useEffect(() => {
    initialCfiRef.current = file.progress.epubCfi
  }, [file.progress.epubCfi])

  useEffect(() => {
    const el = hostRef.current
    if (!el || !file.blobUrl) return

    let cancelled = false
    renditionRef.current = null
    bookRef.current = null
    el.replaceChildren()
    setError(null)

    const run = async () => {
      const url = file.blobUrl
      if (!url) return
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buf = await res.arrayBuffer()
        if (cancelled) return

        const book = ePub(buf)
        bookRef.current = book
        await book.ready
        if (cancelled) {
          book.destroy()
          return
        }

        await book.locations.generate(2000).catch(() => undefined)
        if (cancelled) {
          book.destroy()
          return
        }

        const pad = 8
        const w = Math.max(2000, el.clientWidth || window.innerWidth - pad * 2)
        const h = Math.max(1200, Math.floor(window.innerHeight * 0.94))

        const rendition = book.renderTo(el, {
          width: w,
          height: h,
          flow: 'paginated',
          allowScriptedContent: false,
        })
        renditionRef.current = rendition

        await rendition.display(initialCfiRef.current ?? undefined)

        rendition.on('relocated', (loc: Location) => {
          const cfi = loc.start.cfi
          const raw = loc.start.percentage
          const pct =
            raw == null ? 0 : raw <= 1 ? Math.round(raw * 100) : Math.round(raw)
          void updateFileProgress(file.id, {
            epubCfi: cfi,
            percent: pct,
          })
        })

        requestAnimationFrame(() => {
          try {
            rendition.resize(w, h)
          } catch {
            /* noop */
          }
        })
      } catch (e) {
        console.error(e)
        if (!cancelled) setError('No se pudo abrir el EPUB.')
      }
    }

    void run()

    return () => {
      cancelled = true
      renditionRef.current?.destroy()
      renditionRef.current = null
      bookRef.current?.destroy()
      bookRef.current = null
      el.replaceChildren()
    }
  }, [file.blobUrl, file.id, updateFileProgress])

  const nav = (dir: 'prev' | 'next') => {
    const r = renditionRef.current
    if (!r) return
    void (dir === 'next' ? r.next() : r.prev())
  }

  if (error) {
    return <p className="text-center text-sm text-red-400">{error}</p>
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div
        className="relative min-h-[640px] w-full flex-1 overflow-hidden rounded-xl border border-docly-border bg-neutral-950 shadow-2xl"
        style={{ height: 'calc(100vh - 9.5rem)' }}
      >
        <div ref={hostRef} className="h-full w-full" />
        <button
          type="button"
          aria-label="Página anterior"
          className="absolute inset-y-0 left-0 z-10 flex w-16 items-center justify-center bg-linear-to-r from-black/40 to-transparent text-3xl text-white/70 transition hover:text-white"
          onClick={() => nav('prev')}
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Página siguiente"
          className="absolute inset-y-0 right-0 z-10 flex w-16 items-center justify-center bg-linear-to-l from-black/40 to-transparent text-3xl text-white/70 transition hover:text-white"
          onClick={() => nav('next')}
        >
          ›
        </button>
      </div>
      <div className="flex justify-center gap-3">
        <Button variant="ghost" onClick={() => nav('prev')}>
          ← Anterior
        </Button>
        <Button variant="ghost" onClick={() => nav('next')}>
          Siguiente →
        </Button>
      </div>
    </div>
  )
}
