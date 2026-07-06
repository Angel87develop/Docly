/** Carpetas fijas dentro de la raíz Docly elegida por el usuario */
export const DISK_TODO_DIR = 'TODO'
export const DISK_FOLDERS_DIR = 'folders'

type DirectoryPickerWindow = Window &
  typeof globalThis & {
    showDirectoryPicker?: (options?: {
      id?: string
      mode?: 'read' | 'readwrite'
      startIn?: string
    }) => Promise<FileSystemDirectoryHandle>
  }

type DirHandlePerm = FileSystemDirectoryHandle & {
  queryPermission?: (d: { mode: 'readwrite' }) => Promise<PermissionState>
  requestPermission?: (d: { mode: 'readwrite' }) => Promise<PermissionState>
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

export async function pickDoclyRootDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) return null
  const w = window as DirectoryPickerWindow
  try {
    return await w.showDirectoryPicker!({
      id: 'docly-library',
      mode: 'readwrite',
      startIn: 'documents',
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return null
    throw e
  }
}

/** Crea TODO/ y folders/ si no existen */
export async function ensureDoclyLayout(root: FileSystemDirectoryHandle): Promise<void> {
  await root.getDirectoryHandle(DISK_TODO_DIR, { create: true })
  await root.getDirectoryHandle(DISK_FOLDERS_DIR, { create: true })
}

export async function requestDiskPermission(
  root: FileSystemDirectoryHandle,
): Promise<PermissionState> {
  const h = root as DirHandlePerm
  const opts = { mode: 'readwrite' as const }
  const q = (await h.queryPermission?.(opts)) ?? 'prompt'
  if (q === 'granted') return 'granted'
  return (await h.requestPermission?.(opts)) ?? 'denied'
}

function extensionForKind(kind: string, fallbackName: string): string {
  if (kind === 'pdf') return '.pdf'
  if (kind === 'epub') return '.epub'
  if (kind === 'text') {
    const m = fallbackName.match(/(\.[a-z0-9]+)$/i)
    return m ? m[1] : '.txt'
  }
  const m = fallbackName.match(/(\.[a-z0-9]+)$/i)
  return m ? m[1] : ''
}

function sanitizeSegment(s: string, max = 60): string {
  return s
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max) || 'archivo'
}

/** Ruta relativa: TODO/id_nombre.ext o folders/{folderId}/id_nombre.ext */
export function buildRelativePathForNewFile(
  fileId: string,
  displayName: string,
  kind: string,
  folderId: string | null,
): string {
  const ext = extensionForKind(kind, displayName)
  const base = sanitizeSegment(displayName.replace(/\.[^.]+$/, ''))
  const fileName = `${fileId.slice(0, 12)}_${base}${ext}`
  if (!folderId) return `${DISK_TODO_DIR}/${fileName}`
  return `${DISK_FOLDERS_DIR}/${folderId}/${fileName}`
}

export async function writeFileAtRelativePath(
  root: FileSystemDirectoryHandle,
  relativePath: string,
  data: ArrayBuffer | Blob,
): Promise<void> {
  const parts = relativePath.split('/').filter(Boolean)
  const fileName = parts.pop()
  if (!fileName) throw new Error('Ruta inválida')
  let dir: FileSystemDirectoryHandle = root
  for (const p of parts) {
    dir = await dir.getDirectoryHandle(p, { create: true })
  }
  const fh = await dir.getFileHandle(fileName, { create: true })
  const writable = await fh.createWritable()
  await writable.write(data)
  await writable.close()
}

export async function readFileFromRelativePath(
  root: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<ArrayBuffer> {
  const parts = relativePath.split('/').filter(Boolean)
  const fileName = parts.pop()
  if (!fileName) throw new Error('Ruta inválida')
  let dir: FileSystemDirectoryHandle = root
  for (const p of parts) {
    dir = await dir.getDirectoryHandle(p, { create: false })
  }
  const fh = await dir.getFileHandle(fileName)
  const file = await fh.getFile()
  return file.arrayBuffer()
}

export async function deleteFileAtRelativePath(
  root: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<void> {
  const parts = relativePath.split('/').filter(Boolean)
  const fileName = parts.pop()
  if (!fileName) return
  let dir: FileSystemDirectoryHandle = root
  for (const p of parts) {
    dir = await dir.getDirectoryHandle(p, { create: false })
  }
  await dir.removeEntry(fileName)
}

export async function moveFileOnDisk(
  root: FileSystemDirectoryHandle,
  fromRelative: string,
  toRelative: string,
): Promise<void> {
  const buf = await readFileFromRelativePath(root, fromRelative)
  await writeFileAtRelativePath(root, toRelative, buf)
  await deleteFileAtRelativePath(root, fromRelative)
}

export async function ensureFolderOnDisk(
  root: FileSystemDirectoryHandle,
  folderId: string,
): Promise<void> {
  const folders = await root.getDirectoryHandle(DISK_FOLDERS_DIR, { create: true })
  await folders.getDirectoryHandle(folderId, { create: true })
}

/** Mantiene el nombre de archivo; cambia carpeta destino (TODO vs folders/id). */
export function pathAfterFolderMove(oldRelative: string, newFolderId: string | null): string {
  const parts = oldRelative.split('/').filter(Boolean)
  const fileName = parts[parts.length - 1]
  if (!fileName) return oldRelative
  if (!newFolderId) return `${DISK_TODO_DIR}/${fileName}`
  return `${DISK_FOLDERS_DIR}/${newFolderId}/${fileName}`
}

export async function removeFolderOnDisk(root: FileSystemDirectoryHandle, folderId: string): Promise<void> {
  try {
    const folders = await root.getDirectoryHandle(DISK_FOLDERS_DIR, { create: false })
    await folders.removeEntry(folderId, { recursive: true })
  } catch {
    /* carpeta inexistente */
  }
}
