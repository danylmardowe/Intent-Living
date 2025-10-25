'use client'

import { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

type Goal = { id: string; title: string; parentId?: string | null; progress?: number }

function buildTree(goals: Goal[]) {
  const byId = new Map<string, Goal & { children: Goal[] }>()
  goals.forEach(g => byId.set(g.id, { ...g, children: [] }))
  const roots: (Goal & { children: Goal[] })[] = []
  for (const g of byId.values()) {
    if (g.parentId && byId.has(g.parentId)) {
      byId.get(g.parentId)!.children.push(g)
    } else {
      roots.push(g)
    }
  }
  return roots
}

function GoalNode({ goal }: { goal: Goal & { children?: any[] } }) {
  const pct = Math.max(0, Math.min(100, Math.round((goal.progress ?? 0))))
  return (
    <Card className="mb-3">
      <CardHeader>
        <CardTitle className="text-base">{goal.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Progress value={pct} className="h-2 w-40" />
          <span className="text-sm text-muted-foreground">{pct}%</span>
        </div>
        {goal.children && goal.children.length > 0 && (
          <div className="mt-3 pl-4 border-l">
            {goal.children.map((c) => (
              <GoalNode key={c.id} goal={c} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function GoalTree({ goals }: { goals: Goal[] }) {
  const roots = useMemo(() => buildTree(goals), [goals])
  return (
    <div>
      {roots.map((g) => (
        <GoalNode key={g.id} goal={g as any} />
      ))}
    </div>
  )
}
