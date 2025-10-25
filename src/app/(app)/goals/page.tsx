'use client'

import { useUserCollection } from '@/lib/useUserCollection'
import GoalTree from '@/components/goals/goal-tree'
import { Card } from '@/components/ui/card'

type Goal = { id: string; title: string; parentId?: string | null; progress?: number }

export default function GoalsPage() {
  const { data: goals, loading } = useUserCollection<Goal>('goals', 'title')

  if (loading) return <div className="p-4">Loading…</div>
  if (goals.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No goals yet.</p>
      </Card>
    )
  }

  return <GoalTree goals={goals} />
}
