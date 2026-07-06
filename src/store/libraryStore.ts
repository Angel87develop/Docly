import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { LibraryFile, LibraryFolder, ReadingProgress, StoredFilePayload } from '@/types'
import {
  idbDeleteFile,
  idbDeleteFolder,
  idbGetFile,
  idbListFiles,
  idbListFolders,
  idbLoadRootHandle,
  idbSaveFile,
  idbSaveFolder,
  idbSaveRootHandle,
} from '@/services/idbLibrary'
import type { ImportedFileResult } from '@/services/fileImport'
import {
  buildRelativePathForNewFile,
  deleteFileAtRelativePath,
  ensureDoclyLayout,
  ensureFolderOnDisk,
  moveFileOnDisk,
  pathAfterFolderMove,
  pickDoclyRootDirectory,
  readFileFromRelativePath,
  removeFolderOnDisk,
  requestDiskPermission,
  writeFileAtRelativePath,
} from '@/services/doclyDisk'

type Selection = 'all' | string
export type SortMode = 'az' | 'date' | 'size' | 'progress'
export type ProgressFilter = 'all' | 'unread' | 'in_progress' | 'completed'

export type DiskAccessState = 'none' | 'granted' | 'denied'

type ViewPreferences = {
  sortMode: SortMode
  progressFilter: ProgressFilter
}

const VIEW_PREFS_KEY = 'docly-view-preferences'

function loadViewPreferences(): ViewPreferences {
  if (typeof window === 'undefined') {
    return { sortMode: 'az', progressFilter: 'all' }
  }
  try {
    const raw = localStorage.getItem(VIEW_PREFS_KEY)
    if (!raw) return { sortMode: 'az', progressFilter: 'all' }
    const parsed = JSON.parse(raw) as Partial<ViewPreferences>
    return {
      sortMode: parsed.sortMode ?? 'az',
      progressFilter: parsed.progressFilter ?? 'all',
    }
  } catch {
    return { sortMode: 'az', progressFilter: 'all' }
  }
}

function saveViewPreferences(prefs: ViewPreferences): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(VIEW_PREFS_KEY, JSON.stringify(prefs))
}

function persistedMeta(file: LibraryFile, coverDataUrl: string | null): StoredFilePayload['meta'] {
  return {
    id: file.id,
    name: file.name,
    type: file.type,
    kind: file.kind,
    size: file.size,
    folderId: file.folderId,
    createdAt: file.createdAt,
    progress: file.progress,
    tags: file.tags,
    coverDataUrl,
    diskRelativePath: file.diskRelativePath ?? null,
  }
}

async function resolveRowBuffer(
  row: StoredFilePayload,
  root: FileSystemDirectoryHandle | null,
  access: DiskAccessState,
): Promise<ArrayBuffer | null> {
  if (row.buffer) return row.buffer
  const path = row.meta.diskRelativePath
  if (path && root && access === 'granted') {
    try {
      return await readFileFromRelativePath(root, path)
    } catch (e) {
      console.warn('[Docly] No se pudo leer del disco:', path, e)
      return null
    }
  }
  return null
}

interface LibraryState {
  hydrated: boolean
  files: LibraryFile[]
  folders: LibraryFolder[]
  selectedFolderId: Selection
  searchQuery: string
  sortMode: SortMode
  progressFilter: ProgressFilter
  activeTagFilters: string[]
  diskRoot: FileSystemDirectoryHandle | null
  diskAccess: DiskAccessState

  hydrate: () => Promise<void>
  setSearchQuery: (q: string) => void
  setSelectedFolder: (id: Selection) => void
  setSortMode: (mode: SortMode) => void
  setProgressFilter: (filter: ProgressFilter) => void
  toggleTagFilter: (tag: string) => void
  clearTagFilters: () => void
  connectDoclyFolder: () => Promise<boolean>

  addImportedFile: (payload: ImportedFileResult, targetFolderId: string | null) => Promise<void>
  deleteFile: (id: string) => Promise<void>
  renameFile: (id: string, name: string) => Promise<void>
  moveFileToFolder: (fileId: string, folderId: string | null) => Promise<void>
  setCustomCover: (fileId: string, dataUrl: string) => Promise<void>
  setFileTags: (fileId: string, tags: string[]) => Promise<void>
  updateFileProgress: (id: string, progress: Partial<ReadingProgress>) => Promise<void>

  createFolder: (name: string, parentId: string | null) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  moveFoldersToParent: (folderIds: string[], parentId: string | null) => Promise<void>
}

