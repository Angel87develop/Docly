import { useLibraryStore } from '@/store/libraryStore'
import { LibraryGrid } from '@/features/library/LibraryGrid'

export function LibraryPage() {
  const selectedFolderId = useLibraryStore((s) => s.selectedFolderId)
  const folders = useLibraryStore((s) => s.folders)
  const title =
    selectedFolderId === 'all'
      ? 'Todos los archivos'
      : folders.find((f) => f.id === selectedFolderId)?.name ?? 'Carpeta'

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="rounded-2xl border border-docly-border/60 bg-docly-surface/35 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Organiza, busca y lee tus documentos. Arrastra archivos a la cuadrícula o a una carpeta.
        </p>
      </header>
      <LibraryGrid />
    </div>
  )
}
