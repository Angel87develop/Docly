import { useFileUpload } from '@/hooks/useFileUpload'
import { useVisibleFiles } from '@/hooks/useVisibleFiles'
import { FileCard } from '@/features/library/FileCard'
import { useLibraryStore } from '@/store/libraryStore'

export function LibraryGrid() {
  const files = useVisibleFiles()
  const { uploadList, busy } = useFileUpload()
  const allFiles = useLibraryStore((s) => s.files)
  const sortMode = useLibraryStore((s) => s.sortMode)
  const progressFilter = useLibraryStore((s) => s.progressFilter)
  const activeTagFilters = useLibraryStore((s) => s.activeTagFilters)
  const setSortMode = useLibraryStore((s) => s.setSortMode)
  const setProgressFilter = useLibraryStore((s) => s.setProgressFilter)
  const toggleTagFilter = useLibraryStore((s) => s.toggleTagFilter)
  const clearTagFilters = useLibraryStore((s) => s.clearTagFilters)
  const availableTags = Array.from(new Set(allFiles.flatMap((f) => f.tags))).sort()

  return (
    <div
      className="min-h-[320px] rounded-2xl border border-dashed border-docly-border/70 bg-docly-surface/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-red-500/30 md:p-5"
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      }}
      onDrop={(e) => {
        e.preventDefault()
        if (e.dataTransfer.files?.length) void uploadList(e.dataTransfer.files)
      }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
          className="rounded-xl border border-docly-border bg-docly-surface-soft px-3 py-2 text-xs text-neutral-200 outline-none focus:border-docly-accent"
          aria-label="Ordenar archivos"
        >
          <option value="az">Orden: A-Z</option>
          <option value="date">Orden: Fecha</option>
          <option value="size">Orden: Tamaño</option>
          <option value="progress">Orden: Progreso</option>
        </select>
        <select
          value={progressFilter}
          onChange={(e) => setProgressFilter(e.target.value as typeof progressFilter)}
          className="rounded-xl border border-docly-border bg-docly-surface-soft px-3 py-2 text-xs text-neutral-200 outline-none focus:border-docly-accent"
          aria-label="Filtrar por estado de lectura"
        >
          <option value="all">Estado: Todos</option>
          <option value="unread">Sin leer</option>
          <option value="in_progress">En progreso</option>
          <option value="completed">Completado</option>
        </select>
        {activeTagFilters.length > 0 ? (
          <button
            type="button"
            onClick={clearTagFilters}
            className="rounded-xl border border-red-500/40 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-500/10"
          >
            Limpiar tags
          </button>
        ) : null}
      </div>

      {availableTags.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {availableTags.map((tag) => {
            const active = activeTagFilters.includes(tag)
            return (
              <button
                type="button"
                key={tag}
                onClick={() => toggleTagFilter(tag)}
                className={`rounded-full border px-3 py-1 text-[11px] transition ${
                  active
                    ? 'border-docly-accent bg-red-500/20 text-red-200'
                    : 'border-docly-border text-neutral-400 hover:border-red-500/50 hover:text-neutral-200'
                }`}
              >
                #{tag}
              </button>
            )
          })}
        </div>
      ) : null}

      {busy ? (
        <p className="py-16 text-center text-sm text-neutral-500">Procesando archivos…</p>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-docly-border/50 bg-black/10 py-20 text-center">
          <p className="text-neutral-500">No hay documentos en esta vista.</p>
          <p className="max-w-sm text-xs text-neutral-600">
            Arrastra PDF, EPUB o TXT aquí o usa «Subir archivos» arriba.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((f) => (
            <FileCard key={f.id} file={f} />
          ))}
        </div>
      )}
    </div>
  )
}
