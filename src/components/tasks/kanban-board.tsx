'use client'

import TaskCard, { Task } from './task-card'

export default function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const cols: Array<{ key: Task['status']; title: string }> = [
    { key: 'todo', title: 'To Do' },
    { key: 'in_progress', title: 'In Progress' },
    { key: 'done', title: 'Done' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cols.map(c => (
        <div key={c.key} className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">{c.title}</h3>
          {tasks.filter(t => (t.status ?? 'todo') === c.key).map(t => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      ))}
    </div>
  )
}
