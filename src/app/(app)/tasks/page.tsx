// src/app/(app)/tasks/page.tsx
'use client'

import { useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { useUserCollection } from '@/lib/useUserCollection'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { PlusCircle } from 'lucide-react'
import KanbanBoard from '@/components/tasks/kanban-board'
import EisenhowerMatrix from '@/components/tasks/eisenhower-matrix'
import TaskForm from '@/components/tasks/task-form'
import { Task } from '@/lib/types'

const INITIAL_FORM_DATA: Partial<Task> = {
  title: '',
  description: '',
  lifeAreaId: null,
  goalId: null,
  startAt: null,
  dueAt: null,
  importance: 50,
  urgency: 40,
  status: 'backlog',
  progress: 0,
  done: false,
}

function TasksSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-hidden">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="w-72 shrink-0 space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  )
}

export default function TasksPage() {
  const { data: tasks, loading } = useUserCollection<Task>('tasks', 'createdAt')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Task>>(INITIAL_FORM_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFormChange = (fieldName: keyof Task, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    const uid = auth.currentUser?.uid
    if (!uid || !formData.title?.trim()) return

    setIsSubmitting(true)
    try {
      await addDoc(collection(db, 'users', uid, 'tasks'), {
        ...formData,
        createdAt: serverTimestamp(),
      })
      setFormData(INITIAL_FORM_DATA) // Reset form
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Error adding task:", error)
      // Consider adding a user-facing error message (toast)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="matrix">Matrix</TabsTrigger>
        </TabsList>
        {loading ? (
          <div className="mt-4">
            <TasksSkeleton />
          </div>
        ) : (
          <>
            <TabsContent value="kanban" className="mt-4">
              <KanbanBoard tasks={tasks} />
            </TabsContent>
            <TabsContent value="matrix" className="mt-4">
              <EisenhowerMatrix tasks={tasks} />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create a New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={addTask}>
            <div className="max-h-[70vh] overflow-y-auto pr-2">
              <TaskForm formData={formData} onFormChange={handleFormChange} />
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || !formData.title?.trim()}>
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}