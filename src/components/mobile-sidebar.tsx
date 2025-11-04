'use client'

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { SidebarContent, useSidebar } from '@/components/ui/sidebar'
import SidebarNav from '@/components/sidebar-nav'

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 1023px)').matches
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 1023px)')
    const handler = () => setIsMobile(mq.matches)
    mq.addEventListener?.('change', handler)
    // Safari fallback
    // @ts-ignore
    mq.addListener?.(handler)
    return () => {
      mq.removeEventListener?.('change', handler)
      // @ts-ignore
      mq.removeListener?.(handler)
    }
  }, [])
  return isMobile
}

export default function MobileSidebar() {
  const { open, setOpen } = useSidebar()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [userRequested, setUserRequested] = useState(false)
  const requestedRef = useRef(false)

  // When user clicks the icon (in header), we mark request
  useEffect(() => {
    if (open) {
      requestedRef.current = true
      setUserRequested(true)
    }
  }, [open])

  // Close on route change
  useEffect(() => {
    if (open) setOpen(false)
    requestedRef.current = false
    setUserRequested(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Only mount sheet if mobile OR user explicitly requested it
  if (!isMobile && !userRequested) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="p-0 w-[86vw] max-w-[340px] z-50">
        <SidebarContent className="h-full">
          <SidebarNav />
        </SidebarContent>
      </SheetContent>
    </Sheet>
  )
}
