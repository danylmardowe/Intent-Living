'use client'

import * as React from 'react'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ActivityForm from '@/components/activities/activity-form'
import ActivityList from '@/components/activities/activity-list'

export default function ActivitiesPage() {
  const [open, setOpen] = useState(false)
  const reloadRef = useRef<() => void>(() => {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Activities</h1>
          <p className="text-sm text-muted-foreground">
            <strong>Log actual sessions</strong> you did, with start/end time, duration, notes, tags, energy, and mood.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/activities/bank">Manage Activity Bank</Link>
          </Button>
          <Button onClick={() => setOpen(true)}>+ Log Activity</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Tip:</span> Use the <em>Activity Bank</em> to create templates like “Deep Work” or “Workout”.
            When logging, pick a type to auto-fill title and tags — then just set the time.
          </div>
        </CardContent>
      </Card>

      <ActivityList onReloadRequestRef={reloadRef} />
      <ActivityForm open={open} onOpenChange={setOpen} onCreated={() => reloadRef.current?.()} />
    </div>
  )
}
