'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { SidebarContent, useSidebar } from '@/components/ui/sidebar'
import SidebarNav from '@/components/sidebar-nav'

/**
 * MobileSidebar
 * Renders the app navigation inside a left drawer for < md viewports.
 * The drawer closes automatically on route change.
 */
export default function MobileSidebar() {
  const { open, setOpen } = useSidebar()
  const pathname = usePathname()

  // Close the drawer when the route changes
  useEffect(() => {
    if (open) setOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        className="md:hidden p-0 w-[86vw] max-w-[340px] z-50"
      >
        <SidebarContent className="h-full">
          <SidebarNav />
        </SidebarContent>
      </SheetContent>
    </Sheet>
  )
}
