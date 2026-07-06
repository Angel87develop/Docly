import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LibraryFile } from '@/types'
import { extensionLabel } from '@/utils/fileKind'
import { formatBytes } from '@/utils/formatBytes'
import { useLibraryStore } from '@/store/libraryStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

export function FileCard({ file }: { file: LibraryFile }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(false)
  const [name, setName] = useState(file.name)
  const [tagInput, setTagInput] = useState('')
  const [draftTags, setDraftTags] = useState<string[]>(file.tags)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const deleteFile = useLibraryStore((s) => s.deleteFile)
  const renameFile = useLibraryStore((s) => s.renameFile)
  const setCustomCover = useLibraryStore((s) => s.setCustomCover)
  const setFileTags = useLibraryStore((s) => s.setFileTags)

  const canRead = file.kind === 'pdf' || file.kind === 'epub' || file.kind === 'text'

  const onCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f || !f.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      void setCustomCover(file.id, url)
    }
    reader.readAsDataURL(f)
    e.target.value = ''
  }

  return (
    <>
      <article
        draggable
        onClick={() => {
          if (!canRead) return
          navigate(`/read/${file.id}`)
        }}
        onDragStart={(e) => {
          e.dataTransfer.setData('application/docly-file', file.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        className={`group relative overflow-hidden rounded-2xl border border-docly-border/80 bg-docly-surface/70 shadow-[0_8px_20px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-1 hover:border-red-500/45 hover:shadow-[0_14px_40px_rgba(255,42,42,0.14)] ${canRead ? 'cursor-pointer' : ''}`}
      >
        <div className="relative aspect-3/4 w-full overflow-hidden bg-neutral-900/80">
          {file.coverUrl ? (
            <img
              src={file.coverUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-neutral-600">
              <span className="text-3xl opacity-40">◇</span>
              <span className="text-xs uppercase tracking-wider">Sin portada</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-80" />
          <button
            type="button"
            className="absolute right-2 top-2 rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-xs text-neutral-300 opacity-0 backdrop-blur transition-opacity hover:text-white group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
          >
            ···
          </button>
          {menuOpen ? (
            <div
              className="absolute right-2 top-10 z-10 min-w-[150px] rounded-xl border border-docly-border bg-docly-surface-soft p-1.5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="block w-full rounded-lg px-3 py-2 text-left text-xs text-neutral-300 hover:bg-white/10"
                onClick={() => {
                  setMenuOpen(false)
                  setRenameOpen(true)
                  setName(file.name)
                }}
              >
                Renombrar
              </button>
              <button
                type="button"
                className="block w-full rounded-lg px-3 py-2 text-left text-xs text-neutral-300 hover:bg-white/10"
                onClick={() => {
                  setMenuOpen(false)
                  coverInputRef.current?.click()
                }}
              >
                Portada personalizada
              </button>
              <button
                type="button"
                className="block w-full rounded-lg px-3 py-2 text-left text-xs text-neutral-300 hover:bg-white/10"
                onClick={() => {
                  setMenuOpen(false)
                  setDraftTags(file.tags)
                  setTagInput('')
                  setTagsOpen(true)
                }}
              >
                Editar tags
              </button>
              <button
                type="button"
                className="block w-full rounded-lg px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
                onClick={() => {
                  setMenuOpen(false)
                  if (confirm('¿Eliminar este archivo de la biblioteca?'))
                    void deleteFile(file.id)
                }}
              >
                Eliminar
              </button>
            </div>
          ) : null}
        </div>
        <div className="space-y-1.5 p-4">
          <h3 className="truncate font-medium text-neutral-100">{file.name}</h3>
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-docly-accent">
              {extensionLabel(file.kind, file.type)}
            </span>
            <span>{formatBytes(file.size)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-linear-to-r from-red-700 to-docly-accent transition-all"
              style={{ width: `${Math.min(100, file.progress.percent)}%` }}
            />
          </div>
          {canRead ? (
            <p className="mt-2 block text-center text-xs font-medium text-docly-accent transition-colors hover:text-red-300">
              Abrir lector →
            </p>
          ) : (
            <p className="mt-2 text-center text-[10px] text-neutral-600">
              Vista previa no disponible
            </p>
          )}
          {file.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {file.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-docly-border px-2 py-0.5 text-[10px] text-neutral-400"
                >
                  #{tag}
                </span>
              ))}
              {file.tags.length > 3 ? (
                <span className="text-[10px] text-neutral-500">+{file.tags.length - 3}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onCoverFile}
        />
      </article>

      <Modal
        open={tagsOpen}
        title="Editar tags"
        onClose={() => setTagsOpen(false)}
        footer={
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setTagsOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                void setFileTags(file.id, draftTags)
                setTagsOpen(false)
              }}
            >
              Guardar tags
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="nuevo-tag"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                const tag = tagInput.trim().toLowerCase()
                if (!tag || draftTags.includes(tag)) return
                setDraftTags((prev) => [...prev, tag])
                setTagInput('')
              }}
            />
            <Button
              variant="ghost"
              onClick={() => {
                const tag = tagInput.trim().toLowerCase()
                if (!tag || draftTags.includes(tag)) return
                setDraftTags((prev) => [...prev, tag])
                setTagInput('')
              }}
            >
              Agregar
            </Button>
          </div>
          <div className="flex min-h-10 flex-wrap gap-2 rounded border border-docly-border bg-black/20 p-2">
            {draftTags.length === 0 ? (
              <p className="text-xs text-neutral-500">Sin tags</p>
            ) : (
              draftTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="rounded-full border border-docly-border px-2 py-1 text-xs text-neutral-300 hover:border-red-500/50 hover:text-red-300"
                  onClick={() => setDraftTags((prev) => prev.filter((t) => t !== tag))}
                  title="Quitar tag"
                >
                  #{tag} ×
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={renameOpen}
        title="Renombrar"
        onClose={() => setRenameOpen(false)}
        footer={
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                void renameFile(file.id, name.trim() || file.name)
                setRenameOpen(false)
              }}
            >
              Guardar
            </Button>
          </div>
        }
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Modal>
    </>
  )
}
