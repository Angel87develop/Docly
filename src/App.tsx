import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LibraryPage } from '@/pages/LibraryPage'
import { useLibraryStore } from '@/store/libraryStore'

const ReaderPage = lazy(async () => {
  const m = await import('@/pages/ReaderPage')
  return { default: m.ReaderPage }
})

function AppRoutes() {
  const hydrate = useLibraryStore((s) => s.hydrate)
  const hydrated = useLibraryStore((s) => s.hydrated)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-docly-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-docly-border border-t-docly-accent" />
          <p className="text-sm text-neutral-500">Cargando biblioteca…</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <AppShell>
            <LibraryPage />
          </AppShell>
        }
      />
      <Route
        path="/read/:fileId"
        element={
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-docly-bg text-sm text-neutral-500">
                Cargando lector…
              </div>
            }
          >
            <ReaderPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
