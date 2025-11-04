// src/components/tasks/kanban-board.tsx
'use client'

import { useMemo } from 'react'
import TaskCard from './task-card'
import { Task, TaskStatus } from '@/lib/types'
import { isToday, isPast } from 'date-fns'

type ColumnKey = TaskStatus | 'today'
type Column = { key: ColumnKey; title: string }

const COLUMNS: Column[] = [
  { key: 'today', title: 'Today' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'backlog', title: 'Backlog' },
  { key: 'done', title: 'Done' },
]

function priorityScore(t: Task) {
  const urgency = t.urgency ?? 0
  const importance = t.importance ?? 0
  let dueSoonBoost = 0
  if (t.dueAt?.toDate) {
    const dueDate = t.dueAt.toDate()
    if (isPast(dueDate) && !isToday(dueDate)) {
      dueSoonBoost = 20
    } else {
      const ms = dueDate.getTime() - Date.now()
      const days = ms / (1000 * 60 * 60 * 24)
      if (days <= 1) dueSoonBoost = 15
      else if (days <= 3) dueSoonBoost = 10
      else if (days <= 7) dueSoonBoost = 5
    }
  }
  return 0.6 * urgency + 0.4 * importance + dueSoonBoost
}

function byScoreDesc(a: Task, b: Task) {
  return priorityScore(b) - priorityScore(a)
}

export default function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const visibleTasks = tasks.filter(t => t.status !== 'archived' && t.status !== 'blocked')

  const tasksByColumn = useMemo(() => {
    const todayTasks = new Set<string>()
    const columns = new Map<ColumnKey, Task[]>()
    
    // Initialize columns
    COLUMNS.forEach(c => columns.set(c.key, []))

    // Categorize tasks
    for (const task of visibleTasks) {
      const startAt = task.startAt?.toDate()
      // Dynamic "Today" logic
      if (task.status === 'scheduled' && startAt && isToday(startAt)) {
        columns.get('today')?.push(task)
        todayTasks.add(task.id)
        continue // Go to next task
      }
      
      // If task is scheduled but not for today, don't show it in backlog
      if (task.status === 'scheduled' && !todayTasks.has(task.id)) {
        continue
      }

      const column = columns.get(task.status)
      if (column) {
        column.push(task)
      }
    }

    // Sort tasks within each column
    columns.forEach((tasks, key) => {
      columns.set(key, tasks.sort(byScoreDesc))
    })

    return columns
  }, [visibleTasks])

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((c) => {
        const items = tasksByColumn.get(c.key) || []
        return (
          <section
            key={c.key}
            className="flex h-full min-h-[70vh] flex-col rounded-lg bg-muted/50"
          >
            <header className="flex items-center justify-between rounded-t-lg border-b bg-muted/80 px-3 py-2">
              <h3 className="font-semibold text-sm">{c.title}</h3>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </header>

            <div className="flex-1 space-y-3 p-3">
              {items.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
              {items.length === 0 && (
                <div className="flex h-full items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/20 py-10">
                    <p className="text-sm text-muted-foreground">No tasks</p>
                </div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}