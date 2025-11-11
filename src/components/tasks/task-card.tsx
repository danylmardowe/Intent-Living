// src/components/tasks/task-card.tsx
'use client'

import { useState } from 'react'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Task, TaskStatus } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { CalendarIcon, Trash2Icon } from 'lucide-react'
import { format } from 'date-fns'
import Subtasks from './subtasks'
import TaskForm from './task-form'

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
]

export default function TaskCard({ task }: { task: Task }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Task>>(task)

  const handleFormChange = (fieldName: keyof Task, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  async function safeUpdate(patch: Record<string, any>) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'tasks', task.id), patch)
  }

  async function handleSaveChanges() {
    await safeUpdate(formData)
    setIsDialogOpen(false)
  }

  async function toggleDone() {
    const nextDone = !task.done
    await safeUpdate({
      done: nextDone,
      status: nextDone ? 'done' : 'backlog',
      progress: nextDone ? 100 : task.progress > 0 ? task.progress : 0,
    })
  }
  
  async function changeStatus(next: TaskStatus) {
    if (next === 'done') {
      await safeUpdate({ status: 'done', done: true, progress: 100 })
    } else {
      await safeUpdate({ status: next, done: false })
    }
  }

  async function remove() {
    const ok = confirm('Are you sure you want to delete this task?')
    if (!ok) return
    const uid = auth.currentUser?.uid
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'tasks', task.id))
    setIsDialogOpen(false)
  }

  const dueDate = task.dueAt?.toDate()
  const isOverdue = dueDate && dueDate < new Date() && !task.done

  return (
    <>
      <Card
        className="cursor-pointer transition-shadow duration-200 hover:shadow-md"
        onClick={() => setIsDialogOpen(true)}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div
              className="flex min-w-0 flex-grow items-start gap-2"
              onClick={(e) => {
                e.stopPropagation();
                toggleDone();
              }}
            >
              <Checkbox
                checked={!!task.done}
                className="mt-1"
              />
              <span
                className={`flex-grow cursor-pointer ${
                  task.done ? 'text-muted-foreground line-through' : 'font-medium'
                }`}
              >
                {task.title}
              </span>
            </div>
            <Select value={task.status} onValueChange={changeStatus}>
              <SelectTrigger className="h-7 w-[110px] shrink-0 text-xs focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {dueDate && (
            <div
              className={`mt-2 flex items-center gap-1.5 text-xs ${
                isOverdue ? 'text-red-500' : 'text-muted-foreground'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Due {format(dueDate, 'MMM d')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[70vh] overflow-y-auto p-1 pr-4">
            <TaskForm formData={formData} onFormChange={handleFormChange} />
            <div className="mt-6 border-t pt-4">
              <Subtasks taskId={task.id} currentProgress={task.progress} />
            </div>
          </div>

          <DialogFooter className="mt-4 flex w-full justify-between pt-4">
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={remove}>
              <Trash2Icon className="mr-2 h-4 w-4" /> Delete Task
            </Button>
            <div>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveChanges} className="ml-2">Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}