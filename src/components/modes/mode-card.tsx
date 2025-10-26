'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

export type Mode = {
  id: string
  name: string
  description?: string
  enabled?: boolean
}

export default function ModeCard({ mode }: { mode: Mode }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{mode.name}</CardTitle>
        {mode.description ? <CardDescription>{mode.description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Switch checked={!!mode.enabled} disabled />
          <span className="text-sm text-muted-foreground">Enabled</span>
        </div>
      </CardContent>
    </Card>
  )
}
