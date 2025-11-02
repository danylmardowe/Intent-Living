'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar'
import SidebarNav from '@/components/sidebar-nav'
import PageHeader from '@/components/page-header'
import MobileSidebar from '@/components/mobile-sidebar'
import { useAuth } from '@/context/auth-context'
import { useEnsureUserDoc } from '@/lib/useEnsureUserDoc'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  useEnsureUserDoc()

  // Guard: redirect to sign-in if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      const next = encodeURIComponent(pathname || '/dashboard')
      router.push(`/auth/sign-in?next=${next}`)
    }
  }, [loading, user, pathname, router])

  return (
    <SidebarProvider>
      {/* Desktop / tablet sidebar */}
      <Sidebar className="hidden md:flex">
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      {/* Mobile drawer (shares state with the sidebar) */}
      <MobileSidebar />

      {/* Main content area */}
      <SidebarInset>
        <PageHeader />
        <div className="p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
