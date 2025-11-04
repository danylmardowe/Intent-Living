'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import {
  ActivityType,
  listActivityTypes,
  createActivityType,
  deleteActivityType,
} from '@/lib/activities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function ActivityBank() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<ActivityType[]>([])
  const [loading, setLoading] = useState(true)

  // minimal fields per new spec
  const [title, setTitle] = useState('')
  const [defaultDurationMins, setDefaultDurationMins] = useState<string>('') // optional

  async function load() {
    if (!user?.uid) return
    setLoading(true)
    const data = await listActivityTypes(user.uid)
    setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  async function add() {
    if (!user?.uid) return
    const name = title.trim()
    if (!name) return
    const mins = Number(defaultDurationMins)
    const defaultDuration = Number.isFinite(mins) && mins > 0 ? mins * 60_000 : undefined

    await createActivityType(user.uid, {
      title: name,
      defaultDuration,
    })
    setTitle('')
    setDefaultDurationMins('')
    toast({ title: 'Reusable activity added' })
    await load()
  }

  async function remove(id: string) {
    if (!user?.uid) return
    await deleteActivityType(user.uid, id)
    toast({ title: 'Deleted' })
    await load()
  }

  return (
    <div className="space-y-6">
      {/* Add reusable activity */}
      <Card>
        <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="title">Reusable activity</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Deep Work, Gym, Reading, Team Meeting"
            />
          </div>
          <div>
            <Label htmlFor="duration">Default duration (mins) — optional</Label>
            <Input
              id="duration"
              type="number"
              min={0}
              inputMode="numeric"
              value={defaultDurationMins}
              onChange={(e) => setDefaultDurationMins(e.target.value)}
              placeholder="e.g., 90"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={add} className="w-full sm:w-auto">Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid of reusable activities */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Your reusable activities</h2>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No reusable activities yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((it) => (
              <Card key={it.id} className="group">
                <CardContent className="py-4 px-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.title}</div>
                    {it.defaultDuration ? (
                      <div className="text-xs text-muted-foreground">
                        {Math.round(it.defaultDuration / 60000)} mins
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No default duration</div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => remove(it.id!)}
                    className="opacity-90 group-hover:opacity-100"
                    aria-label={`Delete ${it.title}`}
                  >
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
