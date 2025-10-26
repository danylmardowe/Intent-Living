'use client'

import TaskCard, { Task } from './task-card'

function quadrant(tasks: Task[], urgent: boolean, important: boolean) {
  return tasks.filter(t => (t.urgent ?? false) === urgent && (t.important ?? false) === important)
}

export default function EisenhowerMatrix({ tasks }: { tasks: Task[] }) {
  const q1 = quadrant(tasks, true, true)
  const q2 = quadrant(tasks, false, true)
  const q3 = quadrant(tasks, true, false)
  const q4 = quadrant(tasks, false, false)

  const Box = ({ title, items }: { title: string; items: Task[] }) => (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="space-y-3">
        {items.map(t => <TaskCard key={t.id} task={t} />)}
        {items.length === 0 && <p className="text-sm text-muted-foreground">None</p>}
      </div>
    </div>
  )

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Box title="Do (Urgent & Important)" items={q1} />
      <Box title="Plan (Not Urgent & Important)" items={q2} />
      <Box title="Delegate (Urgent & Not Important)" items={q3} />
      <Box title="Eliminate (Not Urgent & Not Important)" items={q4} />
    </div>
  )
}
