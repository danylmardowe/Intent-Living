'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  ListTodo,
  Goal,
  Layers,
  Landmark,
  Compass,
  FileText,
  Calendar,
  CalendarClock,
  CalendarRange,
  CalendarCheck2,
  ChevronDown,
} from 'lucide-react'

/**
 * SidebarNav
 * Vertical app navigation for the sidebar (desktop) and mobile drawer.
 * Replaces "Daily Review" with "Reviews" + dropdown to pick cadence.
 */
export default function SidebarNav() {
  const pathname = usePathname() || '/'

  const isActive = (href: string) =>
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(href + '/')

  const isAnyReview = pathname.startsWith('/reviews')

  return (
    <nav className="flex flex-col gap-1 p-2">
      <NavLink
        href="/dashboard"
        icon={LayoutDashboard}
        label="Dashboard"
        active={isActive('/dashboard')}
      />

      <NavLink
        href="/objectives"
        icon={Layers}
        label="Objectives"
        active={isActive('/objectives')}
      />

      <NavLink
        href="/tasks"
        icon={ListTodo}
        label="Tasks"
        active={isActive('/tasks')}
      />

      <NavLink
        href="/goals"
        icon={Goal}
        label="Goals"
        active={isActive('/goals')}
      />

      <NavLink
        href="/life-areas"
        icon={Landmark}
        label="Life Areas"
        active={isActive('/life-areas')}
      />

      <NavLink
        href="/modes"
        icon={Compass}
        label="Modes"
        active={isActive('/modes')}
      />

      {/* Reviews dropdown (replaces single "Daily Review" link) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isAnyReview ? 'secondary' : 'ghost'}
            className={cn(
              'justify-start gap-2 w-full',
              isAnyReview && 'font-semibold'
            )}
          >
            <FileText className="h-4 w-4" />
            <span className="flex-1 text-left">Reviews</span>
            <ChevronDown className="h-4 w-4 opacity-75" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-48">
          <DropdownItemLink
            href="/reviews/daily"
            icon={Calendar}
            label="Daily Review"
            active={isActive('/reviews/daily')}
          />
          <DropdownItemLink
            href="/reviews/weekly"
            icon={CalendarClock}
            label="Weekly Review"
            active={isActive('/reviews/weekly')}
          />
          <DropdownItemLink
            href="/reviews/monthly"
            icon={CalendarRange}
            label="Monthly Review"
            active={isActive('/reviews/monthly')}
          />
          <DropdownItemLink
            href="/reviews/six-monthly"
            icon={CalendarCheck2}
            label="Six-Month Review"
            active={isActive('/reviews/six-monthly')}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}

function NavLink(props: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
}) {
  const { href, icon: Icon, label, active } = props
  return (
    <Button
      asChild
      variant={active ? 'secondary' : 'ghost'}
      className={cn('justify-start gap-2 w-full', active && 'font-semibold')}
    >
      <Link href={href}>
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </Link>
    </Button>
  )
}

function DropdownItemLink(props: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
}) {
  const { href, icon: Icon, label, active } = props
  return (
    <DropdownMenuItem asChild className={cn(active && 'font-semibold')}>
      <Link href={href} className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </Link>
    </DropdownMenuItem>
  )
}