export const useLibraryStore = create<LibraryState>((set, get) => {
  const prefs = loadViewPreferences()
  return {
  hydrated: false,
  files: [],
  folders: [],
  selectedFolderId: 'all',
  searchQuery: '',
  sortMode: prefs.sortMode,
  progressFilter: prefs.progressFilter,
  activeTagFilters: [],
  diskRoot: null,
  diskAccess: 'none',

  hydrate: async () => {
    for (const f of get().files) {
      if (f.blobUrl) URL.revokeObjectURL(f.blobUrl)
    }

    const root = await idbLoadRootHandle()
    let diskAccess: DiskAccessState = 'none'
    if (root) {
      const p = await requestDiskPermission(root)
      diskAccess = p === 'granted' ? 'granted' : 'denied'
    }

    const [rows, folderRows] = await Promise.all([idbListFiles(), idbListFolders()])
    const files: LibraryFile[] = []
    for (const row of rows) {
      const buf = await resolveRowBuffer(row, root, diskAccess)
      if (!buf) continue
      const base = row.meta
      const blobUrl = URL.createObjectURL(new Blob([buf], { type: base.type }))
      files.push({
        id: base.id,
        name: base.name,
        type: base.type,
        kind: base.kind,
        size: base.size,
        coverUrl: base.coverDataUrl,
        folderId: base.folderId,
        createdAt: base.createdAt,
        progress: base.progress,
        tags: base.tags,
        blobUrl,
        diskRelativePath: base.diskRelativePath ?? null,
      })
    }

    set({
      files,
      folders: folderRows,
      diskRoot: root,
      diskAccess,
      hydrated: true,
    })
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedFolder: (id) => set({ selectedFolderId: id }),
  setSortMode: (mode) => {
    set({ sortMode: mode })
    saveViewPreferences({ sortMode: mode, progressFilter: get().progressFilter })
  },
  setProgressFilter: (filter) => {
    set({ progressFilter: filter })
    saveViewPreferences({ sortMode: get().sortMode, progressFilter: filter })
  },
  toggleTagFilter: (tag) =>
    set((s) => ({
      activeTagFilters: s.activeTagFilters.includes(tag)
        ? s.activeTagFilters.filter((t) => t !== tag)
        : [...s.activeTagFilters, tag],
    })),
  clearTagFilters: () => set({ activeTagFilters: [] }),

  connectDoclyFolder: async () => {
    const dir = await pickDoclyRootDirectory()
    if (!dir) return false
    await ensureDoclyLayout(dir)
    await idbSaveRootHandle(dir)
    const p = await requestDiskPermission(dir)
    const diskAccess = p === 'granted' ? 'granted' : 'denied'
    set({ diskRoot: dir, diskAccess })
    await get().hydrate()
    return true
  },

  addImportedFile: async (payload, targetFolderId) => {
    const { diskRoot, diskAccess } = get()
    const file: LibraryFile = {
      ...payload.file,
      folderId: targetFolderId,
      coverUrl: payload.coverDataUrl,
      diskRelativePath: null,
    }

    let bufferForIdb: ArrayBuffer | null = payload.buffer

    if (diskRoot && diskAccess === 'granted') {
      if (targetFolderId) await ensureFolderOnDisk(diskRoot, targetFolderId)
      const rel = buildRelativePathForNewFile(file.id, file.name, file.kind, targetFolderId)
      await writeFileAtRelativePath(diskRoot, rel, payload.buffer)
      file.diskRelativePath = rel
      bufferForIdb = null
    }

    const blobUrl = URL.createObjectURL(new Blob([payload.buffer], { type: file.type }))
    set((s) => ({ files: [...s.files, { ...file, blobUrl }] }))

    await idbSaveFile({
      meta: persistedMeta(file, payload.coverDataUrl),
      buffer: bufferForIdb,
    })
  },

  deleteFile: async (id) => {
    const { diskRoot, diskAccess } = get()
    const target = get().files.find((f) => f.id === id)
    if (target?.blobUrl) URL.revokeObjectURL(target.blobUrl)
    const path = target?.diskRelativePath
    if (path && diskRoot && diskAccess === 'granted') {
      try {
        await deleteFileAtRelativePath(diskRoot, path)
      } catch (e) {
        console.warn('[Docly] No se pudo borrar en disco:', e)
      }
    }
    set((s) => ({ files: s.files.filter((f) => f.id !== id) }))
    await idbDeleteFile(id)
  },

  renameFile: async (id, name) => {
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? { ...f, name } : f)),
    }))
    await persistFileRecord(id)
  },

  moveFileToFolder: async (fileId, folderId) => {
    const { diskRoot, diskAccess } = get()
    const prev = get().files.find((x) => x.id === fileId)
    if (!prev) return
    const oldPath = prev.diskRelativePath
    let nextDiskPath = prev.diskRelativePath ?? null

    if (oldPath && diskRoot && diskAccess === 'granted') {
      const newPath = pathAfterFolderMove(oldPath, folderId)
      if (newPath !== oldPath) {
        try {
          if (folderId) await ensureFolderOnDisk(diskRoot, folderId)
          await moveFileOnDisk(diskRoot, oldPath, newPath)
          nextDiskPath = newPath
        } catch (e) {
          console.warn('[Docly] Mover en disco falló:', e)
        }
      }
    }

    set((s) => ({
      files: s.files.map((f) =>
        f.id === fileId ? { ...f, folderId, diskRelativePath: nextDiskPath } : f,
      ),
    }))
    await persistFileRecord(fileId)
  },

  setCustomCover: async (fileId, dataUrl) => {
    set((s) => ({
      files: s.files.map((f) => (f.id === fileId ? { ...f, coverUrl: dataUrl } : f)),
    }))
    await persistFileRecord(fileId)
  },

  setFileTags: async (fileId, tags) => {
    const cleaned = Array.from(
      new Set(tags.map((t) => t.trim()).filter(Boolean)),
    ).slice(0, 16)
    set((s) => ({
      files: s.files.map((f) => (f.id === fileId ? { ...f, tags: cleaned } : f)),
    }))
    await persistFileRecord(fileId)
  },

  updateFileProgress: async (id, progress) => {
    set((s) => ({
      files: s.files.map((f) => {
        if (f.id !== id) return f
        const next: ReadingProgress = { ...f.progress, ...progress }
        return { ...f, progress: next }
      }),
    }))
    await persistFileRecord(id)
  },

  createFolder: async (name, parentId) => {
    const folder: LibraryFolder = {
      id: nanoid(),
      name: name.trim() || 'Sin nombre',
      parentId,
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ folders: [...s.folders, folder] }))
    await idbSaveFolder(folder)
    const { diskRoot, diskAccess } = get()
    if (diskRoot && diskAccess === 'granted') {
      await ensureFolderOnDisk(diskRoot, folder.id)
    }
  },

  deleteFolder: async (folderId) => {
    const { folders, files, diskRoot, diskAccess } = get()
    const childFolderIds = new Set<string>()
    const collect = (pid: string) => {
      for (const fo of folders) {
        if (fo.parentId === pid) {
          childFolderIds.add(fo.id)
          collect(fo.id)
        }
      }
    }
    collect(folderId)
    childFolderIds.add(folderId)
    const parentOfDeleted = folders.find((f) => f.id === folderId)?.parentId ?? null

    const nextFolders = folders.filter((f) => !childFolderIds.has(f.id))
    const movedIds = new Set<string>()
    const nextFiles = files.map((f) => {
      if (f.folderId && childFolderIds.has(f.folderId)) {
        movedIds.add(f.id)
        return { ...f, folderId: parentOfDeleted }
      }
      return f
    })

    let filesAfterDisk = nextFiles
    if (diskRoot && diskAccess === 'granted') {
      const out: LibraryFile[] = []
      for (const f of nextFiles) {
        if (!movedIds.has(f.id) || !f.diskRelativePath) {
          out.push(f)
          continue
        }
        const newPath = pathAfterFolderMove(f.diskRelativePath, parentOfDeleted)
        if (newPath === f.diskRelativePath) {
          out.push(f)
          continue
        }
        try {
          if (parentOfDeleted) await ensureFolderOnDisk(diskRoot, parentOfDeleted)
          await moveFileOnDisk(diskRoot, f.diskRelativePath, newPath)
          out.push({ ...f, diskRelativePath: newPath })
        } catch (e) {
          console.warn('[Docly] Reubicar archivo al borrar carpeta:', e)
          out.push(f)
        }
      }
      filesAfterDisk = out
    }

    set({ folders: nextFolders, files: filesAfterDisk })

    if (diskRoot && diskAccess === 'granted') {
      for (const fid of childFolderIds) {
        await removeFolderOnDisk(diskRoot, fid)
      }
    }

    for (const id of childFolderIds) {
      await idbDeleteFolder(id)
    }
    for (const f of filesAfterDisk) {
      if (!movedIds.has(f.id)) continue
      await persistFileRecord(f.id)
    }
  },

  moveFoldersToParent: async (folderIds, parentId) => {
    const uniqueIds = Array.from(new Set(folderIds))
    if (!uniqueIds.length) return

    const { folders } = get()
    const folderMap = new Map(folders.map((f) => [f.id, f]))
    const movingSet = new Set(uniqueIds.filter((id) => folderMap.has(id)))
    if (!movingSet.size) return

    const isDescendantOf = (candidateId: string, ancestorId: string): boolean => {
      let current = folderMap.get(candidateId) ?? null
      while (current?.parentId) {
        if (current.parentId === ancestorId) return true
        current = folderMap.get(current.parentId) ?? null
      }
      return false
    }

    const validMoves = Array.from(movingSet).filter((id) => {
      if (!parentId) return true
      if (id === parentId) return false
      return !isDescendantOf(parentId, id)
    })
    if (!validMoves.length) return

    const nextFolders = folders.map((folder) =>
      validMoves.includes(folder.id) ? { ...folder, parentId } : folder,
    )

    set({ folders: nextFolders })
    for (const id of validMoves) {
      const updated = nextFolders.find((f) => f.id === id)
      if (updated) await idbSaveFolder(updated)
    }
  },
}
})

async function persistFileRecord(id: string): Promise<void> {
  const f = useLibraryStore.getState().files.find((x) => x.id === id)
  const row = await idbGetFile(id)
  if (!f || !row) return
  await idbSaveFile({
    meta: persistedMeta(f, f.coverUrl),
    buffer: row.buffer,
  })
}
