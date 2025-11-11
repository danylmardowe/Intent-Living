// src/components/dashboard/overview-cards.tsx
'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useUserCollection } from '@/lib/useUserCollection'

type Task = { id: string; done?: boolean; createdAt?: any }
type Goal = { id: string; progress?: number }
type Entry = { id: string; createdAt?: any }

function Stat({
  title,
  value,
  sub,
}: {
  title: string
  value: React.ReactNode
  sub?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {sub ? <div className="text-sm text-muted-foreground">{sub}</div> : null}
      </CardContent>
    </Card>
  )
}

export default function OverviewCards() {
  const { data: tasks, loading: lt } = useUserCollection<Task>('tasks', 'createdAt')
  const { data: goals, loading: lg } = useUserCollection<Goal>('goals', 'title')
  const { data: entries, loading: le } = useUserCollection<Entry>('journal', 'createdAt')

  const loading = lt || lg || le

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.done).length
  const completionPct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

  const avgGoalProgress =
    goals.length === 0
      ? 0
      : Math.round(
          goals.reduce((sum, g) => sum + (typeof g.progress === 'number' ? g.progress : 0), 0) /
            goals.length
        )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Stat title="Tasks" value={loading ? '…' : totalTasks} sub={`${completedTasks} done`} />
      <Stat title="Completion" value={`${completionPct}%`} sub="of tasks done" />
      <Stat title="Goals progress" value={`${avgGoalProgress}%`} sub="avg progress" />
      <Stat title="Journal entries" value={entries.length} sub="total" />
    </div>
  )
}
