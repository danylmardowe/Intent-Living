'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/auth-context'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useActivities } from '@/hooks/useActivities'
import type { ActivityType } from '@/lib/types'

type LifeArea = { id: string; name: string }

function formatTime(d?: Date | null) {
  if (!d) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ActivityLoggerPage() {
  const { user } = useAuth()
  const { activities, addActivity } = useActivities()
  const [types, setTypes] = useState<ActivityType[]>([])
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([])
  const [form, setForm] = useState({
    typeId: '',
    lifeAreaId: '',
    startTime: '',
    endTime: '',
    notes: '',
  })

  useEffect(() => {
    if (!user) return
    const unsubTypes = onSnapshot(collection(db, 'users', user.uid, 'activityTypes'), (snap) =>
      setTypes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    )
    const unsubAreas = onSnapshot(collection(db, 'users', user.uid, 'lifeAreas'), (snap) =>
      setLifeAreas(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    )
    return () => {
      unsubTypes()
      unsubAreas()
    }
  }, [user])

  async function handleAdd() {
    if (!user || !form.typeId) return
    const selectedType = types.find((t) => t.id === form.typeId)

    const start = form.startTime ? new Date(form.startTime) : new Date()
    const end = form.endTime ? new Date(form.endTime) : null
    const durationMinutes =
      end && start ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)) : null

    await addActivity({
      title: selectedType?.title ?? 'Untitled Activity',
      typeId: form.typeId,
      lifeAreaId: form.lifeAreaId || selectedType?.defaultLifeAreaId || null,
      startTime: start,           // logger creates time-stamped entries
      endTime: end,
      durationMinutes,
      notes: form.notes.trim() || null,
    })

    setForm({ typeId: '', lifeAreaId: '', startTime: '', endTime: '', notes: '' })
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Log Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              className="h-9 px-2 rounded-md border bg-background"
              value={form.typeId}
              onChange={(e) => setForm({ ...form, typeId: e.target.value })}
            >
              <option value="">Select Activity Type</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            <select
              className="h-9 px-2 rounded-md border bg-background"
              value={form.lifeAreaId}
              onChange={(e) => setForm({ ...form, lifeAreaId: e.target.value })}
            >
              <option value="">Assign Life Area (optional)</option>
              {lifeAreas.map((la) => (
                <option key={la.id} value={la.id}>
                  {la.name}
                </option>
              ))}
            </select>

            <Input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              placeholder="Start Time"
            />
            <Input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              placeholder="End Time"
            />
          </div>

          <Textarea
            placeholder="Notes about this activity..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <Button onClick={handleAdd} disabled={!form.typeId}>
            Add Activity
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today’s Logged Activities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-sm text-muted-foreground">No activities logged today.</div>
          ) : (
            activities.map((a) => {
              const startLabel = formatTime(a.startTime ?? null)
              const endLabel = formatTime(a.endTime ?? null)
              const durationLabel =
                typeof a.durationMinutes === 'number'
                  ? ` (${Math.round(a.durationMinutes)} min)`
                  : ''

              return (
                <div
                  key={a.id}
                  className="flex justify-between items-center border rounded-md p-2"
                >
                  <div>
                    <div className="font-medium">{a.title}</div>
                    {(startLabel || endLabel || durationLabel) && (
                      <div className="text-xs text-muted-foreground">
                        {startLabel}
                        {endLabel ? ` - ${endLabel}` : ''}
                        {durationLabel}
                      </div>
                    )}
                    {a.notes && (
                      <div className="text-xs text-muted-foreground mt-1">📝 {a.notes}</div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.lifeAreaId || '—'}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
