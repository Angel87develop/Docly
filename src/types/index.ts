/** Extensión o categoría legible para la UI */
export type DocumentKind = 'pdf' | 'epub' | 'text' | 'other'

export interface ReadingProgress {
  /** Página actual (PDF) o índice de sección aproximado */
  currentPage: number
  /** Total de páginas si se conoce (PDF) */
  totalPages: number | null
  /** Ubicación CFI para EPUB */
  epubCfi: string | null
  /** 0–100 */
  percent: number
}

export interface LibraryFile {
  id: string
  name: string
  type: string
  kind: DocumentKind
  size: number
  /** data URL o blob URL para miniatura */
  coverUrl: string | null
  folderId: string | null
  createdAt: string
  progress: ReadingProgress
  tags: string[]
  /** Solo en memoria: URL del binario para el lector */
  blobUrl?: string
  /** Ruta dentro de la carpeta Docly en disco (si aplica) */
  diskRelativePath?: string | null
}

export interface LibraryFolder {
  id: string
  name: string
  parentId: string | null
  createdAt: string
}

/** Vista de árbol en UI: hijos = subcarpetas */
export interface FolderTreeNode extends LibraryFolder {
  children: FolderTreeNode[]
}

export type StoredFileMeta = Omit<LibraryFile, 'coverUrl' | 'blobUrl'> & {
  coverDataUrl: string | null
}

export interface StoredFilePayload {
  meta: StoredFileMeta
  /** Null si el binario está solo en disco (`diskRelativePath`) */
  buffer: ArrayBuffer | null
}
