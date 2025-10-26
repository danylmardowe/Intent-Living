'use client'

import { useUserCollection } from '@/lib/useUserCollection'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

type Objective = { id: string; title: string; description?: string; progress?: number }

export default function ObjectivesPage() {
  const { data: objectives, loading } = useUserCollection<Objective>('objectives', 'title')

  if (loading) return <div className="p-4">Loading…</div>

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {objectives.map(o => (
        <Card key={o.id}>
          <CardHeader><CardTitle>{o.title}</CardTitle></CardHeader>
          {o.description ? <CardContent>{o.description}</CardContent> : null}
        </Card>
      ))}
      {objectives.length === 0 && (
        <Card className="p-6">
          <p className="text-muted-foreground">No objectives yet.</p>
        </Card>
      )}
    </div>
  )
}
