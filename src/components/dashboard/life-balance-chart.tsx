// src/components/dashboard/life-balance-chart.tsx
'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useUserCollection } from '@/lib/useUserCollection'

type Area = { id: string; name: string; focus?: number }

export default function LifeBalanceChart() {
  const { data: areas, loading } = useUserCollection<Area>('lifeAreas', 'name')

  if (loading) return <Card className="p-6"><p>Loading…</p></Card>
  if (areas.length === 0)
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No life areas yet.</p>
      </Card>
    )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Life Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {areas.map((a) => {
          const v = Math.max(0, Math.min(100, a.focus ?? 0))
          return (
            <div key={a.id} className="flex items-center gap-3">
              <div className="w-32 text-sm">{a.name}</div>
              <Progress value={v} className="h-2 flex-1" />
              <div className="w-10 text-right text-sm">{Math.round(v)}%</div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
