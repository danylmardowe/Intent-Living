// src/components/activities/activity-list.tsx
'use client'

import * as React from 'react'
import { useAuth } from '@/context/auth-context'
import { useUserCollection } from '@/lib/useUserCollection'
import { db } from '@/lib/firebase'
import { doc, deleteDoc, Timestamp } from 'firebase/firestore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2 } from 'lucide-react'

type ActivityRow = {
  id: string
  title: string
  startAt?: Timestamp
  endAt?: Timestamp
  duration?: number
  energyLevel?: number
  mood?: string
}

function fmt(ts?: Timestamp) {
  if (!ts) return ''
  const d = ts.toDate()
  return d.toLocaleString()
}

function fmtDur(ms?: number) {
  if (!ms || ms <= 0) return ''
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export default function ActivityList() {
  const { user } = useAuth()
  const { data, loading } = useUserCollection<ActivityRow>('activities', 'createdAt')

  async function handleDelete(id: string) {
    if (!user?.uid) return
    const ok = confirm('Delete this activity?')
    if (!ok) return
    await deleteDoc(doc(db, 'users', user.uid, 'activities', id))
  }

  if (!user) {
    return <div className="text-sm text-muted-foreground">Sign in to see your activities.</div>
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>
  }

  if (!data.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No activities yet. Click <strong>Log Activity</strong> to add your first entry.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[220px]">Title</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Energy</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.title}</TableCell>
              <TableCell>{fmt(a.startAt)}</TableCell>
              <TableCell>{fmt(a.endAt)}</TableCell>
              <TableCell>{fmtDur(a.duration)}</TableCell>
              <TableCell>{a.energyLevel ?? ''}</TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" onClick={() => handleDelete(a.id)} aria-label="Delete activity">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
