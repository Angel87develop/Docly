import { useState, type DragEvent, type MouseEvent } from 'react'
import { useLibraryStore } from '@/store/libraryStore'
import { buildFolderTree } from '@/utils/tree'
import type { FolderTreeNode } from '@/types'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

export function FolderSidebar() {
  const folders = useLibraryStore((s) => s.folders)
  const selectedFolderId = useLibraryStore((s) => s.selectedFolderId)
  const setSelectedFolder = useLibraryStore((s) => s.setSelectedFolder)
  const createFolder = useLibraryStore((s) => s.createFolder)
  const moveFileToFolder = useLibraryStore((s) => s.moveFileToFolder)
  const moveFoldersToParent = useLibraryStore((s) => s.moveFoldersToParent)
  const [modalOpen, setModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([])
  const tree = buildFolderTree(folders)

  const parentForCreate =
    selectedFolderId === 'all' ? null : selectedFolderId

  const clearFolderSelection = () => setSelectedFolderIds([])

  const toggleFolderSelection = (folderId: string, multi: boolean) => {
    if (!multi) {
      setSelectedFolderIds([folderId])
      return
    }
    setSelectedFolderIds((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId],
    )
  }

  const handleFolderDrop = async (e: DragEvent, targetParentId: string | null) => {
    e.preventDefault()
    const payload = e.dataTransfer.getData('application/docly-folders')
    if (!payload) return
    try {
      const ids = JSON.parse(payload) as string[]
      if (!Array.isArray(ids) || !ids.length) return
      await moveFoldersToParent(ids, targetParentId)
      setSelectedFolderIds(ids)
    } catch {
      /* payload inválido */
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    await createFolder(newName.trim(), parentForCreate)
    setNewName('')
    setModalOpen(false)
  }

  return (
    <>
      <aside className="flex w-72 shrink-0 flex-col border-r border-docly-border/80 bg-docly-surface/45 backdrop-blur-sm">
        <div className="border-b border-docly-border p-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-docly-accent">
            Docly
          </p>
          <p className="mt-1 text-sm text-neutral-400">Biblioteca personal</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <SidebarRow
            label="Todos los archivos"
            active={selectedFolderId === 'all'}
            onClick={() => {
              clearFolderSelection()
              setSelectedFolder('all')
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('application/docly-file')
              if (id) {
                void moveFileToFolder(id, null)
                return
              }
              void handleFolderDrop(e, null)
            }}
            depth={0}
            isDropTarget
          />
          <div className="pt-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-xs"
              onClick={() => setModalOpen(true)}
            >
              + Nueva carpeta
            </Button>
          </div>
          <div className="pt-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
            Carpetas
          </div>
          {tree.map((node) => (
            <FolderBranch
              key={node.id}
              node={node}
              depth={0}
              selectedFolderId={selectedFolderId}
              selectedFolderIds={selectedFolderIds}
              onSelect={setSelectedFolder}
              onFolderClick={(folderId, ev) => {
                toggleFolderSelection(folderId, ev.metaKey || ev.ctrlKey)
              }}
            />
          ))}
        </nav>
      </aside>

      <Modal
        open={modalOpen}
        title="Nueva carpeta"
        onClose={() => setModalOpen(false)}
        footer={
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleCreate()}>Crear</Button>
          </div>
        }
      >
        <label className="block text-sm text-neutral-400">
          Nombre
          <Input
            className="mt-1"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ej. Ficción"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleCreate()
            }}
          />
        </label>
        <p className="mt-2 text-xs text-neutral-600">
          Se creará dentro de{' '}
          {parentForCreate
            ? folders.find((f) => f.id === parentForCreate)?.name ?? 'carpeta'
            : 'la raíz'}
          .
        </p>
      </Modal>
    </>
  )
}

function SidebarRow({
  label,
  active,
  onClick,
  depth,
  onDragOver,
  onDrop,
  isDropTarget,
  draggable,
  onDragStart,
}: {
  label: string
  active: boolean
  onClick: (ev: MouseEvent<HTMLButtonElement>) => void
  depth: number
  onDragOver?: (e: DragEvent) => void
  onDrop?: (e: DragEvent) => void
  isDropTarget?: boolean
  draggable?: boolean
  onDragStart?: (e: DragEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{ paddingLeft: 10 + depth * 12 }}
      className={`group flex w-full items-center gap-2 rounded-xl border border-transparent py-2 pr-2 text-left text-sm transition-all duration-200 ${
        active
          ? 'border-red-500/35 bg-red-500/12 text-white shadow-[inset_0_0_20px_rgba(255,42,42,0.08)]'
          : 'text-neutral-400 hover:border-docly-border hover:bg-white/5 hover:text-neutral-100'
      } ${isDropTarget ? 'ring-1 ring-transparent hover:ring-docly-accent/40' : ''}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-docly-accent opacity-0 transition-opacity group-hover:opacity-100" />
      <span className="truncate">{label}</span>
    </button>
  )
}

function FolderBranch({
  node,
  depth,
  selectedFolderId,
  selectedFolderIds,
  onSelect,
  onFolderClick,
}: {
  node: FolderTreeNode
  depth: number
  selectedFolderId: string
  selectedFolderIds: string[]
  onSelect: (id: string) => void
  onFolderClick: (id: string, ev: MouseEvent<HTMLButtonElement>) => void
}) {
  const moveFileToFolder = useLibraryStore((s) => s.moveFileToFolder)
  const moveFoldersToParent = useLibraryStore((s) => s.moveFoldersToParent)
  const deleteFolder = useLibraryStore((s) => s.deleteFolder)
  const isMultiSelected = selectedFolderIds.includes(node.id)

  return (
    <div>
      <div className="group flex items-center gap-1">
        <SidebarRow
          label={node.name}
          active={selectedFolderId === node.id || isMultiSelected}
          onClick={(ev) => {
            onFolderClick(node.id, ev)
            if (!(ev.metaKey || ev.ctrlKey)) onSelect(node.id)
          }}
          depth={depth}
          draggable
          onDragStart={(e) => {
            const draggedIds = isMultiSelected ? selectedFolderIds : [node.id]
            e.dataTransfer.setData('application/docly-folders', JSON.stringify(draggedIds))
            e.dataTransfer.effectAllowed = 'move'
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
          }}
          onDrop={(e) => {
            e.preventDefault()
            const id = e.dataTransfer.getData('application/docly-file')
            if (id) {
              void moveFileToFolder(id, node.id)
              return
            }
            const folderPayload = e.dataTransfer.getData('application/docly-folders')
            if (!folderPayload) return
            try {
              const ids = JSON.parse(folderPayload) as string[]
              if (!Array.isArray(ids) || !ids.length) return
              void moveFoldersToParent(ids, node.id)
            } catch {
              /* payload inválido */
            }
          }}
          isDropTarget
        />
        <button
          type="button"
          title="Eliminar carpeta"
          className="shrink-0 rounded p-1 text-neutral-600 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
          onClick={(ev) => {
            ev.stopPropagation()
            if (confirm(`¿Eliminar «${node.name}» y su contenido del árbol?`))
              void deleteFolder(node.id)
          }}
        >
          ×
        </button>
      </div>
      {node.children.map((ch) => (
        <FolderBranch
          key={ch.id}
          node={ch}
          depth={depth + 1}
          selectedFolderId={selectedFolderId}
          selectedFolderIds={selectedFolderIds}
          onSelect={onSelect}
          onFolderClick={onFolderClick}
        />
      ))}
    </div>
  )
}
