// src/components/goals/goal-tree.tsx
'use client'

import { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Task } from '@/components/tasks/task-card'

type Goal = {
  id: string
  title: string
  description?: string
  parentId?: string | null
  lifeAreaId?: string | null
  progress?: number
  progressMethod?: 'manual' | 'auto'
  status?: 'active' | 'paused' | 'completed'
}

function buildIndex(goals: Goal[]) {
  const byId = new Map<string, Goal & { children: string[] }>()
  goals.forEach(g => byId.set(g.id, { ...g, children: [] }))
  const roots: string[] = []
  for (const g of byId.values()) {
    if (g.parentId && byId.has(g.parentId)) {
      byId.get(g.parentId)!.children.push(g.id)
    } else {
      roots.push(g.id)
    }
  }
  return { byId, roots }
}

function computeProgress(
  goalId: string,
  byId: Map<string, Goal & { children: string[] }>,
  tasks: Task[],
  memo: Map<string, number>
): number {
  if (memo.has(goalId)) return memo.get(goalId)!;
  const g = byId.get(goalId)!
  // manual
  if ((g.progressMethod ?? 'manual') === 'manual') {
    const p = clamp(g.progress ?? 0, 0, 100)
    memo.set(goalId, p)
    return p
  }
  // auto: average of child goals progress + tasks progress
  const childGoalIds = g.children
  const childGoals = childGoalIds.map(id => computeProgress(id, byId, tasks, memo))

  const childTaskProgress = tasks
    .filter(t => t.goalId === g.id)
    .map(t => t.done ? 100 : 0)

  const nums = [...childGoals, ...childTaskProgress]
  const avg = nums.length === 0 ? (g.progress ?? 0) : (nums.reduce((a,c)=>a+c,0) / nums.length)
  const out = clamp(avg, 0, 100)
  memo.set(goalId, out)
  return out
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function GoalNode({
  goalId,
  byId,
  tasks,
  memo,
  depth = 0,
}: {
  goalId: string
  byId: Map<string, Goal & { children: string[] }>
  tasks: Task[]
  memo: Map<string, number>
  depth?: number
}) {
  const g = byId.get(goalId)!
  const pct = Math.round(computeProgress(goalId, byId, tasks, memo))
  return (
    <Card className="mb-3">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{g.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Progress value={pct} className="h-2 w-40" />
            <span className="text-sm text-muted-foreground">{pct}%</span>
          </div>
        </div>
      </CardHeader>
      {g.children.length > 0 && (
        <CardContent>
          <div className="mt-1 pl-4 border-l">
            {g.children.map(cid => (
              <GoalNode key={cid} goalId={cid} byId={byId} tasks={tasks} memo={memo} depth={depth+1} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default function GoalTree({ goals, tasks }: { goals: Goal[]; tasks: Task[] }) {
  const { byId, roots } = useMemo(() => buildIndex(goals), [goals])
  const memo = useMemo(() => new Map<string, number>(), [goals, tasks])

  if (goals.length === 0) {
    return <div className="p-4 text-muted-foreground">No goals yet. Create one above.</div>
  }

  return (
    <div>
      {roots.map(id => (
        <GoalNode key={id} goalId={id} byId={byId} tasks={tasks} memo={memo} />
      ))}
    </div>
  )
}
