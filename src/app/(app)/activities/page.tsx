// src/app/(app)/activities/page.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { useUserCollection } from '@/lib/useUserCollection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle as DialogTitleUI,
  DialogDescription as DialogDescriptionUI,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import ActivityForm from '@/components/activities/activity-form'
import ActivityList from '@/components/activities/activity-list'
import { PlusCircle, ListChecks } from 'lucide-react'

export default function ActivitiesPage() {
  const { user, loading } = useAuth()
  const [open, setOpen] = React.useState(false)

  const { data: activities, loading: activitiesLoading } =
    useUserCollection<any>('activities', 'createdAt')

  const disabled = loading || !user

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activities</h1>
          <p className="text-sm text-muted-foreground">
            Log what you did and review your recent activity. Use the Activity Bank to manage templates.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={disabled}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Log Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitleUI>Log a new activity</DialogTitleUI>
                <DialogDescriptionUI>
                  Create a one-off activity entry. You can pick a template from the bank inside the form.
                </DialogDescriptionUI>
              </DialogHeader>

              {/* ✅ Close the dialog when the form creates an activity */}
              <ActivityForm onSuccess={() => setOpen(false)} />

              <DialogFooter>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button asChild variant="outline">
            <Link href="/activities/bank">
              <ListChecks className="mr-2 h-4 w-4" />
              Activity Bank
            </Link>
          </Button>
        </div>
      </div>

      {/* Body */}
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Entries are scoped to your account and update in real time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!user && !loading ? (
            <div className="text-sm text-muted-foreground">
              Please sign in to log and view your activities.
            </div>
          ) : (
            <>
              <ActivityList />
              <Separator />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {activitiesLoading ? 'Loading…' : `${activities.length} item${activities.length === 1 ? '' : 's'}`}
                </span>
                <span>Tip: use the Activity Bank to create reusable templates.</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
