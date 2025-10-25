'use client'

import { useUserCollection } from '@/lib/useUserCollection'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

type Area = { id: string; name: string; score: number } // 0..100

export default function LifeAreasPage() {
  const { data: areas, loading } = useUserCollection<Area>('lifeAreas', 'name')

  if (loading) return <div className="p-4">Loading…</div>

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {areas.map(a => (
        <Card key={a.id}>
          <CardHeader><CardTitle>{a.name}</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-3">
            <Progress value={Math.max(0, Math.min(100, a.score || 0))} className="h-2 w-40" />
            <span className="text-sm text-muted-foreground">{Math.round(a.score || 0)}%</span>
          </CardContent>
        </Card>
      ))}
      {areas.length === 0 && (
        <Card className="p-6"><p className="text-muted-foreground">No life areas yet.</p></Card>
      )}
    </div>
  )
}
