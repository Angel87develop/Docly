import { nanoid } from 'nanoid'
import type { LibraryFile, ReadingProgress } from '@/types'
import { detectKind } from '@/utils/fileKind'
import { extractEpubCoverDataUrl } from '@/services/epubCover'
import { getPdfPageCount, renderPdfFirstPageDataUrl } from '@/services/pdfCover'

const defaultProgress = (): ReadingProgress => ({
  currentPage: 1,
  totalPages: null,
  epubCfi: null,
  percent: 0,
})

export interface ImportedFileResult {
  file: LibraryFile
  buffer: ArrayBuffer
  coverDataUrl: string | null
}

export async function importLocalFile(raw: File): Promise<ImportedFileResult> {
  const buffer = await raw.arrayBuffer()
  const kind = detectKind(raw.type || 'application/octet-stream', raw.name)
  let coverDataUrl: string | null = null
  let totalPages: number | null = null

  if (kind === 'pdf') {
    ;[coverDataUrl, totalPages] = await Promise.all([
      renderPdfFirstPageDataUrl(buffer),
      getPdfPageCount(buffer).catch(() => null),
    ])
  } else if (kind === 'epub') {
    coverDataUrl = await extractEpubCoverDataUrl(buffer)
  }

  const id = nanoid()
  const progress = defaultProgress()
  if (totalPages != null) progress.totalPages = totalPages

  const file: LibraryFile = {
    id,
    name: raw.name.replace(/\.[^/.]+$/, '') || raw.name,
    type: raw.type || 'application/octet-stream',
    kind,
    size: raw.size,
    coverUrl: coverDataUrl,
    folderId: null,
    createdAt: new Date().toISOString(),
    progress,
    tags: [],
  }

  return { file, buffer, coverDataUrl }
}
