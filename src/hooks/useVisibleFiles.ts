import { useMemo } from 'react'
import { useLibraryStore } from '@/store/libraryStore'
import type { LibraryFile } from '@/types'

export function useVisibleFiles(): LibraryFile[] {
  const files = useLibraryStore((s) => s.files)
  const selectedFolderId = useLibraryStore((s) => s.selectedFolderId)
  const searchQuery = useLibraryStore((s) => s.searchQuery)
  const sortMode = useLibraryStore((s) => s.sortMode)
  const progressFilter = useLibraryStore((s) => s.progressFilter)
  const activeTagFilters = useLibraryStore((s) => s.activeTagFilters)

  return useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const filtered = files.filter((f) => {
      const inFolder = selectedFolderId === 'all' ? true : f.folderId === selectedFolderId
      if (!inFolder) return false

      if (progressFilter === 'unread' && f.progress.percent > 0) return false
      if (
        progressFilter === 'in_progress' &&
        (f.progress.percent <= 0 || f.progress.percent >= 100)
      ) {
        return false
      }
      if (progressFilter === 'completed' && f.progress.percent < 100) return false

      if (activeTagFilters.length > 0) {
        const hasEveryTag = activeTagFilters.every((tag) => f.tags.includes(tag))
        if (!hasEveryTag) return false
      }

      if (!q) return true
      const nameMatch = f.name.toLowerCase().includes(q)
      const tagMatch = f.tags.some((t) => t.toLowerCase().includes(q))
      return nameMatch || tagMatch
    })

    filtered.sort((a, b) => {
      if (sortMode === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sortMode === 'size') return b.size - a.size
      if (sortMode === 'progress') return b.progress.percent - a.progress.percent
      return a.name.localeCompare(b.name)
    })

    return filtered
  }, [files, selectedFolderId, searchQuery, sortMode, progressFilter, activeTagFilters])
}
