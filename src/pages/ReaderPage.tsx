import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLibraryStore } from '@/store/libraryStore'
import { PdfReader } from '@/features/viewer/PdfReader'
import { EpubReader } from '@/features/viewer/EpubReader'
import { TextReader } from '@/features/viewer/TextReader'
import { Button } from '@/components/ui/Button'

export function ReaderPage() {
  const { fileId } = useParams<{ fileId: string }>()
  const navigate = useNavigate()
  const file = useLibraryStore((s) => s.files.find((f) => f.id === fileId))

  if (!fileId || !file) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
        <p className="text-neutral-500">No se encontró el archivo.</p>
        <Button variant="ghost" onClick={() => navigate('/')}>
          Volver a la biblioteca
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-screen w-full max-w-[min(100vw-0.25rem,2560px)] flex-col gap-3 overflow-hidden bg-docly-bg px-1 py-3 sm:gap-4 sm:px-2 sm:py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/"
            className="text-xs font-medium uppercase tracking-wider text-docly-accent hover:text-red-300"
          >
            ← Biblioteca
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-white">{file.name}</h1>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Cerrar lector
        </Button>
      </div>

      {!file.blobUrl ? (
        <p className="text-red-400">No hay datos binarios para este documento.</p>
      ) : file.kind === 'pdf' ? (
        <PdfReader key={file.id} file={file} />
      ) : file.kind === 'epub' ? (
        <EpubReader key={file.id} file={file} />
      ) : file.kind === 'text' ? (
        <TextReader file={file} />
      ) : (
        <p className="text-neutral-500">Formato no soportado en el lector.</p>
      )}
    </div>
  )
}
