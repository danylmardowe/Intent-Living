// src/components/tasks/task-card.tsx
'use client'

import { useState } from 'react'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export type TaskStatus = 'backlog' | 'scheduled' | 'today' | 'in_progress' | 'blocked' | 'done' | 'archived'

export type Task = {
  id: string
  title: string
  description?: string
  status?: TaskStatus
  importance?: number
  urgency?: number
  lifeAreaId?: string | null
  goalId?: string | null
  dueAt?: any
  startAt?: any
  done?: boolean
  blockedReason?: string
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'today', label: 'Today' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
]

export default function TaskCard({ task }: { task: Task }) {
  const [localImportance, setLocalImportance] = useState(task.importance ?? 50)
  const [localUrgency, setLocalUrgency] = useState(task.urgency ?? 40)
  const [localStatus, setLocalStatus] = useState<TaskStatus>(task.status ?? 'backlog')
  const [localReason, setLocalReason] = useState(task.blockedReason ?? '')

  async function safeUpdate(patch: Record<string, any>) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'tasks', task.id), patch)
  }

  async function toggleDone() {
    await safeUpdate({ done: !task.done, status: !task.done ? 'done' : 'backlog' })
  }

  async function changeStatus(next: TaskStatus) {
    // If blocking, require a reason (use existing if present)
    if (next === 'blocked' && !localReason.trim()) {
      const r = prompt('Reason for blocking?') || ''
      setLocalReason(r)
      await safeUpdate({ status: next, blockedReason: r })
    } else {
      await safeUpdate({ status: next })
    }
    setLocalStatus(next)
  }

  async function commitImportance() {
    await safeUpdate({ importance: localImportance })
  }
  async function commitUrgency() {
    await safeUpdate({ urgency: localUrgency })
  }

  async function remove() {
    const ok = confirm('Delete this task?')
    if (!ok) return
    const uid = auth.currentUser?.uid
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'tasks', task.id))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Checkbox checked={!!task.done} onCheckedChange={toggleDone} />
          <CardTitle className={task.done ? 'line-through text-muted-foreground' : ''}>
            {task.title}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Select value={localStatus} onValueChange={(v)=>changeStatus(v as TaskStatus)}>
            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={remove}>Delete</Button>
        </div>
      </CardHeader>
      {task.description ? (
        <CardContent className="pt-0 pb-4">
          <p className="text-sm text-muted-foreground">{task.description}</p>
        </CardContent>
      ) : null}

      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Importance</Label>
          <Input
            className="h-8 w-20"
            type="number"
            min={0}
            max={100}
            value={localImportance}
            onChange={(e)=>setLocalImportance(Number(e.target.value))}
            onBlur={commitImportance}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Urgency</Label>
          <Input
            className="h-8 w-20"
            type="number"
            min={0}
            max={100}
            value={localUrgency}
            onChange={(e)=>setLocalUrgency(Number(e.target.value))}
            onBlur={commitUrgency}
          />
        </div>
        {localStatus === 'blocked' && (
          <div className="sm:col-span-2 flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Reason</Label>
            <Input
              className="h-8"
              placeholder="Why is this blocked?"
              value={localReason}
              onChange={(e)=>setLocalReason(e.target.value)}
              onBlur={()=>safeUpdate({ blockedReason: localReason })}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
