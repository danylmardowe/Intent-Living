'use client'

import { useUserCollection } from '@/lib/useUserCollection'
import KanbanBoard from '@/components/tasks/kanban-board'
import EisenhowerMatrix from '@/components/tasks/eisenhower-matrix'
import { Card } from '@/components/ui/card'
import type { Task } from '@/components/tasks/task-card'

export default function TasksPage() {
  const { data: tasks, loading } = useUserCollection<Task>('tasks', 'createdAt')

  if (loading) return <div className="p-4">Loading…</div>
  if (tasks.length === 0) {
    return <Card className="p-6"><p className="text-muted-foreground">No tasks yet.</p></Card>
  }

  return (
    <div className="space-y-6">
      <KanbanBoard tasks={tasks} />
      <EisenhowerMatrix tasks={tasks} />
    </div>
  )
}
