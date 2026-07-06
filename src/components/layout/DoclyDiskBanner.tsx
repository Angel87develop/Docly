import { isFileSystemAccessSupported } from '@/services/doclyDisk'
import { useLibraryStore } from '@/store/libraryStore'
import { Button } from '@/components/ui/Button'

export function DoclyDiskBanner() {
  const diskAccess = useLibraryStore((s) => s.diskAccess)
  const diskRoot = useLibraryStore((s) => s.diskRoot)
  const connectDoclyFolder = useLibraryStore((s) => s.connectDoclyFolder)
  const hydrated = useLibraryStore((s) => s.hydrated)

  if (!hydrated || !isFileSystemAccessSupported()) return null

  if (diskAccess === 'granted' && diskRoot) {
    return (
      <div className="border-b border-docly-border bg-docly-surface/40 px-6 py-2 text-xs text-neutral-500">
        Carpeta Docly conectada: los archivos nuevos se guardan en{' '}
        <code className="text-docly-accent/90">TODO</code> o en{' '}
        <code className="text-docly-accent/90">folders/&lt;id&gt;</code> dentro de la carpeta que elegiste
        (crea <code className="text-neutral-400">Documentos/Docly</code> y selecciónala aquí).
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-900/40 bg-red-950/20 px-6 py-3 text-sm">
      <p className="text-neutral-300">
        {diskRoot && diskAccess === 'denied'
          ? 'Concede permiso de lectura/escritura para cargar archivos guardados en tu carpeta Docly.'
          : 'Para que los PDF y demás archivos queden en tu PC (p. ej. Documentos/Docly/TODO), conecta una carpeta.'}
      </p>
      <Button
        className="shrink-0 text-xs"
        onClick={() => void connectDoclyFolder().then(() => undefined)}
      >
        Elegir carpeta Docly…
      </Button>
    </div>
  )
}
