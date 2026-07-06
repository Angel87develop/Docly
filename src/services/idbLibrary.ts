import type { LibraryFolder, StoredFilePayload } from '@/types'

const DB_NAME = 'docly-library'
const DB_VERSION = 2
const FILES = 'files'
const FOLDERS = 'folders'
const SETTINGS = 'settings'

type FileRow = StoredFilePayload

const SETTING_ROOT_KEY = 'doclyRootDir'

export type DoclyRootSetting = {
  key: typeof SETTING_ROOT_KEY
  handle: FileSystemDirectoryHandle
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (ev) => {
      const db = req.result
      if (!db.objectStoreNames.contains(FILES)) {
        db.createObjectStore(FILES, { keyPath: 'meta.id' })
      }
      if (!db.objectStoreNames.contains(FOLDERS)) {
        db.createObjectStore(FOLDERS, { keyPath: 'id' })
      }
      if (ev.oldVersion < 2 && !db.objectStoreNames.contains(SETTINGS)) {
        db.createObjectStore(SETTINGS, { keyPath: 'key' })
      }
    }
  })
}

export async function idbSaveFile(row: FileRow): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FILES, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? new Error('IDB abort'))
      tx.objectStore(FILES).put(row)
    })
  } finally {
    db.close()
  }
}

export async function idbDeleteFile(id: string): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FILES, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? new Error('IDB abort'))
      tx.objectStore(FILES).delete(id)
    })
  } finally {
    db.close()
  }
}

export async function idbListFiles(): Promise<FileRow[]> {
  const db = await openDb()
  try {
    return await new Promise<FileRow[]>((resolve, reject) => {
      const tx = db.transaction(FILES, 'readonly')
      const store = tx.objectStore(FILES)
      const r = store.getAll()
      r.onsuccess = () => resolve(r.result as FileRow[])
      r.onerror = () => reject(r.error)
    })
  } finally {
    db.close()
  }
}

export async function idbGetFile(id: string): Promise<FileRow | null> {
  const db = await openDb()
  try {
    return await new Promise<FileRow | null>((resolve, reject) => {
      const tx = db.transaction(FILES, 'readonly')
      const r = tx.objectStore(FILES).get(id)
      r.onsuccess = () => resolve((r.result as FileRow | undefined) ?? null)
      r.onerror = () => reject(r.error)
    })
  } finally {
    db.close()
  }
}

export async function idbSaveFolder(folder: LibraryFolder): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FOLDERS, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? new Error('IDB abort'))
      tx.objectStore(FOLDERS).put(folder)
    })
  } finally {
    db.close()
  }
}

export async function idbDeleteFolder(id: string): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FOLDERS, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? new Error('IDB abort'))
      tx.objectStore(FOLDERS).delete(id)
    })
  } finally {
    db.close()
  }
}

export async function idbListFolders(): Promise<LibraryFolder[]> {
  const db = await openDb()
  try {
    return await new Promise<LibraryFolder[]>((resolve, reject) => {
      const tx = db.transaction(FOLDERS, 'readonly')
      const r = tx.objectStore(FOLDERS).getAll()
      r.onsuccess = () => resolve(r.result as LibraryFolder[])
      r.onerror = () => reject(r.error)
    })
  } finally {
    db.close()
  }
}

export async function idbSaveRootHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SETTINGS, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? new Error('IDB abort'))
      tx.objectStore(SETTINGS).put({ key: SETTING_ROOT_KEY, handle })
    })
  } finally {
    db.close()
  }
}

export async function idbLoadRootHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDb()
  try {
    return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const tx = db.transaction(SETTINGS, 'readonly')
      const r = tx.objectStore(SETTINGS).get(SETTING_ROOT_KEY)
      r.onsuccess = () => {
        const v = r.result as DoclyRootSetting | undefined
        resolve(v?.handle ?? null)
      }
      r.onerror = () => reject(r.error)
    })
  } finally {
    db.close()
  }
}
