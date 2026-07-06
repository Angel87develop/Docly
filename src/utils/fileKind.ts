import type { DocumentKind } from '@/types'

const PDF = 'application/pdf'
const EPUB = 'application/epub+zip'
const EPUB_ALT = 'application/x-epub+zip'

export function detectKind(mime: string, fileName: string): DocumentKind {
  const lower = fileName.toLowerCase()
  if (mime === PDF || lower.endsWith('.pdf')) return 'pdf'
  if (mime === EPUB || mime === EPUB_ALT || lower.endsWith('.epub')) return 'epub'
  if (mime.startsWith('text/') || lower.endsWith('.txt') || lower.endsWith('.md'))
    return 'text'
  return 'other'
}

export function extensionLabel(kind: DocumentKind, mime: string): string {
  if (kind === 'pdf') return 'PDF'
  if (kind === 'epub') return 'EPUB'
  if (kind === 'text') return 'TXT'
  const part = mime.split('/')[1]
  return part ? part.toUpperCase().slice(0, 8) : 'FILE'
}
