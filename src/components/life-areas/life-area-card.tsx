// src/components/life-areas/life-area-card.tsx
'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

/**
 * Local types to avoid importing from `@/lib/types`.
 * This fixes: "Module '@/lib/types' has no exported member 'LifeArea'."
 */
type KPI = {
  name: string
  value: string | number
}

export type LifeAreaCardArea = {
  id: string
  name: string
  vision?: string
  guidingPrinciples: string[]
  kpis: KPI[]
  // Icon component (e.g., from lucide-react)
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

interface LifeAreaCardProps {
  area: LifeAreaCardArea
}

export default function LifeAreaCard({ area }: LifeAreaCardProps) {
  const Icon = area.icon

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 font-headline text-xl">
          <Icon className="h-6 w-6 text-primary" />
          {area.name}
        </CardTitle>
        {area.vision ? (
          <CardDescription>&quot;{area.vision}&quot;</CardDescription>
        ) : null}
      </CardHeader>

      <CardContent className="flex-grow space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-semibold">Guiding Principles</h4>
          {area.guidingPrinciples?.length ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {area.guidingPrinciples.map((principle: string, index: number) => (
                <li key={index}>{principle}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No principles yet.</p>
          )}
        </div>

        <Separator />

        <div>
          <h4 className="mb-2 text-sm font-semibold">Key Performance Indicators (KPIs)</h4>
          {area.kpis?.length ? (
            <div className="flex flex-wrap gap-2">
              {area.kpis.map((kpi: KPI, index: number) => (
                <Badge key={index} variant="secondary">
                  {kpi.name}: {kpi.value}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No KPIs yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
