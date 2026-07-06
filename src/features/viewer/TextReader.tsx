import { useEffect, useState } from 'react'
import type { LibraryFile } from '@/types'
import { useLibraryStore } from '@/store/libraryStore'

export function TextReader({ file }: { file: LibraryFile }) {
  const [text, setText] = useState('')
  const updateFileProgress = useLibraryStore((s) => s.updateFileProgress)

  useEffect(() => {
    if (!file.blobUrl) return
    let cancelled = false
    fetch(file.blobUrl)
      .then((r) => r.text())
      .then((t) => {
        if (!cancelled) setText(t)
      })
      .catch(console.error)
    void updateFileProgress(file.id, { percent: 100, totalPages: 1, currentPage: 1 })
    return () => {
      cancelled = true
    }
  }, [file.blobUrl, file.id, updateFileProgress])

  return (
    <pre className="mx-auto h-[calc(100vh-9.5rem)] w-full max-w-none overflow-auto rounded-xl border border-docly-border bg-docly-surface p-8 sm:p-12 font-sans text-xl leading-[1.85] text-neutral-100 sm:text-2xl [-webkit-font-smoothing:antialiased]">
      {text || 'Cargando…'}
    </pre>
  )
}
