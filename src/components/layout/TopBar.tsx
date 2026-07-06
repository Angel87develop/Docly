import { useRef } from 'react'
import { isFileSystemAccessSupported } from '@/services/doclyDisk'
import { useLibraryStore } from '@/store/libraryStore'
import { useFileUpload } from '@/hooks/useFileUpload'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function TopBar() {
  const inputRef = useRef<HTMLInputElement>(null)
  const searchQuery = useLibraryStore((s) => s.searchQuery)
  const setSearchQuery = useLibraryStore((s) => s.setSearchQuery)
  const diskAccess = useLibraryStore((s) => s.diskAccess)
  const connectDoclyFolder = useLibraryStore((s) => s.connectDoclyFolder)
  const { uploadList, busy } = useFileUpload()
  const showDiskBtn = isFileSystemAccessSupported() && diskAccess !== 'granted'

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-docly-border/80 bg-docly-bg/75 px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="min-w-[200px] flex-1 max-w-xl">
        <Input
          placeholder="Buscar por título o etiqueta…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Buscar"
        />
      </div>
      <div className="flex items-center gap-2">
        {showDiskBtn ? (
          <Button
            variant="ghost"
            className="hidden text-xs sm:inline-flex"
            onClick={() => void connectDoclyFolder()}
          >
            Carpeta Docly
          </Button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.epub,.txt,.md,.text,application/pdf,application/epub+zip,text/plain"
          onChange={(e) => {
            if (e.target.files) void uploadList(e.target.files)
            e.target.value = ''
          }}
        />
        <Button className="shadow-[0_0_0_1px_rgba(255,42,42,0.2)]" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? 'Importando…' : 'Subir archivos'}
        </Button>
      </div>
    </header>
  )
}
