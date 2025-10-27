// src/components/page-header.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/theme-toggle' // <-- default import
import { cn } from '@/lib/utils'

export default function PageHeader() {
  const pathname = usePathname()
  const title = routeTitle(pathname)

  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80 border-b">
      <div className="mx-auto max-w-screen-2xl px-4 lg:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-pink-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant={pathname?.startsWith('/reviews/daily') ? 'default' : 'outline'} size="sm">
              <Link href="/reviews/daily">Daily</Link>
            </Button>
            <Button asChild variant={pathname?.startsWith('/reviews/weekly') ? 'default' : 'outline'} size="sm">
              <Link href="/reviews/weekly">Weekly</Link>
            </Button>
            <Button asChild variant={pathname?.startsWith('/reviews/monthly') ? 'default' : 'outline'} size="sm">
              <Link href="/reviews/monthly">Monthly</Link>
            </Button>
            <Button asChild variant={pathname?.startsWith('/reviews/six-monthly') ? 'default' : 'outline'} size="sm">
              <Link href="/reviews/six-monthly">6M</Link>
            </Button>

            <Button asChild variant={pathname === '/reviews' ? 'default' : 'ghost'} size="sm">
              <Link href="/reviews">Reports</Link>
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}

function routeTitle(path: string | null) {
  if (!path) return 'Dashboard'
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/objectives': 'Objectives',
    '/tasks': 'Tasks',
    '/goals': 'Goals',
    '/life-areas': 'Life Areas',
    '/modes': 'Modes',
    '/reviews': 'Reviews',
  }
  for (const key of Object.keys(map)) {
    if (path === key || path.startsWith(key + '/')) return map[key]
  }
  return 'Lifeline'
}
