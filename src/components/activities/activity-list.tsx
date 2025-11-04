'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/context/auth-context'
import { Activity, listActivities } from '@/lib/activities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

type Filters = {
  from?: string // ISO date
  to?: string   // ISO date
  search?: string
}

// ---- helpers to be resilient to legacy/malformed data ----
function toDateSafe(input: unknown): Date | null {
  if (!input) return null
  // Firestore Timestamp
  if (typeof input === 'object' && input !== null && 'toDate' in (input as any)) {
    try {
      return (input as Timestamp).toDate()
    } catch {
      return null
    }
  }
  // millis number
  if (typeof input === 'number') {
    const d = new Date(input)
    return isNaN(d.getTime()) ? null : d
  }
  // ISO/string
  if (typeof input === 'string') {
    const d = new Date(input)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

function fmtDateAny(value: unknown) {
  const d = toDateSafe(value)
  return d ? d.toLocaleString() : '—'
}

function fmtDur(ms: unknown, startAt?: unknown, endAt?: unknown) {
  let durationMs =
    typeof ms === 'number' && Number.isFinite(ms) ? ms : undefined

  if (durationMs == null) {
    const s = toDateSafe(startAt)
    const e = toDateSafe(endAt)
    if (s && e) durationMs = Math.max(0, e.getTime() - s.getTime())
  }
  if (durationMs == null) return '—'

  const totalM = Math.round(durationMs / 60000)
  const h = Math.floor(totalM / 60)
  const m = totalM % 60
  if (h <= 0) return `${m}m`
  return `${h}h ${m}m`
}

export default function ActivityList({
  onReloadRequestRef,
}: {
  onReloadRequestRef?: React.MutableRefObject<() => void>
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Activity[]>([])
  const [filters, setFilters] = useState<Filters>({
    from: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
      .toISOString()
      .slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    search: '',
  })

  async function load() {
    if (!user?.uid) return
    setLoading(true)
    const fromDate = filters.from
      ? new Date(filters.from + 'T00:00')
      : undefined
    const toDate = filters.to ? new Date(filters.to + 'T23:59') : undefined
    const data = await listActivities(user.uid, { from: fromDate, to: toDate })
    setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  useEffect(() => {
    if (onReloadRequestRef) onReloadRequestRef.current = load
  }, [onReloadRequestRef])

  const filtered = items.filter((a) => {
    const s = filters.search?.toLowerCase() ?? ''
    if (!s) return true
    const hay = [
      (a as any)?.title,
      (a as any)?.notes,
      ...(((a as any)?.tags as string[]) ?? []),
      (a as any)?.mood,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(s)
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              type="date"
              value={filters.from}
              onChange={(e) =>
                setFilters((f) => ({ ...f, from: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="date"
              value={filters.to}
              onChange={(e) =>
                setFilters((f) => ({ ...f, to: e.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              placeholder="title, notes, tags, mood"
            />
          </div>
          <div className="sm:col-span-4 flex gap-2">
            <Button onClick={load}>Apply</Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={(a as any).id} className="overflow-hidden">
              <CardContent className="py-4 grid grid-cols-1 sm:grid-cols-6 gap-2">
                <div className="sm:col-span-2 font-medium">{(a as any)?.title ?? 'Untitled activity'}</div>
                <div>
                  <div className="text-xs text-muted-foreground">Start</div>
                  <div className="text-sm">{fmtDateAny((a as any)?.startAt)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">End</div>
                  <div className="text-sm">{fmtDateAny((a as any)?.endAt)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="text-sm">
                    {fmtDur((a as any)?.duration, (a as any)?.startAt, (a as any)?.endAt)}
                  </div>
                </div>
                <div className="truncate text-sm text-muted-foreground">
                  {((a as any)?.tags as string[] | undefined)?.join(', ') ?? ''}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No activities in this range.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
