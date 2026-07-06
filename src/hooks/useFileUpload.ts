import { useCallback, useState } from 'react'
import { importLocalFile } from '@/services/fileImport'
import { useLibraryStore } from '@/store/libraryStore'

export function useFileUpload() {
  const [busy, setBusy] = useState(false)
  const addImportedFile = useLibraryStore((s) => s.addImportedFile)
  const selectedFolderId = useLibraryStore((s) => s.selectedFolderId)

  const uploadList = useCallback(
    async (list: FileList | File[]) => {
      const arr = Array.from(list)
      if (arr.length === 0) return
      setBusy(true)
      const target =
        selectedFolderId === 'all' ? null : selectedFolderId
      try {
        for (const raw of arr) {
          const payload = await importLocalFile(raw)
          await addImportedFile(payload, target)
        }
      } finally {
        setBusy(false)
      }
    },
    [addImportedFile, selectedFolderId],
  )

  return { uploadList, busy }
}
