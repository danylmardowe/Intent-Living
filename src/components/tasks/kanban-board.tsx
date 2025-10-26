// src/components/tasks/kanban-board.tsx
'use client'

import TaskCard, { Task, TaskStatus } from './task-card'

export default function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const cols: Array<{ key: TaskStatus; title: string }> = [
    { key: 'backlog', title: 'Backlog' },
    { key: 'scheduled', title: 'Scheduled' },
    { key: 'today', title: 'Today' },
    { key: 'in_progress', title: 'In Progress' },
    { key: 'blocked', title: 'Blocked' },
    { key: 'done', title: 'Done' },
    { key: 'archived', title: 'Archived' },
  ]

  return (
    <div className="grid gap-4 xl:grid-cols-7 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
      {cols.map(c => (
        <div key={c.key} className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">{c.title}</h3>
          {tasks
            .filter(t => (t.status ?? 'backlog') === c.key)
            .map(t => <TaskCard key={t.id} task={t} />)}
          {tasks.filter(t => (t.status ?? 'backlog') === c.key).length === 0 && (
            <p className="text-xs text-muted-foreground">None</p>
          )}
        </div>
      ))}
    </div>
  )
}
