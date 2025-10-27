// src/app/(app)/layout.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import PageHeader from '@/components/page-header'
import SidebarNav from '@/components/sidebar-nav'
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useAuth } from '@/context/auth-context'
import { useEnsureUserDoc } from '@/lib/useEnsureUserDoc'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEnsureUserDoc()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/sign-in?next=' + encodeURIComponent(pathname || '/dashboard'))
    }
  }, [loading, user, router, pathname])

  if (loading) return <div className="p-6">Loading…</div>
  if (!user) return null

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        {/* Make the sidebar sticky and make sure the rail exists (so Inset knows the width) */}
        <Sidebar
          collapsible="icon"
          variant="inset"
          side="left"
          className="glass shadow-card sticky top-0 h-screen"
        >
          {/* Force the rail to a slim gradient line so it never overlaps content */}
          <SidebarRail
            className="w-[2px] min-w-[2px] max-w-[2px] bg-brand-gradient"
            data-sidebar-rail
          />
          <SidebarNav />
        </Sidebar>

        <SidebarInset className="flex-1 min-h-screen">
          <PageHeader />
          <div className="p-4 lg:p-6">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
