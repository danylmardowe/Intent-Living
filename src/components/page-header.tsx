'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/theme-toggle'
import { PanelLeft } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'

const titleMap: Record<string, string> = {
  '/dashboard': 'Lifeline',
  '/objectives': 'Objectives',
  '/tasks': 'Tasks',
  '/goals': 'Goals',
  '/life-areas': 'Life Areas',
  '/modes': 'Modes',
  '/reviews/daily': 'Daily Review',
  '/reviews/weekly': 'Weekly Review',
  '/reviews/monthly': 'Monthly Review',
  '/reviews/six-monthly': 'Six-Month Review',
}

function useIsMobile(maxWidth = 1023) {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(`(max-width: ${maxWidth}px)`).matches
  })
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`)
    const handler = () => setIsMobile(mq.matches)
    mq.addEventListener?.('change', handler)
    // Safari fallback
    // @ts-ignore
    mq.addListener?.(handler)
    handler()
    return () => {
      mq.removeEventListener?.('change', handler)
      // @ts-ignore
      mq.removeListener?.(handler)
    }
  }, [maxWidth])
  return isMobile
}

export default function PageHeader() {
  const pathname = usePathname() || '/'
  const { setOpen } = useSidebar()
  const isMobile = useIsMobile()
  const [userClickedMenu, setUserClickedMenu] = React.useState(false)

  const base = Object.keys(titleMap).find((k) => pathname.startsWith(k))
  const title = titleMap[base ?? ''] ?? 'Lifeline'

  return (
    <div className="sticky top-0 z-40 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-2 px-3">
        {/* Menu button — always visible; opens if mobile OR user explicitly clicked */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => {
            setOpen(true)
            setUserClickedMenu(true)
          }}
          aria-label="Open menu"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>

        {/* Title */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
        </div>

        {/* Review shortcuts */}
        <div className={cn('hidden sm:flex items-center gap-2')}>
          <Button
            asChild
            size="sm"
            variant={pathname.startsWith('/reviews/daily') ? 'default' : 'outline'}
          >
            <Link href="/reviews/daily" prefetch={false}>Daily</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={pathname.startsWith('/reviews/weekly') ? 'default' : 'outline'}
          >
            <Link href="/reviews/weekly" prefetch={false}>Weekly</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={pathname.startsWith('/reviews/monthly') ? 'default' : 'outline'}
          >
            <Link href="/reviews/monthly" prefetch={false}>Monthly</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={pathname.startsWith('/reviews/six-monthly') ? 'default' : 'outline'}
          >
            <Link href="/reviews/six-monthly" prefetch={false}>6M</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/reviews" prefetch={false}>Reports</Link>
          </Button>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />
      </div>
    </div>
  )
}
