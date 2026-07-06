import type { ReactNode } from 'react'
import { DoclyDiskBanner } from '@/components/layout/DoclyDiskBanner'
import { TopBar } from '@/components/layout/TopBar'
import { FolderSidebar } from '@/features/folders/FolderSidebar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-docly-bg">
      <FolderSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar />
        <DoclyDiskBanner />
        <main className="min-h-0 flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
