// src/components/tasks/eisenhower-matrix.tsx
'use client'

import TaskCard from './task-card'
import type { Task } from '@/lib/types'

type Props = {
  tasks: Task[]
  /** Threshold for urgent/important split. Default: 50 */
  threshold?: number
  /** Include completed tasks in the matrix. Default: false */
  includeDone?: boolean
}

/** Priority score used for sorting inside quadrants. */
function priorityScore(t: Task) {
  const urgency = Number(t.urgency ?? 0)
  const importance = Number(t.importance ?? 0)

  // dueSoonBoost: nearer due date => higher boost; past due gets extra boost
  let dueSoonBoost = 0
  if (t.dueAt?.toDate) {
    const now = Date.now()
    const ms = t.dueAt.toDate().getTime() - now
    const days = ms / (1000 * 60 * 60 * 24)
    // within 7 days => boost, past due => larger boost
    if (days <= 0) dueSoonBoost = 20
    else if (days <= 1) dueSoonBoost = 15
    else if (days <= 3) dueSoonBoost = 10
    else if (days <= 7) dueSoonBoost = 5
  }

  // stalePenalty: older tasks with no start date or start date long ago
  let stalePenalty = 0
  if (t.startAt?.toDate) {
    const daysOld = (Date.now() - t.startAt.toDate().getTime()) / (1000 * 60 * 60 * 24)
    if (daysOld > 30) stalePenalty = 8
    else if (daysOld > 14) stalePenalty = 5
    else if (daysOld > 7) stalePenalty = 3
  }

  return 0.6 * urgency + 0.4 * importance + dueSoonBoost - stalePenalty
}

function byScoreDesc(a: Task, b: Task) {
  return priorityScore(b) - priorityScore(a)
}

function quadrant(tasks: Task[], urgent: boolean, important: boolean, threshold: number) {
  return tasks.filter((t) => {
    const u = Number(t.urgency ?? 0) >= threshold
    const i = Number(t.importance ?? 0) >= threshold
    return u === urgent && i === important
  })
}

export default function EisenhowerMatrix({ tasks, threshold = 50, includeDone = false }: Props) {
  // Hide archived by default; optionally hide done
  const base = tasks.filter((t) => t.status !== 'archived' && (includeDone || t.status !== 'done'))

  const q1 = quadrant(base, true, true, threshold).sort(byScoreDesc) // Do
  const q2 = quadrant(base, false, true, threshold).sort(byScoreDesc) // Plan
  const q3 = quadrant(base, true, false, threshold).sort(byScoreDesc) // Delegate
  const q4 = quadrant(base, false, false, threshold).sort(byScoreDesc) // Eliminate

  const Box = ({ title, items }: { title: string; items: Task[] }) => (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">None</p>}
      </div>
    </div>
  )

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Box title="Do (Urgent • Important)" items={q1} />
      <Box title="Plan (Not Urgent • Important)" items={q2} />
      <Box title="Delegate (Urgent • Not Important)" items={q3} />
      <Box title="Eliminate (Not Urgent • Not Important)" items={q4} />
    </div>
  )
}