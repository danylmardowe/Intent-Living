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

export default function PageHeader() {
  const pathname = usePathname() || '/'
  const { setOpen } = useSidebar()
  const base = Object.keys(titleMap).find((k) => pathname.startsWith(k))
  const title = titleMap[base ?? ''] ?? 'Lifeline'

  return (
    <div className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-2 px-3">
        {/* Mobile hamburger — opens the sidebar drawer on < md */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>

        {/* Title */}
        <div className="flex flex-1 items-center gap-2">
          <h1 className="text-base font-semibold tracking-tight">{title}</h1>
        </div>

        {/* Review shortcuts */}
        <div className={cn('hidden sm:flex items-center gap-2')}>
          <Button
            asChild
            size="sm"
            variant={pathname.startsWith('/reviews/daily') ? 'default' : 'outline'}
          >
            <Link href="/reviews/daily">Daily</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={pathname.startsWith('/reviews/weekly') ? 'default' : 'outline'}
          >
            <Link href="/reviews/weekly">Weekly</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={pathname.startsWith('/reviews/monthly') ? 'default' : 'outline'}
          >
            <Link href="/reviews/monthly">Monthly</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={pathname.startsWith('/reviews/six-monthly') ? 'default' : 'outline'}
          >
            <Link href="/reviews/six-monthly">6M</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/reviews">Reports</Link>
          </Button>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />
      </div>
    </div>
  )
}
