'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ActivityBank from '@/components/activities/activity-bank'

export default function ActivityBankPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Activity Bank</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage <strong>templates</strong> (activity types) with default tags and settings.
            Use these when logging to speed up entry and keep naming consistent.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/activities">Back to Activity Log</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Examples:</span> “Deep Work”, “Gym”, “Team Meeting”, “Reading”.
            Add an emoji for quick recognition. Defaults here are applied when you choose a type during logging.
          </div>
        </CardContent>
      </Card>

      <ActivityBank />
    </div>
  )
}
