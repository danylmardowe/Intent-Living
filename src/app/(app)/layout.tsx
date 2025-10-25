// src/app/(app)/layout.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import PageHeader from '@/components/page-header'
import SidebarNav from '@/components/sidebar-nav'
import {
  Sidebar,
  SidebarInset,
  SidebarRail,
  SidebarProvider, // ⬅️ add this
} from '@/components/ui/sidebar'
import { useAuth } from '@/context/auth-context'
import { useEnsureUserDoc } from '@/lib/useEnsureUserDoc'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Create users/{uid} on first sign-in (no-op if it exists)
  useEnsureUserDoc()

  // Redirect unauthenticated users to auth
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/sign-in?next=' + encodeURIComponent(pathname || '/dashboard'))
    }
  }, [loading, user, router, pathname])

  if (loading) return <div className="p-6">Loading…</div>
  if (!user) return null // redirecting

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset" side="left">
        <SidebarRail />
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <PageHeader />
        <div className="p-4 lg:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
